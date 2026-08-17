'use client';

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import {
  MessageSquare, Send, User, Search, Store,
  Sparkles, CheckCheck, ShieldCheck, ArrowLeft,
  ChevronLeft, Loader2, Info, MapPin, Handshake, ShoppingBag,
  Settings, Bell, Plus, Mic, Copy, ThumbsUp, Volume2, RotateCcw,
  Check, X,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  getConversations,
  getMessages,
  sendChatMessage,
} from '@/lib/firebase-queries';
import type { Conversation, ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';

// Deduplicate message arrays by ID and prevent rapid duplicate bubbles
function mergeMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const map = new Map<string, ChatMessage>();
  existing.forEach((m) => map.set(m.id, m));
  incoming.forEach((m) => map.set(m.id, m));

  const sorted = Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const deduplicated: ChatMessage[] = [];
  for (const msg of sorted) {
    const isDuplicate = deduplicated.some(
      (prev) =>
        prev.id === msg.id ||
        (prev.senderId === msg.senderId &&
          prev.text.trim() === msg.text.trim() &&
          Math.abs(new Date(prev.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 3000)
    );
    if (!isDuplicate) {
      deduplicated.push(msg);
    }
  }

  return deduplicated;
}

function MessagesContent() {
  const { user, profile, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const targetUserParam = searchParams.get('user');
  const targetNameParam = searchParams.get('name');
  const { toast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [search, setSearch] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>(targetUserParam ? 'chat' : 'list');
  const [sending, setSending] = useState(false);
  const [likedMessages, setLikedMessages] = useState<Record<string, boolean>>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  // Smoothly scroll only the chat message list without jumping the window
  const scrollToBottom = useCallback((smooth = true) => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  // Load and merge real conversations for the authenticated user
  const loadUserConversations = useCallback(async () => {
    if (!user) return;

    const convs = await getConversations(user.uid);

    const sorted = [...convs].sort((a, b) => {
      const timeA = new Date(a.lastMessageTimestamp).getTime() || 0;
      const timeB = new Date(b.lastMessageTimestamp).getTime() || 0;
      return timeB - timeA;
    });

    setConversations((prev) => {
      const map = new Map<string, Conversation>();
      sorted.forEach((c) => map.set(c.id, c));
      prev.forEach((c) => {
        if (!map.has(c.id)) map.set(c.id, c);
      });
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
      );
    });

    if (!activeConvId && sorted.length > 0 && !targetUserParam) {
      setActiveConvId(sorted[0].id);
    }
  }, [user, activeConvId, targetUserParam]);

  // Real-time listener for ALL user conversations in Firestore
  useEffect(() => {
    if (!user) return;
    loadUserConversations();

    let unsubscribeChats = () => {};
    try {
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid)
      );
      unsubscribeChats = onSnapshot(
        q,
        () => {
          loadUserConversations();
        },
        (err) => {
          console.warn('Firestore chats snapshot notice:', err);
        }
      );
    } catch (err) {
      console.warn('Firestore chats query notice:', err);
    }

    return () => unsubscribeChats();
  }, [user, loadUserConversations]);

  // Handle URL target user param
  useEffect(() => {
    if (!user || !targetUserParam) return;
    const sorted = [user.uid, targetUserParam].sort();
    const computedId = `chat_${sorted[0]}_${sorted[1]}`;
    setActiveConvId(computedId);
    setMobileView('chat');

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
  }, [user, targetUserParam, targetNameParam, profile]);

  // Real-time listener for active conversation
  useEffect(() => {
    if (!activeConvId) return;

    getMessages(activeConvId).then((msgs) => {
      setMessages((prev) => mergeMessages(prev, msgs));
      setTimeout(() => scrollToBottom(false), 50);
    });

    let unsubscribe = () => {};
    try {
      const q = query(
        collection(db, 'chats', activeConvId, 'messages'),
        orderBy('createdAt', 'asc')
      );
      unsubscribe = onSnapshot(
        q,
        (snap) => {
          if (!snap.empty) {
            const incoming: ChatMessage[] = [];
            snap.forEach((d) => {
              const data = d.data();
              incoming.push({
                id: d.id,
                conversationId: activeConvId,
                senderId: data.senderId,
                senderName: data.senderName,
                senderAvatar: data.senderAvatar || '',
                recipientId: data.recipientId || '',
                text: data.text || '',
                createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
              });
            });
            setMessages((prev) => mergeMessages(prev, incoming));
            setTimeout(() => scrollToBottom(true), 50);
          }
        },
        (err) => {
          console.warn('Firestore snapshot notice in MessagesPage:', err);
        }
      );
    } catch (e) {
      console.warn('Firestore listener setup notice:', e);
    }

    const handleSync = () => {
      getMessages(activeConvId).then((msgs) => {
        setMessages((prev) => mergeMessages(prev, msgs));
        setTimeout(() => scrollToBottom(false), 50);
      });
      loadUserConversations();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('campuscart_message_sent', handleSync);
      window.addEventListener('storage', handleSync);
      return () => {
        unsubscribe();
        window.removeEventListener('campuscart_message_sent', handleSync);
        window.removeEventListener('storage', handleSync);
      };
    }

    return () => unsubscribe();
  }, [activeConvId, loadUserConversations, scrollToBottom]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length, scrollToBottom]);

  async function handleSend(e?: React.FormEvent, customText?: string) {
    if (e) e.preventDefault();
    const textToSend = (customText || inputMsg).trim();
    if (!user || !activeConvId || !textToSend) return;

    const currentConv = conversations.find((c) => c.id === activeConvId);
    const otherId = currentConv?.participantIds.find((id) => id !== user.uid) || targetUserParam;
    if (!otherId) return;

    const otherName = currentConv?.participantNames?.[otherId] || targetNameParam || 'Campus Student';
    const otherAvatar = currentConv?.participantAvatars?.[otherId] || '';

    const exactMessageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const exactCreatedAt = new Date().toISOString();

    const tempMsg: ChatMessage = {
      id: exactMessageId,
      conversationId: activeConvId,
      senderId: user.uid,
      senderName: profile?.display_name || user.displayName || user.email?.split('@')[0] || 'Student',
      senderAvatar: profile?.avatar_url || '',
      recipientId: otherId,
      text: textToSend,
      createdAt: exactCreatedAt,
    };

    setMessages((prev) => mergeMessages(prev, [tempMsg]));
    setInputMsg('');
    setSending(true);
    setTimeout(() => scrollToBottom(true), 30);

    setConversations((prev) => {
      const map = new Map<string, Conversation>();
      prev.forEach((c) => map.set(c.id, c));
      const existing = map.get(activeConvId);
      map.set(activeConvId, {
        id: activeConvId,
        participantIds: existing?.participantIds || [user.uid, otherId],
        participantNames: {
          ...(existing?.participantNames || {}),
          [user.uid]: profile?.display_name || user.email?.split('@')[0] || 'Student',
          [otherId]: otherName,
        },
        participantAvatars: {
          ...(existing?.participantAvatars || {}),
          [user.uid]: profile?.avatar_url || '',
          [otherId]: otherAvatar,
        },
        lastMessage: tempMsg.text,
        lastMessageTimestamp: tempMsg.createdAt,
        unreadCount: existing?.unreadCount || {},
      });
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
      );
    });

    try {
      await sendChatMessage({
        id: exactMessageId,
        createdAt: exactCreatedAt,
        conversationId: activeConvId,
        senderId: user.uid,
        senderName: profile?.display_name || user.displayName || user.email?.split('@')[0] || 'Student',
        senderAvatar: profile?.avatar_url || '',
        recipientId: otherId,
        text: textToSend,
      });
    } catch (err: any) {
      toast({ title: 'Message delivery notice', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
      setTimeout(() => scrollToBottom(true), 50);
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
    } else {
      toast({ title: 'Text-to-speech not supported on this browser' });
    }
  }

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
    const found = conversations.find((c) => c.id === activeConvId);
    if (found) return found;
    if (activeConvId && user && targetUserParam) {
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

  function handleSelectConversation(id: string) {
    setActiveConvId(id);
    setMobileView('chat');
  }

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
      {/* Ambient Pastel Gradient Wrapper with controlled bottom clearance */}
      <main className="min-h-[calc(100dvh-4rem)] bg-gradient-to-b from-[#F7F2FF] via-[#FAF7FF] to-[#FFF5ED] dark:from-[#150F22] dark:via-[#110C1B] dark:to-[#170E1B] py-2 sm:py-6 pb-24 md:pb-8">
        <div className="container-px mx-auto max-w-5xl">
          
          {/* Main Card Container with rock-solid fixed height to avoid layout jump */}
          <div className="rounded-[28px] sm:rounded-[32px] border border-white/80 dark:border-border/60 bg-white/75 dark:bg-card/75 backdrop-blur-2xl overflow-hidden shadow-xl grid grid-cols-1 md:grid-cols-12 h-[calc(100dvh-135px)] md:h-[calc(100dvh-150px)] min-h-[500px] max-h-[820px]">
            
            {/* =========================================================================
                LEFT PANEL: Chats List View (Reference Screen 2)
               ========================================================================= */}
            <div
              className={`md:col-span-5 lg:col-span-4 border-r border-white/60 dark:border-border/60 flex flex-col h-full min-h-0 bg-transparent ${
                mobileView === 'chat' ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Chats Header: Title + Search/Bell Icons */}
              <div className="p-3.5 sm:p-5 border-b border-white/60 dark:border-border/60 shrink-0 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                    Chats
                  </h1>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Search"
                      className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-white/80 dark:bg-card/80 border border-white/80 dark:border-border/80 shadow-2xs flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all"
                    >
                      <Search className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Notifications"
                      className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-white/80 dark:bg-card/80 border border-white/80 dark:border-border/80 shadow-2xs flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all"
                    >
                      <Bell className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                    </button>
                  </div>
                </div>

                {/* Translucent Frosted Search Pill */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search Chats"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-10 sm:h-11 text-xs sm:text-sm rounded-2xl bg-white/70 dark:bg-card/70 border border-white/70 dark:border-border/70 shadow-2xs placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-purple-500/20"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Thread Cards List */}
              <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-4 space-y-2 sm:space-y-2.5 scrollbar-thin">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center space-y-3 text-muted-foreground my-auto">
                    <div className="h-14 w-14 rounded-3xl bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto">
                      <MessageSquare className="h-7 w-7" />
                    </div>
                    <p className="text-sm font-bold text-foreground">No conversations yet</p>
                    <p className="text-xs leading-relaxed max-w-[200px] mx-auto text-muted-foreground">
                      Connect with students from the Marketplace or Requests board.
                    </p>
                    <Button asChild size="sm" className="btn-gradient-primary rounded-xl text-xs mt-2">
                      <Link href="/marketplace">Explore Marketplace</Link>
                    </Button>
                  </div>
                ) : (
                  filteredConversations.map((c) => {
                    const otherId = c.participantIds.find((id) => id !== user.uid) || '';
                    const otherName = c.participantNames?.[otherId] || 'Campus Student';
                    const otherAvatar = c.participantAvatars?.[otherId];
                    const isSelected = c.id === activeConvId;

                    return (
                      <button
                        key={c.id}
                        onClick={() => handleSelectConversation(c.id)}
                        className={cn(
                          'w-full p-3 sm:p-4 rounded-2xl sm:rounded-3xl flex items-center gap-3 sm:gap-3.5 text-left transition-all border',
                          isSelected
                            ? 'bg-white dark:bg-card border-purple-500/30 shadow-md ring-2 ring-purple-500/10'
                            : 'bg-white/70 dark:bg-card/70 border-white/60 dark:border-border/50 hover:bg-white/90 dark:hover:bg-card/90 shadow-2xs hover:scale-[1.01]'
                        )}
                      >
                        {/* Circular Avatar */}
                        <Avatar className="h-11 w-11 sm:h-13 sm:w-13 shrink-0 ring-2 ring-purple-400/25 shadow-xs">
                          <AvatarImage src={otherAvatar} alt={otherName} className="object-cover" />
                          <AvatarFallback className="text-sm bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-purple-700 dark:text-purple-300 font-black">
                            {otherName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Name & Subtitle Preview */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs sm:text-sm font-extrabold text-foreground truncate">{otherName}</h4>
                            <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                              {new Date(c.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5 font-medium flex items-center gap-1">
                            <span>{c.lastMessage || 'Say hi'}</span>
                          </p>
                        </div>

                        {/* Status / Badge on Right */}
                        <div className="shrink-0">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 block" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* =========================================================================
                RIGHT PANEL: Active Chat Thread View (Reference Screen 1)
               ========================================================================= */}
            <div
              className={`md:col-span-7 lg:col-span-8 flex flex-col h-full min-h-0 bg-white/40 dark:bg-card/40 backdrop-blur-xl ${
                mobileView === 'list' ? 'hidden md:flex' : 'flex'
              }`}
            >
              {activeConv && otherParticipant ? (
                <>
                  {/* Top Bar: Back Button, Title, and Settings Gear */}
                  <div className="p-3 sm:p-4 border-b border-white/60 dark:border-border/60 flex items-center justify-between bg-white/60 dark:bg-card/60 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      {/* Back Button */}
                      <button
                        type="button"
                        onClick={() => setMobileView('list')}
                        aria-label="Back to conversations list"
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-white/90 dark:bg-card/90 border border-white/80 dark:border-border shadow-2xs flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all shrink-0"
                      >
                        <ArrowLeft className="h-4.5 w-4.5 sm:h-5 sm:w-5 stroke-[2.2]" />
                      </button>

                      <div className="min-w-0">
                        <h2 className="font-display text-sm sm:text-base md:text-lg font-black text-foreground truncate">
                          {otherParticipant.name}
                        </h2>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>Campus Peer • Verified</span>
                        </p>
                      </div>
                    </div>

                    {/* Settings Button */}
                    <button
                      type="button"
                      aria-label="Chat Settings"
                      className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-white/90 dark:bg-card/90 border border-white/80 dark:border-border shadow-2xs flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all shrink-0"
                    >
                      <Settings className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                    </button>
                  </div>

                  {/* Messages Scroll Area with independent non-jumping overflow */}
                  <div
                    ref={chatScrollContainerRef}
                    className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-5 scrollbar-thin overscroll-contain"
                  >
                    
                    {/* Centered Date Pill Separator */}
                    <div className="flex justify-center my-1">
                      <div className="rounded-full px-4 py-0.5 sm:py-1 bg-white/80 dark:bg-card/80 border border-white/80 dark:border-border/60 text-[11px] sm:text-xs font-bold text-muted-foreground shadow-2xs">
                        Today
                      </div>
                    </div>

                    {messages.length === 0 ? (
                      <div className="text-center py-10 space-y-2 text-muted-foreground">
                        <p className="text-sm font-bold text-foreground">Say hello to {otherParticipant.name} 👋</p>
                        <p className="text-xs">Ask questions, agree on meetup points, or discuss deals.</p>
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isMe = m.senderId === user.uid;
                        const isLiked = likedMessages[m.id];
                        const isCopied = copiedMessageId === m.id;

                        return (
                          <div
                            key={m.id}
                            className={cn(
                              'flex items-end gap-2 sm:gap-2.5 w-full',
                              isMe ? 'justify-end' : 'justify-start'
                            )}
                          >
                            {/* Incoming Avatar on Left */}
                            {!isMe && (
                              <Avatar className="h-7 w-7 sm:h-9 sm:w-9 ring-2 ring-purple-400/20 shadow-2xs shrink-0 mb-1">
                                <AvatarImage src={otherParticipant.avatar} alt={otherParticipant.name} />
                                <AvatarFallback className="text-[10px] sm:text-xs font-bold bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                                  {otherParticipant.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            )}

                            {/* Message Bubble Block - Prevents collapsing & preserves natural bubble width */}
                            <div className={cn('flex flex-col gap-1 max-w-[82%] sm:max-w-[75%] min-w-0', isMe ? 'items-end' : 'items-start')}>
                              
                              {/* Bubble */}
                              <div
                                className={cn(
                                  'px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm leading-relaxed rounded-[22px] sm:rounded-[24px] shadow-sm w-fit inline-block font-medium',
                                  isMe
                                    ? 'bg-[#a855f7] dark:bg-purple-600 text-white rounded-br-[4px]'
                                    : 'bg-white dark:bg-card text-foreground border border-slate-200/80 dark:border-border/80 rounded-bl-[4px] shadow-2xs'
                                )}
                                style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                              >
                                <p className="whitespace-pre-wrap">{m.text}</p>
                              </div>

                              {/* Action Toolbar on Incoming Messages */}
                              {!isMe && (
                                <div className="flex items-center gap-1.5 sm:gap-2 px-1 pt-0.5 text-muted-foreground">
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(m.text, m.id)}
                                    title="Copy text"
                                    className="p-1 rounded-lg hover:bg-white dark:hover:bg-card hover:text-foreground transition-colors"
                                  >
                                    {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleLike(m.id)}
                                    title="Like message"
                                    className={cn(
                                      'p-1 rounded-lg hover:bg-white dark:hover:bg-card transition-colors',
                                      isLiked ? 'text-purple-600 font-bold' : 'hover:text-foreground'
                                    )}
                                  >
                                    <ThumbsUp className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSpeak(m.text)}
                                    title="Listen to message"
                                    className="p-1 rounded-lg hover:bg-white dark:hover:bg-card hover:text-foreground transition-colors"
                                  >
                                    <Volume2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Outgoing Avatar on Right */}
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
                      FLOATING INPUT DOCK (Reference Image 1 Bottom Bar)
                     ========================================================================= */}
                  <div className="p-2.5 sm:p-4 bg-transparent shrink-0">
                    <form onSubmit={handleSend} className="flex items-center gap-2 max-w-3xl mx-auto">
                      
                      {/* Floating Pill Input Box */}
                      <div className="flex-1 flex items-center h-11 sm:h-12 rounded-full bg-white/95 dark:bg-card/95 border border-white/80 dark:border-border/80 shadow-md px-3 gap-2 backdrop-blur-md">
                        
                        {/* Left '+' Attachment / Options Button */}
                        <button
                          type="button"
                          onClick={() => setInputMsg((prev) => prev ? prev + ' 🤝 Let\'s meet at Central Library' : '🤝 Let\'s meet at Central Library')}
                          title="Add campus location"
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-secondary/80 hover:bg-secondary flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all shrink-0"
                        >
                          <Plus className="h-4 w-4 stroke-[2.5]" />
                        </button>

                        {/* Main Text Input */}
                        <input
                          value={inputMsg}
                          onChange={(e) => setInputMsg(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 bg-transparent border-0 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/70 focus:outline-none px-1"
                        />

                        {/* Black Squircle Send Button */}
                        <button
                          type="submit"
                          disabled={!inputMsg.trim() || sending}
                          className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-xl bg-foreground text-background flex items-center justify-center shadow-xs hover:scale-105 active:scale-90 transition-transform shrink-0 disabled:opacity-30"
                        >
                          {sending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5 stroke-[2.2] -translate-y-0.5 translate-x-0.5" />
                          )}
                        </button>
                      </div>

                      {/* Right Round Voice / Mic Button */}
                      <button
                        type="button"
                        onClick={() => {
                          toast({ title: 'Microphone Voice Notes enabled! 🎙️', description: 'Speak your message into the microphone.' });
                        }}
                        aria-label="Voice Message"
                        className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-white/95 dark:bg-card/95 border border-white/80 dark:border-border/80 shadow-md flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all shrink-0"
                      >
                        <Mic className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 my-auto">
                  <div className="h-16 w-16 rounded-3xl bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto shadow-xs">
                    <MessageSquare className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Select a chat to begin</h3>
                  <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                    Choose a conversation from the list to message campus buyers and sellers.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
      <Footer />
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
