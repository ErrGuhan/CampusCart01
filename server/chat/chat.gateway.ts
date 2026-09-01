import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export enum ChatType {
  DIRECT = 'DIRECT',
  GLOBAL = 'GLOBAL',
}

export interface ProductContextPayload {
  id: string;
  title: string;
  price?: number;
  image?: string;
}

export interface DirectMessagePayload {
  senderId: string;
  recipientId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  productContext?: ProductContextPayload;
}

export interface GlobalMessagePayload {
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  productContext?: ProductContextPayload;
}

export interface TypingPayload {
  senderId: string;
  room: string;
  isTyping: boolean;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  /**
   * Generates a deterministic dynamic room name for 1-on-1 direct messages
   * Format: chat_userA_userB (lexicographically sorted)
   */
  public static getDirectRoomName(userA: string, userB: string): string {
    const sorted = [userA, userB].sort();
    return `chat_${sorted[0]}_${sorted[1]}`;
  }

  /**
   * Phase 1 Fix: Every connecting client explicitly joins the 'campus_global' room
   */
  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      this.logger.log(`Client connecting to CampusCart Gateway: ${client.id}`);

      // Explicitly subscribe client to Global Campus Hub room
      await client.join('campus_global');
      this.logger.log(`Client ${client.id} joined shared room: 'campus_global'`);

      client.emit('connected', {
        status: 'success',
        message: 'Connected to CampusCart Real-time Gateway',
        defaultRoom: 'campus_global',
        socketId: client.id,
      });
    } catch (error) {
      this.logger.error(`Connection auth error for socket ${client.id}`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Event Listener: Join Direct Chat Room
   */
  @SubscribeMessage('join_direct_chat')
  handleJoinDirectChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { senderId: string; recipientId: string }
  ) {
    if (!payload?.senderId || !payload?.recipientId) {
      return { status: 'error', message: 'senderId and recipientId are required' };
    }
    const room = ChatGateway.getDirectRoomName(payload.senderId, payload.recipientId);
    client.join(room);
    this.logger.log(`Client ${client.id} joined DM room: ${room}`);
    return { status: 'joined', room };
  }

  /**
   * Event Listener: Send Direct Message
   */
  @SubscribeMessage('send_direct_message')
  async handleSendDirectMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DirectMessagePayload
  ) {
    if (!payload?.senderId || !payload?.recipientId || !payload?.content?.trim()) {
      return { status: 'error', message: 'Invalid direct message payload' };
    }

    const room = ChatGateway.getDirectRoomName(payload.senderId, payload.recipientId);
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();

    const formattedMessage = {
      id: messageId,
      chatType: ChatType.DIRECT,
      conversationId: room,
      senderId: payload.senderId,
      recipientId: payload.recipientId,
      senderName: payload.senderName || 'Campus Student',
      senderAvatar: payload.senderAvatar || '',
      content: payload.content.trim(),
      productContext: payload.productContext || null,
      status: 'DELIVERED',
      createdAt: timestamp,
    };

    // Emit real-time message to DM room (both sender and recipient)
    this.server.to(room).emit('new_direct_message', formattedMessage);
    this.server.to(room).emit('receive_direct_message', formattedMessage);
    this.logger.log(`Direct message sent in room [${room}] by [${payload.senderId}]`);

    return { status: 'sent', messageId, conversationId: room, message: formattedMessage };
  }

  /**
   * Phase 1 Broadcast Fix: Send Global Message Handler
   * Broadcasts to ALL connected users in 'campus_global' room via receive_global_message & new_global_message
   */
  @SubscribeMessage('send_global_message')
  async handleSendGlobalMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: GlobalMessagePayload
  ) {
    if (!payload?.senderId || !payload?.content?.trim()) {
      return { status: 'error', message: 'Invalid global message payload' };
    }

    const messageId = `global_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();

    const savedMessage = {
      id: messageId,
      chatType: ChatType.GLOBAL,
      conversationId: 'campus_global_hub',
      senderId: payload.senderId,
      senderName: payload.senderName || 'Campus Peer',
      senderAvatar: payload.senderAvatar || '',
      content: payload.content.trim(),
      productContext: payload.productContext || null,
      status: 'DELIVERED',
      createdAt: timestamp,
    };

    // CRITICAL BROADCAST FIX:
    // Broadcasts to the ENTIRE 'campus_global' room so all connected users receive the message simultaneously
    this.server.to('campus_global').emit('receive_global_message', savedMessage);
    this.server.to('campus_global').emit('new_global_message', savedMessage);

    this.logger.log(`Global message broadcasted to room 'campus_global' from [${payload.senderName}]`);

    return { status: 'sent', messageId, message: savedMessage };
  }

  /**
   * Event Listener: User Typing Indicator
   */
  @SubscribeMessage('user_typing')
  handleUserTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingPayload
  ) {
    if (!payload?.room || !payload?.senderId) return;

    client.to(payload.room).emit('user_typing', {
      senderId: payload.senderId,
      room: payload.room,
      isTyping: payload.isTyping,
    });
  }
}
