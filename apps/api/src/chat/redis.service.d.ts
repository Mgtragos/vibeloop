import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private client;
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
    /** Add userId to the waiting queue with current timestamp as score (FIFO). */
    enqueue(userId: string): Promise<void>;
    /**
     * Atomically pop the oldest waiting user.
     * Returns the userId or null if the queue is empty.
     */
    popOldest(): Promise<string | null>;
    /** Remove a specific user from the queue (used on skip/disconnect). */
    removeFromQueue(userId: string): Promise<void>;
    /**
     * 0-based rank in the queue (lowest score = oldest = rank 0).
     * Returns null if the user is not queued.
     */
    queueRank(userId: string): Promise<number | null>;
    queueSize(): Promise<number>;
    setSocketUser(socketId: string, userId: string): Promise<void>;
    getSocketUser(socketId: string): Promise<string | null>;
    getUserSocket(userId: string): Promise<string | null>;
    removeSocketUser(socketId: string, userId: string): Promise<void>;
    setSession(userA: string, userB: string): Promise<void>;
    getSession(userId: string): Promise<string | null>;
    removeSession(userA: string, userB: string): Promise<void>;
}
//# sourceMappingURL=redis.service.d.ts.map