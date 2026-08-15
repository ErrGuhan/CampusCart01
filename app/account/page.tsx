'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package, ShoppingBag, Heart, TrendingUp,
  ChevronRight, ArrowRight, Store, CheckCircle2,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AccountSidebar } from '@/components/account-sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth-provider';
import { useCart } from '@/components/cart-provider';
import { getOrders, statusLabels, statusColors, type Order } from '@/lib/order-storage';
import { getDiscountedProducts } from '@/lib/firebase-queries';
import type { Product } from '@/lib/types';

export default function AccountDashboardPage() {
  const { user, profile, loading } = useAuth();
  const { totalItems } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setOrders(getOrders());
    setLoaded(true);
  }, []);

  useEffect(() => {
    getDiscountedProducts().then((products) => setDeals(products.slice(0, 3)));
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-7xl py-8">
          <div className="h-96 animate-pulse rounded-xl bg-secondary" />
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-7xl py-16">
          <div className="flex flex-col items-center justify-center text-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-6">
              <Package className="h-10 w-10" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Sign in to view your account</h1>
            <p className="mt-2 text-muted-foreground max-w-sm">
              Access your orders, wishlist, and account settings by signing in.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/register">Create Account</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
  const recentOrders = orders.slice(0, 3);

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Welcome back, {profile?.display_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="mt-1.5 text-muted-foreground">
            Here's what's happening with your account
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="hidden lg:block">
            <AccountSidebar />
          </aside>

          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                  <Package className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold">{orders.length}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Total Orders</div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success mb-3">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold">₹{totalSpent}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Total Spent</div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground mb-3">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold">{totalItems}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Items in Cart</div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning mb-3">
                  <Heart className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold">
                  {typeof window !== 'undefined'
                    ? (() => {
                        try {
                          const ids = localStorage.getItem('campuscart-wishlist');
                          return ids ? JSON.parse(ids).length : 0;
                        } catch {
                          return 0;
                        }
                      })()
                    : 0}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Wishlist Items</div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold">Recent Orders</h2>
                {orders.length > 0 && (
                  <Link
                    href="/account/orders"
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all"
                  >
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>

              {loaded && orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No orders yet</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href="/products">Start Shopping</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/account/orders/${order.id}`}
                      className="group flex items-center gap-4 rounded-lg border border-border p-3 transition-all hover:border-primary/20 hover:bg-accent/30"
                    >
                      <div className="flex -space-x-3">
                        {order.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="h-10 w-10 overflow-hidden rounded-lg border-2 border-card bg-secondary/50 shrink-0"
                          >
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{order.id}</span>
                          <Badge className={`${statusColors[order.status]} hover:${statusColors[order.status]}`}>
                            {statusLabels[order.status]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' · '}
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">₹{order.total}</div>
                        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold">Deals for You</h2>
                <Link
                  href="/products"
                  className="flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all"
                >
                  Browse all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {deals.map((product) => {
                  const hasDiscount = product.discountPrice !== undefined;
                  const discountPercent = hasDiscount
                    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
                    : 0;
                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group flex gap-3 rounded-lg border border-border p-3 transition-all hover:border-primary/20 hover:bg-accent/30"
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary/50">
                        <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                          {product.name}
                        </span>
                        <div className="mt-auto flex items-center gap-2">
                          <span className="text-sm font-bold">₹{product.discountPrice}</span>
                          <span className="text-xs text-muted-foreground line-through">₹{product.price}</span>
                          <Badge variant="destructive" className="text-[10px]">{discountPercent}%</Badge>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {!profile?.is_seller && (
              <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-accent/30 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold">Become a Seller</h2>
                    <p className="text-sm text-muted-foreground">
                      Start selling your products to students on campus — it's free!
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['No platform fees', 'List unlimited products', 'Reach campus buyers'].map((feature) => (
                    <span key={feature} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      {feature}
                    </span>
                  ))}
                </div>
                <Button className="mt-4" asChild>
                  <Link href="/register">
                    Start Selling
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
