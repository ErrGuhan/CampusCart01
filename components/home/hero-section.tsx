'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShoppingBag, ShieldCheck, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { getAllProducts, getAllSellers } from '@/lib/firebase-queries';
import { getOrders } from '@/lib/order-storage';

export function HeroSection() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<{ products: number; creators: number; rating: string }>({
    products: 0,
    creators: 0,
    rating: '5.0',
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [prods, sellers] = await Promise.all([getAllProducts(), getAllSellers()]);
        const avgRating =
          prods.length > 0
            ? (prods.reduce((acc, p) => acc + (p.rating || 5.0), 0) / prods.length).toFixed(1)
            : '5.0';

        setStats({
          products: prods.length,
          creators: sellers.length,
          rating: avgRating,
        });
      } catch {}
    }
    loadStats();
  }, []);

  const sellerLink = user && profile?.is_seller ? '/seller/dashboard' : user ? '/account/settings' : '/register';
  const sellerLabel = user && profile?.is_seller ? 'Seller Studio' : 'Start Selling';

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="container-px mx-auto max-w-7xl relative">
        <div className="grid grid-cols-1 gap-8 py-12 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:py-24 items-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Campus-First Student Commerce & Freelance</span>
            </div>

            <h1 className="mt-4 sm:mt-6 font-display text-3xl sm:text-4xl font-extrabold leading-[1.15] tracking-tight text-balance md:text-5xl lg:text-6xl">
              Discover what your{' '}
              <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                campus creates
              </span>
            </h1>

            <p className="mt-3 sm:mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg text-balance">
              Buy, sell, freelance, and collaborate with students around you. From engineering drawing boards and semester notes to symposium posters and IoT hardware.
            </p>

            <div className="mt-6 sm:mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="w-full sm:w-auto sm:h-12 sm:px-6 text-base rounded-2xl shadow-md gap-2">
                <Link href="/marketplace">
                  <ShoppingBag className="h-4 w-4" />
                  Explore Marketplace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto sm:h-12 sm:px-6 text-base rounded-2xl">
                <Link href={sellerLink}>{sellerLabel}</Link>
              </Button>
            </div>

            {/* Real dynamic stats */}
            <div className="mt-8 sm:mt-10 grid grid-cols-3 gap-2 sm:gap-6 pt-6 border-t border-border/60">
              <div>
                <div className="font-display text-xl sm:text-3xl font-bold text-foreground">
                  {stats.products}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  Products & notes
                </div>
              </div>

              <div>
                <div className="font-display text-xl sm:text-3xl font-bold text-foreground">
                  {stats.creators}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  Student creators
                </div>
              </div>

              <div>
                <div className="font-display text-xl sm:text-3xl font-bold text-foreground">
                  {stats.rating} ★
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  Avg. store rating
                </div>
              </div>
            </div>
          </div>

          <div className="relative animate-fade-in-up [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards] mt-8 sm:mt-0">
            <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-3 sm:space-y-4">
                <div className="overflow-hidden rounded-2xl border border-border shadow-md aspect-square bg-secondary">
                  <img
                    src="https://images.pexels.com/photos/28867382/pexels-photo-28867382.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                    alt="Campus handmade product"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="overflow-hidden rounded-2xl border border-border shadow-md aspect-[4/3] bg-secondary">
                  <img
                    src="https://images.pexels.com/photos/33428339/pexels-photo-33428339.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                    alt="Engineering kit and accessories"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="overflow-hidden rounded-2xl border border-border shadow-md aspect-[4/3] bg-secondary">
                  <img
                    src="https://images.pexels.com/photos/14580494/pexels-photo-14580494.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                    alt="Student crafts and snacks"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="overflow-hidden rounded-2xl border border-border shadow-md aspect-square bg-secondary">
                  <img
                    src="https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                    alt="Coding and freelance services"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
