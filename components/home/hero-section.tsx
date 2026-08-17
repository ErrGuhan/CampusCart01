'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag, Sparkles, Search, Store,
  Lightbulb,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';

export function HeroSection() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [search, setSearch] = useState('');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) {
      router.push('/marketplace');
      return;
    }
    router.push(`/marketplace?search=${encodeURIComponent(search.trim())}`);
  }

  const firstName = profile?.display_name
    ? profile.display_name.split(' ')[0]
    : user?.email?.split('@')[0] || 'Student';

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background pt-5 pb-7 sm:pt-10 sm:pb-12 border-b border-border/60">
      <div className="container-px mx-auto max-w-7xl relative z-10">
        
        {/* Top Greeting Badge */}
        <div className="flex justify-center mb-3.5 sm:mb-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs sm:text-sm font-bold text-primary shadow-2xs">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            {user ? (
              <span>Welcome back, {firstName}! 🎓</span>
            ) : (
              <span>SVCET Campus Marketplace & Student Hub</span>
            )}
          </div>
        </div>

        {/* Hero Headline */}
        <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-3">
          <h1 className="font-display text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.15]">
            {user ? (
              <span>What are you looking for today?</span>
            ) : (
              <span>Buy, Sell & Trade on Campus</span>
            )}
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
            {user ? (
              <span>Discover textbooks, project kits, peer freelance gigs, or post a campus bounty.</span>
            ) : (
              <span>Student textbooks, electronics, project components & freelance gigs with zero fees.</span>
            )}
          </p>
        </div>

        {/* Clean, Large Floating Search Bar */}
        <form onSubmit={handleSearch} className="mt-5 sm:mt-8 max-w-xl mx-auto">
          <div className="relative flex items-center h-14 sm:h-16 rounded-2xl sm:rounded-3xl border-2 border-border/80 bg-card p-1.5 shadow-sm hover:border-primary/40 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
            <Search className="h-5 w-5 text-muted-foreground ml-3.5 sm:ml-4 shrink-0 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search books, drafters, kits, freelance gigs..."
              className="border-0 bg-transparent text-sm sm:text-base h-full shadow-none focus-visible:ring-0 px-3.5 placeholder:text-muted-foreground/70"
            />
            <Button
              type="submit"
              size="default"
              className="btn-gradient-primary rounded-xl sm:rounded-2xl px-6 sm:px-8 h-full font-extrabold text-sm sm:text-base shrink-0 shadow-xs active:scale-95 transition-transform"
            >
              Search
            </Button>
          </div>
        </form>

        {/* 4 Clean Large Quick-Action Hub Cards - Responsive Layout without truncation */}
        <div className="mt-6 sm:mt-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 max-w-4xl mx-auto">
          <Link
            href="/marketplace"
            className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3.5 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-border/70 bg-card hover:bg-secondary/60 hover:border-sky-500/40 transition-all active:scale-95 shadow-2xs group"
          >
            <div className="flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
              <ShoppingBag className="h-5.5 w-5.5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 w-full">
              <span className="font-extrabold text-sm sm:text-base text-foreground block group-hover:text-sky-600 transition-colors leading-tight">Marketplace</span>
              <span className="text-xs text-muted-foreground font-medium block mt-0.5">Kits & Books</span>
            </div>
          </Link>

          <Link
            href="/services"
            className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3.5 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-border/70 bg-card hover:bg-secondary/60 hover:border-indigo-500/40 transition-all active:scale-95 shadow-2xs group"
          >
            <div className="flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5.5 w-5.5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 w-full">
              <span className="font-extrabold text-sm sm:text-base text-foreground block group-hover:text-indigo-600 transition-colors leading-tight">Freelance</span>
              <span className="text-xs text-muted-foreground font-medium block mt-0.5">Design & Code</span>
            </div>
          </Link>

          <Link
            href="/requests"
            className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3.5 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-border/70 bg-card hover:bg-secondary/60 hover:border-amber-500/40 transition-all active:scale-95 shadow-2xs group"
          >
            <div className="flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
              <Lightbulb className="h-5.5 w-5.5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 w-full">
              <span className="font-extrabold text-sm sm:text-base text-foreground block group-hover:text-amber-600 transition-colors leading-tight">Requests</span>
              <span className="text-xs text-muted-foreground font-medium block mt-0.5">Bounty Board</span>
            </div>
          </Link>

          <Link
            href={user ? '/seller/dashboard' : '/studio'}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3.5 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-border/70 bg-card hover:bg-secondary/60 hover:border-emerald-500/40 transition-all active:scale-95 shadow-2xs group"
          >
            <div className="flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
              <Store className="h-5.5 w-5.5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 w-full">
              <span className="font-extrabold text-sm sm:text-base text-foreground block group-hover:text-emerald-600 transition-colors leading-tight">Seller Studio</span>
              <span className="text-xs text-muted-foreground font-medium block mt-0.5">Sell & Earn</span>
            </div>
          </Link>
        </div>

      </div>
    </section>
  );
}
