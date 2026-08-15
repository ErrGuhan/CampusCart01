'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Recycle, Search, Plus, Sparkles,
  CheckCircle2, ArrowRight, Tag, X,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getAllProducts } from '@/lib/firebase-queries';
import type { Product } from '@/lib/types';

export default function UsedMarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const conditions = [
    { value: 'all', label: 'All Pre-Owned' },
    { value: 'like_new', label: '✨ Like New' },
    { value: 'excellent', label: '🌟 Excellent' },
    { value: 'good', label: '👍 Good Condition' },
    { value: 'fair', label: '📦 Fair / Budget' },
  ];

  const categories = [
    'All',
    'Books',
    'Electronics',
    'College Supplies',
    'Academic Materials',
    'Hostel Items',
  ];

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

  const usedProducts = useMemo(() => {
    return products.filter((p) => {
      const isUsedItem =
        p.isUsed ||
        (p.tags && p.tags.some((t) => ['used', 'second-hand', 'preowned', 'secondhand', 'notes', 'drafter'].includes(t.toLowerCase()))) ||
        p.price < 500;

      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());

      const matchesCondition =
        selectedCondition === 'all' ||
        p.condition === selectedCondition ||
        (selectedCondition === 'like_new' && !p.condition);

      const matchesCategory =
        selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();

      return isUsedItem && matchesSearch && matchesCondition && matchesCategory;
    });
  }, [products, search, selectedCondition, selectedCategory]);

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-6 sm:py-10 min-h-screen">
        {/* Header Hero */}
        <div className="rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-card to-background p-5 sm:p-8 mb-8 shadow-xs">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400 mb-2.5">
              <Recycle className="h-3.5 w-3.5" />
              <span>Senior-to-Junior Circular Economy</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Used & Pre-Owned Campus Marketplace
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Save up to 70% on standard textbook editions, drawing drafters, scientific calculators, lab coats, and hostel essentials passed down by seniors.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Button asChild size="sm" className="rounded-xl gap-2 font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs text-xs">
                <Link href="/seller/dashboard/products">
                  <Plus className="h-4 w-4" />
                  Sell a Used Item
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="rounded-xl gap-2 text-xs">
                <Link href="/requests">
                  <Tag className="h-4 w-4 text-emerald-600" />
                  Post a Request
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search used books, calculators, drawing boards, coats..."
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

          {/* Condition Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {conditions.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setSelectedCondition(c.value)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all select-none ${
                  selectedCondition === c.value
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat.toLowerCase())}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all select-none ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-secondary font-bold text-foreground border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-secondary/50" />
            ))}
          </div>
        ) : usedProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-14 text-center bg-card/40 my-6">
            <Recycle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-display text-base font-bold">No used items match this filter</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Be the first student to pass down a textbook, drafter, or calculator to your juniors!
            </p>
            <Button asChild size="sm" className="mt-5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white">
              <Link href="/seller/dashboard/products">List a Used Item</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {usedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
