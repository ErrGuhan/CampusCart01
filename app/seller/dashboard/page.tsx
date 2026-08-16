'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package, IndianRupee, ShoppingBag, Star, ArrowRight,
  Plus, Settings, KeyRound, MapPin, Sparkles, CheckCircle2,
  Check, Loader2, Tag, ChevronRight, X, AlertCircle,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { SellerSidebar } from '@/components/seller-sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { setDoc, doc } from 'firebase/firestore';
import {
  getOrders, statusLabels, statusColors, verifyOrderPickupPin,
  type Order,
} from '@/lib/order-storage';
import { getAllProductsAdmin, getAllGigsAdmin } from '@/lib/firebase-queries';
import type { Product, ServiceGig } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function SellerDashboardPage() {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allGigs, setAllGigs] = useState<ServiceGig[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'gigs'>('products');

  // Modal States
  const [listModalOpen, setListModalOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [selectedOrderForPin, setSelectedOrderForPin] = useState<Order | null>(null);
  const [inputPin, setInputPin] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Refresh all seller data
  const refreshData = useCallback(() => {
    setOrders(getOrders());
    Promise.all([getAllProductsAdmin(), getAllGigsAdmin()]).then(([prods, gigs]) => {
      setAllProducts(prods);
      setAllGigs(gigs);
    });
  }, []);

  useEffect(() => {
    refreshData();

    if (typeof window !== 'undefined') {
      window.addEventListener('campuscart_order_updated', refreshData);
      window.addEventListener('campuscart_product_updated', refreshData);
      window.addEventListener('campuscart_gig_updated', refreshData);
      window.addEventListener('storage', refreshData);
      window.addEventListener('focus', refreshData);

      return () => {
        window.removeEventListener('campuscart_order_updated', refreshData);
        window.removeEventListener('campuscart_product_updated', refreshData);
        window.removeEventListener('campuscart_gig_updated', refreshData);
        window.removeEventListener('storage', refreshData);
        window.removeEventListener('focus', refreshData);
      };
    }
  }, [refreshData]);

  const username = profile?.username?.toLowerCase() || '';
  const isGuhanOrAdmin = username.includes('guhan') || user?.email?.toLowerCase().includes('guhan');

  // Filter products belonging to this seller
  const sellerProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const pUser = p.seller?.username?.toLowerCase() || '';
      const pSellerId = p.seller?.id || '';
      return (
        pSellerId === user?.uid ||
        pUser === username ||
        (isGuhanOrAdmin && (pUser === 'guhan' || pSellerId === 'seller-guhan'))
      );
    });
  }, [allProducts, user?.uid, username, isGuhanOrAdmin]);

  // Filter freelance gigs belonging to this seller
  const sellerGigs = useMemo(() => {
    return allGigs.filter((g) => {
      const gUser = g.seller?.username?.toLowerCase() || '';
      const gSellerId = g.sellerId || g.seller?.id || '';
      return (
        gSellerId === user?.uid ||
        gUser === username ||
        (isGuhanOrAdmin && (gUser === 'guhan' || gSellerId === 'seller-guhan'))
      );
    });
  }, [allGigs, user?.uid, username, isGuhanOrAdmin]);

  // Filter orders containing items from this seller
  const sellerOrders = useMemo(() => {
    return orders.filter((o) =>
      o.items.some((i) => {
        const itemUser = i.sellerUsername?.toLowerCase() || '';
        return (
          itemUser === username ||
          (isGuhanOrAdmin && (itemUser === 'guhan' || itemUser === 'guhan24td0781'))
        );
      })
    );
  }, [orders, username, isGuhanOrAdmin]);

  // Pending handovers / active orders (Priority 1)
  const pendingOrders = useMemo(() => {
    return sellerOrders.filter(
      (o) => o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'refunded'
    );
  }, [sellerOrders]);

  // Real Calculated Metrics
  const totalRevenue = useMemo(() => {
    return sellerOrders.reduce((sum, o) => {
      if (o.status === 'cancelled' || o.status === 'refunded') return sum;
      const sellerItems = o.items.filter((i) => {
        const itemUser = i.sellerUsername?.toLowerCase() || '';
        return (
          itemUser === username ||
          (isGuhanOrAdmin && (itemUser === 'guhan' || itemUser === 'guhan24td0781'))
        );
      });
      return sum + sellerItems.reduce((s, i) => s + (i.discountPrice ?? i.price) * i.quantity, 0);
    }, 0);
  }, [sellerOrders, username, isGuhanOrAdmin]);

  const totalUnits = useMemo(() => {
    return sellerOrders.reduce((sum, o) => {
      const sellerItems = o.items.filter((i) => {
        const itemUser = i.sellerUsername?.toLowerCase() || '';
        return (
          itemUser === username ||
          (isGuhanOrAdmin && (itemUser === 'guhan' || itemUser === 'guhan24td0781'))
        );
      });
      return sum + sellerItems.reduce((s, i) => s + i.quantity, 0);
    }, 0);
  }, [sellerOrders, username, isGuhanOrAdmin]);

  const avgRating = useMemo(() => {
    const allRatings = [
      ...sellerProducts.map((p) => p.rating),
      ...sellerGigs.map((g) => g.rating),
    ].filter((r) => r > 0);
    if (allRatings.length === 0) return '5.0';
    const avg = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
    return avg.toFixed(1);
  }, [sellerProducts, sellerGigs]);

  // Handle PIN verification
  function handleVerifyPin() {
    if (!selectedOrderForPin) {
      toast({ title: 'Select an order', description: 'Please choose an active order to verify.', variant: 'destructive' });
      return;
    }
    if (!inputPin.trim()) {
      toast({ title: 'PIN required', description: 'Please enter the 4-digit handover PIN provided by the buyer.', variant: 'destructive' });
      return;
    }

    setVerifyingPin(true);
    setTimeout(() => {
      const result = verifyOrderPickupPin(selectedOrderForPin.id, inputPin.trim());
      setVerifyingPin(false);

      if (result.success) {
        toast({
          title: 'Handover Completed! 🎉',
          description: result.message,
        });
        setOrders(getOrders());
        setPinModalOpen(false);
        setInputPin('');
        setSelectedOrderForPin(null);
      } else {
        toast({
          title: 'PIN verification failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    }, 400);
  }

  // Toggle Product Active / Sold status
  function handleToggleProductStatus(productId: string, currentActive: boolean) {
    const newStatus = currentActive ? 'active' : 'out_of_stock';
    
    // Update local products
    setAllProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
    );

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('campuscart_products');
        if (raw) {
          let list = JSON.parse(raw);
          list = list.map((p: any) => (p.id === productId ? { ...p, status: newStatus } : p));
          localStorage.setItem('campuscart_products', JSON.stringify(list));
        }
        window.dispatchEvent(new CustomEvent('campuscart_product_updated'));
      } catch {}
    }

    try {
      setDoc(doc(db, 'products', productId), { status: newStatus }, { merge: true }).catch(() => {});
    } catch {}

    toast({
      title: newStatus === 'active' ? 'Listing Activated' : 'Marked as Sold / Inactive',
      description: `Product is now ${newStatus === 'active' ? 'visible to buyers' : 'hidden from market'}.`,
    });
  }

  // Toggle Gig Active / Paused status
  function handleToggleGigStatus(gigId: string, currentActive: boolean) {
    const newStatus = currentActive ? 'active' : 'paused';

    setAllGigs((prev) =>
      prev.map((g) => (g.id === gigId ? { ...g, status: newStatus } : g))
    );

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('campuscart_gigs');
        if (raw) {
          let list = JSON.parse(raw);
          list = list.map((g: any) => (g.id === gigId ? { ...g, status: newStatus } : g));
          localStorage.setItem('campuscart_gigs', JSON.stringify(list));
        }
        window.dispatchEvent(new CustomEvent('campuscart_gig_updated'));
      } catch {}
    }

    try {
      setDoc(doc(db, 'service_gigs', gigId), { status: newStatus }, { merge: true }).catch(() => {});
    } catch {}

    toast({
      title: newStatus === 'active' ? 'Gig Activated' : 'Gig Paused',
      description: `Freelance service is now ${newStatus === 'active' ? 'accepting orders' : 'paused'}.`,
    });
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-7xl py-8">
          <div className="h-96 animate-pulse rounded-2xl bg-secondary/50" />
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
            <h1 className="font-display text-2xl font-bold tracking-tight">Sign in to access your Studio</h1>
            <p className="mt-2 text-muted-foreground max-w-sm text-sm">
              Manage your campus products, freelance orders, and meetups in one place.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild className="rounded-xl"><Link href="/login">Sign In</Link></Button>
              <Button variant="outline" asChild className="rounded-xl"><Link href="/register">Create Account</Link></Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'GM';

  const studentTag = `${profile?.year ? profile.year + ' ' : '4th Year '}${profile?.department || 'CSE'} • Verified`;

  return (
    <>
      <Navbar />

      <main className="container-px mx-auto max-w-7xl py-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-4">
          
          {/* Desktop Sidebar */}
          <aside className="lg:block">
            <SellerSidebar />
          </aside>

          {/* Main Seller Workspace Content Area */}
          <div className="lg:col-span-3 space-y-5">
            
            {/* 1. Compact Profile Header */}
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <Avatar className="h-12 w-12 border-2 border-primary/20 shrink-0">
                  {profile?.avatar_url && (
                    <AvatarImage src={profile.avatar_url} alt={profile.display_name || 'Guhan M'} />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-display text-base sm:text-lg font-bold truncate text-foreground leading-tight">
                      {profile?.display_name || user.email?.split('@')[0] || 'Guhan M'}
                    </h1>
                    <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/10 text-[11px] font-bold px-2 py-0 border-amber-500/20">
                      ★ {avgRating}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {studentTag}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground"
                >
                  <Link href="/seller/dashboard/settings" title="Store Settings">
                    <Settings className="h-4.5 w-4.5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* 2. Earnings & Quick Action Hero Card */}
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-secondary/30 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                    Available Balance / Total Earnings
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold font-display text-foreground tracking-tight mt-1 flex items-baseline gap-2">
                    <span>₹{totalRevenue.toLocaleString()}</span>
                    <span className="text-xs text-emerald-600 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                      {totalUnits} units fulfilled
                    </span>
                  </div>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-xs">
                  <IndianRupee className="h-5 w-5" />
                </div>
              </div>

              {/* Two Primary Action Buttons Side-by-Side */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Button
                  onClick={() => setListModalOpen(true)}
                  className="rounded-xl h-11 text-xs sm:text-sm font-bold gap-1.5 shadow-sm active:scale-95 transition-transform"
                >
                  <Plus className="h-4 w-4" />
                  + List Item / Gig
                </Button>

                <Button
                  onClick={() => {
                    setSelectedOrderForPin(pendingOrders[0] || null);
                    setInputPin('');
                    setPinModalOpen(true);
                  }}
                  variant="outline"
                  className="rounded-xl h-11 text-xs sm:text-sm font-bold gap-1.5 border-primary/30 hover:bg-primary/5 active:scale-95 transition-transform text-foreground bg-card/60"
                >
                  <KeyRound className="h-4 w-4 text-primary" />
                  🔑 Enter Handover PIN
                </Button>
              </div>
            </div>

            {/* 3. Action Required / Active Orders Section (Priority 1) */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-base font-bold text-foreground">Action Required / Active Orders</h2>
                  {pendingOrders.length > 0 && (
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20 font-bold text-[11px] px-2 py-0.5">
                      {pendingOrders.length} Pending
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" asChild className="text-xs text-primary hover:text-primary/80 h-8">
                  <Link href="/seller/dashboard/orders">
                    View All ({sellerOrders.length})
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </div>

              {pendingOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">All Campus Orders Fulfilled!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    No pending meetups right now. New campus orders will appear here instantly.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pendingOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-foreground truncate">
                            {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-extrabold text-sm text-primary">₹{order.total}</span>
                            <Badge className={`${statusColors[order.status]} text-[10px] px-2 py-0.5 font-semibold`}>
                              {order.status === 'delivered' ? 'Delivered' : 'Pending Pickup'}
                            </Badge>
                          </div>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0 font-medium">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate font-medium text-foreground/80">
                            {order.pickupPoint || 'Central Library Entrance'}
                          </span>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedOrderForPin(order);
                            setInputPin('');
                            setPinModalOpen(true);
                          }}
                          className="rounded-xl text-xs h-8 px-3 font-bold shrink-0 gap-1.5"
                        >
                          <KeyRound className="h-3 w-3" />
                          Complete Handover
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Segmented Inventory Switcher */}
            <div className="space-y-3 pt-2">
              {/* 2-Tab Segmented Control */}
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-secondary/80 border border-border/60">
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className={cn(
                    'py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5',
                    activeTab === 'products'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Package className="h-4 w-4" />
                  My Items ({sellerProducts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('gigs')}
                  className={cn(
                    'py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5',
                    activeTab === 'gigs'
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  My Gigs ({sellerGigs.length})
                </button>
              </div>

              {/* Tab 1: Products List */}
              {activeTab === 'products' && (
                <div className="space-y-2.5">
                  {sellerProducts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center space-y-3">
                      <Package className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                      <p className="text-sm font-semibold">No items listed yet</p>
                      <Button asChild size="sm" className="rounded-xl text-xs">
                        <Link href="/seller/dashboard/products">Add Your First Product</Link>
                      </Button>
                    </div>
                  ) : (
                    sellerProducts.map((p) => {
                      const isActive = p.status === 'active';
                      return (
                        <div
                          key={p.id}
                          className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-secondary border border-border/50 shrink-0">
                              <Image
                                src={
                                  p.images[0] ||
                                  'https://images.pexels.com/photos/28867382/pexels-photo-28867382.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
                                }
                                alt={p.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">{p.name}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-extrabold text-xs text-primary">₹{p.price}</span>
                                <span className="text-[11px] text-muted-foreground">• {p.inventory} in stock</span>
                                <span className="text-[11px] text-muted-foreground hidden sm:inline">• {p.reviewCount} reviews</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'text-[11px] font-semibold',
                                  isActive ? 'text-emerald-600' : 'text-muted-foreground'
                                )}
                              >
                                {isActive ? 'Active' : 'Sold'}
                              </span>
                              <Switch
                                checked={isActive}
                                onCheckedChange={(checked) => handleToggleProductStatus(p.id, checked)}
                                aria-label={`Toggle active status for ${p.name}`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab 2: Freelance Gigs List */}
              {activeTab === 'gigs' && (
                <div className="space-y-2.5">
                  {sellerGigs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center space-y-3">
                      <Sparkles className="h-10 w-10 text-muted-foreground/40 mx-auto text-primary" />
                      <p className="text-sm font-semibold">No freelance gigs posted yet</p>
                      <Button asChild size="sm" className="rounded-xl text-xs">
                        <Link href="/seller/dashboard/services">Post a Service Gig</Link>
                      </Button>
                    </div>
                  ) : (
                    sellerGigs.map((g) => {
                      const isActive = g.status === 'active';
                      return (
                        <div
                          key={g.id}
                          className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-secondary border border-border/50 shrink-0">
                              <Image
                                src={
                                  g.coverImage ||
                                  'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
                                }
                                alt={g.title}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">{g.title}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-extrabold text-xs text-primary">Starts at ₹{g.startingPrice}</span>
                                <span className="text-[11px] text-muted-foreground">• {g.deliveryTimeDays || 2}d delivery</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'text-[11px] font-semibold',
                                  isActive ? 'text-emerald-600' : 'text-muted-foreground'
                                )}
                              >
                                {isActive ? 'Active' : 'Paused'}
                              </span>
                              <Switch
                                checked={isActive}
                                onCheckedChange={(checked) => handleToggleGigStatus(g.id, checked)}
                                aria-label={`Toggle active status for ${g.title}`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* MODAL 1: List Item / Gig Chooser */}
      <Dialog open={listModalOpen} onOpenChange={setListModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">What would you like to list?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Choose the category of campus offering you want to publish.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3">
            <Link
              href="/seller/dashboard/products"
              onClick={() => setListModalOpen(false)}
              className="p-4 rounded-2xl border border-border hover:border-primary/50 bg-secondary/30 hover:bg-primary/5 transition-all text-left group flex flex-col justify-between"
            >
              <div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
                  <Package className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm text-foreground">Physical Item</h4>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Textbooks, electronics, notes, project components & pre-owned gear.
                </p>
              </div>
              <span className="text-xs text-primary font-bold mt-4 flex items-center gap-1">
                List Product <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </Link>

            <Link
              href="/seller/dashboard/services"
              onClick={() => setListModalOpen(false)}
              className="p-4 rounded-2xl border border-border hover:border-primary/50 bg-secondary/30 hover:bg-primary/5 transition-all text-left group flex flex-col justify-between"
            >
              <div>
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm text-foreground">Freelance Service</h4>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Design posters, coding help, 3D printing, tutoring & video edits.
                </p>
              </div>
              <span className="text-xs text-indigo-600 font-bold mt-4 flex items-center gap-1">
                Post Service <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Enter Handover PIN */}
      <Dialog open={pinModalOpen} onOpenChange={setPinModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Confirm Campus Handover
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ask the buyer for their 4-digit Pickup PIN at the meetup spot to mark the order delivered.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {pendingOrders.length > 0 ? (
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Select Target Order</Label>
                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                  {pendingOrders.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setSelectedOrderForPin(o)}
                      className={cn(
                        'w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between',
                        selectedOrderForPin?.id === o.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border bg-card hover:bg-secondary/50'
                      )}
                    >
                      <div className="min-w-0">
                        <p className="font-bold truncate text-foreground">
                          {o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          📍 {o.pickupPoint || 'Campus Pickup'} • ₹{o.total}
                        </p>
                      </div>
                      {selectedOrderForPin?.id === o.id && (
                        <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-secondary/50 text-center text-xs text-muted-foreground">
                No pending orders found.
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Buyer 4-Digit PIN</Label>
              <Input
                type="text"
                maxLength={4}
                placeholder="e.g. 4892"
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                className="rounded-xl text-center text-xl tracking-widest font-mono font-bold h-12"
              />
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPinModalOpen(false)}
              className="flex-1 sm:flex-none rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleVerifyPin}
              disabled={verifyingPin || !inputPin.trim()}
              className="flex-1 sm:flex-none rounded-xl text-xs font-bold gap-1.5"
            >
              {verifyingPin ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Verify & Hand Over
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  );
}
