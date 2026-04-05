import { Injectable } from '@nestjs/common';

import { RedisService } from '../chat/redis.service';

/**
 * Encapsulates matchmaking business logic.
 * Transport concerns (Socket.IO) stay out of this layer.
 */
@Injectable()
export class MatchService {
  constructor(private readonly redis: RedisService) {}

  /**
   * Attempt to match `userId` with a waiting candidate.
   *
   * Returns the candidate's userId if a match was made, null if the caller
   * was added to the queue instead.
   */
  async tryMatch(userId: string): Promise<string | null> {
    const candidate = await this.redis.popOldest();

    if (candidate && candidate !== userId) {
      await this.redis.setSession(userId, candidate);
      return candidate;
    }

    // Edge case: we popped ourselves (reconnect race). Put back and stop.
    if (candidate === userId) {
      await this.redis.enqueue(userId);
      return null;
    }

    await this.redis.enqueue(userId);
    return null;
  }

  /**
   * 1-based queue position for `userId`. Returns 1 if not found (safe default).
   */
  async queuePosition(userId: string): Promise<number> {
    const rank = await this.redis.queueRank(userId);
    return rank !== null ? rank + 1 : 1;
  }

  async removeFromQueue(userId: string): Promise<void> {
    await this.redis.removeFromQueue(userId);
  }

  async getSession(userId: string): Promise<string | null> {
    return this.redis.getSession(userId);
  }

  async endSession(userA: string, userB: string): Promise<void> {
    await this.redis.removeSession(userA, userB);
  }

  async requeueUser(userId: string): Promise<number> {
    await this.redis.enqueue(userId);
    return this.queuePosition(userId);
  }
}
