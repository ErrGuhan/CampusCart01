'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Sparkles, MessageSquare, X, Send, Bot,
  ShoppingBag, ArrowRight, CornerDownLeft, ExternalLink,
  Tag, HelpCircle, Copy, ThumbsUp, Volume2, Plus, Mic, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getAllProducts, getAllGigs } from '@/lib/firebase-queries';
import type { Product, ServiceGig } from '@/lib/types';
import { cn } from '@/lib/utils';

type AIMessage = {
  id?: string;
  sender: 'ai' | 'user';
  text: string;
  matchedProducts?: Product[];
  matchedGigs?: ServiceGig[];
  showRequestSuggestion?: boolean;
};

export function CampusCartAIAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'ai_welcome',
      sender: 'ai',
      text: 'Hi! I am your CampusCart AI shopping assistant 🎓. Ask me to find textbooks, lab equipment, CAD designs, or services under your budget!',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allGigs, setAllGigs] = useState<ServiceGig[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const [prods, gigs] = await Promise.all([getAllProducts(), getAllGigs()]);
      setAllProducts(prods);
      setAllGigs(gigs);
    }
    load();
  }, []);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const quickPrompts = [
    'Electronics under ₹500',
    'Drawing board for EG',
    'Poster design gig',
    'Semester 4 study notes',
  ];

  async function handleSend(queryText: string) {
    if (!queryText.trim()) return;

    const userMsg: AIMessage = { id: `user_${Date.now()}`, sender: 'user', text: queryText.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const q = queryText.toLowerCase();

    // Extract price constraint if any
    const priceMatch = q.match(/under\s*₹?\s*(\d+)|below\s*₹?\s*(\d+)|less than\s*₹?\s*(\d+)/i);
    const maxBudget = priceMatch ? parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3], 10) : null;

    setTimeout(() => {
      // Find matching products
      const matchedProds = allProducts.filter((p) => {
        const matchesName =
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => q.includes(t.toLowerCase())));

        const matchesPrice = maxBudget ? (p.discountPrice ?? p.price) <= maxBudget : true;

        return matchesName && matchesPrice;
      });

      // Find matching gigs
      const matchedGigs = allGigs.filter((g) => {
        const matchesGig =
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q);

        const matchesPrice = maxBudget ? g.startingPrice <= maxBudget : true;

        return matchesGig && matchesPrice;
      });

      let replyText = '';
      let showRequestSuggestion = false;

      if (matchedProds.length > 0 || matchedGigs.length > 0) {
        replyText = `Found ${matchedProds.length} products and ${matchedGigs.length} freelance services matching "${queryText}":`;
      } else {
        replyText = `I couldn't find any items matching "${queryText}". Would you like to post a request on the campus board so classmates can offer it to you?`;
        showRequestSuggestion = true;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: replyText,
          matchedProducts: matchedProds.slice(0, 3),
          matchedGigs: matchedGigs.slice(0, 2),
          showRequestSuggestion,
        },
      ]);
      setLoading(false);
    }, 450);
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
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

  if (pathname?.startsWith('/messages')) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Open AI shopping assistant"
        className="fixed bottom-20 md:bottom-6 right-3.5 sm:right-6 z-50 flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#1D5BF1] to-[#3B42C4] text-[#FFFDD0] shadow-[0_4px_25px_rgba(29,91,241,0.4)] hover:shadow-[0_6px_35px_rgba(29,91,241,0.55)] hover:scale-105 active:scale-90 transition-all duration-200 ring-4 ring-[#1D5BF1]/25 border border-white/30"
      >
        {open ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse" />}
      </button>

      {/* Chat Window with Soft Ambient Gradient Background */}
      {open && (
        <div className="fixed bottom-20 sm:bottom-24 left-2.5 right-2.5 sm:left-auto sm:right-6 z-50 sm:w-[390px] h-[74vh] max-h-[560px] rounded-[32px] border border-[#E2E4F6] dark:border-white/15 bg-[#FFFDD0]/95 dark:bg-slate-900/80 backdrop-blur-2xl shadow-[0_16px_50px_rgba(29,91,241,0.14)] flex flex-col overflow-hidden animate-fade-in-up">
          
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-[#E2E4F6] dark:border-white/10 bg-[#FFFDD0] dark:bg-slate-900/60 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-2xl bg-gradient-to-r from-[#1D5BF1] to-[#3B42C4] text-[#FFFDD0] flex items-center justify-center font-bold shadow-xs">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-display font-black text-xs sm:text-sm text-[#0F172A] flex items-center gap-1.5">
                  Chat Assistant
                  <Badge variant="outline" className="text-[9px] bg-[#1D5BF1]/10 text-[#1D5BF1] border-[#1D5BF1]/20 font-bold px-1.5 py-0">
                    Smart AI
                  </Badge>
                </h3>
                <p className="text-[10px] text-muted-foreground font-medium">Campus shopping & deals</p>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="h-8 w-8 rounded-2xl bg-[#FAF8E6] dark:bg-card/80 border border-[#E2E4F6] dark:border-border shadow-2xs flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin">
            
            {/* Centered Date Separator */}
            <div className="flex justify-center my-1">
              <div className="rounded-full px-3.5 py-0.5 bg-[#FAF8E6] dark:bg-card/80 border border-[#E2E4F6] dark:border-border/60 text-[11px] font-bold text-muted-foreground shadow-2xs">
                Today
              </div>
            </div>

            {messages.map((m, idx) => {
              const isAi = m.sender === 'ai';
              const msgId = m.id || `msg_${idx}`;
              const isCopied = copiedId === msgId;
              const isLiked = likedMap[msgId];

              return (
                <div key={idx} className={cn('flex items-end gap-2', isAi ? 'justify-start' : 'justify-end')}>
                  
                  {/* AI iridescent gradient orb / avatar */}
                  {isAi && (
                    <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#1D5BF1] via-[#3B42C4] to-[#6366F1] shadow-2xs flex items-center justify-center text-[#FFFDD0] shrink-0 mb-1 ring-2 ring-[#1D5BF1]/30">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div className={cn('flex flex-col gap-1', isAi ? 'items-start' : 'items-end')}>
                    <div
                      className={cn(
                        'px-4 py-2.5 leading-relaxed max-w-[85%]',
                        isAi
                          ? 'bg-[#FAF8E6] dark:bg-card/95 text-[#0F172A] shadow-xs border border-[#E2E4F6] dark:border-border/60 rounded-[22px] rounded-bl-[4px] font-medium'
                          : 'bg-gradient-to-r from-[#1D5BF1] to-[#3B42C4] text-[#FFFDD0] shadow-sm rounded-[22px] rounded-br-[4px] font-medium'
                      )}
                    >
                      <p className="break-words whitespace-pre-wrap">{m.text}</p>
                    </div>

                    {/* Action Toolbar on AI Responses */}
                    {isAi && (
                      <div className="flex items-center gap-1 px-1 text-muted-foreground">
                        <button
                          type="button"
                          onClick={() => handleCopy(m.text, msgId)}
                          className="p-0.5 rounded hover:text-foreground"
                          title="Copy text"
                        >
                          {isCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleLike(msgId)}
                          className={cn('p-0.5 rounded', isLiked ? 'text-[#1D5BF1]' : 'hover:text-foreground')}
                          title="Like message"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSpeak(m.text)}
                          className="p-0.5 rounded hover:text-foreground"
                          title="Speak aloud"
                        >
                          <Volume2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {/* Matched Product Cards Preview */}
                    {m.matchedProducts && m.matchedProducts.length > 0 && (
                      <div className="mt-2 space-y-1.5 w-full">
                        {m.matchedProducts.map((p) => (
                          <Link
                            key={p.id}
                            href={`/products/${p.slug}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2.5 p-2 rounded-2xl border border-[#E2E4F6] dark:border-border/80 bg-[#FAF8E6] dark:bg-card/90 shadow-2xs hover:border-[#1D5BF1]/50 transition-all"
                          >
                            <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-secondary shrink-0">
                              <Image
                                src={p.images[0]}
                                alt={p.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-xs truncate text-foreground">{p.name}</h4>
                              <p className="text-[11px] text-[#1D5BF1] font-bold">
                                ₹{p.discountPrice ?? p.price}
                              </p>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Matched Gigs Preview */}
                    {m.matchedGigs && m.matchedGigs.length > 0 && (
                      <div className="mt-2 space-y-1.5 w-full">
                        {m.matchedGigs.map((g) => (
                          <Link
                            key={g.id}
                            href={`/services/${g.slug}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2.5 p-2 rounded-2xl border border-[#E2E4F6] dark:border-border/80 bg-[#FAF8E6] dark:bg-card/90 shadow-2xs hover:border-[#1D5BF1]/50 transition-all"
                          >
                            <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-secondary shrink-0">
                              <Image
                                src={g.coverImage}
                                alt={g.title}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-xs truncate text-foreground">{g.title}</h4>
                              <p className="text-[11px] text-[#1D5BF1] font-bold">
                                Starts at ₹{g.startingPrice}
                              </p>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Request Suggestion Button */}
                    {m.showRequestSuggestion && (
                      <Button asChild size="sm" className="mt-2 rounded-xl text-xs gap-1.5 btn-gradient-primary">
                        <Link href="/requests" onClick={() => setOpen(false)}>
                          <Tag className="h-3.5 w-3.5" />
                          Post a Request on Campus Board
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-[#FAF8E6] dark:bg-card/80 p-2.5 rounded-2xl w-fit border border-[#E2E4F6] shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 animate-spin text-[#1D5BF1]" />
                <span>Searching campus catalog...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="p-2 border-t border-[#E2E4F6] dark:border-border/60 flex items-center gap-1.5 overflow-x-auto bg-[#FFFDD0] dark:bg-card/50 scrollbar-none">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="rounded-xl border border-[#E2E4F6] dark:border-border bg-[#FAF8E6] dark:bg-card/80 px-2.5 py-1 text-[10px] font-semibold text-[#0F172A] hover:text-[#1D5BF1] hover:border-[#1D5BF1]/40 whitespace-nowrap transition-colors shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Floating Pill Input Dock */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-3 bg-transparent flex items-center gap-2 shrink-0"
          >
            <div className="flex-1 flex items-center h-12 rounded-full bg-[#FAF8E6] dark:bg-card/90 border border-[#E2E4F6] dark:border-border/80 shadow-md px-3 gap-2 backdrop-blur-md">
              <input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent border-0 text-xs font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none px-1"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="h-8 w-8 rounded-xl bg-[#1D5BF1] text-[#FFFDD0] flex items-center justify-center shadow-xs hover:scale-105 active:scale-90 transition-transform shrink-0 disabled:opacity-30"
              >
                <Send className="h-3.5 w-3.5 -translate-y-0.5 translate-x-0.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleSend('Show me top budget student essentials')}
              aria-label="Voice note"
              className="h-12 w-12 rounded-full bg-[#FAF8E6] dark:bg-card/90 border border-[#E2E4F6] dark:border-border/80 shadow-md flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all shrink-0"
            >
              <Mic className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
