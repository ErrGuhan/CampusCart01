'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useChatSocket, ChatSocketMessage, ProductContext } from '@/hooks/use-chat-socket';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, Globe, Sparkles, Bell } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface RealtimeContextType {
  isConnected: boolean;
  socket: any;
  unreadCount: number;
  latestGlobalMessage: ChatSocketMessage | null;
  latestDirectMessage: ChatSocketMessage | null;
  joinDirectChat: (senderId: string, recipientId: string) => void;
  sendDirectMessage: (payload: any) => void;
  sendGlobalMessage: (payload: any) => void;
  emitTyping: (room: string, senderId: string, isTyping: boolean) => void;
  refreshUnreadCount: () => void;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  socket: null,
  unreadCount: 0,
  latestGlobalMessage: null,
  latestDirectMessage: null,
  joinDirectChat: () => {},
  sendDirectMessage: () => {},
  sendGlobalMessage: () => {},
  emitTyping: () => {},
  refreshUnreadCount: () => {},
});

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const {
    socket,
    isConnected,
    globalMessages,
    directMessages,
    typingUsers,
    joinDirectChat,
    sendDirectMessage,
    sendGlobalMessage,
    emitTyping,
  } = useChatSocket();

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [latestGlobalMessage, setLatestGlobalMessage] = useState<ChatSocketMessage | null>(null);
  const [latestDirectMessage, setLatestDirectMessage] = useState<ChatSocketMessage | null>(null);

  // Sync unread messages and notifications count across the site
  const refreshUnreadCount = useCallback(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      const convRaw = localStorage.getItem('campuscart_conversations');
      if (convRaw) {
        const convs = JSON.parse(convRaw);
        if (Array.isArray(convs)) {
          let count = 0;
          convs.forEach((c: any) => {
            if (c.unreadCount && c.unreadCount[user.uid]) {
              count += c.unreadCount[user.uid];
            }
          });
          setUnreadCount(count);
        }
      }
    } catch {}
  }, [user]);

  // Handle incoming real-time global messages website-wide
  useEffect(() => {
    if (globalMessages.length > 0) {
      const newest = globalMessages[globalMessages.length - 1];
      setLatestGlobalMessage(newest);

      // Only toast if message is from another user and received recently
      if (user && newest.senderId !== user.uid) {
        const isRecent = Math.abs(Date.now() - new Date(newest.createdAt).getTime()) < 5000;
        if (isRecent) {
          toast({
            title: `🌐 Campus Hub: ${newest.senderName}`,
            description: newest.content.length > 50 ? newest.content.slice(0, 47) + '...' : newest.content,
            action: (
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl text-xs font-bold border-purple-500/40 text-purple-600 dark:text-purple-400"
                onClick={() => router.push('/messages')}
              >
                View Hub
              </Button>
            ),
          });
        }
      }
    }
  }, [globalMessages, user, toast, router]);

  // Handle incoming real-time direct messages website-wide
  useEffect(() => {
    const allDMArrays = Object.values(directMessages);
    if (allDMArrays.length > 0) {
      const flattened = allDMArrays.flat();
      if (flattened.length > 0) {
        const newest = flattened.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        setLatestDirectMessage(newest);
        refreshUnreadCount();

        if (user && newest.senderId !== user.uid && newest.recipientId === user.uid) {
          const isRecent = Math.abs(Date.now() - new Date(newest.createdAt).getTime()) < 5000;
          if (isRecent) {
            toast({
              title: `💬 Message from ${newest.senderName}`,
              description: newest.content.length > 50 ? newest.content.slice(0, 47) + '...' : newest.content,
              action: (
                <Button
                  size="sm"
                  className="btn-gradient-primary rounded-xl text-xs font-bold"
                  onClick={() => router.push(`/messages?user=${newest.senderId}&name=${encodeURIComponent(newest.senderName)}`)}
                >
                  Reply
                </Button>
              ),
            });
          }
        }
      }
    }
  }, [directMessages, user, toast, router, refreshUnreadCount]);

  // Event listeners for data synchronization across tabs/components
  useEffect(() => {
    refreshUnreadCount();

    const handleSync = () => {
      refreshUnreadCount();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('campuscart_message_sent', handleSync);
      window.addEventListener('storage', handleSync);
      return () => {
        window.removeEventListener('campuscart_message_sent', handleSync);
        window.removeEventListener('storage', handleSync);
      };
    }
  }, [refreshUnreadCount]);

  const value = useMemo(
    () => ({
      isConnected,
      socket,
      unreadCount,
      latestGlobalMessage,
      latestDirectMessage,
      joinDirectChat,
      sendDirectMessage,
      sendGlobalMessage,
      emitTyping,
      refreshUnreadCount,
    }),
    [
      isConnected,
      socket,
      unreadCount,
      latestGlobalMessage,
      latestDirectMessage,
      joinDirectChat,
      sendDirectMessage,
      sendGlobalMessage,
      emitTyping,
      refreshUnreadCount,
    ]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeSync() {
  return useContext(RealtimeContext);
}
