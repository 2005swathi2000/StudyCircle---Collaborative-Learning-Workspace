import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    let rawSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    
    // Enforce correct Render domain (k1l7) when running in production Vercel environment
    if (typeof window !== 'undefined' && 
        (window.location.hostname.includes('vercel.app') || rawSocketUrl.includes('studycircle-backend'))) {
      rawSocketUrl = 'https://studycircle-backend-k1l7.onrender.com';
    }
    
    // Ensure no trailing slash
    rawSocketUrl = rawSocketUrl.replace(/\/$/, '');
    
    const socketUrl = rawSocketUrl;
    socket = io(socketUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling']
    });
  }
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
