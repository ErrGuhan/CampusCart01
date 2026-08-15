'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Flame, Zap, Percent, ArrowRight, Search, Sparkles,
  ShoppingBag, Check, X,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getAllProducts } from '@/lib/firebase-queries';
import type { Product } from '@/lib/types';

export default function StudentDealsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dealBracket, setDealBracket] = useState<'all' | 'under99' | 'under199' | 'under499' | 'discounts'>('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const all = await getAllProducts();
        setProducts(all);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();

    if (typeof window !== 'undefined') {
      window.addEventListener('campuscart_product_updated', load);
      return () => window.removeEventListener('campuscart_product_updated', load);
    }
  }, []);

  const dealProducts = useMemo(() => {
    return products.filter((p) => {
      const activePrice = p.discountPrice ?? p.price;
      const hasDiscount = p.discountPrice !== undefined && p.discountPrice < p.price;

      let matchesBracket = true;
      if (dealBracket === 'under99') {
        matchesBracket = activePrice <= 99;
      } else if (dealBracket === 'under199') {
        matchesBracket = activePrice <= 199;
      } else if (dealBracket === 'under499') {
        matchesBracket = activePrice <= 499;
      } else if (dealBracket === 'discounts') {
        matchesBracket = hasDiscount;
      } else {
        matchesBracket = hasDiscount || activePrice <= 499;
      }

      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());

      return matchesBracket && matchesSearch;
    });
  }, [products, dealBracket, search]);

  const under99Count = useMemo(() => products.filter((p) => (p.discountPrice ?? p.price) <= 99).length, [products]);
  const under199Count = useMemo(() => products.filter((p) => (p.discountPrice ?? p.price) <= 199).length, [products]);
  const under499Count = useMemo(() => products.filter((p) => (p.discountPrice ?? p.price) <= 499).length, [products]);
  const discountCount = useMemo(() => products.filter((p) => p.discountPrice !== undefined && p.discountPrice < p.price).length, [products]);

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-6 sm:py-10 min-h-screen">
        {/* Header */}
        <div className="rounded-3xl border border-rose-500/25 bg-gradient-to-br from-rose-500/10 via-card to-orange-500/5 p-5 sm:p-8 mb-8 shadow-xs">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/15 px-3 py-0.5 text-xs font-bold text-rose-600 mb-2.5">
              <Flame className="h-3.5 w-3.5" />
              <span>Campus Student Deals</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Pocket-Friendly Student Bargains
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Snag study resources, stationery, handmade accessories, and electronics at student-discounted rates.
            </p>
          </div>
        </div>

        {/* Quick Deal Brackets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
          <button
            type="button"
            onClick={() => setDealBracket('under99')}
            className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all active:scale-95 ${
              dealBracket === 'under99'
                ? 'border-rose-500 bg-rose-500/10 shadow-xs'
                : 'border-border/80 bg-card hover:bg-secondary/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground">Budget Pick</span>
              <Zap className="h-3.5 w-3.5 text-rose-500" />
            </div>
            <div className="mt-1.5 text-lg sm:text-xl font-extrabold text-foreground">Under ₹99</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{under99Count} items</p>
          </button>

          <button
            type="button"
            onClick={() => setDealBracket('under199')}
            className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all active:scale-95 ${
              dealBracket === 'under199'
                ? 'border-orange-500 bg-orange-500/10 shadow-xs'
                : 'border-border/80 bg-card hover:bg-secondary/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground">Sweet Spot</span>
              <Flame className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <div className="mt-1.5 text-lg sm:text-xl font-extrabold text-foreground">Under ₹199</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{under199Count} items</p>
          </button>

          <button
            type="button"
            onClick={() => setDealBracket('under499')}
            className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all active:scale-95 ${
              dealBracket === 'under499'
                ? 'border-primary bg-primary/10 shadow-xs'
                : 'border-border/80 bg-card hover:bg-secondary/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground">Mid Tier</span>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="mt-1.5 text-lg sm:text-xl font-extrabold text-foreground">Under ₹499</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{under499Count} items</p>
          </button>

          <button
            type="button"
            onClick={() => setDealBracket('discounts')}
            className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all active:scale-95 ${
              dealBracket === 'discounts'
                ? 'border-emerald-500 bg-emerald-500/10 shadow-xs'
                : 'border-border/80 bg-card hover:bg-secondary/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground">Special Drops</span>
              <Percent className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="mt-1.5 text-lg sm:text-xl font-extrabold text-foreground">Discounted</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{discountCount} on sale</p>
          </button>
        </div>

        {/* Search & Reset */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search deals by name or category..."
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

          <Button
            variant={dealBracket === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setDealBracket('all');
              setSearch('');
            }}
            className="rounded-xl text-xs w-full sm:w-auto h-9 font-semibold"
          >
            View All ({products.length})
          </Button>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-secondary/50" />
            ))}
          </div>
        ) : dealProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-14 text-center bg-card/40 my-6">
            <Flame className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-display text-base font-bold">No deals in this price bracket</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Check out all marketplace items or post a product request with your budget.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Button asChild size="sm" className="rounded-xl text-xs font-bold">
                <Link href="/marketplace">Explore Marketplace</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {dealProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
