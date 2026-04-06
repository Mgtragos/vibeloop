import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { ClientToServerEvents, ServerToClientEvents } from '@vibeloop/types';
import type { Server, Socket } from 'socket.io';

import { MatchService } from '../match/match.service';

import { JoinQueueSchema, MessageSchema, SignalSchema } from './dto/chat-events.dto';
import { RedisService } from './redis.service';

type ChatServer = Server<ClientToServerEvents, ServerToClientEvents>;
type ChatSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: [
      process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',
      'https://vibeloop-web.vercel.app',
    ],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: ChatServer;

  private readonly logger = new Logger(ChatGateway.name);

  /**
   * Keyed by socket.id. Used for direct per-socket emits so we never rely on
   * `this.server.to(socketId)`, which targets the root "/" namespace and silently
   * drops events for sockets that are connected to the "/chat" namespace only.
   */
  private readonly sockets = new Map<string, ChatSocket>();

  constructor(
    private readonly redis: RedisService,
    private readonly match: MatchService,
  ) {}

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  handleConnection(client: ChatSocket): void {
    this.sockets.set(client.id, client);
    this.logger.log(`Connected: ${client.id} (active: ${this.sockets.size})`);
  }

  async handleDisconnect(client: ChatSocket): Promise<void> {
    this.sockets.delete(client.id);
    this.logger.log(`Disconnected: ${client.id}`);
    await this.cleanup(client, 'disconnect');
  }

  // ── chat:join-queue ──────────────────────────────────────────────────────────

  @SubscribeMessage('chat:join-queue')
  async handleJoinQueue(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: ChatSocket,
  ): Promise<void> {
    const result = JoinQueueSchema.safeParse(payload);
    if (!result.success) {
      client.emit('chat:error', { message: result.error.issues[0]?.message ?? 'Invalid payload' });
      return;
    }

    const { userId } = result.data;

    await this.redis.setSocketUser(client.id, userId);

    const candidate = await this.match.tryMatch(userId);

    if (candidate) {
      const candidateSocketId = await this.redis.getUserSocket(candidate);

      if (!candidateSocketId) {
        // Candidate disconnected before we could pair — clean up the session that
        // tryMatch already created, then re-enqueue the current user.
        await this.match.endSession(userId, candidate);
        const position = await this.match.requeueUser(userId);
        client.emit('chat:queued', { position });
        return;
      }

      this.logger.log(
        `Matched: ${userId}(${client.id}) ↔ ${candidate}(${candidateSocketId})`,
      );

      // Each peer receives the other's socket ID as partnerId for direct signal routing.
      client.emit('chat:matched', { partnerId: candidateSocketId, initiator: true });
      this.toSocket(candidateSocketId)?.emit('chat:matched', { partnerId: client.id, initiator: false });
    } else {
      const position = await this.match.queuePosition(userId);
      client.emit('chat:queued', { position });
      this.logger.log(`Queued: ${userId} at position ${position}`);
    }
  }

  // ── chat:signal ──────────────────────────────────────────────────────────────

  @SubscribeMessage('chat:signal')
  async handleSignal(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: ChatSocket,
  ): Promise<void> {
    const result = SignalSchema.safeParse(payload);
    if (!result.success) {
      client.emit('chat:error', { message: result.error.issues[0]?.message ?? 'Invalid payload' });
      return;
    }

    const { to, signal } = result.data;

    const senderId = await this.redis.getSocketUser(client.id);
    if (!senderId) {
      client.emit('chat:error', { message: 'Not authenticated — join the queue first' });
      return;
    }

    const targetUserId = await this.redis.getSocketUser(to);
    if (!targetUserId) {
      client.emit('chat:error', { message: 'Recipient socket not found' });
      return;
    }

    const session = await this.match.getSession(senderId);
    if (session !== targetUserId) {
      client.emit('chat:error', { message: 'You are not in a session with this user' });
      return;
    }

    this.toSocket(to)?.emit('chat:signal', { from: client.id, signal });
  }

  // ── chat:message ─────────────────────────────────────────────────────────────

  @SubscribeMessage('chat:message')
  async handleMessage(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: ChatSocket,
  ): Promise<void> {
    const result = MessageSchema.safeParse(payload);
    if (!result.success) {
      client.emit('chat:error', { message: result.error.issues[0]?.message ?? 'Invalid payload' });
      return;
    }

    const { to, text } = result.data; // to = partner's socketId

    const senderId = await this.redis.getSocketUser(client.id);
    if (!senderId) {
      client.emit('chat:error', { message: 'Not authenticated — join the queue first' });
      return;
    }

    const targetUserId = await this.redis.getSocketUser(to);
    if (!targetUserId) {
      client.emit('chat:error', { message: 'Recipient socket not found' });
      return;
    }

    const session = await this.match.getSession(senderId);
    if (session !== targetUserId) {
      client.emit('chat:error', { message: 'You are not in a session with this user' });
      return;
    }

    this.toSocket(to)?.emit('chat:message', { text });
  }

  // ── chat:skip ────────────────────────────────────────────────────────────────

  @SubscribeMessage('chat:skip')
  async handleSkip(@ConnectedSocket() client: ChatSocket): Promise<void> {
    await this.cleanup(client, 'skip');
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  /** Returns the live socket for a given socket ID, or undefined if not connected. */
  private toSocket(socketId: string): ChatSocket | undefined {
    return this.sockets.get(socketId);
  }

  private async cleanup(
    client: ChatSocket,
    reason: 'skip' | 'disconnect',
  ): Promise<void> {
    const userId = await this.redis.getSocketUser(client.id);
    if (!userId) return;

    await this.match.removeFromQueue(userId);

    const partnerId = await this.match.getSession(userId);

    if (partnerId) {
      await this.match.endSession(userId, partnerId);

      const partnerSocketId = await this.redis.getUserSocket(partnerId);
      if (partnerSocketId) {
        this.toSocket(partnerSocketId)?.emit('chat:partner-left', { reason });

        if (reason === 'skip') {
          const position = await this.match.requeueUser(partnerId);
          this.toSocket(partnerSocketId)?.emit('chat:queued', { position });
        }
      }
    }

    if (reason === 'skip') {
      if (partnerId) {
        // Was in a session → requeue to meet someone new.
        const position = await this.match.requeueUser(userId);
        client.emit('chat:queued', { position });
      }
      // No session → user cancelled from queue → do nothing, stay idle.
    } else {
      await this.redis.removeSocketUser(client.id, userId);
    }

    this.logger.log(`Cleanup [${reason}]: ${userId}`);
  }
}
