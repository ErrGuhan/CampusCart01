'use client';

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import {
  MessageSquare, Send, User, Search, Store,
  Sparkles, CheckCheck, ShieldCheck, ArrowLeft,
  ChevronLeft, Loader2, Info, MapPin, Handshake,
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
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  getConversations,
  getMessages,
  sendChatMessage,
} from '@/lib/firebase-queries';
import type { Conversation, ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';

const QUICK_STARTERS = [
  '👋 Hi! Is this still available?',
  '📍 Can we meet at the Central Library / Student Center for handover?',
  '🤝 I saw your listing on CampusCart and would love to discuss!',
];

// Helper to merge message arrays deduplicating by ID and sorting chronologically
function mergeMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const map = new Map<string, ChatMessage>();
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

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [search, setSearch] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>(targetUserParam ? 'chat' : 'list');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load and merge conversations for the user
  const loadUserConversations = useCallback(async () => {
    if (!user) return;

    const convs = await getConversations(user.uid);

    // Sort newest on top
    const sorted = [...convs].sort((a, b) => {
      const timeA = new Date(a.lastMessageTimestamp).getTime() || 0;
      const timeB = new Date(b.lastMessageTimestamp).getTime() || 0;
      return timeB - timeA;
    });

    setConversations((prev) => {
      const map = new Map<string, Conversation>();
      sorted.forEach((c) => map.set(c.id, c));
      // Preserve any active or local threads in current state
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

  useEffect(() => {
    loadUserConversations();
  }, [loadUserConversations]);

  // Handle URL user param to open direct chat & switch mobile view to 'chat'
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
        [targetUserParam]: targetNameParam || 'Campus Peer',
      },
      participantAvatars: {
        [user.uid]: profile?.avatar_url || '',
        [targetUserParam]: '',
      },
      lastMessage: 'Conversation active',
      lastMessageTimestamp: new Date().toISOString(),
      unreadCount: {},
    };

    setConversations((prev) => {
      if (prev.some((c) => c.id === computedId)) return prev;
      return [draftConv, ...prev];
    });
  }, [user, targetUserParam, targetNameParam, profile]);

  // Real-time listener for active conversation (with lossless message merging)
  useEffect(() => {
    if (!activeConvId) return;

    // 1. Load local & database messages first
    getMessages(activeConvId).then((msgs) => {
      setMessages((prev) => mergeMessages(prev, msgs));
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
            // Merge losslessly so local optimistic messages never get erased
            setMessages((prev) => mergeMessages(prev, incoming));
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
  }, [activeConvId, loadUserConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e?: React.FormEvent, customText?: string) {
    if (e) e.preventDefault();
    const textToSend = (customText || inputMsg).trim();
    if (!user || !activeConvId || !textToSend) return;

    const currentConv = conversations.find((c) => c.id === activeConvId);
    const otherId = currentConv?.participantIds.find((id) => id !== user.uid) || targetUserParam || 'seller-guhan';
    const otherName = currentConv?.participantNames?.[otherId] || targetNameParam || 'Campus Peer';
    const otherAvatar = currentConv?.participantAvatars?.[otherId] || '';

    const tempMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      conversationId: activeConvId,
      senderId: user.uid,
      senderName: profile?.display_name || user.displayName || user.email?.split('@')[0] || 'Student',
      senderAvatar: profile?.avatar_url || '',
      recipientId: otherId,
      text: textToSend,
      createdAt: new Date().toISOString(),
    };

    // 1. Optimistically append message immediately to local state so it NEVER disappears
    setMessages((prev) => mergeMessages(prev, [tempMsg]));
    setInputMsg('');
    setSending(true);

    // 2. Update conversation list preview in state
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
        conversationId: activeConvId,
        senderId: user.uid,
        senderName: profile?.display_name || user.displayName || user.email?.split('@')[0] || 'Student',
        senderAvatar: profile?.avatar_url || '',
        recipientId: otherId,
        text: textToSend,
      });
    } catch (err: any) {
      toast({ title: 'Message delivery warning', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }

  // Filter conversations based on user search query
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

  // Robust active conversation resolver (with fallback synthesis so chat window NEVER disappears)
  const activeConv = useMemo(() => {
    const found = conversations.find((c) => c.id === activeConvId);
    if (found) return found;
    if (activeConvId && user) {
      const targetId = targetUserParam || 'seller-guhan';
      return {
        id: activeConvId,
        participantIds: [user.uid, targetId],
        participantNames: {
          [user.uid]: profile?.display_name || user.email?.split('@')[0] || 'You',
          [targetId]: targetNameParam || 'Campus Peer',
        },
        participantAvatars: {
          [user.uid]: profile?.avatar_url || '',
          [targetId]: '',
        },
        lastMessage: 'Conversation active',
        lastMessageTimestamp: new Date().toISOString(),
        unreadCount: {},
      };
    }
    return null;
  }, [conversations, activeConvId, user, targetUserParam, targetNameParam, profile]);

  const otherParticipant = useMemo(() => {
    if (!activeConv || !user) return null;
    const otherId = activeConv.participantIds.find((id) => id !== user.uid) || targetUserParam || 'seller-guhan';
    return {
      id: otherId,
      name: activeConv.participantNames?.[otherId] || targetNameParam || 'Campus Peer',
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
      <main className="container-px mx-auto max-w-6xl py-4 sm:py-8 min-h-[calc(100vh-140px)] pb-28 sm:pb-32 bg-radial-wash">
        <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12 min-h-[620px] max-h-[780px]">
          {/* Left Sidebar: Conversations List */}
          <div
            className={`md:col-span-5 lg:col-span-4 border-r border-border flex flex-col bg-secondary/15 ${
              mobileView === 'chat' ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="p-4 border-b border-border/80">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h2 className="font-display text-lg font-bold text-foreground">Campus Messages</h2>
                </div>
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 font-bold">
                  Live Chat
                </Badge>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search chats by name or text..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl bg-card border-border/80 shadow-2xs"
                />
              </div>
            </div>

            {/* Conversation list items */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/60">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground font-medium">
                  {search ? 'No matching chats found.' : 'No active conversations yet.'}
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const otherId = c.participantIds.find((id) => id !== user.uid) || 'seller-guhan';
                  const otherName = c.participantNames?.[otherId] || 'Campus Peer';
                  const otherAvatar = c.participantAvatars?.[otherId];
                  const isSelected = c.id === activeConvId;

                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectConversation(c.id)}
                      className={cn(
                        'w-full p-4 flex items-center gap-3 text-left transition-colors',
                        isSelected ? 'bg-primary/10 border-l-4 border-primary shadow-2xs' : 'hover:bg-accent/40'
                      )}
                    >
                      <Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/20 shadow-2xs">
                        <AvatarImage src={otherAvatar} alt={otherName} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                          {otherName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-foreground truncate">{otherName}</h4>
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-1 font-medium">
                            {new Date(c.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5 font-medium">{c.lastMessage}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Area: Active Chat */}
          <div
            className={`md:col-span-7 lg:col-span-8 flex flex-col bg-background ${
              mobileView === 'list' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activeConv && otherParticipant ? (
              <>
                {/* Chat Header */}
                <div className="p-3.5 sm:p-4 border-b border-border flex items-center justify-between bg-card/50">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    {/* Mobile Back Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden h-8 w-8 rounded-lg"
                      onClick={() => setMobileView('list')}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>

                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-primary/20 shrink-0">
                      <AvatarImage src={otherParticipant.avatar} alt={otherParticipant.name} />
                      <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                        {otherParticipant.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-xs sm:text-sm text-foreground truncate">{otherParticipant.name}</h3>
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      </div>
                      <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active on Campus
                      </p>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8 touch-target">
                    <Link href="/marketplace">Explore Store</Link>
                  </Button>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-xs font-medium space-y-3">
                      <p>Start a conversation with {otherParticipant.name}!</p>
                      <div className="flex flex-col gap-2 max-w-sm mx-auto">
                        {QUICK_STARTERS.map((starter) => (
                          <button
                            key={starter}
                            type="button"
                            onClick={() => handleSend(undefined, starter)}
                            className="p-2.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold text-left transition-all"
                          >
                            {starter}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.senderId === user.uid;
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={cn(
                              'max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs',
                              isMe
                                ? 'bg-gradient-to-r from-primary to-cyan-500 text-white rounded-br-none'
                                : 'bg-secondary text-foreground rounded-bl-none border border-border/70'
                            )}
                          >
                            {m.text}
                          </div>
                          <span className="text-[9px] text-muted-foreground mt-1 px-1 font-medium">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Bar */}
                <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-border bg-card/40 flex items-center gap-2">
                  <Input
                    placeholder="Type a message to arrange pickup or details..."
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    className="rounded-xl text-xs h-10 bg-card border-border/80 shadow-2xs"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="btn-gradient-primary rounded-xl h-10 w-10 shrink-0 shadow-xs touch-target"
                    disabled={!inputMsg.trim() || sending}
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mb-2 opacity-40" />
                <p className="text-sm font-semibold">Select a conversation to start chatting</p>
              </div>
            )}
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
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
