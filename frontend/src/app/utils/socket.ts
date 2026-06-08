import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    let rawSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    // Auto-correct spelling typo (k117 -> k1l7) in Render subdomain
    if (rawSocketUrl.includes('studycircle-backend-k117.onrender.com')) {
      rawSocketUrl = rawSocketUrl.replace('studycircle-backend-k117.onrender.com', 'studycircle-backend-k1l7.onrender.com');
    }
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
