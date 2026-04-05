'use client';

import type { ClientToServerEvents, ServerToClientEvents } from '../types';
import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const CHAT_URL =
  (typeof process !== 'undefined' && process.env['NEXT_PUBLIC_API_URL']) ||
  'http://localhost:4000';

/**
 * Creates and manages a Socket.IO connection to the /chat namespace.
 * The socket is stable across re-renders and is torn down on unmount.
 */
export function useSocket(): ChatSocket | null {
  const [socket, setSocket] = useState<ChatSocket | null>(null);
  const socketRef = useRef<ChatSocket | null>(null);

  useEffect(() => {
    const s: ChatSocket = io(`${CHAT_URL}/chat`, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, []);

  return socket;
}
