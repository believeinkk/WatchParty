'use client';

import { io } from 'socket.io-client';

/**
 * Frontend Socket.io Client initialization.
 * Dynamically connects to NEXT_PUBLIC_SOCKET_URL (for custom/external Render deployments)
 * or falls back to window.location.origin (for same-origin full-stack deployments).
 */
export const socket =
  typeof window !== 'undefined'
    ? io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
        transports: ['websocket', 'polling'],
      })
    : null;

if (socket) {
  socket.on('connect', () => {
    console.log('[Socket] Connected to server successfully:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error?.message || error);
  });

  socket.on('disconnect', (reason) => {
    console.warn('[Socket] Disconnected from server:', reason);
  });
}

/**
 * Returns the singleton Socket.io client instance.
 * Safe for Next.js SSR: returns null on the server.
 */
export const getSocket = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return socket;
};

export default getSocket;
