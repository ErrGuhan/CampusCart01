'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface ProductContext {
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
  productContext?: ProductContext;
}

export interface GlobalMessagePayload {
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  productContext?: ProductContext;
}

export interface ChatSocketMessage {
  id: string;
  chatType: 'DIRECT' | 'GLOBAL';
  conversationId?: string;
  senderId: string;
  recipientId?: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  productContext?: ProductContext | null;
  status?: 'SENT' | 'DELIVERED' | 'READ';
  createdAt: string;
}

export function useChatSocket(serverUrl = 'http://localhost:3001/chat') {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [globalMessages, setGlobalMessages] = useState<ChatSocketMessage[]>([]);
  const [directMessages, setDirectMessages] = useState<Record<string, ChatSocketMessage[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Pass JWT token from localStorage for authentication as specified in Phase 3
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('auth_token') || localStorage.getItem('campuscart_auth_token') || ''
        : '';

    const socket: Socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ [Socket.io] Connected to Chat Gateway:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('⚡ [Socket.io] Disconnected from Chat Gateway');
      setIsConnected(false);
    });

    // Listen for incoming global messages in campus_global room
    socket.on('new_global_message', (msg: ChatSocketMessage) => {
      setGlobalMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Listen for incoming direct messages in active DM rooms
    socket.on('new_direct_message', (msg: ChatSocketMessage) => {
      if (!msg.conversationId) return;
      setDirectMessages((prev) => {
        const roomMsgs = prev[msg.conversationId!] || [];
        if (roomMsgs.some((m) => m.id === msg.id)) return prev;
        return {
          ...prev,
          [msg.conversationId!]: [...roomMsgs, msg],
        };
      });
    });

    // Listen for typing events
    socket.on('user_typing', ({ senderId, isTyping }: { senderId: string; isTyping: boolean }) => {
      setTypingUsers((prev) => ({ ...prev, [senderId]: isTyping }));
    });

    return () => {
      socket.disconnect();
    };
  }, [serverUrl]);

  /**
   * Helper to join a specific 1-on-1 DM room dynamically
   */
  const joinDirectChat = useCallback((senderId: string, recipientId: string) => {
    if (!socketRef.current || !senderId || !recipientId) return;
    socketRef.current.emit('join_direct_chat', { senderId, recipientId });
  }, []);

  /**
   * Helper to send direct message
   */
  const sendDirectMessage = useCallback((payload: DirectMessagePayload) => {
    if (!socketRef.current) return;
    socketRef.current.emit('send_direct_message', payload);
  }, []);

  /**
   * Helper to send global campus hub message
   */
  const sendGlobalMessage = useCallback((payload: GlobalMessagePayload) => {
    if (!socketRef.current) return;
    socketRef.current.emit('send_global_message', payload);
  }, []);

  /**
   * Helper to emit typing state to room
   */
  const emitTyping = useCallback((room: string, senderId: string, isTyping: boolean) => {
    if (!socketRef.current) return;
    socketRef.current.emit('user_typing', { room, senderId, isTyping });
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    globalMessages,
    directMessages,
    typingUsers,
    joinDirectChat,
    sendDirectMessage,
    sendGlobalMessage,
    emitTyping,
    setGlobalMessages,
    setDirectMessages,
  };
}
