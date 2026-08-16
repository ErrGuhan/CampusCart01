'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MessageSquare, Send, X, Loader2, Sparkles,
  Check, Handshake, IndianRupee, ArrowRight, LogIn, ShieldCheck,
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        ? `Hey! Thanks for your interest in "${product.name}". Feel free to ask questions or make an offer!`
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
          }
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        },
        (err) => {
          console.warn('Firestore onSnapshot notice in ChatDialog:', err);
        }
      );
    } catch (err) {
      console.warn('Chat listener notice:', err);
    }

    const handleSync = () => {
      getMessages(computedChatId).then((msgs) => setMessages(msgs));
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
  }, [isOpen, user, recipientId, recipientName, recipientAvatar, product]);

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50">
        <div className="relative w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl text-center space-y-4">
          <Button variant="ghost" size="icon" className="absolute right-4 top-4 rounded-full" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold font-display">Sign In to Chat</h3>
          <p className="text-sm text-muted-foreground">
            You need to be signed in to message {recipientName} and make price offers.
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
              Cancel
            </Button>
            <Button asChild className="btn-gradient-primary flex-1 rounded-xl font-bold">
              <Link href="/login">
                <LogIn className="h-4 w-4 mr-2" /> Sign In
              </Link>
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
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
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
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-card/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20 shrink-0">
              <AvatarImage src={recipientAvatar} alt={recipientName} />
              <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                {recipientName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-bold text-sm text-foreground truncate">{recipientName}</h3>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              </div>
              <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Verified Student on Campus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs text-primary font-bold h-8 px-2.5 rounded-xl hover:bg-primary/10"
            >
              <Link href={`/messages?user=${recipientId}&name=${encodeURIComponent(recipientName)}`}>
                Full Inbox
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Product Context Banner */}
        {product && (
          <div className="p-3 bg-secondary/40 border-b border-border/80 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {product.image && (
                <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border/60">
                  <Image src={product.image} alt={product.name} fill className="object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{product.name}</p>
                <p className="text-xs font-black text-primary">₹{product.price}</p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setOfferMode(!offerMode)}
              className="h-8 text-xs font-bold rounded-xl border-primary/40 text-primary hover:bg-primary/10 shrink-0"
            >
              <Handshake className="h-3.5 w-3.5 mr-1" />
              Make Offer
            </Button>
          </div>
        )}

        {/* Make Offer Collapsible Drawer */}
        {offerMode && product && (
          <div className="p-3 bg-primary/5 border-b border-primary/20 space-y-2 animate-in slide-in-from-top-2 shrink-0">
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
                  className="pl-8 h-9 text-xs rounded-xl"
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
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => {
            const isMe = m.senderId === user.uid;
            return (
              <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                    isMe
                      ? 'bg-gradient-to-r from-primary to-cyan-500 text-white rounded-br-none'
                      : 'bg-secondary text-foreground rounded-bl-none border border-border/60'
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

        {/* Message Input Footer */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card/60 flex items-center gap-2 shrink-0">
          <Input
            placeholder="Type a message to arrange pickup or details..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="rounded-xl text-xs h-10 border-border/80"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputText.trim() || sending}
            className="btn-gradient-primary rounded-xl h-10 w-10 shrink-0 shadow-xs"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
