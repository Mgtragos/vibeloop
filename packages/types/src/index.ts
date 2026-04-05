// ── User ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserDto = Pick<User, 'email' | 'username'>;

// ── Chat ──────────────────────────────────────────────────────────────────────

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

// ── API responses ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

// ── Socket events (canonical source of truth) ─────────────────────────────────
export type { ClientToServerEvents, ServerToClientEvents } from './events';
