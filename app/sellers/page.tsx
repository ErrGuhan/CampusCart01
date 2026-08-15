'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Star, ArrowRight, Store, Search, Sparkles,
  GraduationCap, Building2, UserPlus, CheckCircle2,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getAllSellers } from '@/lib/firebase-queries';
import type { Seller } from '@/lib/types';

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [loaded, setLoaded] = useState(false);

  const loadCreators = useCallback(() => {
    getAllSellers().then((data) => {
      setSellers(data);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    loadCreators();

    if (typeof window !== 'undefined') {
      window.addEventListener('campuscart_seller_updated', loadCreators);
      window.addEventListener('storage', loadCreators);
      window.addEventListener('focus', loadCreators);

      return () => {
        window.removeEventListener('campuscart_seller_updated', loadCreators);
        window.removeEventListener('storage', loadCreators);
        window.removeEventListener('focus', loadCreators);
      };
    }
  }, [loadCreators]);

  // Extract all unique departments present among real sellers
  const departments = useMemo(() => {
    const set = new Set<string>();
    sellers.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set);
  }, [sellers]);

  const filtered = useMemo(() => {
    return sellers.filter((seller) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        seller.displayName.toLowerCase().includes(q) ||
        seller.username.toLowerCase().includes(q) ||
        seller.bio.toLowerCase().includes(q) ||
        seller.skills.some((sk) => sk.toLowerCase().includes(q));

      const matchesDept =
        selectedDept === 'all' ||
        seller.department.toLowerCase().includes(selectedDept.toLowerCase());

      return matchesSearch && matchesDept;
    });
  }, [sellers, search, selectedDept]);

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 text-primary text-sm font-semibold">
              <Sparkles className="h-4 w-4" />
              <span>Campus Entrepreneur Directory</span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Student Creators</h1>
            <p className="mt-1.5 text-muted-foreground max-w-2xl">
              Discover student founders, designers, coders, and makers building products and freelance services across campus.
            </p>
          </div>

          <Button asChild className="rounded-xl shadow-sm">
            <Link href="/register">
              <UserPlus className="h-4 w-4 mr-2" />
              Become a Creator
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search creators by name, skills (e.g. Next.js, IoT), or specialty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <Button
              variant={selectedDept === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDept('all')}
              className="rounded-xl text-xs whitespace-nowrap h-8 font-semibold"
            >
              All Creators ({sellers.length})
            </Button>
            {departments.map((dept) => (
              <Button
                key={dept}
                variant={selectedDept === dept ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDept(dept)}
                className="rounded-xl text-xs whitespace-nowrap h-8"
              >
                {dept.split('(')[0].trim()}
              </Button>
            ))}
          </div>
        </div>

        {/* Creators Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center my-6">
            <Store className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-display text-lg font-bold">No student creators found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              No sellers match your current search or filter criteria.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setSelectedDept('all');
              }}
              className="mt-4 rounded-xl"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((seller) => (
              <Link
                key={seller.id}
                href={`/seller/${seller.username}`}
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 ring-2 ring-border group-hover:ring-primary/40 transition-all">
                    <AvatarImage src={seller.avatar} alt={seller.displayName} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                      {seller.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {seller.displayName}
                      </h2>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                        Verified
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {seller.department} {seller.year ? `• ${seller.year}` : ''}
                    </p>

                    <div className="mt-2 flex items-center gap-3">
                      {seller.rating > 0 ? (
                        <div className="flex items-center gap-1 text-xs font-semibold">
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          <span>{seller.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium">New Creator</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {seller.productCount} {seller.productCount === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                  {seller.bio}
                </p>

                {seller.skills && seller.skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {seller.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-all">
                  <span>Visit Creator Store</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Join CTA */}
        <div className="mt-16 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-background p-8 sm:p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-sm">
            <Store className="h-7 w-7" />
          </div>
          <h2 className="font-display text-2xl font-bold">Start Your Campus Business Today</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Join CampusCart with your college email. List handmade goods, project kits, notes, or freelance services with zero listing fees.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button className="rounded-xl" asChild>
              <Link href="/register">Create Creator Account</Link>
            </Button>
            <Button variant="outline" className="rounded-xl" asChild>
              <Link href="/how-it-works">Learn How It Works</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
