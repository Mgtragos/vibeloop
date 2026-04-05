import type { Loop } from './index';
export interface ServerToClientEvents {
    'loop:created': (loop: Loop) => void;
    'loop:updated': (loop: Loop) => void;
    'loop:deleted': (id: string) => void;
    'chat:queued': (payload: {
        position: number;
    }) => void;
    'chat:matched': (payload: {
        partnerId: string;
        initiator: boolean;
    }) => void;
    'chat:signal': (payload: {
        from: string;
        signal: unknown;
    }) => void;
    'chat:partner-left': (payload: {
        reason: 'skip' | 'disconnect';
    }) => void;
    'chat:error': (payload: {
        message: string;
    }) => void;
}
export interface ClientToServerEvents {
    'loop:join': (loopId: string) => void;
    'loop:leave': (loopId: string) => void;
    'chat:join-queue': (payload: {
        userId: string;
    }) => void;
    'chat:signal': (payload: {
        to: string;
        signal: unknown;
    }) => void;
    'chat:skip': () => void;
}
//# sourceMappingURL=events.d.ts.map