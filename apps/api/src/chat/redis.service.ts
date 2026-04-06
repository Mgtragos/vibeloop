import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Redis key layout
 * ─────────────────────────────────────────────────────────────
 * queue:global           Sorted Set  member=userId  score=joinTimestamp(ms)
 * user:{socketId}        String      → userId
 * user:reverse:{userId}  String      → socketId   (reverse lookup)
 * session:{sessionId}    String      → partnerId
 */
const QUEUE_KEY = 'queue:global';
const SOCKET_KEY = (socketId: string) => `user:${socketId}`;
const USER_KEY = (userId: string) => `user:reverse:${userId}`;
const SESSION_KEY = (id: string) => `session:${id}`;

const TTL_SECONDS = 3600; // 1 h safety expiry on ephemeral keys

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  onModuleInit(): void {
    this.client = process.env['REDIS_URL']
      ? new Redis(process.env['REDIS_URL'])
      : new Redis({
          host: process.env['REDIS_HOST'] ?? 'localhost',
          port: Number(process.env['REDIS_PORT'] ?? 6379),
          password: process.env['REDIS_PASSWORD'] ?? undefined,
        });

    this.client.on('error', (err: Error) => this.logger.error('Redis error', err.message));
    this.client.on('connect', () => this.logger.log('Redis connected'));
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  // ── Queue (Sorted Set) ───────────────────────────────────────────────────────

  /** Add userId to the waiting queue with current timestamp as score (FIFO). */
  async enqueue(userId: string): Promise<void> {
    await this.client.zadd(QUEUE_KEY, Date.now(), userId);
  }

  /**
   * Atomically pop the oldest waiting user.
   * Returns the userId or null if the queue is empty.
   */
  async popOldest(): Promise<string | null> {
    // ZPOPMIN returns [member, score, member, score, ...]
    const result = await this.client.zpopmin(QUEUE_KEY, 1);
    return result.length > 0 ? (result[0] ?? null) : null;
  }

  /** Remove a specific user from the queue (used on skip/disconnect). */
  async removeFromQueue(userId: string): Promise<void> {
    await this.client.zrem(QUEUE_KEY, userId);
  }

  /**
   * 0-based rank in the queue (lowest score = oldest = rank 0).
   * Returns null if the user is not queued.
   */
  async queueRank(userId: string): Promise<number | null> {
    const rank = await this.client.zrank(QUEUE_KEY, userId);
    return rank; // ioredis returns null when member absent
  }

  async queueSize(): Promise<number> {
    return this.client.zcard(QUEUE_KEY);
  }

  // ── Socket ↔ User mappings ───────────────────────────────────────────────────

  async setSocketUser(socketId: string, userId: string): Promise<void> {
    await Promise.all([
      this.client.set(SOCKET_KEY(socketId), userId, 'EX', TTL_SECONDS),
      this.client.set(USER_KEY(userId), socketId, 'EX', TTL_SECONDS),
    ]);
  }

  async getSocketUser(socketId: string): Promise<string | null> {
    return this.client.get(SOCKET_KEY(socketId));
  }

  async getUserSocket(userId: string): Promise<string | null> {
    return this.client.get(USER_KEY(userId));
  }

  async removeSocketUser(socketId: string, userId: string): Promise<void> {
    await Promise.all([
      this.client.del(SOCKET_KEY(socketId)),
      this.client.del(USER_KEY(userId)),
    ]);
  }

  // ── Session (active pairs) ───────────────────────────────────────────────────

  async setSession(userA: string, userB: string): Promise<void> {
    await Promise.all([
      this.client.set(SESSION_KEY(userA), userB, 'EX', TTL_SECONDS),
      this.client.set(SESSION_KEY(userB), userA, 'EX', TTL_SECONDS),
    ]);
  }

  async getSession(userId: string): Promise<string | null> {
    return this.client.get(SESSION_KEY(userId));
  }

  async removeSession(userA: string, userB: string): Promise<void> {
    await Promise.all([
      this.client.del(SESSION_KEY(userA)),
      this.client.del(SESSION_KEY(userB)),
    ]);
  }
}
