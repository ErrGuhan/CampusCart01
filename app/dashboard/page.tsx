'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles, Package, ShoppingBag, Heart, MessageSquare,
  Plus, Store, ArrowRight, ShieldCheck, Clock, ExternalLink,
  Tag, Recycle, Users,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth-provider';
import { useCart } from '@/components/cart-provider';
import { ProductCard } from '@/components/product-card';
import { getAllProducts, getFeaturedProducts } from '@/lib/firebase-queries';
import { subscribeToOrders, type Order } from '@/lib/order-storage';
import type { Product } from '@/lib/types';

export default function StudentDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { totalItems } = useCart();

  const [orders, setOrders] = useState<Order[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    getFeaturedProducts(4).then(setRecommended);

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('campuscart-wishlist');
      if (stored) {
        try {
          setWishlistCount(JSON.parse(stored).length);
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    const unsubscribe = subscribeToOrders((allOrders) => {
      const myUid = user.uid;
      const myEmail = user.email?.toLowerCase() || '';

      const buyerOrders = allOrders.filter((o) => {
        const isBuyerId = o.buyerId && o.buyerId === myUid;
        const isBuyerEmail = o.buyerEmail && o.buyerEmail.toLowerCase() === myEmail;
        return isBuyerId || isBuyerEmail;
      });

      setOrders(buyerOrders);
    });

    return () => unsubscribe();
  }, [user]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const latestOrder = orders.length > 0 ? orders[0] : null;

  if (authLoading) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-7xl py-12">
          <div className="h-96 animate-pulse rounded-3xl bg-secondary/50" />
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-3xl py-20 text-center">
          <div className="rounded-3xl border border-border p-10 bg-card">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-3" />
            <h1 className="font-display text-2xl font-bold">Welcome to CampusCart</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Sign in with your student account to access your personalized campus dashboard.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild className="rounded-xl">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button variant="outline" asChild className="rounded-xl">
                <Link href="/register">Create Student Account</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-8 sm:py-12 min-h-screen">
        {/* Welcome Header */}
        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-secondary/30 p-6 sm:p-10 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-primary/30">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name} />
                <AvatarFallback className="text-xl font-bold bg-primary/20 text-primary">
                  {profile?.display_name?.charAt(0) || 'S'}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Verified Student Creator</span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {greeting}, {profile?.display_name?.split(' ')[0]}! 🎓
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {profile?.department || 'SVCET Student'} • {profile?.year || 'Campus Member'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button asChild variant="outline" className="rounded-xl text-xs gap-1.5">
                <Link href="/account">My Profile</Link>
              </Button>
              <Button asChild className="rounded-xl text-xs gap-1.5 shadow-sm">
                <Link href="/seller/dashboard">
                  <Store className="h-4 w-4" />
                  Seller Studio
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Link
              href="/account/orders"
              className="p-4 rounded-2xl border border-border/70 bg-card/60 hover:bg-card transition-all"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Orders</span>
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">{orders.length}</div>
              <span className="text-[10px] text-muted-foreground">View order history</span>
            </Link>

            <Link
              href="/wishlist"
              className="p-4 rounded-2xl border border-border/70 bg-card/60 hover:bg-card transition-all"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Wishlist</span>
                <Heart className="h-4 w-4 text-rose-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">{wishlistCount}</div>
              <span className="text-[10px] text-muted-foreground">Saved products</span>
            </Link>

            <Link
              href="/messages"
              className="p-4 rounded-2xl border border-border/70 bg-card/60 hover:bg-card transition-all"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Messages</span>
                <MessageSquare className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">Chat</div>
              <span className="text-[10px] text-muted-foreground">Peer conversations</span>
            </Link>

            <Link
              href="/cart"
              className="p-4 rounded-2xl border border-border/70 bg-card/60 hover:bg-card transition-all"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Cart</span>
                <ShoppingBag className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">{totalItems}</div>
              <span className="text-[10px] text-muted-foreground">Ready for checkout</span>
            </Link>
          </div>
        </div>

        {/* Latest Active Order Preview if any */}
        {latestOrder && (
          <div className="mb-10 rounded-3xl border border-primary/20 bg-primary/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary">Latest Order #{latestOrder.id.slice(-6)}</span>
                  <Badge variant="outline" className="text-[10px] capitalize bg-background">
                    {latestOrder.status}
                  </Badge>
                </div>
                <h4 className="font-bold text-sm text-foreground mt-0.5">
                  {latestOrder.items?.length || 1} items • ₹{latestOrder.total}
                </h4>
                {latestOrder.pickupPin && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pickup Handshake PIN: <strong className="text-primary font-mono text-sm">{latestOrder.pickupPin}</strong>
                  </p>
                )}
              </div>
            </div>

            <Button asChild size="sm" className="rounded-xl text-xs gap-1.5 self-end sm:self-center">
              <Link href={`/account/orders/${latestOrder.id}`}>
                View Tracking
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}

        {/* Primary Action Hub */}
        <div className="mb-12">
          <h2 className="font-display text-xl font-bold mb-4">Quick Student Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/marketplace"
              className="group p-5 rounded-3xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Explore Marketplace</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Shop books, circuits & notes</p>
              </div>
            </Link>

            <Link
              href="/requests"
              className="group p-5 rounded-3xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <Tag className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Post a Request</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Ask campus for specific items</p>
              </div>
            </Link>

            <Link
              href="/seller/dashboard/services"
              className="group p-5 rounded-3xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <Sparkles className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Offer Freelance Gigs</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Posters, code, 3D CAD & tutoring</p>
              </div>
            </Link>

            <Link
              href="/used"
              className="group p-5 rounded-3xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Recycle className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Buy & Sell Used</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Second-hand college bargains</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recommended for You */}
        <div>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-xl font-bold">Recommended for You</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Top-rated campus original creations</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs gap-1">
              <Link href="/marketplace">
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {recommended.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
