'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Heart, ArrowRight, ShoppingBag, ChevronRight } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getProductsByIds } from '@/lib/firebase-queries';
import type { Product } from '@/lib/types';

const STORAGE_KEY = 'campuscart-wishlist';

export default function WishlistPage() {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { toast } = useToast();

  const loadWishlist = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setWishlistIds(JSON.parse(stored));
      } else {
        setWishlistIds([]);
      }
    } catch {
      setWishlistIds([]);
    }
  }, []);

  useEffect(() => {
    loadWishlist();

    if (typeof window !== 'undefined') {
      window.addEventListener('campuscart_wishlist_updated', loadWishlist);
      window.addEventListener('storage', loadWishlist);
      window.addEventListener('focus', loadWishlist);

      return () => {
        window.removeEventListener('campuscart_wishlist_updated', loadWishlist);
        window.removeEventListener('storage', loadWishlist);
        window.removeEventListener('focus', loadWishlist);
      };
    }
  }, [loadWishlist]);

  useEffect(() => {
    getProductsByIds(wishlistIds)
      .then(setWishlistProducts)
      .finally(() => setLoaded(true));
  }, [wishlistIds]);

  if (!loaded) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-7xl py-16">
          <div className="h-64 animate-pulse rounded-3xl bg-secondary/50" />
        </main>
        <Footer />
      </>
    );
  }

  if (wishlistProducts.length === 0) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-7xl py-16 sm:py-24">
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 max-w-md mx-auto rounded-3xl border border-dashed border-border bg-card/40">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mb-4 shadow-xs">
              <Heart className="h-8 w-8" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Your wishlist is empty</h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Save products you love by tapping the heart icon on any card. They will show up here for easy access.
            </p>
            <Button className="mt-6 rounded-xl font-bold text-xs" asChild>
              <Link href="/marketplace">
                Discover Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-6 sm:py-10 min-h-screen">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-semibold">Wishlist</span>
        </nav>

        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">My Wishlist</h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              {wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'} saved for later
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold self-start sm:self-auto" asChild>
            <Link href="/marketplace">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {wishlistProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
