'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles, Search, SlidersHorizontal, Plus,
  Palette, Code, Video, Box, BookOpen, FileText, Music, Wrench,
  ArrowRight, CheckCircle2, ShieldCheck, Zap,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { GigCard } from '@/components/gig-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getAllGigs, GIG_CATEGORIES } from '@/lib/firebase-queries';
import type { ServiceGig } from '@/lib/types';

export default function ServicesPage() {
  const [gigs, setGigs] = useState<ServiceGig[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    getAllGigs()
      .then((data) => {
        setGigs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
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
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 via-background to-background py-14 sm:py-20">
          <div className="container-px mx-auto max-w-7xl relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                <span>SVCET Student Freelancers & Creator Hub</span>
              </div>
              <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                Hire Talented Classmates for Your Next Project
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                Connect with student designers, coders, video editors, 3D printing makers, and subject tutors. Fast turnarounds, student-friendly pricing, and trusted campus delivery.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" className="rounded-xl shadow-md" asChild>
                  <Link href="/services/bounties">
                    <Zap className="h-4 w-4 mr-2" />
                    Browse Campus Bounties
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-xl" asChild>
                  <Link href="/seller/dashboard/services">
                    <Plus className="h-4 w-4 mr-2" />
                    Offer Your Skills
                  </Link>
                </Button>
              </div>
            </div>

            {/* Quick Benefits */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-border/60">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold">Verified College Students</h4>
                  <p className="text-[11px] text-muted-foreground">Colleagues verified via @svcet.ac.in</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold">Same-Day / 24h Turnaround</h4>
                  <p className="text-[11px] text-muted-foreground">Fast turnaround for urgent deadlines</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold">Pocket-Friendly Pricing</h4>
                  <p className="text-[11px] text-muted-foreground">Affordable rates tailored for students</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Browser & Filters */}
        <section className="container-px mx-auto max-w-7xl py-10">
          <div className="flex flex-col gap-6">
            {/* Search and Category Pills */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by skill, poster design, React, 3D printing..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-card"
                />
              </div>

              <div className="text-xs text-muted-foreground self-start md:self-center">
                Showing <strong className="text-foreground">{filtered.length}</strong> available gigs
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl text-xs font-medium shrink-0 transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
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
                    className={`px-4 py-2 rounded-xl text-xs font-medium shrink-0 transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Gigs Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-8">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-72 animate-pulse rounded-2xl bg-secondary/50" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center bg-card/50">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold">No freelance gigs found</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-md">
                  {search || selectedCategory !== 'all'
                    ? 'Try searching with different keywords or switch categories.'
                    : 'Be the first student to offer freelance services on campus!'}
                </p>
                <div className="mt-6 flex gap-3">
                  <Button asChild>
                    <Link href="/seller/dashboard/services">
                      <Plus className="h-4 w-4 mr-2" />
                      Create a Gig
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/services/bounties">
                      Post a Request
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filtered.map((gig) => (
                  <GigCard key={gig.id} gig={gig} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
