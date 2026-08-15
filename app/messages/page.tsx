'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  MessageSquare, Send, User, Search, Store,
  Sparkles, CheckCheck, ShieldCheck, ArrowLeft,
  ChevronLeft,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  getConversations,
  getMessages,
  sendChatMessage,
} from '@/lib/firebase-queries';
import type { Conversation, ChatMessage } from '@/lib/types';

export default function MessagesPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [search, setSearch] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load and sort conversations for the user
  const loadUserConversations = useCallback(async () => {
    if (!user) return;

    let convs = await getConversations(user.uid);
    if (convs.length === 0) {
      // Check if user is Guhan or regular student to avoid self-chat
      const isGuhan =
        user.uid === 'seller-guhan' ||
        user.email?.toLowerCase().includes('guhan') ||
        profile?.username === 'guhan';

      const peerId = isGuhan ? 'student-priya' : 'seller-guhan';
      const peerName = isGuhan ? 'Priya R (ECE Student)' : 'Guhan M (Founder & Admin)';
      const peerAvatar = isGuhan
        ? 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300'
        : 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300';

      const sampleConv: Conversation = {
        id: `conv_${user.uid}_${peerId}`,
        participantIds: [user.uid, peerId],
        participantNames: {
          [user.uid]: profile?.display_name || user.displayName || 'Student',
          [peerId]: peerName,
        },
        participantAvatars: {
          [user.uid]: profile?.avatar_url || '',
          [peerId]: peerAvatar,
        },
        lastMessage: isGuhan
          ? 'Hi Guhan! I am interested in the Mini Drafter for my Engineering Graphics class.'
          : 'Welcome to CampusCart! Feel free to reach out if you need assistance with your store.',
        lastMessageTimestamp: new Date().toISOString(),
        unreadCount: { [user.uid]: 1 },
      };

      const sampleMsg: ChatMessage = {
        id: 'msg_welcome',
        conversationId: sampleConv.id,
        senderId: peerId,
        senderName: peerName.split(' ')[0],
        senderAvatar: peerAvatar,
        recipientId: user.uid,
        text: isGuhan
          ? 'Hi Guhan! I am interested in the Mini Drafter for my Engineering Graphics class. Is it still available?'
          : 'Hey! Welcome to CampusCart. Feel free to list your products, offer freelance gigs, or chat about campus collaborations.',
        createdAt: new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('campuscart_conversations', JSON.stringify([sampleConv]));
          localStorage.setItem(`campuscart_msgs_${sampleConv.id}`, JSON.stringify([sampleMsg]));
        } catch {}
      }
      convs = [sampleConv];
    }

    // Sort with newest messages on top
    const sorted = [...convs].sort((a, b) => {
      const timeA = new Date(a.lastMessageTimestamp).getTime() || 0;
      const timeB = new Date(b.lastMessageTimestamp).getTime() || 0;
      return timeB - timeA;
    });

    setConversations(sorted);
    if (!activeConvId && sorted.length > 0) {
      setActiveConvId(sorted[0].id);
    }
  }, [user, profile, activeConvId]);

  useEffect(() => {
    loadUserConversations();
  }, [loadUserConversations]);

  // Load messages for active conversation
  const loadMessagesForActive = useCallback(async () => {
    if (!activeConvId) return;
    const msgs = await getMessages(activeConvId);
    setMessages(msgs);
  }, [activeConvId]);

  useEffect(() => {
    loadMessagesForActive();

    const handleSync = () => {
      loadMessagesForActive();
      loadUserConversations();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('campuscart_message_sent', handleSync);
      window.addEventListener('storage', handleSync);
      return () => {
        window.removeEventListener('campuscart_message_sent', handleSync);
        window.removeEventListener('storage', handleSync);
      };
    }
  }, [loadMessagesForActive, loadUserConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !activeConvId || !inputMsg.trim()) return;

    const currentConv = conversations.find((c) => c.id === activeConvId);
    const otherId = currentConv?.participantIds.find((id) => id !== user.uid) || 'seller-guhan';

    const sent = await sendChatMessage({
      conversationId: activeConvId,
      senderId: user.uid,
      senderName: profile?.display_name || user.displayName || 'Student',
      senderAvatar: profile?.avatar_url || '',
      recipientId: otherId,
      text: inputMsg.trim(),
    });

    setMessages((prev) => [...prev, sent]);
    setInputMsg('');

    // Update conversation sidebar preview immediately
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? { ...c, lastMessage: sent.text, lastMessageTimestamp: sent.createdAt }
          : c
      ).sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime())
    );
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

  const activeConv = useMemo(() => {
    return conversations.find((c) => c.id === activeConvId);
  }, [conversations, activeConvId]);

  const otherParticipant = useMemo(() => {
    if (!activeConv || !user) return null;
    const otherId = activeConv.participantIds.find((id) => id !== user.uid) || 'seller-guhan';
    return {
      id: otherId,
      name: activeConv.participantNames?.[otherId] || 'Campus Peer',
      avatar: activeConv.participantAvatars?.[otherId] || '',
    };
  }, [activeConv, user]);

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
            <Button asChild className="mt-6 rounded-xl w-full">
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
      <main className="container-px mx-auto max-w-6xl py-6 sm:py-8 min-h-[calc(100vh-140px)]">
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12 min-h-[620px] max-h-[780px]">
          {/* Left Sidebar: Conversations List */}
          <div
            className={`md:col-span-5 lg:col-span-4 border-r border-border flex flex-col bg-secondary/20 ${
              mobileView === 'chat' ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="font-display text-lg font-bold">Messages</h2>
                <Badge variant="outline" className="text-[10px] bg-background">
                  Campus Real-time
                </Badge>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search chats..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border/60">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
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
                      className={`w-full p-4 flex items-center gap-3 text-left transition-colors ${
                        isSelected ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-accent/40'
                      }`}
                    >
                      <Avatar className="h-10 w-10 shrink-0 ring-1 ring-border">
                        <AvatarImage src={otherAvatar} alt={otherName} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                          {otherName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-foreground truncate">{otherName}</h4>
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                            {new Date(c.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{c.lastMessage}</p>
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

                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10 ring-1 ring-border shrink-0">
                      <AvatarImage src={otherParticipant.avatar} alt={otherParticipant.name} />
                      <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                        {otherParticipant.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-xs sm:text-sm text-foreground truncate">{otherParticipant.name}</h3>
                        <ShieldCheck className="h-3.5 w-3.5 text-success shrink-0" />
                      </div>
                      <p className="text-[10px] text-success font-medium flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                        Active on Campus
                      </p>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
                    <Link href="/marketplace">Browse Store</Link>
                  </Button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
                  {messages.map((m) => {
                    const isMe = m.senderId === user.uid;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-br-none'
                              : 'bg-secondary text-foreground rounded-bl-none'
                          }`}
                        >
                          {m.text}
                        </div>
                        <span className="text-[9px] text-muted-foreground mt-1 px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-border bg-card/30 flex items-center gap-2">
                  <Input
                    placeholder="Type a message to arrange pickup or ask questions..."
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    className="rounded-xl text-xs h-10"
                  />
                  <Button type="submit" size="icon" className="rounded-xl h-10 w-10 shrink-0" disabled={!inputMsg.trim()}>
                    <Send className="h-4 w-4" />
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
