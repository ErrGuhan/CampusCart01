'use client';

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import {
  MessageSquare, Send, User, Search, Store,
  Sparkles, CheckCheck, ShieldCheck, ArrowLeft,
  ChevronLeft, Loader2, Info, MapPin, Handshake, ShoppingBag,
  Settings, Bell, Plus, Mic, Copy, ThumbsUp, Volume2, RotateCcw,
  Check, X, Trash2, MoreVertical, BellRing, ExternalLink,
  Globe, Shield, MessageCircle, ExternalLink as LinkIcon, Radio, Zap,
  Filter, CheckCircle2, MessageCircleQuestion
} from 'lucide-react';
import {
  collection,
  doc,
  setDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import { useChatSocket, ChatSocketMessage, ProductContext } from '@/hooks/use-chat-socket';
import {
  getConversations,
  getMessages,
  sendChatMessage,
  getNotifications,
  deleteConversation,
} from '@/lib/firebase-queries';
import type { Conversation, NotificationItem } from '@/lib/types';
import { cn } from '@/lib/utils';

// Constant ID for Global Campus Hub Room
const GLOBAL_HUB_ID = 'campus_global_hub';

// Preset Quick Reply Chips for 1-Tap Message Sending
const QUICK_REPLY_CHIPS = [
  '👋 Hey! Is this still available?',
  '🤝 Let\'s meet at Central Library',
  '💰 Is the price negotiable?',
  '📍 What is your hostel/room number?',
  '📦 Can we meet at the Canteen?',
];

// Helper to extract product context from text format [Re: "Product Title"]
function extractProductContext(text: string, contextObject?: ProductContext | null) {
  if (contextObject && contextObject.title) {
    return { product: contextObject, cleanText: text };
  }

  const regex = /\[Re:\s*["']?([^"']+)["']?\]/i;
  const match = text.match(regex);
  if (match) {
    const title = match[1].trim();
    const cleanText = text.replace(regex, '').trim();
    return {
      product: { id: 'ctx_' + title, title, price: undefined },
      cleanText: cleanText || text,
    };
  }

  return { product: null, cleanText: text };
}

// Deduplication Helper: Merges messages avoiding duplicate client or broadcast bubbles
function mergeAndSortMessages(existing: ChatSocketMessage[], incoming: ChatSocketMessage[]): ChatSocketMessage[] {
  const map = new Map<string, ChatSocketMessage>();
  existing.forEach((m) => map.set(m.id, m));

  incoming.forEach((msg) => {
    const isDuplicate = Array.from(map.values()).some(
      (ex) =>
        ex.id === msg.id ||
        (ex.senderId === msg.senderId &&
          ex.content.trim() === msg.content.trim() &&
          Math.abs(new Date(ex.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 3000)
    );

    if (!isDuplicate) {
      map.set(msg.id, msg);
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

function MessagesContent() {
  const { user, profile, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const targetUserParam = searchParams.get('user');
  const targetNameParam = searchParams.get('name');
  const targetProductParam = searchParams.get('product');
  const { toast } = useToast();

  // Socket.io Real-Time Connection
  const {
    isConnected,
    globalMessages: socketGlobalMessages,
    directMessages: socketDirectMessages,
    typingUsers,
    joinDirectChat,
    sendDirectMessage,
    sendGlobalMessage,
    emitTyping,
  } = useChatSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>(GLOBAL_HUB_ID);
  const [messages, setMessages] = useState<ChatSocketMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'direct' | 'hub'>('all');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>(targetUserParam ? 'chat' : 'list');
  const [sending, setSending] = useState(false);
  const [likedMessages, setLikedMessages] = useState<Record<string, boolean>>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Touch gesture state for mobile drawer
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Notification & Delete Dialog States
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [convToDelete, setConvToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Broadcast channel for zero-latency cross-tab communication
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Smooth scroll container to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  // 1. Inter-tab BroadcastChannel setup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('campuscart_chat_channel');
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        const { type, conversationId, message } = event.data || {};
        if (type === 'NEW_MESSAGE' && message) {
          if (conversationId === activeConvId) {
            setMessages((prev) => mergeAndSortMessages(prev, [message]));
            setTimeout(() => scrollToBottom(true), 30);
          }
        }
      };

      return () => {
        channel.close();
      };
    }
  }, [activeConvId, scrollToBottom]);

  // 2. Load conversations for the user
  const loadUserConversations = useCallback(async () => {
    if (!user) return;
    try {
      const convs = await getConversations(user.uid);
      const sorted = [...convs].sort((a, b) => {
        const timeA = new Date(a.lastMessageTimestamp).getTime() || 0;
        const timeB = new Date(b.lastMessageTimestamp).getTime() || 0;
        return timeB - timeA;
      });
      setConversations(sorted);
    } catch (err) {
      console.warn('Error loading conversations:', err);
    }
  }, [user]);

  // 3. Real-Time Firestore Snapshot Listener for Active Conversation Messages
  useEffect(() => {
    if (!activeConvId) return;

    let unsubscribe = () => {};

    try {
      const msgsRef = collection(db, 'chats', activeConvId, 'messages');
      const q = query(msgsRef, orderBy('createdAt', 'asc'), limit(100));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const liveMsgs: ChatSocketMessage[] = [];
            snapshot.forEach((docSnap) => {
              const d = docSnap.data();
              liveMsgs.push({
                id: docSnap.id,
                chatType: activeConvId === GLOBAL_HUB_ID ? 'GLOBAL' : 'DIRECT',
                conversationId: activeConvId,
                senderId: d.senderId,
                recipientId: d.recipientId || (activeConvId === GLOBAL_HUB_ID ? 'global' : ''),
                senderName: d.senderName || 'Campus Student',
                senderAvatar: d.senderAvatar || '',
                content: d.text || d.content || '',
                productContext: d.productContext || null,
                status: 'DELIVERED',
                createdAt: d.createdAt || new Date().toISOString(),
              });
            });

            setMessages((prev) => mergeAndSortMessages(prev, liveMsgs));
            setTimeout(() => scrollToBottom(true), 50);
          }
        },
        (err) => {
          console.warn('Firestore onSnapshot listener notice:', err);
        }
      );
    } catch (err) {
      console.warn('Chat listener setup notice:', err);
    }

    // Also fetch initial/cached messages from local storage / REST fallback
    (async () => {
      try {
        if (activeConvId === GLOBAL_HUB_ID) {
          try {
            const res = await fetch('/api/chat/global');
            const data = await res.json();
            if (data.success && Array.isArray(data.messages)) {
              setMessages((prev) => mergeAndSortMessages(prev, data.messages));
            }
          } catch {}
        }
        const cached = await getMessages(activeConvId);
        if (cached.length > 0) {
          const formatted: ChatSocketMessage[] = cached.map((m) => ({
            id: m.id,
            chatType: activeConvId === GLOBAL_HUB_ID ? 'GLOBAL' : 'DIRECT',
            conversationId: activeConvId,
            senderId: m.senderId,
            recipientId: m.recipientId,
            senderName: m.senderName,
            senderAvatar: m.senderAvatar || '',
            content: m.text,
            status: 'DELIVERED',
            createdAt: m.createdAt,
          }));
          setMessages((prev) => mergeAndSortMessages(prev, formatted));
          setTimeout(() => scrollToBottom(false), 30);
        }
      } catch {}
    })();

    return () => {
      unsubscribe();
    };
  }, [activeConvId, scrollToBottom]);

  // 4. Socket.io Real-Time Listener Sync
  useEffect(() => {
    if (activeConvId === GLOBAL_HUB_ID && socketGlobalMessages.length > 0) {
      setMessages((prev) => mergeAndSortMessages(prev, socketGlobalMessages));
      setTimeout(() => scrollToBottom(true), 40);
    } else if (activeConvId && socketDirectMessages[activeConvId]) {
      const roomMsgs = socketDirectMessages[activeConvId];
      setMessages((prev) => mergeAndSortMessages(prev, roomMsgs));
      setTimeout(() => scrollToBottom(true), 40);
    }
  }, [activeConvId, socketGlobalMessages, socketDirectMessages, scrollToBottom]);

  // 5. Real-Time Firestore Snapshot Listener for Conversations List
  useEffect(() => {
    if (!user) return;
    loadUserConversations();
    getNotifications(user.uid).then(setNotifications).catch(() => {});

    let unsubscribe = () => {};

    try {
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('participants', 'array-contains', user.uid));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const liveConvs: Conversation[] = [];
            snapshot.forEach((docSnap) => {
              const d = docSnap.data();
              liveConvs.push({
                id: docSnap.id,
                participantIds: d.participants || [],
                participantNames: d.participantNames || {},
                participantAvatars: d.participantAvatars || {},
                lastMessage: d.lastMessage || '',
                lastMessageTimestamp: d.lastMessageTimestamp || d.updatedAt || new Date().toISOString(),
                unreadCount: d.unreadCount || {},
              });
            });

            setConversations((prev) => {
              const map = new Map<string, Conversation>();
              prev.forEach((c) => map.set(c.id, c));
              liveConvs.forEach((c) => map.set(c.id, { ...map.get(c.id), ...c }));
              return Array.from(map.values()).sort(
                (a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
              );
            });
          }
        },
        (err) => {
          console.warn('Conversations listener notice:', err);
        }
      );
    } catch {}

    const handleMessageSync = () => {
      loadUserConversations();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('campuscart_message_sent', handleMessageSync);
      window.addEventListener('storage', handleMessageSync);
      return () => {
        unsubscribe();
        window.removeEventListener('campuscart_message_sent', handleMessageSync);
        window.removeEventListener('storage', handleMessageSync);
      };
    }

    return () => {
      unsubscribe();
    };
  }, [user, loadUserConversations]);

  // 6. Handle URL target user param for direct messages
  useEffect(() => {
    if (!user || !targetUserParam) return;
    const sorted = [user.uid, targetUserParam].sort();
    const computedId = `chat_${sorted[0]}_${sorted[1]}`;
    setActiveConvId(computedId);
    setMobileView('chat');

    joinDirectChat(user.uid, targetUserParam);

    const draftConv: Conversation = {
      id: computedId,
      participantIds: [user.uid, targetUserParam],
      participantNames: {
        [user.uid]: profile?.display_name || user.email?.split('@')[0] || 'Student',
        [targetUserParam]: targetNameParam || 'Campus Student',
      },
      participantAvatars: {
        [user.uid]: profile?.avatar_url || '',
        [targetUserParam]: '',
      },
      lastMessage: targetProductParam ? `Inquiring about ${targetProductParam}` : 'Say hi 👋',
      lastMessageTimestamp: new Date().toISOString(),
      unreadCount: {},
    };

    setConversations((prev) => {
      if (prev.some((c) => c.id === computedId)) return prev;
      return [draftConv, ...prev];
    });
  }, [user, targetUserParam, targetNameParam, targetProductParam, profile, joinDirectChat]);

  const handleSelectConversation = (id: string, otherId?: string) => {
    setActiveConvId(id);
    setMobileView('chat');
    if (id !== GLOBAL_HUB_ID && user && otherId) {
      joinDirectChat(user.uid, otherId);
    }

    // Clear unread count for current user
    if (user) {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === id && c.unreadCount && c.unreadCount[user.uid]) {
            const nextUnread = { ...c.unreadCount, [user.uid]: 0 };
            return { ...c, unreadCount: nextUnread };
          }
          return c;
        })
      );
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchEndX - touchStartX;

    if (diffX > 75 && mobileView === 'chat') {
      setMobileView('list');
    } else if (diffX < -75 && mobileView === 'list' && activeConvId) {
      setMobileView('chat');
    }
    setTouchStartX(null);
  };

  // Send message handler
  async function handleSend(e?: React.FormEvent, customText?: string) {
    if (e) e.preventDefault();
    const textToSend = (customText || inputMsg).trim();
    if (!user || !activeConvId || !textToSend) return;

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const createdAt = new Date().toISOString();
    const senderName = profile?.display_name || user.displayName || user.email?.split('@')[0] || 'Campus Student';
    const senderAvatar = profile?.avatar_url || '';

    const { product } = extractProductContext(textToSend);

    setSending(true);
    setInputMsg('');

    if (activeConvId === GLOBAL_HUB_ID) {
      const newGlobalMsg: ChatSocketMessage = {
        id: messageId,
        chatType: 'GLOBAL',
        conversationId: GLOBAL_HUB_ID,
        senderId: user.uid,
        senderName,
        senderAvatar,
        content: textToSend,
        productContext: product,
        status: 'DELIVERED',
        createdAt,
      };

      // Optimistic append
      setMessages((prev) => mergeAndSortMessages(prev, [newGlobalMsg]));

      // Cross-tab broadcast
      broadcastChannelRef.current?.postMessage({
        type: 'NEW_MESSAGE',
        conversationId: GLOBAL_HUB_ID,
        message: newGlobalMsg,
      });

      // Persist to Firestore & REST
      try {
        await sendChatMessage({
          id: messageId,
          createdAt,
          conversationId: GLOBAL_HUB_ID,
          senderId: user.uid,
          senderName,
          senderAvatar,
          recipientId: 'global',
          text: textToSend,
        });

        fetch('/api/chat/global', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: user.uid,
            senderName,
            senderAvatar,
            content: textToSend,
            productContext: product,
          }),
        }).catch(() => {});
      } catch {}

      // Socket broadcast
      sendGlobalMessage({
        senderId: user.uid,
        senderName,
        senderAvatar,
        content: textToSend,
        productContext: product || undefined,
      });
    } else {
      const currentConv = conversations.find((c) => c.id === activeConvId);
      const recipientId = currentConv?.participantIds.find((id) => id !== user.uid) || targetUserParam || '';
      const recipientName = currentConv?.participantNames?.[recipientId] || targetNameParam || 'Campus Student';
      const recipientAvatar = currentConv?.participantAvatars?.[recipientId] || '';

      const newDirectMsg: ChatSocketMessage = {
        id: messageId,
        chatType: 'DIRECT',
        conversationId: activeConvId,
        senderId: user.uid,
        recipientId,
        senderName,
        senderAvatar,
        content: textToSend,
        productContext: product,
        status: 'DELIVERED',
        createdAt,
      };

      setMessages((prev) => mergeAndSortMessages(prev, [newDirectMsg]));

      broadcastChannelRef.current?.postMessage({
        type: 'NEW_MESSAGE',
        conversationId: activeConvId,
        message: newDirectMsg,
      });

      try {
        await sendChatMessage({
          id: messageId,
          createdAt,
          conversationId: activeConvId,
          senderId: user.uid,
          senderName,
          senderAvatar,
          recipientId,
          recipientName,
          recipientAvatar,
          text: textToSend,
        });
      } catch {}

      sendDirectMessage({
        senderId: user.uid,
        recipientId,
        senderName,
        senderAvatar,
        content: textToSend,
        productContext: product || undefined,
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? { ...c, lastMessage: textToSend, lastMessageTimestamp: createdAt }
            : c
        )
      );
    }

    setSending(false);
    setTimeout(() => scrollToBottom(true), 30);
  }

  // Handle Delete Conversation
  async function handleConfirmDeleteConversation() {
    if (!user || !convToDelete) return;
    setIsDeleting(true);
    try {
      await deleteConversation(convToDelete.id, user.uid);
      setConversations((prev) => prev.filter((c) => c.id !== convToDelete.id));
      if (activeConvId === convToDelete.id) {
        setActiveConvId(GLOBAL_HUB_ID);
        setMobileView('list');
      }
      toast({ title: 'Conversation removed 🗑️', description: `Chat with ${convToDelete.name} has been deleted.` });
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setConvToDelete(null);
    }
  }

  // Helper to copy message text with feedback
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    toast({ title: 'Copied to clipboard 📋' });
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const toggleLike = (id: string) => {
    setLikedMessages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (c.id === GLOBAL_HUB_ID) return false;
      const otherId = c.participantIds.find((id) => id !== user?.uid) || '';
      const otherName = c.participantNames?.[otherId] || 'Campus Student';
      const lastMsg = c.lastMessage || '';

      const matchesSearch =
        otherName.toLowerCase().includes(search.toLowerCase()) ||
        lastMsg.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (filterTab === 'direct') return true;
      if (filterTab === 'hub') return false;
      return true;
    });
  }, [conversations, search, user?.uid, filterTab]);

  const activeConv = useMemo(() => {
    if (activeConvId === GLOBAL_HUB_ID) return null;
    const found = conversations.find((c) => c.id === activeConvId);
    if (found) return found;
    if (user && targetUserParam) {
      return {
        id: activeConvId,
        participantIds: [user.uid, targetUserParam],
        participantNames: {
          [user.uid]: profile?.display_name || user.email?.split('@')[0] || 'You',
          [targetUserParam]: targetNameParam || 'Campus Student',
        },
        participantAvatars: {
          [user.uid]: profile?.avatar_url || '',
          [targetUserParam]: '',
        },
        lastMessage: 'Say hi 👋',
        lastMessageTimestamp: new Date().toISOString(),
        unreadCount: {},
      };
    }
    return null;
  }, [conversations, activeConvId, user, targetUserParam, targetNameParam, profile]);

  const otherParticipant = useMemo(() => {
    if (!activeConv || !user) return null;
    const otherId = activeConv.participantIds.find((id) => id !== user.uid) || targetUserParam;
    if (!otherId) return null;
    return {
      id: otherId,
      name: activeConv.participantNames?.[otherId] || targetNameParam || 'Campus Student',
      avatar: activeConv.participantAvatars?.[otherId] || '',
    };
  }, [activeConv, user, targetUserParam, targetNameParam]);

  if (authLoading) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-6xl py-12 min-h-screen">
          <div className="h-96 animate-pulse rounded-3xl bg-secondary/50 backdrop-blur-xl border border-border/50" />
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-3xl py-20 text-center min-h-[70vh] flex items-center justify-center relative">
          <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <div className="h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          </div>
          <div className="rounded-3xl border border-border/70 p-8 sm:p-12 bg-card/80 backdrop-blur-2xl shadow-xl max-w-md w-full">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4 ring-8 ring-primary/5">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Sign In to View Messages</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
              Chat in real-time with buyers, sellers, and student freelancers across campus.
            </p>
            <Button asChild className="btn-gradient-primary mt-6 rounded-2xl w-full font-bold shadow-md">
              <Link href="/login">Sign In Now</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="min-h-[calc(100dvh-4rem)] bg-background relative overflow-x-hidden py-3 sm:py-6 pb-24 md:pb-8 flex flex-col justify-center"
      >
        {/* Soft Ambient Background Glows */}
        <div className="absolute top-12 left-1/4 -z-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-16 right-1/4 -z-10 h-80 w-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        <div className="container-px mx-auto max-w-6xl w-full">
          {/* Main Glassmorphic Chat Shell */}
          <div className="rounded-[28px] sm:rounded-[32px] border border-border/70 bg-card/75 dark:bg-card/65 backdrop-blur-2xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12 h-[calc(100dvh-5.5rem)] md:h-[calc(100vh-6.5rem)] min-h-[540px] max-h-[860px]">
            
            {/* LEFT COLUMN: SIDEBAR (CONVERSATIONS & HUB) */}
            <div
              className={`md:col-span-5 lg:col-span-4 border-r border-border/60 flex flex-col h-full min-h-0 bg-background/40 dark:bg-background/20 transition-all duration-300 ${
                mobileView === 'chat' ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Sidebar Header */}
              <div className="p-4 sm:p-5 border-b border-border/60 shrink-0 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <h1 className="font-display text-xl sm:text-2xl font-black tracking-tight text-foreground">
                      Messages
                    </h1>
                    <Badge
                      variant="outline"
                      className="gap-1.5 px-2 py-0.5 text-[10px] font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Sync
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNotificationsModalOpen(true)}
                      title="Campus Notifications"
                      aria-label="Notifications"
                      className="relative h-9 w-9 rounded-xl bg-card border border-border/70 shadow-xs flex items-center justify-center text-foreground hover:bg-accent hover:scale-105 active:scale-95 transition-all"
                    >
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      {unreadNotificationsCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-white text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse">
                          {unreadNotificationsCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Search chats or peers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-8 h-9 sm:h-10 text-xs sm:text-sm rounded-xl bg-card/80 border-border/70 shadow-2xs focus-visible:ring-primary/20"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setFilterTab('all')}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                      filterTab === 'all'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                    )}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('direct')}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                      filterTab === 'direct'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                    )}
                  >
                    Direct
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('hub')}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                      filterTab === 'hub'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                    )}
                  >
                    Campus Hub
                  </button>
                </div>
              </div>

              {/* Sidebar Conversations Scroll Area */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-2 scrollbar-thin">
                {/* PINNED GLOBAL CAMPUS HUB */}
                {(filterTab === 'all' || filterTab === 'hub') && (
                  <button
                    type="button"
                    onClick={() => handleSelectConversation(GLOBAL_HUB_ID)}
                    className={cn(
                      'w-full rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 text-left transition-all relative overflow-hidden border',
                      activeConvId === GLOBAL_HUB_ID
                        ? 'bg-primary/10 border-primary/40 shadow-sm ring-1 ring-primary/20 backdrop-blur-xl'
                        : 'bg-card/70 dark:bg-card/50 border-border/60 hover:border-border hover:bg-card/90 shadow-2xs'
                    )}
                  >
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Globe className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">SVCET Campus Hub</h4>
                          <Badge className="bg-primary/20 text-primary hover:bg-primary/30 text-[9px] font-black px-1.5 py-0 h-4 border-0">
                            GLOBAL
                          </Badge>
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-500" />
                          Live
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5 font-medium">
                        Public campus feed • Instant broadcast
                      </p>
                    </div>
                  </button>
                )}

                {filterTab !== 'hub' && (
                  <>
                    <div className="pt-2 pb-1 px-1 flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      <span>Direct Messages</span>
                      <span className="text-[10px] font-semibold bg-secondary/80 px-2 py-0.5 rounded-full">
                        {filteredConversations.length}
                      </span>
                    </div>

                    {filteredConversations.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground space-y-1.5">
                        <MessageSquare className="h-6 w-6 mx-auto opacity-30" />
                        <p className="text-xs font-semibold">No direct conversations yet.</p>
                        <p className="text-[11px] opacity-80">Click &apos;Chat with Seller&apos; on any product or item.</p>
                      </div>
                    ) : (
                      filteredConversations.map((c) => {
                        const otherId = c.participantIds.find((id) => id !== user.uid) || '';
                        const otherName = c.participantNames?.[otherId] || 'Campus Student';
                        const otherAvatar = c.participantAvatars?.[otherId];
                        const isSelected = c.id === activeConvId;
                        const unread = (c.unreadCount && c.unreadCount[user.uid]) || 0;

                        return (
                          <div
                            key={c.id}
                            className={cn(
                              'group relative w-full rounded-2xl flex items-center transition-all border',
                              isSelected
                                ? 'bg-primary/10 border-primary/40 shadow-xs ring-1 ring-primary/20'
                                : 'bg-card/70 dark:bg-card/50 border-border/60 hover:bg-card hover:border-border shadow-2xs'
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectConversation(c.id, otherId)}
                              className="flex-1 p-3 sm:p-3.5 flex items-center gap-3 text-left min-w-0"
                            >
                              <div className="relative shrink-0">
                                <Avatar className="h-10 w-10 sm:h-11 sm:w-11 ring-1 ring-border/80 shadow-2xs">
                                  <AvatarImage src={otherAvatar} alt={otherName} className="object-cover" />
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                                    {otherName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">{otherName}</h4>
                                  <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                                    {new Date(c.lastMessageTimestamp).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-1 mt-0.5">
                                  <p className="text-xs text-muted-foreground truncate font-medium flex-1">
                                    {c.lastMessage || 'Say hi 👋'}
                                  </p>
                                  {unread > 0 && (
                                    <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center shadow-xs">
                                      {unread}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>

                            <div className="pr-2 flex items-center shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConvToDelete({ id: c.id, name: otherName });
                                  setDeleteDialogOpen(true);
                                }}
                                title="Delete Conversation"
                                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: ACTIVE CHAT VIEWPORT */}
            <div
              className={`md:col-span-7 lg:col-span-8 flex flex-col h-full min-h-0 bg-card/40 dark:bg-card/20 backdrop-blur-xl ${
                mobileView === 'list' ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Active Chat Header */}
              <div className="p-3.5 sm:p-4 border-b border-border/60 flex items-center justify-between bg-card/60 dark:bg-card/40 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileView('list')}
                    aria-label="Back to conversation list"
                    className="md:hidden h-9 w-9 rounded-xl bg-card border border-border/70 shadow-2xs flex items-center justify-center text-foreground hover:bg-accent transition-all shrink-0"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  {activeConvId === GLOBAL_HUB_ID ? (
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Globe className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10 ring-1 ring-border shadow-2xs">
                        <AvatarImage src={otherParticipant?.avatar} alt={otherParticipant?.name} className="object-cover" />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                          {otherParticipant?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2 className="font-display text-sm sm:text-base font-bold text-foreground truncate">
                        {activeConvId === GLOBAL_HUB_ID ? 'SVCET Campus Hub' : otherParticipant?.name || 'Peer Chat'}
                      </h2>
                      {activeConvId === GLOBAL_HUB_ID ? (
                        <Badge className="bg-primary/20 text-primary hover:bg-primary/20 text-[9px] font-black px-1.5 py-0 h-4 border-0">
                          PUBLIC
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 h-4 border-border text-muted-foreground gap-0.5">
                          <ShieldCheck className="h-3 w-3 text-emerald-500" />
                          SVCET Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>
                        {activeConvId === GLOBAL_HUB_ID
                          ? 'Real-Time Campus Feed • Everyone on Campus'
                          : 'Direct Peer Conversation • Encrypted & Private'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Conversation Options"
                      className="h-9 w-9 rounded-xl bg-card border border-border/70 shadow-2xs flex items-center justify-center text-foreground hover:bg-accent transition-all shrink-0"
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5 shadow-xl bg-card/95 backdrop-blur-xl">
                    {otherParticipant && (
                      <DropdownMenuItem asChild className="rounded-xl font-medium text-xs cursor-pointer">
                        <Link href={`/seller/${encodeURIComponent(otherParticipant.name.toLowerCase().replace(/\s+/g, '-'))}`}>
                          <Store className="h-4 w-4 mr-2 text-primary" />
                          View Student Storefront
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleSend(undefined, '📍 Let\'s meet at Central Library to inspect the item.')}
                      className="rounded-xl font-medium text-xs cursor-pointer"
                    >
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      Share Library Meetup Point
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        if (activeConvId && activeConvId !== GLOBAL_HUB_ID) {
                          setConvToDelete({ id: activeConvId, name: otherParticipant?.name || 'this student' });
                          setDeleteDialogOpen(true);
                        } else {
                          toast({ title: 'Campus Hub cannot be deleted' });
                        }
                      }}
                      className="rounded-xl font-medium text-xs cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Conversation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Product Context Banner (if chat was initiated from a product) */}
              {targetProductParam && (
                <div className="px-4 py-2 bg-primary/5 border-b border-primary/15 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <ShoppingBag className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs font-semibold text-foreground truncate">
                      Chatting regarding listing: <strong className="text-primary font-bold">{targetProductParam}</strong>
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-card border-primary/30 text-primary shrink-0">
                    Marketplace Inquiry
                  </Badge>
                </div>
              )}

              {/* Messages Body */}
              <div
                ref={chatScrollContainerRef}
                className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin overscroll-contain"
              >
                <div className="flex justify-center my-1">
                  <div className="rounded-full px-3.5 py-1 bg-card/80 border border-border/80 text-[10px] font-bold text-muted-foreground shadow-2xs backdrop-blur-md">
                    Today
                  </div>
                </div>

                {messages.length === 0 ? (
                  <div className="text-center py-12 space-y-2.5 text-muted-foreground">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto ring-6 ring-primary/5">
                      <MessageCircleQuestion className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {activeConvId === GLOBAL_HUB_ID
                        ? 'Welcome to SVCET Campus Hub! 🚀'
                        : `Start a conversation with ${otherParticipant?.name || 'peer'} 👋`}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      {activeConvId === GLOBAL_HUB_ID
                        ? 'Broadcast messages, questions, and requests to all students on campus.'
                        : 'Agree on meetup points, negotiate prices, or ask about listings safely.'}
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === user.uid;
                    const isLiked = likedMessages[m.id];
                    const isCopied = copiedMessageId === m.id;
                    const isGlobalRoom = activeConvId === GLOBAL_HUB_ID;

                    const { product, cleanText } = extractProductContext(m.content, m.productContext);

                    return (
                      <div
                        key={m.id}
                        className={cn(
                          'flex items-end gap-2 sm:gap-2.5 w-full group/msg',
                          isMe ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {!isMe && (
                          <Avatar className="h-8 w-8 ring-1 ring-border/80 shadow-2xs shrink-0 mb-1">
                            <AvatarImage
                              src={m.senderAvatar || (isGlobalRoom ? undefined : otherParticipant?.avatar)}
                              alt={m.senderName}
                              className="object-cover"
                            />
                            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                              {(m.senderName || 'C').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={cn(
                            'flex flex-col gap-1 max-w-[85%] sm:max-w-[72%] min-w-0',
                            isMe ? 'items-end' : 'items-start'
                          )}
                        >
                          {!isMe && isGlobalRoom && (
                            <span className="text-[11px] font-bold text-primary px-1">
                              {m.senderName || 'Campus Peer'}
                            </span>
                          )}

                          {product && (
                            <div className="w-full mb-1">
                              <Link
                                href="/marketplace"
                                className="group/card block rounded-xl border border-primary/25 bg-primary/5 p-2.5 hover:bg-primary/10 transition-all shadow-2xs"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                                    <ShoppingBag className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-primary block">
                                      Referenced Item
                                    </span>
                                    <h5 className="text-xs font-bold text-foreground truncate">
                                      {product.title}
                                    </h5>
                                  </div>
                                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover/card:text-primary transition-colors" />
                                </div>
                              </Link>
                            </div>
                          )}

                          <div
                            className={cn(
                              'px-4 py-2.5 sm:px-4.5 sm:py-3 text-xs sm:text-sm leading-relaxed rounded-2xl shadow-xs relative font-normal backdrop-blur-md',
                              isMe
                                ? 'bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground rounded-br-xs'
                                : 'bg-card/85 dark:bg-secondary/60 text-foreground border border-border/70 rounded-bl-xs'
                            )}
                            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                          >
                            <p className="whitespace-pre-wrap">{cleanText}</p>

                            <div
                              className={cn(
                                'flex items-center justify-end gap-1 mt-1 text-[10px] font-medium',
                                isMe ? 'text-primary-foreground/80' : 'text-muted-foreground'
                              )}
                            >
                              <span>
                                {new Date(m.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isMe && (
                                <CheckCheck className="h-3.5 w-3.5 text-primary-foreground stroke-[2.5]" />
                              )}
                            </div>
                          </div>

                          {/* Quick Message Actions */}
                          <div
                            className={cn(
                              'flex items-center gap-1 px-1 opacity-0 group-hover/msg:opacity-100 transition-opacity',
                              isMe ? 'justify-end' : 'justify-start'
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => handleCopy(cleanText, m.id)}
                              title="Copy text"
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
                            >
                              {isCopied ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleLike(m.id)}
                              title="React"
                              className={cn(
                                'p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors',
                                isLiked && 'text-red-500'
                              )}
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSpeak(cleanText)}
                              title="Read aloud"
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {isMe && (
                          <Avatar className="h-8 w-8 ring-1 ring-primary/20 shadow-2xs shrink-0 mb-1">
                            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'You'} />
                            <AvatarFallback className="text-[10px] font-bold bg-primary text-primary-foreground">
                              {(profile?.display_name || user.email || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* INPUT DOCK & QUICK CHIPS */}
              <div className="p-3 sm:p-4 bg-background/50 dark:bg-card/30 border-t border-border/60 shrink-0 space-y-2.5 backdrop-blur-xl">
                {/* 1-Tap Quick Reply Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none px-0.5">
                  <span className="text-[10px] font-black uppercase text-primary shrink-0 flex items-center gap-1">
                    <Zap className="h-3 w-3 fill-primary" />
                    Quick:
                  </span>
                  {QUICK_REPLY_CHIPS.map((chipText) => (
                    <button
                      key={chipText}
                      type="button"
                      onClick={() => handleSend(undefined, chipText)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-card/85 hover:bg-accent border border-border/70 text-foreground hover:border-primary/40 hover:scale-[1.02] active:scale-95 transition-all shrink-0 shadow-2xs"
                    >
                      {chipText}
                    </button>
                  ))}
                </div>

                {/* Form Input Bar */}
                <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto w-full">
                  <div className="flex-1 flex items-center h-11 sm:h-12 rounded-2xl bg-card/90 dark:bg-card/75 border border-border/70 shadow-sm px-2.5 gap-2 backdrop-blur-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
                    <button
                      type="button"
                      onClick={() => handleSend(undefined, '📍 Let\'s meet at Central Library entrance.')}
                      title="Send Central Library Meeting Location"
                      className="h-8 w-8 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-all shrink-0"
                    >
                      <MapPin className="h-4 w-4" />
                    </button>

                    <input
                      value={inputMsg}
                      onChange={(e) => {
                        setInputMsg(e.target.value);
                        if (activeConvId && user) {
                          emitTyping(activeConvId, user.uid, true);
                          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                          typingTimeoutRef.current = setTimeout(() => {
                            emitTyping(activeConvId, user.uid, false);
                          }, 2500);
                        }
                      }}
                      placeholder={
                        activeConvId === GLOBAL_HUB_ID
                          ? 'Broadcast message to SVCET Campus Hub...'
                          : `Message ${otherParticipant?.name || 'peer'}...`
                      }
                      className="flex-1 bg-transparent border-0 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/70 focus:outline-none px-1"
                    />

                    <button
                      type="submit"
                      disabled={!inputMsg.trim() || sending}
                      className="h-8.5 w-8.5 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs hover:scale-105 active:scale-90 transition-transform shrink-0 disabled:opacity-40"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 stroke-[2.2] -translate-y-0.5 translate-x-0.5" />
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => toast({ title: 'Microphone voice notes ready 🎙️' })}
                    aria-label="Record voice note"
                    className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-card/90 dark:bg-card/75 border border-border/70 shadow-sm flex items-center justify-center text-foreground hover:bg-accent transition-all shrink-0"
                  >
                    <Mic className="h-4.5 w-4.5" />
                  </button>
                </form>
              </div>

            </div>

          </div>
        </div>
      </main>
      <Footer />

      {/* Notifications Modal */}
      <Dialog open={notificationsModalOpen} onOpenChange={setNotificationsModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-5 sm:p-6 bg-card/95 backdrop-blur-2xl border border-border/80">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <BellRing className="h-4 w-4" />
                </div>
                <DialogTitle className="font-display font-bold text-lg">Notifications</DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Direct messages, order milestones, and campus offers.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[350px] overflow-y-auto space-y-2 py-2 pr-1 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="py-8 text-center space-y-2 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto opacity-30" />
                <p className="text-xs font-semibold">No notifications right now</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-3 rounded-2xl border bg-secondary/40 border-border/60 flex items-start gap-3">
                  <div className="h-7 w-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs text-foreground truncate">{n.title}</h5>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Conversation Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-card/95 backdrop-blur-2xl border border-border/80">
          <DialogHeader className="text-center">
            <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
              <Trash2 className="h-6 w-6" />
            </div>
            <DialogTitle className="font-display font-bold text-lg">Delete Conversation?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to delete your conversation with <strong className="text-foreground">{convToDelete?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex sm:flex-row gap-2 pt-3">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteConversation}
              disabled={isDeleting}
              className="flex-1 rounded-xl font-bold"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="container-px mx-auto max-w-6xl py-12">
          <div className="h-96 animate-pulse rounded-3xl bg-secondary/50" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
