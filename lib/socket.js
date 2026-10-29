'use client';

import { io } from 'socket.io-client';

let socket = null;

/**
 * Singleton Socket.io client instance.
 * In a single full-stack Railway deployment, both frontend and backend
 * share the exact same domain, so the client connects to window.location.origin.
 */
export const getSocket = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!socket) {
    const socketOrigin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : undefined;

    socket = io(socketOrigin, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });
  }

  return socket;
};
