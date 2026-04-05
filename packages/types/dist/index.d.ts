export interface User {
    id: string;
    email: string;
    username: string;
    createdAt: Date;
    updatedAt: Date;
}
export type CreateUserDto = Pick<User, 'email' | 'username'>;
export interface QueueEntry {
    userId: string;
    joinedAt: number;
}
export interface ChatMatchPayload {
    partnerId: string;
    initiator: boolean;
}
export interface SignalPayload {
    /** Socket ID of the intended recipient */
    to: string;
    /** Opaque WebRTC SDP / ICE payload */
    signal: unknown;
}
export interface ApiResponse<T> {
    data: T;
    message?: string;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    total: number;
    page: number;
    limit: number;
}
export type { ClientToServerEvents, ServerToClientEvents } from './events';
//# sourceMappingURL=index.d.ts.map