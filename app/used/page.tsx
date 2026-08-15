'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Recycle, Search, SlidersHorizontal, Plus, Sparkles,
  CheckCircle2, ArrowRight, Tag,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getAllProducts } from '@/lib/firebase-queries';
import type { Product, ProductCondition } from '@/lib/types';

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
      <main className="container-px mx-auto max-w-7xl py-8 sm:py-12 min-h-screen">
        {/* Header Hero */}
        <div className="rounded-3xl border border-border bg-gradient-to-br from-amber-500/10 via-background to-secondary/40 p-6 sm:p-10 mb-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-600 mb-3">
              <Recycle className="h-4 w-4" />
              <span>Campus Circular Economy</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Used & Pre-Owned Campus Marketplace
            </h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Save up to 70% on standard textbook editions, drawing drafters, scientific calculators, lab coats, and hostel essentials passed down by seniors.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild className="rounded-xl gap-2 shadow-sm">
                <Link href="/seller/dashboard/products">
                  <Plus className="h-4 w-4" />
                  Sell a Used Item
                </Link>
              </Button>
              <Button variant="outline" asChild className="rounded-xl gap-2">
                <Link href="/requests">
                  <Tag className="h-4 w-4" />
                  Post a Request
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search used books, calculators, drawing boards, coats..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          {/* Condition Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap mr-1">Condition:</span>
            {conditions.map((c) => (
              <Button
                key={c.value}
                variant={selectedCondition === c.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCondition(c.value)}
                className="rounded-xl text-xs whitespace-nowrap h-8"
              >
                {c.label}
              </Button>
            ))}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap mr-1">Category:</span>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory.toLowerCase() === cat.toLowerCase() ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(cat.toLowerCase())}
                className={`rounded-xl text-xs whitespace-nowrap h-8 ${
                  selectedCategory.toLowerCase() === cat.toLowerCase() ? 'font-bold border border-border' : ''
                }`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-secondary/50" />
            ))}
          </div>
        ) : usedProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-16 text-center bg-card/40">
            <Recycle className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-display text-lg font-bold">No used items match this filter</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Be the first to list a used textbook or calculator for your juniors!
            </p>
            <Button asChild className="mt-5 rounded-xl">
              <Link href="/seller/dashboard/products">List a Used Item</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">
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
