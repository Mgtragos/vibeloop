import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import type { ClientToServerEvents, ServerToClientEvents, SignalPayload } from '@vibeloop/types';
import type { Server, Socket } from 'socket.io';
import { MatchService } from '../match/match.service';
import { RedisService } from './redis.service';
type ChatServer = Server<ClientToServerEvents, ServerToClientEvents>;
type ChatSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly redis;
    private readonly match;
    server: ChatServer;
    private readonly logger;
    constructor(redis: RedisService, match: MatchService);
    handleConnection(client: ChatSocket): void;
    handleDisconnect(client: ChatSocket): Promise<void>;
    handleJoinQueue(payload: {
        userId: string;
    }, client: ChatSocket): Promise<void>;
    handleSignal(payload: SignalPayload, client: ChatSocket): Promise<void>;
    handleSkip(client: ChatSocket): Promise<void>;
    private cleanup;
}
export {};
//# sourceMappingURL=chat.gateway.d.ts.map