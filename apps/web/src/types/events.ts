export interface ServerToClientEvents {
  'chat:queued': (payload: { position: number }) => void;
  'chat:matched': (payload: { partnerId: string; initiator: boolean }) => void;
  'chat:signal': (payload: { from: string; signal: unknown }) => void;
  'chat:message': (payload: { text: string }) => void;
  'chat:partner-left': (payload: { reason: 'skip' | 'disconnect' }) => void;
  'chat:error': (payload: { message: string }) => void;
}

export interface ClientToServerEvents {
  'chat:join-queue': (payload: { userId: string }) => void;
  'chat:signal': (payload: { to: string; signal: unknown }) => void;
  'chat:message': (payload: { to: string; text: string }) => void;
  'chat:skip': () => void;
}
