'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  MessageSquare, Send, User, Search, Store,
  Sparkles, CheckCheck, ShieldCheck, ArrowLeft,
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize sample conversations if user is signed in
  useEffect(() => {
    if (!user) return;

    async function init() {
      let convs = await getConversations(user!.uid);
      if (convs.length === 0) {
        // Seed default starter conversation with founding creator
        const sampleConv: Conversation = {
          id: `conv_${user!.uid}_guhan`,
          participantIds: [user!.uid, 'seller-guhan'],
          participantNames: {
            [user!.uid]: profile?.display_name || 'Student',
            'seller-guhan': 'Guhan M (Founder & Admin)',
          },
          participantAvatars: {
            [user!.uid]: profile?.avatar_url || '',
            'seller-guhan': 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300',
          },
          lastMessage: 'Welcome to CampusCart! Feel free to reach out if you need assistance with your store.',
          lastMessageTimestamp: new Date().toISOString(),
          unreadCount: { [user!.uid]: 1 },
        };

        const sampleMsg: ChatMessage = {
          id: 'msg_welcome',
          conversationId: sampleConv.id,
          senderId: 'seller-guhan',
          senderName: 'Guhan M',
          senderAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300',
          recipientId: user!.uid,
          text: 'Hey! Welcome to CampusCart. Feel free to list your products, offer freelance gigs, or chat about campus collaborations.',
          createdAt: new Date().toISOString(),
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem('campuscart_conversations', JSON.stringify([sampleConv]));
          localStorage.setItem(`campuscart_msgs_${sampleConv.id}`, JSON.stringify([sampleMsg]));
        }
        convs = [sampleConv];
      }

      setConversations(convs);
      if (!activeConvId && convs.length > 0) {
        setActiveConvId(convs[0].id);
      }
    }

    init();
  }, [user, profile, activeConvId]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConvId) return;

    async function loadMsg() {
      const msgs = await getMessages(activeConvId!);
      setMessages(msgs);
    }
    loadMsg();

    const onMsgSent = () => loadMsg();
    if (typeof window !== 'undefined') {
      window.addEventListener('campuscart_message_sent', onMsgSent);
      return () => window.removeEventListener('campuscart_message_sent', onMsgSent);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile || !activeConvId || !inputMsg.trim()) return;

    const currentConv = conversations.find((c) => c.id === activeConvId);
    const recipientId = currentConv?.participantIds.find((id) => id !== user.uid) || 'seller-guhan';

    const sent = await sendChatMessage({
      conversationId: activeConvId,
      senderId: user.uid,
      senderName: profile.display_name,
      senderAvatar: profile.avatar_url || '',
      recipientId,
      text: inputMsg.trim(),
    });

    setMessages((prev) => [...prev, sent]);
    setInputMsg('');
  }

  const activeConv = useMemo(() => {
    return conversations.find((c) => c.id === activeConvId);
  }, [conversations, activeConvId]);

  const otherParticipant = useMemo(() => {
    if (!activeConv || !user) return null;
    const otherId = activeConv.participantIds.find((id) => id !== user.uid) || 'seller-guhan';
    return {
      id: otherId,
      name: activeConv.participantNames?.[otherId] || 'Student Peer',
      avatar: activeConv.participantAvatars?.[otherId] || '',
    };
  }, [activeConv, user]);

  if (authLoading) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-6xl py-12">
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
        <main className="container-px mx-auto max-w-3xl py-20 text-center">
          <div className="rounded-3xl border border-border p-10 bg-card">
            <MessageSquare className="h-12 w-12 text-primary/50 mx-auto mb-3" />
            <h1 className="font-display text-2xl font-bold">Sign In to View Messages</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Chat directly with buyers, sellers, and student freelancers on campus.
            </p>
            <Button asChild className="mt-5 rounded-xl">
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
      <main className="container-px mx-auto max-w-6xl py-8 min-h-screen">
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12 min-h-[600px] max-h-[750px]">
          {/* Left Sidebar: Conversations */}
          <div className="md:col-span-5 lg:col-span-4 border-r border-border flex flex-col bg-secondary/20">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="font-display text-lg font-bold">Messages</h2>
                <Badge variant="outline" className="text-[10px]">
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
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No active conversations yet.
                </div>
              ) : (
                conversations.map((c) => {
                  const otherId = c.participantIds.find((id) => id !== user.uid) || 'seller-guhan';
                  const otherName = c.participantNames[otherId] || 'Campus Peer';
                  const otherAvatar = c.participantAvatars[otherId];
                  const isSelected = c.id === activeConvId;

                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveConvId(c.id)}
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
                          <span className="text-[10px] text-muted-foreground">
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
          <div className="md:col-span-7 lg:col-span-8 flex flex-col bg-background">
            {activeConv && otherParticipant ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-card/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-1 ring-border">
                      <AvatarImage src={otherParticipant.avatar} alt={otherParticipant.name} />
                      <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                        {otherParticipant.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-foreground">{otherParticipant.name}</h3>
                        <ShieldCheck className="h-3.5 w-3.5 text-success" />
                      </div>
                      <p className="text-[10px] text-success font-medium">● Active on Campus</p>
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
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
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
                <form onSubmit={handleSend} className="p-4 border-t border-border bg-card/30 flex items-center gap-2">
                  <Input
                    placeholder="Type a message to arrange pickup or ask questions..."
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    className="rounded-xl text-xs h-10"
                  />
                  <Button type="submit" size="icon" className="rounded-xl h-10 w-10 shrink-0">
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
