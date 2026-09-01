import { Injectable } from '@nestjs/common';
import { ChatType } from '../chat/chat.gateway';

export interface GlobalChatMessageDto {
  id: string;
  chatType: 'GLOBAL';
  conversationId: 'campus_global_hub';
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  productContext?: any;
  status: 'DELIVERED';
  createdAt: string;
}

// In-Memory & PostgreSQL Persistence Buffer for Global Campus Hub Chat History
const globalMessagesStore: GlobalChatMessageDto[] = [
  {
    id: 'global_init_1',
    chatType: 'GLOBAL',
    conversationId: 'campus_global_hub',
    senderId: 'user_admin',
    senderName: 'Campus Manager',
    senderAvatar: '',
    content: 'Welcome to the official Global Campus Hub! Share requests, ask questions, or announce campus news.',
    status: 'DELIVERED',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

@Injectable()
export class ChatService {
  /**
   * Fetches historical global messages ordered by created_at ASC (Last 50 messages)
   */
  async getGlobalMessagesHistory(limit = 50): Promise<GlobalChatMessageDto[]> {
    // PostgreSQL DDL Query equivalent:
    // SELECT id, chat_type AS "chatType", conversation_id AS "conversationId", 
    //        sender_id AS "senderId", content, product_context AS "productContext", created_at AS "createdAt"
    // FROM messages
    // WHERE chat_type = 'GLOBAL'
    // ORDER BY created_at ASC
    // LIMIT $1;

    return [...globalMessagesStore]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-limit);
  }

  /**
   * Saves a new global message ensuring chat_type is assigned as 'GLOBAL'
   */
  async saveGlobalMessage(payload: {
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    content: string;
    productContext?: any;
  }): Promise<GlobalChatMessageDto> {
    const newMsg: GlobalChatMessageDto = {
      id: `global_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      chatType: 'GLOBAL',
      conversationId: 'campus_global_hub',
      senderId: payload.senderId,
      senderName: payload.senderName || 'Campus Peer',
      senderAvatar: payload.senderAvatar || '',
      content: payload.content.trim(),
      productContext: payload.productContext || null,
      status: 'DELIVERED',
      createdAt: new Date().toISOString(),
    };

    globalMessagesStore.push(newMsg);
    if (globalMessagesStore.length > 200) {
      globalMessagesStore.shift();
    }

    return newMsg;
  }
}

export const chatService = new ChatService();
