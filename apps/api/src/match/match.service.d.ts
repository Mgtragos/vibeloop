import { RedisService } from '../chat/redis.service';
/**
 * Encapsulates matchmaking business logic.
 * Transport concerns (Socket.IO) stay out of this layer.
 */
export declare class MatchService {
    private readonly redis;
    constructor(redis: RedisService);
    /**
     * Attempt to match `userId` with a waiting candidate.
     *
     * Returns the candidate's userId if a match was made, null if the caller
     * was added to the queue instead.
     */
    tryMatch(userId: string): Promise<string | null>;
    /**
     * 1-based queue position for `userId`. Returns 1 if not found (safe default).
     */
    queuePosition(userId: string): Promise<number>;
    removeFromQueue(userId: string): Promise<void>;
    getSession(userId: string): Promise<string | null>;
    endSession(userA: string, userB: string): Promise<void>;
    requeueUser(userId: string): Promise<number>;
}
//# sourceMappingURL=match.service.d.ts.map