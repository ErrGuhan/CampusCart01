'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Search, Plus, Palette, Code, Video, Box,
  ArrowRight, CheckCircle2, ShieldCheck, Zap, X,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { GigCard } from '@/components/gig-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth-provider';
import { AuthPromptDialog } from '@/components/auth-prompt-dialog';
import { getAllGigs, GIG_CATEGORIES } from '@/lib/firebase-queries';
import type { ServiceGig } from '@/lib/types';

export default function ServicesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [gigs, setGigs] = useState<ServiceGig[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  const refreshGigs = () => {
    getAllGigs()
      .then((data) => {
        setGigs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    refreshGigs();

    if (typeof window !== 'undefined') {
      window.addEventListener('campuscart_gig_updated', refreshGigs);
      window.addEventListener('storage', refreshGigs);
      window.addEventListener('focus', refreshGigs);

      return () => {
        window.removeEventListener('campuscart_gig_updated', refreshGigs);
        window.removeEventListener('storage', refreshGigs);
        window.removeEventListener('focus', refreshGigs);
      };
    }
  }, []);

  const filtered = gigs.filter((gig) => {
    const matchesSearch =
      gig.title.toLowerCase().includes(search.toLowerCase()) ||
      gig.description.toLowerCase().includes(search.toLowerCase()) ||
      gig.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' ||
      gig.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') ===
        selectedCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/70 bg-gradient-to-b from-indigo-500/10 via-background to-background py-8 sm:py-14">
          <div className="container-px mx-auto max-w-7xl relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3 py-0.5 text-xs font-bold text-indigo-600 mb-3">
                <Sparkles className="h-3.5 w-3.5" />
                <span>SVCET Student Freelance & Creator Hub</span>
              </div>
              <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                Hire Talented Classmates for Your Next Project
              </h1>
              <p className="mt-2.5 text-xs sm:text-base text-muted-foreground leading-relaxed">
                Connect with student designers, coders, video editors, 3D printing makers, and subject tutors. Fast turnarounds, student-friendly pricing, and trusted campus delivery.
              </p>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Button size="sm" className="rounded-xl h-10 px-4 font-bold text-xs shadow-xs" asChild>
                  <Link href="/services/bounties">
                    <Zap className="h-4 w-4 mr-1.5" />
                    Campus Bounties
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl h-10 px-4 text-xs font-semibold"
                  onClick={() => {
                    if (!user) {
                      setAuthPromptOpen(true);
                      return;
                    }
                    router.push('/seller/dashboard/services');
                  }}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Offer Your Skills
                </Button>
              </div>
            </div>

            {/* Quick Benefits */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Verified Students</h4>
                  <p className="text-[10px] text-muted-foreground">Classmates verified via @svcet.ac.in</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">24h Turnaround</h4>
                  <p className="text-[10px] text-muted-foreground">Fast turnaround for urgent deadlines</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Pocket-Friendly Pricing</h4>
                  <p className="text-[10px] text-muted-foreground">Affordable rates tailored for students</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Browser & Filters */}
        <section className="container-px mx-auto max-w-7xl py-8">
          <div className="flex flex-col gap-4">
            {/* Search and Category Pills */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by skill, poster design, React, 3D printing..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-8 h-10 rounded-xl bg-card text-xs border-border/80"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="text-xs text-muted-foreground self-start sm:self-center font-medium">
                Showing <strong className="text-foreground">{filtered.length}</strong> freelance gigs
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all select-none ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                All Freelance Services
              </button>
              {GIG_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all select-none ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Gigs Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-64 animate-pulse rounded-2xl bg-secondary/50" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-16 text-center bg-card/40 my-6">
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-3">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold">No freelance gigs found</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-md">
                  {search || selectedCategory !== 'all'
                    ? 'Try searching with different keywords or switch categories.'
                    : 'Be the first student to offer freelance services on campus!'}
                </p>
                <div className="mt-5 flex gap-2">
                  <Button
                    size="sm"
                    className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => {
                      if (!user) {
                        setAuthPromptOpen(true);
                        return;
                      }
                      router.push('/seller/dashboard/services');
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create a Gig
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 pt-2">
                {filtered.map((gig) => (
                  <GigCard key={gig.id} gig={gig} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Auth Prompt Dialog */}
        <AuthPromptDialog
          isOpen={authPromptOpen}
          onClose={() => setAuthPromptOpen(false)}
          title="Sign In to Offer Skills"
          description="Sign in with your campus student account to list freelance services, set your prices, and earn on campus."
          actionName="Offer Skills"
          redirectTo="/seller/dashboard/services"
        />
      </main>
      <Footer />
    </>
  );
}
