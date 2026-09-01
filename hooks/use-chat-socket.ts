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

// Helper to deduplicate messages by ID or identical sender + text + timestamp
function deduplicateMessages(existing: ChatSocketMessage[], incoming: ChatSocketMessage[]): ChatSocketMessage[] {
  const map = new Map<string, ChatSocketMessage>();
  existing.forEach((m) => map.set(m.id, m));

  incoming.forEach((msg) => {
    // Check if duplicate exists by ID or by matching senderId, text, and timestamp window
    const exists = Array.from(map.values()).some(
      (ex) =>
        ex.id === msg.id ||
        (ex.senderId === msg.senderId &&
          ex.content.trim() === msg.content.trim() &&
          Math.abs(new Date(ex.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 3000)
    );

    if (!exists) {
      map.set(msg.id, msg);
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function useChatSocket(customServerUrl?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [globalMessages, setGlobalMessages] = useState<ChatSocketMessage[]>([]);
  const [directMessages, setDirectMessages] = useState<Record<string, ChatSocketMessage[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  useEffect(() => {
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
        console.warn('⚡ [Socket.io] Connection notice:', err.message);
        setIsConnected(false);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      // Phase 3 Listeners: Active listeners for receive_global_message AND new_global_message
      const handleIncomingGlobalMessage = (msg: ChatSocketMessage) => {
        setGlobalMessages((prev) => deduplicateMessages(prev, [msg]));
      };

      socket.on('receive_global_message', handleIncomingGlobalMessage);
      socket.on('new_global_message', handleIncomingGlobalMessage);

      // Listeners for direct messages
      const handleIncomingDirectMessage = (msg: ChatSocketMessage) => {
        if (!msg.conversationId) return;
        setDirectMessages((prev) => {
          const roomMsgs = prev[msg.conversationId!] || [];
          return {
            ...prev,
            [msg.conversationId!]: deduplicateMessages(roomMsgs, [msg]),
          };
        });
      };

      socket.on('receive_direct_message', handleIncomingDirectMessage);
      socket.on('new_direct_message', handleIncomingDirectMessage);

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
