import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { connectDB } from './config/db';
import { ENV } from './config/constants';

async function bootstrap() {
  await connectDB();

  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      credentials: true,
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    // Join global room by default
    socket.join('campus_global');

    socket.emit('connected', {
      status: 'success',
      message: 'Connected to CampusCart Real-time Gateway',
      socketId: socket.id,
      room: 'campus_global',
    });

    socket.on('join_room', ({ room }) => {
      if (room) {
        socket.join(room);
      }
    });

    socket.on('join_direct', ({ senderId, recipientId }) => {
      if (senderId && recipientId) {
        const sorted = [senderId, recipientId].sort();
        const roomName = `chat_${sorted[0]}_${sorted[1]}`;
        socket.join(roomName);
      }
    });

    socket.on('send_global_message', (payload) => {
      const msg = {
        id: `global_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        chatType: 'GLOBAL',
        conversationId: 'campus_global_hub',
        senderId: payload.senderId,
        senderName: payload.senderName || 'Campus Student',
        senderAvatar: payload.senderAvatar || '',
        content: payload.content,
        productContext: payload.productContext || null,
        status: 'DELIVERED',
        createdAt: new Date().toISOString(),
      };
      io.to('campus_global').emit('receive_global_message', msg);
      io.to('campus_global').emit('new_global_message', msg);
    });

    socket.on('send_direct_message', (payload) => {
      if (!payload.senderId || !payload.recipientId) return;
      const sorted = [payload.senderId, payload.recipientId].sort();
      const roomName = `chat_${sorted[0]}_${sorted[1]}`;
      const msg = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        chatType: 'DIRECT',
        conversationId: roomName,
        senderId: payload.senderId,
        recipientId: payload.recipientId,
        senderName: payload.senderName || 'Campus Student',
        senderAvatar: payload.senderAvatar || '',
        content: payload.content,
        productContext: payload.productContext || null,
        status: 'DELIVERED',
        createdAt: new Date().toISOString(),
      };
      io.to(roomName).emit('receive_direct_message', msg);
    });

    socket.on('typing', ({ room, senderId, isTyping }) => {
      if (room) {
        socket.to(room).emit('user_typing', { senderId, isTyping });
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  const server = httpServer.listen(ENV.PORT, () => {
    console.log(`
==================================================================
  🛡️  CampusCart Secure API & Real-Time Engine Active
  🚀  Port: ${ENV.PORT} | Mode: ${ENV.NODE_ENV}
  ⚡  WebSocket: Socket.IO Gateway attached on /socket.io
  🔒  Auth: Stateless JWT in HttpOnly + SameSite=Strict Cookies
  🛡️  Security: Magic Bytes Validation + Rate Limits + CSRF
  ⚡  Geospatial: MongoDB 2dsphere + Cursor Pagination
  ⚖️  Escrow: Zero-Trust State Machine with OTP Release
==================================================================
    `);
  });

  const gracefulShutdown = () => {
    console.log('[Server] Gracefully shutting down CampusCart server...');
    server.close(() => {
      console.log('[Server] Process terminated.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

if (require.main === module) {
  bootstrap();
}

export { app, bootstrap };
