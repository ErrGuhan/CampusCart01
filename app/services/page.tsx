'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Search, Plus, Palette, Code, Video, Box,
  ArrowRight, CheckCircle2, ShieldCheck, Zap, X,
  Clock, IndianRupee, Rocket, User, AlertCircle, Check, Loader2,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { GigCard } from '@/components/gig-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { AuthPromptDialog } from '@/components/auth-prompt-dialog';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAllGigs } from '@/lib/firebase-queries';
import { getBounties, claimBounty } from '@/lib/collaboration-hub';
import type { ServiceGig, CampusBounty } from '@/lib/types';
import { cn } from '@/lib/utils';

// Outcome-based classification
const OUTCOMES = [
  { id: 'all', label: 'All Services', icon: Sparkles },
  { id: 'startup', label: '🚀 Launch a Startup', icon: Rocket, categories: ['Coding & Tech Projects', '3D Printing & CAD', 'Design & Posters'] },
  { id: 'creative', label: '🎨 Creative & Media', icon: Palette, categories: ['Design & Posters', 'Video & Photography', 'Music & Events'] },
  { id: 'dev', label: '⚡ Dev & Prototyping', icon: Code, categories: ['Coding & Tech Projects', '3D Printing & CAD'] },
  { id: 'academics', label: '📚 Tutoring & Reports', icon: Box, categories: ['Tutoring & Academics', 'Writing & Resumes'] },
];

