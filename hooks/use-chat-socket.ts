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

export function useChatSocket(customServerUrl?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [globalMessages, setGlobalMessages] = useState<ChatSocketMessage[]>([]);
  const [directMessages, setDirectMessages] = useState<Record<string, ChatSocketMessage[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Dynamic Socket URL detection (Fallback to current hostname on port 3001)
    const getSocketUrl = () => {
      if (customServerUrl) return customServerUrl;
      if (process.env.NEXT_PUBLIC_SOCKET_URL) return process.env.NEXT_PUBLIC_SOCKET_URL;
      if (typeof window !== 'undefined') {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname || 'localhost';
        return `${protocol}//${hostname}:3001/chat`;
      }
      return 'http://localhost:3001/chat';
    };

    const targetUrl = getSocketUrl();
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('auth_token') || localStorage.getItem('campuscart_auth_token') || ''
        : '';

    let socket: Socket;
    try {
      socket = io(targetUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 5000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('⚡ [Socket.io] Connected to Chat Gateway:', socket.id);
        setIsConnected(true);
      });

      socket.on('connect_error', (err) => {
        console.warn('⚡ [Socket.io] Socket connection fallback notice:', err.message);
        setIsConnected(false);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      // Listen for incoming global messages
      socket.on('new_global_message', (msg: ChatSocketMessage) => {
        setGlobalMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      });

      // Listen for incoming direct messages
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

      socket.on('user_typing', ({ senderId, isTyping }: { senderId: string; isTyping: boolean }) => {
        setTypingUsers((prev) => ({ ...prev, [senderId]: isTyping }));
      });
    } catch (err) {
      console.warn('Socket initialization notice:', err);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [customServerUrl]);

  const joinDirectChat = useCallback((senderId: string, recipientId: string) => {
    if (!socketRef.current || !senderId || !recipientId) return;
    try {
      socketRef.current.emit('join_direct_chat', { senderId, recipientId });
    } catch {}
  }, []);

  const sendDirectMessage = useCallback((payload: DirectMessagePayload) => {
    if (!socketRef.current) return;
    try {
      socketRef.current.emit('send_direct_message', payload);
    } catch {}
  }, []);

  const sendGlobalMessage = useCallback((payload: GlobalMessagePayload) => {
    if (!socketRef.current) return;
    try {
      socketRef.current.emit('send_global_message', payload);
    } catch {}
  }, []);

  const emitTyping = useCallback((room: string, senderId: string, isTyping: boolean) => {
    if (!socketRef.current) return;
    try {
      socketRef.current.emit('user_typing', { room, senderId, isTyping });
    } catch {}
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
