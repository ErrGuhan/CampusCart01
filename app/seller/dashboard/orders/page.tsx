'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag, Search, ChevronRight, MapPin, Truck,
  Package, Eye, ShieldCheck, KeyRound, Check, Loader2,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { SellerSidebar } from '@/components/seller-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  getOrders, statusLabels, statusColors, verifyOrderPickupPin,
  type Order,
} from '@/lib/order-storage';

export default function SellerOrdersPage() {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Verify PIN Dialog state
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [targetOrderId, setTargetOrderId] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    function load() {
      setOrders(getOrders());
      setLoaded(true);
    }
    load();

    if (typeof window !== 'undefined') {
      window.addEventListener('campuscart_order_updated', load);
      window.addEventListener('storage', load);
      window.addEventListener('focus', load);

      return () => {
        window.removeEventListener('campuscart_order_updated', load);
        window.removeEventListener('storage', load);
        window.removeEventListener('focus', load);
      };
    }
  }, []);

  function handleOpenPinModal(orderId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setTargetOrderId(orderId);
    setInputPin('');
    setPinModalOpen(true);
  }

  function handleVerifyPin() {
    if (!inputPin.trim()) {
      toast({ title: 'PIN required', description: 'Please enter the 4-digit handover PIN.', variant: 'destructive' });
      return;
    }

    setVerifying(true);
    setTimeout(() => {
      const result = verifyOrderPickupPin(targetOrderId, inputPin.trim());
      setVerifying(false);

      if (result.success) {
        toast({
          title: 'Handover Verified! 🎉',
          description: result.message,
        });
        setOrders(getOrders());
        setPinModalOpen(false);
        setInputPin('');
      } else {
        toast({
          title: 'Verification failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    }, 400);
  }

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
            <Package className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h1 className="font-display text-2xl font-bold tracking-tight">Sign in required</h1>
            <p className="mt-2 text-muted-foreground">Sign in to view your orders.</p>
            <Button className="mt-6" asChild><Link href="/login">Sign In</Link></Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!profile?.is_seller) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-7xl py-16">
          <div className="flex flex-col items-center justify-center text-center py-16">
            <Package className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h1 className="font-display text-2xl font-bold tracking-tight">Orders are only for sellers</h1>
            <p className="mt-2 text-muted-foreground max-w-md">
              Students who are not selling products can browse products and place orders from the marketplace.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild><Link href="/products">Go Shopping</Link></Button>
              <Button variant="outline" asChild><Link href="/account/settings">Become a Seller</Link></Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const username = profile?.username?.toLowerCase() || '';
  const isGuhanOrAdmin = username.includes('guhan') || user?.email?.toLowerCase().includes('guhan');

  const sellerOrders = orders.filter((o) =>
    o.items.some((i) => {
      const itemUser = i.sellerUsername?.toLowerCase() || '';
      return (
        itemUser === username ||
        (isGuhanOrAdmin && (itemUser === 'guhan' || itemUser === 'guhan24td0781'))
      );
    })
  );

  const filtered = sellerOrders.filter((o) => {
    const matchesSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = sellerOrders.filter((o) => o.status === 'confirmed' || o.status === 'processing').length;
  const readyCount = sellerOrders.filter((o) => o.status === 'ready_for_pickup' || o.status === 'out_for_delivery').length;
  const completedCount = sellerOrders.filter((o) => o.status === 'delivered').length;

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">Orders</h1>
          <p className="mt-1.5 text-muted-foreground">
            {sellerOrders.length} {sellerOrders.length === 1 ? 'order' : 'orders'} for your products
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="hidden lg:block">
            <SellerSidebar />
          </aside>

          <div className="lg:col-span-3 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="text-xl font-bold">{pendingCount}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Pending</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="text-xl font-bold">{readyCount}</div>
                <div className="text-xs text-muted-foreground mt-0.5">In Transit</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="text-xl font-bold">{completedCount}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Completed</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID or product name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loaded && filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">No orders found</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                  {search || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters.'
                    : 'Orders for your products will appear here once customers start buying.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((order) => {
                  const sellerItems = order.items.filter(
                    (i) => i.sellerUsername === profile?.username
                  );
                  const sellerTotal = sellerItems.reduce(
                    (s, i) => s + (i.discountPrice ?? i.price) * i.quantity, 0
                  );

                  return (
                    <Link
                      key={order.id}
                      href={`/account/orders/${order.id}`}
                      className="group block rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground shrink-0">
                            <ShoppingBag className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{order.id}</span>
                              <Badge className={`${statusColors[order.status]} hover:${statusColors[order.status]}`}>
                                {statusLabels[order.status]}
                              </Badge>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                day: 'numeric', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </p>
                            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                {order.fulfillmentType === 'pickup' ? (
                                  <><MapPin className="h-3 w-3" /> Pickup</>
                                ) : (
                                  <><Truck className="h-3 w-3" /> Delivery</>
                                )}
                              </span>
                              <span>{sellerItems.length} of your {sellerItems.length === 1 ? 'product' : 'products'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Your earnings</div>
                            <div className="font-display text-lg font-bold">₹{sellerTotal}</div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {sellerItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 rounded-lg border border-border p-2 shrink-0">
                            <div className="h-10 w-10 overflow-hidden rounded-md bg-secondary/50">
                              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium line-clamp-1 max-w-[140px]">{item.name}</p>
                              <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <div className="mt-4 pt-3 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="text-xs text-muted-foreground">
                            Pickup Point: <strong className="text-foreground">{order.pickupPoint || 'Campus Pickup Landmark'}</strong>
                          </div>
                          <Button
                            size="sm"
                            className="h-8 text-xs font-semibold rounded-lg"
                            onClick={(e) => handleOpenPinModal(order.id, e)}
                          >
                            <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                            Verify Handover PIN
                          </Button>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {/* Verify Handover PIN Dialog */}
      <Dialog open={pinModalOpen} onOpenChange={setPinModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Verify Handover PIN
            </DialogTitle>
            <DialogDescription>
              Ask the student buyer for their 4-digit Security PIN to confirm pickup and mark this order as completed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="h-pin" className="text-xs font-medium">4-Digit Security PIN</Label>
              <Input
                id="h-pin"
                placeholder="e.g. 4892"
                maxLength={4}
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value.replace(/[^0-9]/g, ''))}
                className="text-center font-mono text-2xl tracking-widest font-bold h-12"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPinModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleVerifyPin} disabled={verifying}>
              {verifying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...</> : 'Confirm Handover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