export default function ServicesPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [gigs, setGigs] = useState<ServiceGig[]>([]);
  const [bounties, setBounties] = useState<CampusBounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState('all');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  // Debounce search input (150ms) for high typing responsiveness
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 150);
    return () => clearTimeout(timer);
  }, [search]);

  const refreshData = useCallback(() => {
    Promise.all([getAllGigs(), getBounties('ALL')])
      .then(([gigsData, bountiesData]) => {
        setGigs(gigsData);
        setBounties(bountiesData);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Services fetch notice:', err);
        setLoading(false);
      });
  }, []);

  // Real-time listener for gigs & bounties
  useEffect(() => {
    refreshData();

    let unsubscribeGigs = () => {};
    let unsubscribeBounties = () => {};

    try {
      unsubscribeGigs = onSnapshot(collection(db, 'gigs'), () => {
        refreshData();
      }, (e) => console.warn('Firestore gigs snapshot notice:', e));

      unsubscribeBounties = onSnapshot(collection(db, 'collaboration_bounties'), () => {
        refreshData();
      }, (e) => console.warn('Firestore bounties snapshot notice:', e));
    } catch {}

    if (typeof window !== 'undefined') {
      window.addEventListener('campuscart_gig_updated', refreshData);
      window.addEventListener('campuscart_bounty_updated', refreshData);
      window.addEventListener('storage', refreshData);
      window.addEventListener('focus', refreshData);

      return () => {
        unsubscribeGigs();
        unsubscribeBounties();
        window.removeEventListener('campuscart_gig_updated', refreshData);
        window.removeEventListener('campuscart_bounty_updated', refreshData);
        window.removeEventListener('storage', refreshData);
        window.removeEventListener('focus', refreshData);
      };
    }

    return () => {
      unsubscribeGigs();
      unsubscribeBounties();
    };
  }, [refreshData]);

  // Filter gigs by outcome & search
  const filteredGigs = useMemo(() => {
    const activeOutcome = OUTCOMES.find((o) => o.id === selectedOutcome);
    return gigs.filter((gig) => {
      const q = debouncedSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        gig.title.toLowerCase().includes(q) ||
        gig.description.toLowerCase().includes(q) ||
        gig.tags.some((t) => t.toLowerCase().includes(q));

      const matchesOutcome =
        selectedOutcome === 'all' ||
        (activeOutcome?.categories && activeOutcome.categories.includes(gig.category));

      return matchesSearch && matchesOutcome;
    });
  }, [gigs, debouncedSearch, selectedOutcome]);

  // Handle live claiming of a bounty
  async function handleClaimBounty(bounty: CampusBounty) {
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }

    setClaimingId(bounty.id);
    try {
      await claimBounty(
        bounty.id,
        user.uid || 'user_demo',
        profile?.display_name || 'Student Builder',
        profile?.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
      );
      toast({
        title: 'Bounty Claimed! 🎯',
        description: `You are now assigned to "${bounty.title}". Complete the task to earn ₹${bounty.rewardAmount}.`,
      });
      refreshData();
    } catch (err: any) {
      toast({
        title: 'Claim Failed',
        description: err.message || 'Could not claim bounty.',
        variant: 'destructive',
      });
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pb-28 sm:pb-32 bg-radial-wash">
        {/* Header Section */}
        <section className="relative overflow-hidden border-b border-border/70 bg-gradient-to-b from-indigo-500/10 via-background to-background py-8 sm:py-14">
          <div className="container-px mx-auto max-w-7xl relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3.5 py-1 text-xs font-bold text-indigo-600 mb-3 shadow-2xs">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Student Builders & Freelance Hub</span>
              </div>
              <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-foreground">
                Hire Your Classmates. Build Your Vision.
              </h1>
              <p className="mt-2.5 text-xs sm:text-base text-muted-foreground leading-relaxed font-medium">
                Collaborate with top campus talent to build MVPs, craft symposium designs, slice 3D models, or solve project blockers with zero platform fees.
              </p>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button size="default" className="btn-gradient-primary rounded-2xl h-11 px-5 font-bold text-xs sm:text-sm shadow-md touch-target min-h-[44px]" asChild>
                  <Link href="/services/bounties">
                    <Zap className="h-4 w-4 mr-2" />
                    Campus Bounties (Micro-Gigs)
                  </Link>
                </Button>
                <Button
                  size="default"
                  variant="outline"
                  className="rounded-2xl h-11 px-5 text-xs sm:text-sm font-bold border-border/80 shadow-2xs touch-target min-h-[44px]"
                  onClick={() => {
                    if (!user) {
                      setAuthPromptOpen(true);
                      return;
                    }
                    router.push('/seller/dashboard/services');
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Offer Your Skills
                </Button>
              </div>
            </div>

            {/* Quick Trust Highlights */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-border/60">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60 shadow-2xs">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Verified Students</h4>
                  <p className="text-[11px] text-muted-foreground font-medium">Peer-reviewed campus builders</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60 shadow-2xs">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Quick Turnaround</h4>
                  <p className="text-[11px] text-muted-foreground font-medium">Fast delivery for tight deadlines</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60 shadow-2xs">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Zero Platform Cut</h4>
                  <p className="text-[11px] text-muted-foreground font-medium">100% earnings go to student makers</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Live Campus Bounties (Micro-gigs) */}
        <section className="container-px mx-auto max-w-7xl py-8 sm:py-12 border-b border-border/60">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 mb-1">
                <Zap className="h-4 w-4 fill-amber-500" />
                <span>Micro-Gigs & Instant Help</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                Active Campus Bounties
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground font-medium">
                Claim urgent tasks posted by students, solve their problem, and earn cash.
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="rounded-xl text-xs touch-target min-h-[44px] sm:min-h-auto">
              <Link href="/services/bounties">View All Bounties</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bounties.slice(0, 3).map((bounty) => {
              const isClaimed = bounty.status === 'CLAIMED';
              const isCompleted = bounty.status === 'COMPLETED';
              const isMine = Boolean(user && bounty.creatorId === user.uid);

              return (
                <div
                  key={bounty.id}
                  className="flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-border/90 bg-card shadow-xs hover:border-amber-500/40 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                        {bounty.category || 'Micro-Gig'}
                      </span>
                      <Badge
                        variant={isCompleted ? 'secondary' : isClaimed ? 'outline' : 'default'}
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5',
                          bounty.status === 'OPEN' && 'bg-emerald-500 text-white',
                          isClaimed && 'border-amber-500 text-amber-600 bg-amber-500/10',
                          isCompleted && 'bg-secondary text-muted-foreground'
                        )}
                      >
                        {bounty.status}
                      </Badge>
                    </div>

                    <h3 className="font-display font-bold text-sm text-foreground line-clamp-2 leading-snug">
                      {bounty.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                      {bounty.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-semibold leading-none">Reward</span>
                      <span className="text-sm sm:text-base font-black text-foreground">
                        ₹{bounty.rewardAmount}
                      </span>
                    </div>

                    {bounty.status === 'OPEN' ? (
                      <Button
                        size="sm"
                        disabled={claimingId === bounty.id || isMine}
                        onClick={() => handleClaimBounty(bounty)}
                        className="btn-gradient-primary rounded-xl text-xs font-bold shadow-xs min-h-[38px] px-3.5"
                      >
                        {claimingId === bounty.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isMine ? (
                          'Your Bounty'
                        ) : (
                          'Claim Bounty'
                        )}
                      </Button>
                    ) : isClaimed ? (
                      <span className="text-[11px] font-semibold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-xl">
                        In Progress ({bounty.solverName || 'Assigned'})
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                        ✓ Completed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section: Outcome-Based Freelance Directory */}
        <section className="container-px mx-auto max-w-7xl py-8 sm:py-12">
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                Browse by Desired Outcome
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground font-medium">
                Find the right skill sets tailored to your specific venture or coursework.
              </p>
            </div>

            {/* Outcome Filter Pills - 44px touch targets */}
            <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
              {OUTCOMES.map((outcome) => {
                const active = selectedOutcome === outcome.id;
                return (
                  <button
                    key={outcome.id}
                    onClick={() => setSelectedOutcome(outcome.id)}
                    className={cn(
                      'px-4 py-2.5 min-h-[44px] rounded-2xl text-xs font-bold whitespace-nowrap transition-all select-none shadow-2xs border',
                      active
                        ? 'bg-gradient-to-r from-primary to-cyan-500 text-white border-transparent shadow-xs'
                        : 'bg-card border-border/80 text-foreground/80 hover:text-foreground'
                    )}
                  >
                    {outcome.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-8 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by skill (e.g. Next.js, SolidWorks, After Effects, Arduino)..."
              className="pl-10 pr-8 h-11 rounded-2xl bg-card text-xs border-border/80 shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Services Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-72 rounded-3xl bg-secondary/50 animate-pulse" />
              ))}
            </div>
          ) : filteredGigs.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title={search || selectedOutcome !== 'all' ? 'No freelance gigs match your filter' : 'Welcome to the Freelance Hub!'}
              description={
                search || selectedOutcome !== 'all'
                  ? 'Try adjusting your search query or reset outcome filters to view more student services.'
                  : 'The freelance board is clean. Offer your design, coding, tutoring, or CAD skills to earn on campus!'
              }
              actionLabel="+ Offer a Service / Gig"
              actionHref="/seller/dashboard/services"
              secondaryActionLabel={search || selectedOutcome !== 'all' ? 'Reset Filters' : 'Post a Bounty'}
              onSecondaryAction={
                search || selectedOutcome !== 'all'
                  ? () => {
                      setSelectedOutcome('all');
                      setSearch('');
                    }
                  : undefined
              }
              secondaryActionHref={!search && selectedOutcome === 'all' ? '/services/bounties' : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredGigs.map((gig) => (
                <GigCard key={gig.id} gig={gig} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />

      <AuthPromptDialog
        isOpen={authPromptOpen}
        onClose={() => setAuthPromptOpen(false)}
        actionName="Claim Bounties & Offer Services"
      />
    </>
  );
}
