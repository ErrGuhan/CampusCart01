'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, X, Loader2, Sparkles,
  Check, Handshake, DollarSign, ArrowRight,
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
  serverTimestamp,
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

    // Ensure conversation parent document exists
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
    );

    // Listen to real-time messages
    const q = query(
      collection(db, 'chats', computedChatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
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
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [isOpen, user, recipientId, recipientName, product]);

  if (!isOpen) return null;

  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!user || !chatId) return;

    if (!inputText.trim()) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        senderName: profile?.display_name || user.email?.split('@')[0] || 'Student',
        text: inputText.trim(),
        createdAt: new Date().toISOString(),
      });

      setInputText('');
    } catch (err: any) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  }

  async function handleSendOffer() {
    if (!user || !chatId) return;
    const priceNum = parseFloat(offerPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast({ title: 'Valid offer price required', variant: 'destructive' });
      return;
    }

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

      setOfferMode(false);
      toast({ title: 'Offer sent!', description: `Offered ₹${priceNum} to ${recipientName}.` });
    } catch (err: any) {
      console.error('Error sending offer:', err);
    } finally {
      setSending(false);
    }
  }

  async function handleRespondToOffer(msgId: string, status: 'accepted' | 'declined') {
    if (!chatId) return;
    try {
      await setDoc(
        doc(db, 'chats', chatId, 'messages', msgId),
        { offerStatus: status },
        { merge: true }
      );
      toast({
        title: status === 'accepted' ? 'Offer accepted! 🎉' : 'Offer declined',
        description: status === 'accepted' ? 'Coordinate with buyer for handover.' : undefined,
      });
    } catch (err: any) {
      console.error(err);
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
                {recipientUsername ? `@${recipientUsername}` : 'SVCET Student'} • Active now
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
                  placeholder="300"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="pl-7 h-9 text-xs font-semibold"
                />
              </div>
              <Button size="sm" className="h-9 px-4 text-xs font-semibold" onClick={handleSendOffer} disabled={sending}>
                Send Offer
              </Button>
            </div>
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
              <MessageSquare className="h-10 w-10 text-primary/40 mb-2" />
              <p className="text-xs font-medium text-foreground">Direct Student Chat</p>
              <p className="text-[11px] max-w-xs mt-1">
                Say hello, ask questions about the item condition, or coordinate a meeting spot on campus!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === user?.uid;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  {/* Offer Card Bubble */}
                  {msg.offerPrice ? (
                    <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-3.5 max-w-[280px] space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-primary">
                        <Handshake className="h-4 w-4" />
                        <span>Price Offer: ₹{msg.offerPrice}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{msg.text}</p>

                      {msg.offerStatus === 'accepted' ? (
                        <Badge className="bg-success text-white text-[10px]">
                          <Check className="h-3 w-3 mr-1" /> Offer Accepted
                        </Badge>
                      ) : msg.offerStatus === 'declined' ? (
                        <Badge variant="secondary" className="text-muted-foreground text-[10px]">
                          Offer Declined
                        </Badge>
                      ) : !isMine ? (
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            className="h-6 text-[10px] px-2.5 bg-success text-white hover:bg-success/90"
                            onClick={() => handleRespondToOffer(msg.id, 'accepted')}
                          >
                            Accept ₹{msg.offerPrice}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[10px] px-2"
                            onClick={() => handleRespondToOffer(msg.id, 'declined')}
                          >
                            Decline
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          Pending response...
                        </Badge>
                      )}
                    </div>
                  ) : (
                    /* Regular Message Bubble */
                    <div
                      className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                        isMine
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-secondary text-secondary-foreground rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card flex items-center gap-2">
          <Input
            placeholder="Type a message or campus meeting point..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 h-10 text-xs rounded-xl bg-secondary/40"
          />
          <Button type="submit" size="icon" className="h-10 w-10 rounded-xl shrink-0" disabled={sending || !inputText.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
