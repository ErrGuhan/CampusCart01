'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package, TrendingUp, IndianRupee, ShoppingCart,
  Star, ArrowRight, Plus, AlertCircle, Eye,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { SellerSidebar } from '@/components/seller-sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth-provider';
import { getOrders, statusLabels, statusColors, type Order } from '@/lib/order-storage';
import { getMyProducts } from '@/lib/supabase-queries';
import type { Product } from '@/lib/types';

export default function SellerDashboardPage() {
  const { user, profile, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setOrders(getOrders());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (profile?.id) {
      getMyProducts(profile.id).then(setSellerProducts);
    }
  }, [profile?.id]);

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
            <h1 className="font-display text-2xl font-bold tracking-tight">Sign in to access your dashboard</h1>
            <p className="mt-2 text-muted-foreground max-w-sm">
              You need a seller account to manage your products and orders.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild><Link href="/login">Sign In</Link></Button>
              <Button variant="outline" asChild><Link href="/register">Create Account</Link></Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const lowStockProducts = sellerProducts.filter((p) => p.inventory <= 5);
  const sellerOrders = orders.filter((o) =>
    o.items.some((i) => i.sellerUsername === profile?.username || i.sellerUsername === 'ananyapots')
  );

  const totalRevenue = sellerOrders.reduce((sum, o) => {
    const sellerItems = o.items.filter(
      (i) => i.sellerUsername === profile?.username || i.sellerUsername === 'ananyapots'
    );
    return sum + sellerItems.reduce((s, i) => s + (i.discountPrice ?? i.price) * i.quantity, 0);
  }, 0);

  const totalUnits = sellerOrders.reduce((sum, o) => {
    const sellerItems = o.items.filter(
      (i) => i.sellerUsername === profile?.username || i.sellerUsername === 'ananyapots'
    );
    return sum + sellerItems.reduce((s, i) => s + i.quantity, 0);
  }, 0);

  const avgRating = sellerProducts.length > 0
    ? (sellerProducts.reduce((sum, p) => sum + p.rating, 0) / sellerProducts.length).toFixed(1)
    : '0.0';

  const recentOrders = sellerOrders.slice(0, 5);

  const chartData = [
    { day: 'Mon', value: 320 },
    { day: 'Tue', value: 480 },
    { day: 'Wed', value: 250 },
    { day: 'Thu', value: 610 },
    { day: 'Fri', value: 890 },
    { day: 'Sat', value: 720 },
    { day: 'Sun', value: 540 },
  ];
  const maxChartValue = Math.max(...chartData.map((d) => d.value));

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Seller Dashboard</h1>
            <p className="mt-1.5 text-muted-foreground">Manage your store, products, and orders</p>
          </div>
          <Button asChild className="hidden sm:flex">
            <Link href="/seller/dashboard/products">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="hidden lg:block">
            <SellerSidebar />
          </aside>

          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success mb-3">
                  <IndianRupee className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Revenue</div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold">{sellerOrders.length}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Orders</div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground mb-3">
                  <Package className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold">{sellerProducts.length}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Products</div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning mb-3">
                  <Star className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold">{avgRating}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Avg Rating</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-base font-bold">Weekly Revenue</h2>
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
                <div className="flex items-end justify-between gap-2 h-40">
                  {chartData.map((d) => (
                    <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex w-full items-end justify-center" style={{ height: '100%' }}>
                        <div
                          className="w-full max-w-[2rem] rounded-t-md bg-primary/80 transition-all hover:bg-primary"
                          style={{ height: `${(d.value / maxChartValue) * 100}%`, minHeight: '4px' }}
                          title={`₹${d.value}`}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{d.day}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">This week</span>
                  <span className="font-semibold">₹{chartData.reduce((s, d) => s + d.value, 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-base font-bold">Quick Stats</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Units sold</span>
                    <span className="text-sm font-semibold">{totalUnits}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active products</span>
                    <span className="text-sm font-semibold">
                      {sellerProducts.filter((p) => p.status === 'active').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Low stock alerts</span>
                    <span className={`text-sm font-semibold ${lowStockProducts.length > 0 ? 'text-warning' : ''}`}>
                      {lowStockProducts.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total reviews</span>
                    <span className="text-sm font-semibold">
                      {sellerProducts.reduce((s, p) => s + p.reviewCount, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {lowStockProducts.length > 0 && (
              <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  <h2 className="font-semibold text-sm text-warning">Low Stock Alert</h2>
                </div>
                <div className="space-y-2">
                  {lowStockProducts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <Link href={`/products/${p.slug}`} className="hover:text-primary transition-colors">
                        {p.name}
                      </Link>
                      <Badge variant="secondary" className="bg-warning/10 text-warning">
                        {p.inventory} left
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-base font-bold">Recent Orders</h2>
                <Link
                  href="/seller/dashboard/orders"
                  className="flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all"
                >
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {loaded && recentOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No orders yet</p>
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
                        <span className="text-sm font-medium">{order.id}</span>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <Badge className={`${statusColors[order.status]} hover:${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </Badge>
                      <div className="text-sm font-bold">₹{order.total}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-base font-bold">Your Products</h2>
                <Link
                  href="/seller/dashboard/products"
                  className="flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all"
                >
                  Manage all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="space-y-2">
                {sellerProducts.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-secondary/50">
                      <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${p.slug}`} className="text-sm font-medium hover:text-primary transition-colors line-clamp-1">
                        {p.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        ₹{p.discountPrice ?? p.price} · {p.inventory} in stock
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" />
                      {p.reviewCount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
