'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag, Recycle, Sparkles, Tag,
  Search, ArrowRight, ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const popularChips = [
  { label: '📐 Mini Drafter', query: 'drafter' },
  { label: '⚡ Casio 991EX', query: 'calculator' },
  { label: '🎨 Poster Design', query: 'poster' },
  { label: '💻 Python & IoT', query: 'python' },
  { label: '📚 Semester Notes', query: 'notes' },
];

export function HeroSection() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) {
      router.push('/marketplace');
      return;
    }
    router.push(`/marketplace?search=${encodeURIComponent(search.trim())}`);
  }

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/5 via-background to-background pt-7 pb-12 sm:pt-14 sm:pb-20">
      {/* Background Decorative Ambient Circles */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute -top-24 left-1/4 w-80 h-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -top-12 right-1/4 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl" />
      </div>

      <div className="container-px mx-auto max-w-7xl relative z-10">
        {/* Top Campus Badge */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>SVCET Campus Marketplace & Freelance Hub</span>
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.15] text-balance">
            Buy, Sell & Freelance{' '}
            <span className="bg-gradient-to-r from-primary via-cyan-500 to-indigo-600 bg-clip-text text-transparent">
              on Campus
            </span>
          </h1>

          <p className="mt-3 sm:mt-4 text-xs sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto text-balance font-medium">
            Find used engineering tools, textbooks & semester notes at 60% off, or hire classmate freelancers with zero fees.
          </p>

          {/* Floating Search Bar */}
          <form onSubmit={handleSearch} className="mt-6 sm:mt-8 max-w-xl mx-auto">
            <div className="relative flex items-center rounded-2xl sm:rounded-3xl border border-border/90 bg-card p-1.5 sm:p-2 shadow-md hover:border-primary/40 focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/15 transition-all">
              <Search className="h-5 w-5 text-muted-foreground ml-3 shrink-0 pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search books, mini drafters, notes, coding gigs..."
                className="border-0 bg-transparent text-xs sm:text-sm h-10 sm:h-11 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-3"
              />
              <Button type="submit" size="sm" className="rounded-xl sm:rounded-2xl px-5 h-9 sm:h-10 font-bold text-xs shrink-0 shadow-xs">
                Search
              </Button>
            </div>

            {/* Popular Quick Chips */}
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none justify-start sm:justify-center">
              <span className="text-[11px] text-muted-foreground font-semibold shrink-0 mr-1">Trending:</span>
              {popularChips.map((chip) => (
                <button
                  key={chip.query}
                  type="button"
                  onClick={() => router.push(`/marketplace?search=${encodeURIComponent(chip.query)}`)}
                  className="inline-flex items-center rounded-xl bg-secondary/80 hover:bg-secondary px-2.5 py-1 text-[11px] font-medium text-foreground transition-all hover:scale-105 active:scale-95 shrink-0 border border-border/50"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* 4 Core Visual Hub Cards - Clean, spacious & prominent */}
        <div className="mt-10 sm:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {/* 1. Marketplace */}
          <Link
            href="/marketplace"
            className="group relative flex flex-col justify-between p-4 sm:p-6 rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-background hover:border-primary/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
          >
            <div>
              <div className="flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold mb-3.5 shadow-sm group-hover:scale-105 transition-transform">
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="font-display font-extrabold text-sm sm:text-lg text-foreground group-hover:text-primary transition-colors leading-snug">
                Marketplace
              </h3>
              <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
                Textbooks, drawing kits & study notes
              </p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] sm:text-xs font-bold text-primary">
              <span>Browse Items</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 2. Used & Pre-Owned */}
          <Link
            href="/used"
            className="group relative flex flex-col justify-between p-4 sm:p-6 rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-card to-background hover:border-amber-500/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
          >
            <div>
              <div className="flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-2xl bg-amber-500 text-white font-bold mb-3.5 shadow-sm group-hover:scale-105 transition-transform">
                <Recycle className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="font-display font-extrabold text-sm sm:text-lg text-foreground group-hover:text-amber-600 transition-colors leading-snug">
                Used Gear
              </h3>
              <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
                Drafters, calculators & coats at 70% off
              </p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] sm:text-xs font-bold text-amber-600">
              <span>Save 70%</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 3. Freelance & Gigs */}
          <Link
            href="/services"
            className="group relative flex flex-col justify-between p-4 sm:p-6 rounded-3xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 via-card to-background hover:border-indigo-500/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
          >
            <div>
              <div className="flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-2xl bg-indigo-600 text-white font-bold mb-3.5 shadow-sm group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="font-display font-extrabold text-sm sm:text-lg text-foreground group-hover:text-indigo-600 transition-colors leading-snug">
                Freelancers
              </h3>
              <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
                Posters, coding apps, video cuts & CAD
              </p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] sm:text-xs font-bold text-indigo-600">
              <span>Hire Talent</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 4. Need / Request Board */}
          <Link
            href="/requests"
            className="group relative flex flex-col justify-between p-4 sm:p-6 rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-card to-background hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
          >
            <div>
              <div className="flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold mb-3.5 shadow-sm group-hover:scale-105 transition-transform">
                <Tag className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="font-display font-extrabold text-sm sm:text-lg text-foreground group-hover:text-emerald-600 transition-colors leading-snug">
                Request Board
              </h3>
              <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
                Ask peers for specific items or make offers
              </p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] sm:text-xs font-bold text-emerald-600">
              <span>Post Request</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
