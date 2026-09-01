'use client';

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import {
  MessageSquare, Send, User, Search, Store,
  Sparkles, CheckCheck, ShieldCheck, ArrowLeft,
  ChevronLeft, Loader2, Info, MapPin, Handshake, ShoppingBag,
  Settings, Bell, Plus, Mic, Copy, ThumbsUp, Volume2, RotateCcw,
  Check, X, Trash2, MoreVertical, BellRing, ExternalLink,
  Globe, Shield, MessageCircle, ExternalLink as LinkIcon, Radio, Zap
} from 'lucide-react';
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
  markNotificationRead,
  deleteConversation
} from '@/lib/firebase-queries';
import type { Conversation, NotificationItem, ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';

// Constant ID for Global Campus Hub Room
const GLOBAL_HUB_ID = 'campus_global_hub';

// Preset Quick Reply Chips for 1-Tap Message Sending
const QUICK_REPLY_CHIPS = [
  '👋 Hey! Is this available?',
  '🤝 Let\'s meet at Central Library',
  '📍 What is your hostel/location?',
  '💰 Is the price negotiable?',
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

// Deduplicate and merge chat message arrays
function mergeAndSortMessages(existing: ChatSocketMessage[], incoming: ChatSocketMessage[]): ChatSocketMessage[] {
  const map = new Map<string, ChatSocketMessage>();
  existing.forEach((m) => map.set(m.id, m));
  incoming.forEach((m) => map.set(m.id, m));

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

function MessagesContent() {
  const { user, profile, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const targetUserParam = searchParams.get('user');
  const targetNameParam = searchParams.get('name');
  const { toast } = useToast();

  // Socket.io Real-time Hook Integration
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
  const [mobileView, setMobileView] = useState<'list' | 'chat'>(targetUserParam ? 'chat' : 'list');
  const [sending, setSending] = useState(false);
  const [likedMessages, setLikedMessages] = useState<Record<string, boolean>>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showLocationMenu, setShowLocationMenu] = useState(false);

  // Mobile sidebar touch gesture state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Notification & Delete Dialog States
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [convToDelete, setConvToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  // Smooth scroll container to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  // Load and merge stored messages for active conversation
  const loadActiveMessages = useCallback(async (convId: string) => {
    try {
      const msgs = await getMessages(convId);
      const formatted: ChatSocketMessage[] = msgs.map((m) => ({
        id: m.id,
        chatType: convId === GLOBAL_HUB_ID ? 'GLOBAL' : 'DIRECT',
        conversationId: convId,
        senderId: m.senderId,
        recipientId: m.recipientId,
        senderName: m.senderName,
        senderAvatar: m.senderAvatar || '',
        content: m.text,
        status: 'DELIVERED',
        createdAt: m.createdAt,
      }));

      setMessages((prev) => mergeAndSortMessages(prev, formatted));
      setTimeout(() => scrollToBottom(false), 50);
    } catch (err) {
      console.warn('Error loading active messages:', err);
    }
  }, [scrollToBottom]);

  // Load user conversations
  const loadUserConversations = useCallback(async () => {
    if (!user) return;
    const convs = await getConversations(user.uid);
    const sorted = [...convs].sort((a, b) => {
      const timeA = new Date(a.lastMessageTimestamp).getTime() || 0;
      const timeB = new Date(b.lastMessageTimestamp).getTime() || 0;
      return timeB - timeA;
    });
    setConversations(sorted);
  }, [user]);

  // Handle active conversation selection & load stored messages
  useEffect(() => {
    if (!activeConvId) return;
    loadActiveMessages(activeConvId);
  }, [activeConvId, loadActiveMessages]);

  // Sync real-time socket messages into local messages state
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

  // Real-time synchronization event listener (Resolves message receiving issue across tabs/windows)
  useEffect(() => {
    if (!user) return;
    loadUserConversations();
    getNotifications(user.uid).then(setNotifications).catch(() => {});

    const handleMessageSync = (e?: Event) => {
      if (activeConvId) {
        loadActiveMessages(activeConvId);
      }
      loadUserConversations();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('campuscart_message_sent', handleMessageSync);
      window.addEventListener('storage', handleMessageSync);
      return () => {
        window.removeEventListener('campuscart_message_sent', handleMessageSync);
        window.removeEventListener('storage', handleMessageSync);
      };
    }
  }, [user, activeConvId, loadActiveMessages, loadUserConversations]);

  // Handle URL target user param for direct messages
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
      lastMessage: 'Say hi 👋',
      lastMessageTimestamp: new Date().toISOString(),
      unreadCount: {},
    };

    setConversations((prev) => {
      if (prev.some((c) => c.id === computedId)) return prev;
      return [draftConv, ...prev];
    });
  }, [user, targetUserParam, targetNameParam, profile, joinDirectChat]);

  // Handle selecting a conversation
  const handleSelectConversation = (id: string, otherId?: string) => {
    setActiveConvId(id);
    setMobileView('chat');
    if (id !== GLOBAL_HUB_ID && user && otherId) {
      joinDirectChat(user.uid, otherId);
    }
  };

  // Touch-swipe handlers for smooth mobile sidebar transitions
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

  // Send message handler (Supports both 1-Tap Quick Messages, Global Broadcasts, and DMs)
  async function handleSend(e?: React.FormEvent, customText?: string) {
    if (e) e.preventDefault();
    const textToSend = (customText || inputMsg).trim();
    if (!user || !activeConvId || !textToSend) return;

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const createdAt = new Date().toISOString();
    const senderName = profile?.display_name || user.displayName || user.email?.split('@')[0] || 'Campus Student';
    const senderAvatar = profile?.avatar_url || '';

    // Parse product context if included in text
    const { product } = extractProductContext(textToSend);

    setSending(true);
    setInputMsg('');
    setShowLocationMenu(false);

    if (activeConvId === GLOBAL_HUB_ID) {
      // 1. Global Campus Hub Message Handling
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

      // Persist to local storage & Firestore queries
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
      } catch {}

      // Emit via Socket.io
      sendGlobalMessage({
        senderId: user.uid,
        senderName,
        senderAvatar,
        content: textToSend,
        productContext: product || undefined,
      });

      setMessages((prev) => mergeAndSortMessages(prev, [newGlobalMsg]));
    } else {
      // 2. Direct Message Handling
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

      // Persist to local storage & Firestore queries
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

      // Emit via Socket.io
      sendDirectMessage({
        senderId: user.uid,
        recipientId,
        senderName,
        senderAvatar,
        content: textToSend,
        productContext: product || undefined,
      });

      setMessages((prev) => mergeAndSortMessages(prev, [newDirectMsg]));

      // Update sidebar preview
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
      toast({ title: 'Conversation deleted 🗑️', description: `Chat with ${convToDelete.name} has been removed.` });
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setConvToDelete(null);
    }
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    toast({ title: 'Copied to clipboard' });
    setTimeout(() => setCopiedMessageId(null), 2000);
  }

  function toggleLike(id: string) {
    setLikedMessages((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleSpeak(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }

  const unreadNotificationsCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase().trim();
    return conversations.filter((c) => {
      const otherId = c.participantIds.find((id) => id !== user?.uid) || '';
      const otherName = (c.participantNames?.[otherId] || '').toLowerCase();
      const lastMsg = (c.lastMessage || '').toLowerCase();
      return otherName.includes(q) || lastMsg.includes(q);
    });
  }, [conversations, search, user?.uid]);

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
          <div className="h-96 animate-pulse rounded-3xl bg-secondary/50" />
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-3xl py-20 text-center min-h-[70vh] flex items-center justify-center">
          <div className="rounded-3xl border border-border p-8 sm:p-12 bg-card shadow-sm max-w-md w-full">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-bold">Sign In to View Messages</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
              Chat directly with buyers, sellers, and student freelancers on campus.
            </p>
            <Button asChild className="btn-gradient-primary mt-6 rounded-xl w-full font-bold">
              <Link href="/login">Sign In</Link>
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
        className="min-h-[calc(100dvh-4rem)] bg-gradient-to-b from-[#F7F2FF] via-[#FAF7FF] to-[#FFF5ED] dark:from-[#150F22] dark:via-[#110C1B] dark:to-[#170E1B] py-2 sm:py-6 pb-24 md:pb-8"
      >
        <div className="container-px mx-auto max-w-5xl">
          
          {/* Main Container Card */}
          <div className="rounded-[28px] sm:rounded-[32px] border border-white/80 dark:border-border/60 bg-white/75 dark:bg-card/75 backdrop-blur-2xl overflow-hidden shadow-xl grid grid-cols-1 md:grid-cols-12 h-[calc(100dvh-135px)] md:h-[calc(100dvh-150px)] min-h-[520px] max-h-[840px]">
            
            {/* =========================================================================
                LEFT PANEL: SIDEBAR NAVIGATION
               ========================================================================= */}
            <div
              className={`md:col-span-5 lg:col-span-4 border-r border-white/60 dark:border-border/60 flex flex-col h-full min-h-0 bg-transparent transition-all duration-300 ${
                mobileView === 'chat' ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Header */}
              <div className="p-3.5 sm:p-5 border-b border-white/60 dark:border-border/60 shrink-0 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                      Chats
                    </h1>
                    <span
                      title={isConnected ? 'Real-time Socket Connected' : 'Connecting Socket...'}
                      className={cn(
                        'h-2.5 w-2.5 rounded-full animate-pulse mt-1',
                        isConnected ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-amber-500'
                      )}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNotificationsModalOpen(true)}
                      title="Campus Notifications"
                      aria-label="Notifications"
                      className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all"
                    >
                      <Bell className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
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
                    placeholder="Search Chats or Hub..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-10 sm:h-11 text-xs sm:text-sm rounded-2xl bg-card border border-border shadow-xs text-foreground"
                  />
                  {search && (
                    <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Thread Cards List with PINNED Global Campus Hub */}
              <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-4 space-y-2.5 scrollbar-thin">
                
                {/* PINNED GLOBAL CAMPUS HUB */}
                <button
                  type="button"
                  onClick={() => handleSelectConversation(GLOBAL_HUB_ID)}
                  className={cn(
                    'w-full rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 flex items-center gap-3.5 text-left transition-all relative overflow-hidden border',
                    activeConvId === GLOBAL_HUB_ID
                      ? 'bg-gradient-to-r from-purple-600/15 via-indigo-600/15 to-pink-600/15 border-purple-500/50 shadow-md ring-2 ring-purple-500/20 backdrop-blur-xl scale-[1.01]'
                      : 'bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-pink-500/10 border-purple-500/30 hover:border-purple-500/50 hover:bg-white/80 dark:hover:bg-card/80 backdrop-blur-md shadow-xs'
                  )}
                >
                  <div className="h-11 w-11 sm:h-13 sm:w-13 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600 text-white flex items-center justify-center shrink-0 shadow-sm ring-2 ring-purple-400/30">
                    <Globe className="h-5 w-5 sm:h-6 sm:w-6 animate-spin-slow" />
                  </div>

                  <div className="flex-1 min-w-0 z-10">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-black text-foreground tracking-tight">Campus Hub</h4>
                        <Badge className="bg-purple-600/90 text-white text-[9px] font-bold px-1.5 py-0 h-4 border-0">
                          GLOBAL
                        </Badge>
                      </div>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-extrabold flex items-center gap-1">
                        <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-500" />
                        Live
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 font-medium">
                      Public campus feed • Open broadcast
                    </p>
                  </div>
                </button>

                <div className="pt-1 pb-0.5 px-1 flex items-center justify-between text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">
                  <span>Direct Messages</span>
                  <span className="text-[10px] font-semibold">{filteredConversations.length}</span>
                </div>

                {/* Direct Messages List */}
                {filteredConversations.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <p className="text-xs font-semibold">No direct messages yet.</p>
                  </div>
                ) : (
                  filteredConversations.map((c) => {
                    const otherId = c.participantIds.find((id) => id !== user.uid) || '';
                    const otherName = c.participantNames?.[otherId] || 'Campus Student';
                    const otherAvatar = c.participantAvatars?.[otherId];
                    const isSelected = c.id === activeConvId;

                    return (
                      <div
                        key={c.id}
                        className={cn(
                          'group relative w-full rounded-2xl sm:rounded-3xl flex items-center transition-all border',
                          isSelected
                            ? 'bg-card border-primary/40 shadow-md ring-2 ring-primary/10'
                            : 'bg-card/75 dark:bg-card/60 border-border/80 hover:bg-card shadow-xs hover:scale-[1.01]'
                        )}
                      >
                        <button
                          onClick={() => handleSelectConversation(c.id, otherId)}
                          className="flex-1 p-3 sm:p-4 flex items-center gap-3 sm:gap-3.5 text-left min-w-0"
                        >
                          <Avatar className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 ring-2 ring-purple-400/25 shadow-xs">
                            <AvatarImage src={otherAvatar} alt={otherName} className="object-cover" />
                            <AvatarFallback className="text-sm bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-purple-700 dark:text-purple-300 font-black">
                              {otherName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs sm:text-sm font-extrabold text-foreground truncate">{otherName}</h4>
                              <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                                {new Date(c.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5 font-medium">
                              {c.lastMessage || 'Say hi 👋'}
                            </p>
                          </div>
                        </button>

                        <div className="pr-3 flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConvToDelete({ id: c.id, name: otherName });
                              setDeleteDialogOpen(true);
                            }}
                            title="Delete Chat"
                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* =========================================================================
                RIGHT PANEL: ACTIVE CHAT THREAD VIEW
               ========================================================================= */}
            <div
              className={`md:col-span-7 lg:col-span-8 flex flex-col h-full min-h-0 bg-white/40 dark:bg-card/40 backdrop-blur-xl ${
                mobileView === 'list' ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Active Chat Header */}
              <div className="p-3 sm:p-4 border-b border-white/60 dark:border-border/60 flex items-center justify-between bg-white/60 dark:bg-card/60 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileView('list')}
                    aria-label="Back to conversations"
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all shrink-0"
                  >
                    <ArrowLeft className="h-4.5 w-4.5 sm:h-5 sm:w-5 stroke-[2.2]" />
                  </button>

                  <div className="min-w-0">
                    <h2 className="font-display text-sm sm:text-base md:text-lg font-black text-foreground truncate flex items-center gap-2">
                      {activeConvId === GLOBAL_HUB_ID ? (
                        <>
                          <span>Campus Hub</span>
                          <Badge className="bg-purple-600 text-white text-[9px] font-extrabold px-2 py-0.5">
                            GLOBAL CHAT
                          </Badge>
                        </>
                      ) : (
                        otherParticipant?.name || 'Direct Message'
                      )}
                    </h2>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>{activeConvId === GLOBAL_HUB_ID ? 'Public Campus Feed • Real-Time Broadcast' : 'Direct Message • Encrypted'}</span>
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Chat Options"
                      className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all shrink-0"
                    >
                      <Settings className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5 shadow-xl">
                    {otherParticipant && (
                      <DropdownMenuItem asChild className="rounded-xl font-medium text-xs cursor-pointer">
                        <Link href={`/seller/${encodeURIComponent(otherParticipant.name.toLowerCase().replace(/\s+/g, '-'))}`}>
                          <Store className="h-4 w-4 mr-2 text-primary" />
                          View Storefront
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setMessages([])} className="rounded-xl font-medium text-xs cursor-pointer">
                      <RotateCcw className="h-4 w-4 mr-2 text-muted-foreground" />
                      Clear Chat History
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Messages Scroll Body */}
              <div
                ref={chatScrollContainerRef}
                className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-5 scrollbar-thin overscroll-contain"
              >
                <div className="flex justify-center my-1">
                  <div className="rounded-full px-4 py-0.5 sm:py-1 bg-card border border-border/80 text-[11px] sm:text-xs font-bold text-muted-foreground shadow-xs">
                    Today
                  </div>
                </div>

                {messages.length === 0 ? (
                  <div className="text-center py-10 space-y-2 text-muted-foreground">
                    <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {activeConvId === GLOBAL_HUB_ID ? 'Welcome to Global Campus Hub! 🚀' : `Say hi to ${otherParticipant?.name || 'peer'} 👋`}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      {activeConvId === GLOBAL_HUB_ID
                        ? 'Broadcast messages, questions, and requests to all students on campus.'
                        : 'Agree on meetup points, negotiate prices, or ask about listings.'}
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === user.uid;
                    const isLiked = likedMessages[m.id];
                    const isCopied = copiedMessageId === m.id;
                    const isGlobalRoom = activeConvId === GLOBAL_HUB_ID;

                    // Extract product context mini-card
                    const { product, cleanText } = extractProductContext(m.content, m.productContext);

                    return (
                      <div
                        key={m.id}
                        className={cn(
                          'flex items-end gap-2 sm:gap-2.5 w-full',
                          isMe ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {/* INCOMING AVATAR LOGIC */}
                        {!isMe && (
                          <Avatar className="h-7 w-7 sm:h-9 sm:w-9 ring-2 ring-primary/20 shadow-2xs shrink-0 mb-1">
                            <AvatarImage src={m.senderAvatar || (isGlobalRoom ? undefined : otherParticipant?.avatar)} alt={m.senderName} />
                            <AvatarFallback className="text-[10px] sm:text-xs font-bold bg-primary/10 text-primary">
                              {(m.senderName || 'C').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div className={cn('flex flex-col gap-1 max-w-[85%] sm:max-w-[78%] min-w-0', isMe ? 'items-end' : 'items-start')}>
                          
                          {/* SENDER NAME IN GLOBAL CHAT FOR INCOMING MESSAGES */}
                          {!isMe && isGlobalRoom && (
                            <span className="text-[11px] font-extrabold text-purple-700 dark:text-purple-300 px-1">
                              {m.senderName || 'Campus Peer'}
                            </span>
                          )}

                          {/* RICH CONTEXT MINI-CARD */}
                          {product && (
                            <div className="w-full mb-1">
                              <Link
                                href={`/marketplace`}
                                className="group/card block rounded-2xl border border-purple-500/30 bg-purple-500/10 dark:bg-purple-900/20 p-2.5 sm:p-3 hover:bg-purple-500/20 transition-all shadow-xs"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="h-9 w-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                                    <ShoppingBag className="h-4.5 w-4.5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-300 block">
                                      Referenced Listing
                                    </span>
                                    <h5 className="text-xs font-extrabold text-foreground truncate group-hover/card:text-purple-600 transition-colors">
                                      {product.title}
                                    </h5>
                                  </div>
                                  <LinkIcon className="h-3.5 w-3.5 text-muted-foreground group-hover/card:translate-x-0.5 transition-transform" />
                                </div>
                              </Link>
                            </div>
                          )}

                          {/* MESSAGE BUBBLE */}
                          <div
                            className={cn(
                              'px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm leading-relaxed rounded-[22px] sm:rounded-[24px] shadow-xs relative inline-block font-medium',
                              isMe
                                ? 'btn-gradient-primary text-white rounded-br-[4px]'
                                : 'bg-card text-foreground border border-border rounded-bl-[4px]'
                            )}
                            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                          >
                            <p className="whitespace-pre-wrap">{cleanText}</p>

                            {/* DELIVERY STATE INDICATOR (✓ sent, ✓✓ delivered) */}
                            {isMe && (
                              <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-90 font-bold text-white/90">
                                <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {m.status === 'DELIVERED' ? (
                                  <span title="Delivered"><CheckCheck className="h-3.5 w-3.5 text-white stroke-[2.5]" /></span>
                                ) : (
                                  <span title="Sent"><Check className="h-3.5 w-3.5 text-white/80 stroke-[2.5]" /></span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Incoming Action Toolbar */}
                          {!isMe && (
                            <div className="flex items-center gap-1.5 px-1 text-muted-foreground">
                              <button type="button" onClick={() => handleCopy(cleanText, m.id)} className="p-1 hover:text-foreground">
                                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                              <button type="button" onClick={() => toggleLike(m.id)} className={cn('p-1', isLiked && 'text-purple-600')}>
                                <ThumbsUp className="h-3.5 w-3.5" />
                              </button>
                              <button type="button" onClick={() => handleSpeak(cleanText)} className="p-1 hover:text-foreground">
                                <Volume2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* OUTGOING AVATAR */}
                        {isMe && (
                          <Avatar className="h-7 w-7 sm:h-9 sm:w-9 ring-2 ring-purple-400/20 shadow-2xs shrink-0 mb-1">
                            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'You'} />
                            <AvatarFallback className="text-[10px] sm:text-xs font-bold bg-[#9333ea] text-white">
                              {(profile?.display_name || user.email || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* =========================================================================
                  INPUT DOCK & 1-TAP QUICK ACTION CHIPS
                 ========================================================================= */}
              <div className="p-2.5 sm:p-4 bg-transparent shrink-0 space-y-2">
                
                {/* 1-Tap Quick Reply Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none px-1">
                  <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 shrink-0 flex items-center gap-1">
                    <Zap className="h-3 w-3 fill-purple-600" />
                    Quick:
                  </span>
                  {QUICK_REPLY_CHIPS.map((chipText) => (
                    <button
                      key={chipText}
                      type="button"
                      onClick={() => handleSend(undefined, chipText)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 dark:bg-card/90 border border-purple-500/30 text-foreground hover:bg-purple-500/10 hover:border-purple-500/50 hover:scale-105 active:scale-95 transition-all shrink-0 shadow-2xs"
                    >
                      {chipText}
                    </button>
                  ))}
                </div>

                {/* Main Floating Input Form */}
                <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto w-full">
                  <div className="flex-1 flex items-center h-11 sm:h-12 rounded-full bg-white/95 dark:bg-card/95 border border-white/80 dark:border-border/80 shadow-md px-3 gap-2 backdrop-blur-md">
                    
                    {/* '+' Quick Location / Context Button */}
                    <button
                      type="button"
                      onClick={() => handleSend(undefined, '🤝 Let\'s meet at Central Library')}
                      title="Send Central Library Meetup Location"
                      className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 flex items-center justify-center transition-all shrink-0"
                    >
                      <MapPin className="h-4 w-4" />
                    </button>

                    <input
                      value={inputMsg}
                      onChange={(e) => {
                        setInputMsg(e.target.value);
                        if (activeConvId && user) {
                          emitTyping(activeConvId, user.uid, e.target.value.length > 0);
                        }
                      }}
                      placeholder={activeConvId === GLOBAL_HUB_ID ? 'Broadcast message to Campus Hub...' : 'Type direct message...'}
                      className="flex-1 bg-transparent border-0 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/70 focus:outline-none px-1"
                    />

                    <button
                      type="submit"
                      disabled={!inputMsg.trim() || sending}
                      className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-xl bg-foreground text-background flex items-center justify-center shadow-xs hover:scale-105 active:scale-90 transition-transform shrink-0 disabled:opacity-30"
                    >
                      {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5 stroke-[2.2] -translate-y-0.5 translate-x-0.5" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => toast({ title: 'Microphone Voice Notes ready 🎙️' })}
                    aria-label="Voice Message"
                    className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-white/95 dark:bg-card/95 border border-white/80 dark:border-border/80 shadow-md flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all shrink-0"
                  >
                    <Mic className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
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
        <DialogContent className="max-w-md rounded-3xl p-5 sm:p-6 bg-white/95 dark:bg-card/95 backdrop-blur-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <BellRing className="h-4 w-4" />
                </div>
                <DialogTitle className="font-display font-black text-lg">Notifications</DialogTitle>
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
                  <div className="h-7 w-7 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
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

      {/* Delete Conversation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6 bg-white dark:bg-card">
          <DialogHeader className="text-center">
            <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
              <Trash2 className="h-6 w-6" />
            </div>
            <DialogTitle className="font-display font-black text-lg">Delete Conversation?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to delete your conversation with <strong className="text-foreground">{convToDelete?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex sm:flex-row gap-2 pt-3">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteConversation} disabled={isDeleting} className="flex-1 rounded-xl font-bold">
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
