'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Sparkles, MessageSquare, X, Send, Bot,
  ShoppingBag, ArrowRight, CornerDownLeft, ExternalLink,
  Tag, HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getAllProducts, getAllGigs } from '@/lib/firebase-queries';
import type { Product, ServiceGig } from '@/lib/types';

type AIMessage = {
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
      sender: 'ai',
      text: 'Hi! I am your CampusCart AI shopping assistant 🎓. Ask me to find textbooks, electronics, CAD designs, or project kits under your budget!',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allGigs, setAllGigs] = useState<ServiceGig[]>([]);
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

    const userMsg: AIMessage = { sender: 'user', text: queryText.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const q = queryText.toLowerCase();

    // Extract price constraint if any (e.g. "under 500", "< 300")
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

  if (pathname?.startsWith('/messages')) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button (FAB) - Gradient Styled with 48px+ Touch Target */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Open AI shopping assistant"
        className="fixed bottom-20 md:bottom-6 right-3.5 sm:right-6 z-50 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-primary to-cyan-500 text-white shadow-xl hover:shadow-cyan-500/30 hover:scale-105 active:scale-90 transition-all duration-200 ring-4 ring-primary/20"
      >
        {open ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse" />}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-20 sm:bottom-24 left-2.5 right-2.5 sm:left-auto sm:right-6 z-50 sm:w-[380px] h-[72vh] max-h-[520px] rounded-3xl border border-border bg-background/95 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="p-3.5 border-b border-border bg-gradient-to-r from-primary/10 to-indigo-500/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                  CampusCart AI
                  <Badge variant="outline" className="text-[9px] bg-background">
                    Smart Assistant
                  </Badge>
                </h3>
                <p className="text-[10px] text-muted-foreground">Find products & services fast</p>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
            {messages.map((m, idx) => {
              const isAi = m.sender === 'ai';
              return (
                <div key={idx} className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl p-3 leading-relaxed ${
                      isAi
                        ? 'bg-secondary text-foreground rounded-bl-none'
                        : 'bg-primary text-primary-foreground rounded-br-none font-medium'
                    }`}
                  >
                    {m.text}
                  </div>

                  {/* Matched Product Cards Preview */}
                  {m.matchedProducts && m.matchedProducts.length > 0 && (
                    <div className="mt-2 space-y-1.5 w-full">
                      {m.matchedProducts.map((p) => (
                        <Link
                          key={p.id}
                          href={`/products/${p.slug}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors"
                        >
                          <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-secondary shrink-0">
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
                            <p className="text-[11px] text-primary font-bold">
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
                          className="flex items-center gap-2.5 p-2 rounded-xl border border-border/80 bg-card hover:border-indigo-500/40 transition-colors"
                        >
                          <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-secondary shrink-0">
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
                            <p className="text-[11px] text-indigo-600 font-bold">
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
                    <Button asChild size="sm" className="mt-2 rounded-xl text-xs gap-1.5">
                      <Link href="/requests" onClick={() => setOpen(false)}>
                        <Tag className="h-3.5 w-3.5" />
                        Post a Request on Campus Board
                      </Link>
                    </Button>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 p-2.5 rounded-xl w-fit">
                <Sparkles className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>Searching campus catalog...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="p-2 border-t border-border/60 flex items-center gap-1.5 overflow-x-auto bg-card/40 scrollbar-none">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="rounded-lg border border-border bg-background px-2.5 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 whitespace-nowrap transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-2.5 border-t border-border bg-card/60 flex items-center gap-2"
          >
            <Input
              placeholder="e.g. Need textbook under ₹300..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="rounded-xl text-xs h-9"
            />
            <Button type="submit" size="icon" className="rounded-xl h-9 w-9 shrink-0">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
