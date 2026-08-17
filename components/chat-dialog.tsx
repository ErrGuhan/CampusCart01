'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MessageSquare, Send, X, Loader2, Sparkles,
  Check, Handshake, IndianRupee, ArrowRight, LogIn, ShieldCheck,
  Plus, Mic, Copy, ThumbsUp, Volume2, Settings,
} from 'lucide-react';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getMessages, sendChatMessage } from '@/lib/firebase-queries';
import type { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';

type ChatDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  recipientUsername?: string;
  product?: {
    id: string;
    name: string;
    price: number;
    image?: string;
  };
};

export function ChatDialog({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  recipientAvatar,
  recipientUsername,
  product,
}: ChatDialogProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [offerMode, setOfferMode] = useState(false);
  const [offerPrice, setOfferPrice] = useState(product ? (product.price * 0.9).toFixed(0) : '');
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  // Initialize or find conversation
  useEffect(() => {
    if (!isOpen || !user || !recipientId) return;

    // Generate deterministic 1-on-1 chat room ID
    const sortedUids = [user.uid, recipientId].sort();
    const computedChatId = `chat_${sortedUids[0]}_${sortedUids[1]}`;
    setChatId(computedChatId);

    // Initial greeting if conversation has no messages
    const initialGreeting: ChatMessage = {
      id: 'greeting_0',
      conversationId: computedChatId,
      senderId: recipientId,
      senderName: recipientName,
      senderAvatar: recipientAvatar || '',
      recipientId: user.uid,
      text: product
        ? `Hey! Thanks for checking out "${product.name}". Feel free to ask questions or make an offer!`
        : `Hey! How can I help you today?`,
      createdAt: new Date().toISOString(),
    };

    // Load initial messages
    getMessages(computedChatId).then((msgs) => {
      if (msgs.length > 0) {
        setMessages(msgs);
      } else {
        setMessages([initialGreeting]);
      }
      setTimeout(() => scrollToBottom(false), 50);
    });

    // Listen to real-time messages from Firestore
    let unsubscribe = () => {};
    try {
      const q = query(
        collection(db, 'chats', computedChatId, 'messages'),
        orderBy('createdAt', 'asc')
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const msgs: ChatMessage[] = [];
            snapshot.forEach((docSnap) => {
              const d = docSnap.data();
              msgs.push({
                id: docSnap.id,
                conversationId: computedChatId,
                senderId: d.senderId,
                senderName: d.senderName,
                senderAvatar: d.senderAvatar || '',
                recipientId: d.recipientId || '',
                text: d.text,
                createdAt: d.createdAt,
              });
            });
            setMessages(msgs);
            setTimeout(() => scrollToBottom(true), 50);
          }
        },
        (err) => {
          console.warn('Firestore onSnapshot notice in ChatDialog:', err);
        }
      );
    } catch (err) {
      console.warn('Chat listener notice:', err);
    }

    const handleSync = () => {
      getMessages(computedChatId).then((msgs) => {
        setMessages(msgs);
        setTimeout(() => scrollToBottom(false), 50);
      });
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
  }, [isOpen, user, recipientId, recipientName, recipientAvatar, product, scrollToBottom]);

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in-50">
        <div className="relative w-full max-w-md bg-card border border-border p-6 rounded-3xl shadow-2xl text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto">
            <MessageSquare className="h-7 w-7" />
          </div>
          <h3 className="font-display font-bold text-lg">Sign in to Message {recipientName}</h3>
          <p className="text-xs text-muted-foreground">
            Sign in with your student account to send direct messages, propose meetup spots, or negotiate offers.
          </p>
          <div className="flex gap-2.5 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button asChild className="flex-1 btn-gradient-primary rounded-xl">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!user || !chatId || !inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const sent = await sendChatMessage({
        conversationId: chatId,
        senderId: user.uid,
        senderName: profile?.display_name || user.displayName || user.email?.split('@')[0] || 'Student',
        senderAvatar: profile?.avatar_url || '',
        recipientId,
        text: textToSend,
      });

      setMessages((prev) => [...prev, sent]);
    } catch (err: any) {
      console.warn('Error sending chat message:', err);
    } finally {
      setSending(false);
      setTimeout(() => scrollToBottom(true), 50);
    }
  }

  async function handleSendOffer() {
    if (!user || !chatId) return;
    const priceNum = parseFloat(offerPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast({ title: 'Valid offer price required', variant: 'destructive' });
      return;
    }

    const offerText = `🤝 Made an offer for ₹${priceNum}${product ? ` on "${product.name}"` : ''}`;
    setOfferMode(false);
    setSending(true);

    try {
      const sent = await sendChatMessage({
        conversationId: chatId,
        senderId: user.uid,
        senderName: profile?.display_name || user.displayName || user.email?.split('@')[0] || 'Student',
        senderAvatar: profile?.avatar_url || '',
        recipientId,
        text: offerText,
      });

      setMessages((prev) => [...prev, sent]);
      toast({ title: 'Offer sent! 🎉', description: `Offered ₹${priceNum} to ${recipientName}.` });
    } catch (err: any) {
      toast({ title: 'Error sending offer', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
      setTimeout(() => scrollToBottom(true), 50);
    }
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: 'Copied to clipboard' });
    setTimeout(() => setCopiedId(null), 2000);
  }

  function toggleLike(id: string) {
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleSpeak(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/70 backdrop-blur-md animate-in fade-in-50">
      {/* Modal Card with Soft Ambient Gradient Background */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#E2E4F6] via-[#FAF8E6] to-[#FFFDD0] dark:from-[#171026] dark:via-[#130D20] dark:to-[#1B1120] border border-[#E2E4F6] dark:border-border/60 rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[580px] max-h-[88vh]">
        
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#E2E4F6] dark:border-border/60 flex items-center justify-between bg-[#FFFDD0]/90 dark:bg-card/70 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              aria-label="Back"
              className="h-9 w-9 rounded-2xl bg-[#FFFDD0] dark:bg-card/90 border border-[#E2E4F6] dark:border-border shadow-2xs flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="min-w-0">
              <h3 className="font-display font-black text-sm sm:text-base text-[#0F172A] truncate">{recipientName}</h3>
              <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Verified Student Peer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs text-[#1D5BF1] dark:text-purple-400 font-bold h-8 px-2.5 rounded-xl hover:bg-[#1D5BF1]/10"
            >
              <Link href={`/messages?user=${recipientId}&name=${encodeURIComponent(recipientName)}`}>
                Full View
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Product Context Banner */}
        {product && (
          <div className="p-2.5 sm:p-3 bg-[#FFFDD0]/80 dark:bg-card/80 border-b border-[#E2E4F6] dark:border-border/60 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {product.image && (
                <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border/60">
                  <Image src={product.image} alt={product.name} fill className="object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{product.name}</p>
                <p className="text-xs font-black text-[#1D5BF1] dark:text-purple-400">₹{product.price}</p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setOfferMode(!offerMode)}
              className="h-8 text-xs font-bold rounded-xl border-[#1D5BF1]/40 text-[#1D5BF1] dark:text-purple-400 hover:bg-[#1D5BF1]/10 shrink-0"
            >
              <Handshake className="h-3.5 w-3.5 mr-1" />
              Make Offer
            </Button>
          </div>
        )}

        {/* Make Offer Collapsible Drawer */}
        {offerMode && product && (
          <div className="p-3 bg-[#1D5BF1]/10 border-b border-[#1D5BF1]/20 space-y-2 animate-in slide-in-from-top-2 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">Propose Price to {recipientName}:</span>
              <span className="text-muted-foreground line-through">Listed: ₹{product.price}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  placeholder="Offer amount"
                  className="pl-8 h-9 text-xs rounded-xl bg-[#FFFDD0] dark:bg-card"
                />
              </div>
              <Button
                size="sm"
                onClick={handleSendOffer}
                disabled={sending}
                className="btn-gradient-primary rounded-xl text-xs font-bold h-9 px-3"
              >
                Send Offer
              </Button>
            </div>
          </div>
        )}

        {/* Messages Body */}
        <div ref={chatScrollContainerRef} className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 scrollbar-thin overscroll-contain">
          
          {/* Centered Date Separator */}
          <div className="flex justify-center my-1">
            <div className="rounded-full px-3.5 py-0.5 bg-[#FFFDD0]/90 dark:bg-card/80 border border-[#E2E4F6] dark:border-border/60 text-[11px] font-bold text-muted-foreground shadow-2xs">
              Today
            </div>
          </div>

          {messages.map((m) => {
            const isMe = m.senderId === user.uid;
            const isLiked = likedMap[m.id];
            const isCopied = copiedId === m.id;

            return (
              <div key={m.id} className={cn('flex items-end gap-2 w-full', isMe ? 'justify-end' : 'justify-start')}>
                
                {/* Peer avatar on left */}
                {!isMe && (
                  <Avatar className="h-7 w-7 ring-2 ring-[#1D5BF1]/20 shadow-2xs shrink-0 mb-1">
                    <AvatarImage src={recipientAvatar} alt={recipientName} />
                    <AvatarFallback className="text-[10px] font-black bg-gradient-to-br from-[#1D5BF1] to-[#3B42C4] text-white">
                      {recipientName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={cn('flex flex-col gap-1 max-w-[82%] min-w-0', isMe ? 'items-end' : 'items-start')}>
                  <div
                    className={cn(
                      'px-4 py-2.5 text-xs sm:text-sm leading-relaxed rounded-[22px] shadow-sm w-fit inline-block font-medium',
                      isMe
                        ? 'bg-[#1D5BF1] dark:bg-purple-600 text-[#FFFDD0] rounded-br-[4px]'
                        : 'bg-[#FFFDD0] dark:bg-card text-[#0F172A] border border-[#E2E4F6] dark:border-border/80 rounded-bl-[4px] shadow-2xs'
                    )}
                    style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>

                  {/* Actions on Incoming */}
                  {!isMe && (
                    <div className="flex items-center gap-1.5 px-1 pt-0.5 text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => handleCopy(m.text, m.id)}
                        className="p-0.5 rounded hover:text-foreground"
                      >
                        {isCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleLike(m.id)}
                        className={cn('p-0.5 rounded', isLiked ? 'text-[#1D5BF1]' : 'hover:text-foreground')}
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSpeak(m.text)}
                        className="p-0.5 rounded hover:text-foreground"
                      >
                        <Volume2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* User avatar on right */}
                {isMe && (
                  <Avatar className="h-7 w-7 ring-2 ring-[#1D5BF1]/20 shadow-2xs shrink-0 mb-1">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'You'} />
                    <AvatarFallback className="text-[10px] font-bold bg-[#1D5BF1] text-white">
                      {(profile?.display_name || user.email || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
        </div>

        {/* Message Input Footer (Floating Pill Dock) */}
        <form onSubmit={handleSendMessage} className="p-2.5 sm:p-3 bg-transparent flex items-center gap-2 shrink-0">
          <div className="flex-1 flex items-center h-11 sm:h-12 rounded-full bg-[#FFFDD0] dark:bg-card/95 border border-[#E2E4F6] dark:border-border/80 shadow-md px-3 gap-2 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setInputText((prev) => prev ? prev + ' 🤝 Let\'s meet at Central Library' : '🤝 Let\'s meet at Central Library')}
              className="h-7 w-7 rounded-full bg-secondary/80 hover:bg-secondary flex items-center justify-center text-foreground shrink-0"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
            </button>

            <input
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-transparent border-0 text-xs font-medium text-foreground placeholder:text-muted-foreground/70 focus:outline-none px-1"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="h-8 w-8 rounded-xl bg-[#1D5BF1] text-[#FFFDD0] flex items-center justify-center shadow-xs hover:scale-105 active:scale-90 transition-transform shrink-0 disabled:opacity-30"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5 -translate-y-0.5 translate-x-0.5" />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => toast({ title: 'Microphone Voice Notes enabled! 🎙️' })}
            aria-label="Voice note"
            className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-[#FFFDD0] dark:bg-card/95 border border-[#E2E4F6] dark:border-border/80 shadow-md flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all shrink-0"
          >
            <Mic className="h-4.5 w-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
