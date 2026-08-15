'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  MessageSquare, Send, X, Loader2, Sparkles,
  Check, Handshake, DollarSign, ArrowRight, LogIn,
} from 'lucide-react';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  query,
  where,
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

type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  offerPrice?: number;
  offerStatus?: 'pending' | 'accepted' | 'declined';
  createdAt: any;
};

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

    // Initial fallback message if none exists
    const initialGreeting: ChatMessage = {
      id: 'greeting_0',
      senderId: recipientId,
      senderName: recipientName,
      text: product
        ? `Hey! Thanks for your interest in "${product.name}". Feel free to ask questions or make an offer!`
        : `Hey! How can I help you today?`,
      createdAt: new Date().toISOString(),
    };

    // Load local cached messages first
    try {
      const localCached = localStorage.getItem(`campuscart_chat_${computedChatId}`);
      if (localCached) {
        setMessages(JSON.parse(localCached));
      } else {
        setMessages([initialGreeting]);
      }
    } catch {
      setMessages([initialGreeting]);
    }

    // Ensure conversation parent document exists
    try {
      const chatRef = doc(db, 'chats', computedChatId);
      setDoc(
        chatRef,
        {
          participants: [user.uid, recipientId],
          participantNames: {
            [user.uid]: profile?.display_name || user.email?.split('@')[0] || 'Student',
            [recipientId]: recipientName,
          },
          product: product ? { id: product.id, name: product.name, price: product.price } : null,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});
    } catch {}

    // Listen to real-time messages
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
                senderId: d.senderId,
                senderName: d.senderName,
                text: d.text,
                offerPrice: d.offerPrice,
                offerStatus: d.offerStatus,
                createdAt: d.createdAt,
              });
            });
            setMessages(msgs);
            try {
              localStorage.setItem(`campuscart_chat_${computedChatId}`, JSON.stringify(msgs));
            } catch {}
          }
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        },
        (err) => {
          console.warn('Firestore onSnapshot notice:', err);
        }
      );
    } catch (err) {
      console.warn('Chat listener notice:', err);
    }

    return () => unsubscribe();
  }, [isOpen, user, recipientId, recipientName, product]);

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
            <Button asChild className="flex-1 rounded-xl">
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
    if (!user || !chatId) return;

    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      senderId: user.uid,
      senderName: profile?.display_name || user.email?.split('@')[0] || 'Student',
      text: inputText.trim(),
      createdAt: new Date().toISOString(),
    };

    // Update local UI immediately
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    try {
      localStorage.setItem(`campuscart_chat_${chatId}`, JSON.stringify(updatedMessages));
    } catch {}

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        senderName: profile?.display_name || user.email?.split('@')[0] || 'Student',
        text: textToSend,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn('Firestore message save notice:', err);
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

    const offerMsg: ChatMessage = {
      id: 'offer_' + Date.now(),
      senderId: user.uid,
      senderName: profile?.display_name || user.email?.split('@')[0] || 'Student',
      text: `🤝 Made an offer for ₹${priceNum}`,
      offerPrice: priceNum,
      offerStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    const updated = [...messages, offerMsg];
    setMessages(updated);
    try {
      localStorage.setItem(`campuscart_chat_${chatId}`, JSON.stringify(updated));
    } catch {}

    setOfferMode(false);
    toast({ title: 'Offer sent! 🎉', description: `Offered ₹${priceNum} to ${recipientName}.` });

    setSending(true);
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        senderName: profile?.display_name || user.email?.split('@')[0] || 'Student',
        text: `🤝 Made an offer for ₹${priceNum}`,
        offerPrice: priceNum,
        offerStatus: 'pending',
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn('Firestore offer notice:', err);
    } finally {
      setSending(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }

  async function handleRespondToOffer(msgId: string, status: 'accepted' | 'declined') {
    if (!chatId) return;

    const updated = messages.map((m) => (m.id === msgId ? { ...m, offerStatus: status } : m));
    setMessages(updated);
    try {
      localStorage.setItem(`campuscart_chat_${chatId}`, JSON.stringify(updated));
    } catch {}

    toast({
      title: status === 'accepted' ? 'Offer accepted! 🎉' : 'Offer declined',
      description: status === 'accepted' ? 'Coordinate with buyer for campus handover.' : undefined,
    });

    try {
      await setDoc(
        doc(db, 'chats', chatId, 'messages', msgId),
        { offerStatus: status },
        { merge: true }
      );
    } catch (err: any) {
      console.warn('Firestore offer response notice:', err);
    }
  }

  const initials = recipientName
    ? recipientName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'CC';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50">
      <div className="relative w-full max-w-lg h-[90vh] sm:h-[620px] bg-card border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-border">
              {recipientAvatar && <AvatarImage src={recipientAvatar} alt={recipientName} />}
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm leading-none">{recipientName}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {recipientUsername ? `@${recipientUsername}` : 'SVCET Student'} • Active on campus
              </p>
            </div>
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Product Context Banner */}
        {product && (
          <div className="flex items-center justify-between px-4 py-2 bg-primary/5 border-b border-primary/10 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              {product.image && (
                <img src={product.image} alt={product.name} className="h-7 w-7 rounded object-cover border" />
              )}
              <span className="font-medium truncate max-w-[200px]">{product.name}</span>
              <span className="font-bold text-primary">₹{product.price}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] px-2 rounded-lg border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => setOfferMode(!offerMode)}
            >
              <Handshake className="h-3 w-3 mr-1" />
              Make Offer
            </Button>
          </div>
        )}

        {/* Offer Input Mode */}
        {offerMode && (
          <div className="p-3 bg-card border-b border-border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Offer your price:</span>
              <button
                onClick={() => setOfferMode(false)}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                <Input
                  type="number"
                  placeholder="Enter offer price"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="pl-7 h-9 text-xs rounded-xl"
                  autoFocus
                />
              </div>
              <Button size="sm" onClick={handleSendOffer} disabled={sending} className="h-9 px-4 rounded-xl text-xs">
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Send Offer'}
              </Button>
            </div>
          </div>
        )}

        {/* Messages Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          <div className="text-center my-2">
            <span className="text-[10px] text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full border border-border">
              🔒 Direct Student-to-Student Campus Chat
            </span>
          </div>

          {messages.map((msg) => {
            const isMe = msg.senderId === user.uid;

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted text-foreground rounded-bl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                  {/* Offer Interactive Card */}
                  {msg.offerPrice && (
                    <div className="mt-2 pt-2 border-t border-current/20 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold">Offer: ₹{msg.offerPrice}</span>
                        {msg.offerStatus === 'accepted' && (
                          <Badge className="bg-emerald-500 text-white text-[10px] h-4">Accepted</Badge>
                        )}
                        {msg.offerStatus === 'declined' && (
                          <Badge variant="destructive" className="text-[10px] h-4">Declined</Badge>
                        )}
                        {msg.offerStatus === 'pending' && (
                          <Badge variant="outline" className="text-[10px] h-4 bg-amber-500/10 text-amber-600 border-amber-500/30">
                            Pending
                          </Badge>
                        )}
                      </div>

                      {/* If I am the recipient and offer is pending, allow Accept/Decline */}
                      {!isMe && msg.offerStatus === 'pending' && (
                        <div className="flex gap-1.5 pt-1">
                          <Button
                            size="sm"
                            className="h-6 text-[10px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex-1"
                            onClick={() => handleRespondToOffer(msg.id, 'accepted')}
                          >
                            <Check className="h-3 w-3 mr-1" /> Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[10px] px-2.5 rounded-lg flex-1 border-border"
                            onClick={() => handleRespondToOffer(msg.id, 'declined')}
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground px-1 mt-0.5">
                  {isMe ? 'You' : msg.senderName}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card flex gap-2">
          <Input
            placeholder="Type a message or bargain..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 h-10 text-xs rounded-xl"
          />
          <Button type="submit" size="icon" disabled={sending || !inputText.trim()} className="h-10 w-10 shrink-0 rounded-xl">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
