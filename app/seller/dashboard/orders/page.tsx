'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag, Search, ChevronRight, MapPin, Truck,
  Package, KeyRound, Check, Loader2, Clock, CheckCircle2,
  XCircle, AlertTriangle, ArrowRight, ShieldCheck, RefreshCw,
  SlidersHorizontal,
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
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  getOrders, subscribeToOrders, statusLabels, statusColors,
  updateOrderStatus, verifyOrderPickupPin, type Order, type OrderStatus,
} from '@/lib/order-storage';
import { cn } from '@/lib/utils';

export default function SellerOrdersPage() {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Verify PIN Dialog state
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [inputPin, setInputPin] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Cancel Order Dialog state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToOrders((allOrders) => {
      setOrders(allOrders);
      setLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  function handleOpenPinModal(order: Order, e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedOrder(order);
    setInputPin('');
    setPinModalOpen(true);
  }

  function handleOpenCancelModal(order: Order, e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setOrderToCancel(order);
    setCancelModalOpen(true);
  }

  function handleVerifyPin() {
    if (!selectedOrder) return;
    if (!inputPin.trim()) {
      toast({ title: 'PIN required', description: 'Please enter the 4-digit handover PIN from the student.', variant: 'destructive' });
      return;
    }

    setVerifying(true);
    setTimeout(() => {
      const result = verifyOrderPickupPin(selectedOrder.id, inputPin.trim());
      setVerifying(false);

      if (result.success) {
        toast({
          title: 'Handover Verified! 🎉',
          description: `Order ${selectedOrder.id} marked as delivered and completed.`,
        });
        setOrders(getOrders());
        setPinModalOpen(false);
        setInputPin('');
        setSelectedOrder(null);
      } else {
        toast({
          title: 'Incorrect PIN',
          description: result.message,
          variant: 'destructive',
        });
      }
    }, 400);
  }

  function handleUpdateStatus(orderId: string, newStatus: OrderStatus, e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const success = updateOrderStatus(orderId, newStatus);
    if (success) {
      setOrders(getOrders());
      const label = statusLabels[newStatus] || newStatus;
      toast({
        title: `Status Updated: ${label}`,
        description: `Order status has been updated to ${label}.`,
      });
    }
  }

  function handleConfirmCancel() {
    if (!orderToCancel) return;
    setCancelling(true);
    setTimeout(() => {
      updateOrderStatus(orderToCancel.id, 'cancelled');
      setOrders(getOrders());
      setCancelling(false);
      setCancelModalOpen(false);
      setOrderToCancel(null);
      toast({
        title: 'Order Cancelled',
        description: 'The order request has been cancelled.',
        variant: 'destructive',
      });
    }, 300);
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-7xl py-8">
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
        <main className="container-px mx-auto max-w-7xl py-16">
          <div className="flex flex-col items-center justify-center text-center py-16">
            <Package className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h1 className="font-display text-2xl font-bold tracking-tight">Sign in required</h1>
            <p className="mt-2 text-muted-foreground">Sign in to view your store orders.</p>
            <Button className="mt-6 rounded-2xl" asChild><Link href="/login">Sign In</Link></Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const myUid = user?.uid || '';
  const myEmail = user?.email?.toLowerCase() || '';
  const username = profile?.username?.toLowerCase() || '';
  const displayName = profile?.display_name?.toLowerCase() || '';
  const isGuhanOrAdmin = (profile?.role === 'admin') || username.includes('guhan') || myEmail.includes('guhan');

  const sellerOrders = orders.filter((o) => {
    if (isGuhanOrAdmin) return true;
    return o.items.some((i) => {
      const itemSellerId = i.sellerId || '';
      const itemUser = i.sellerUsername?.toLowerCase() || '';
      const itemName = i.sellerName?.toLowerCase() || '';

      return (
        (myUid && itemSellerId === myUid) ||
        (username && itemUser === username) ||
        (displayName && itemName === displayName) ||
        (myEmail && itemUser === myEmail.split('@')[0])
      );
    });
  });

  const filtered = sellerOrders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'pending') return matchesSearch && (o.status === 'confirmed' || o.status === 'processing');
    if (statusFilter === 'ready') return matchesSearch && (o.status === 'ready_for_pickup' || o.status === 'out_for_delivery');
    if (statusFilter === 'delivered') return matchesSearch && o.status === 'delivered';
    if (statusFilter === 'cancelled') return matchesSearch && o.status === 'cancelled';
    return matchesSearch && o.status === statusFilter;
  });

  const confirmedCount = sellerOrders.filter((o) => o.status === 'confirmed').length;
  const processingCount = sellerOrders.filter((o) => o.status === 'processing').length;
  const readyCount = sellerOrders.filter((o) => o.status === 'ready_for_pickup' || o.status === 'out_for_delivery').length;
  const completedCount = sellerOrders.filter((o) => o.status === 'delivered').length;
  const cancelledCount = sellerOrders.filter((o) => o.status === 'cancelled').length;

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-6 sm:py-10 pb-28 md:pb-12">
        {/* Header Title */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Campus Orders & Meetups
          </h1>
          <p className="mt-1 text-xs sm:text-base text-muted-foreground font-medium">
            Manage active student orders, update progress, enter handover PINs, or cancel requests.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-4">
          <aside className="lg:block">
            <SellerSidebar />
          </aside>

          <div className="lg:col-span-3 space-y-5">
            {/* Quick Stat Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'confirmed' ? 'all' : 'confirmed')}
                className={cn(
                  'p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border text-left transition-all active:scale-95 shadow-2xs',
                  statusFilter === 'confirmed'
                    ? 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/20'
                    : 'border-border/80 bg-card hover:bg-secondary/40'
                )}
              >
                <div className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400">{confirmedCount}</div>
                <div className="text-xs text-muted-foreground font-semibold mt-0.5">Order Confirmed</div>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'processing' ? 'all' : 'processing')}
                className={cn(
                  'p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border text-left transition-all active:scale-95 shadow-2xs',
                  statusFilter === 'processing'
                    ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20'
                    : 'border-border/80 bg-card hover:bg-secondary/40'
                )}
              >
                <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{processingCount}</div>
                <div className="text-xs text-muted-foreground font-semibold mt-0.5">Processing / Prep</div>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'ready' ? 'all' : 'ready')}
                className={cn(
                  'p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border text-left transition-all active:scale-95 shadow-2xs',
                  statusFilter === 'ready'
                    ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20'
                    : 'border-border/80 bg-card hover:bg-secondary/40'
                )}
              >
                <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">{readyCount}</div>
                <div className="text-xs text-muted-foreground font-semibold mt-0.5">Ready for Pickup</div>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'delivered' ? 'all' : 'delivered')}
                className={cn(
                  'p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border text-left transition-all active:scale-95 shadow-2xs',
                  statusFilter === 'delivered'
                    ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                    : 'border-border/80 bg-card hover:bg-secondary/40'
                )}
              >
                <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{completedCount}</div>
                <div className="text-xs text-muted-foreground font-semibold mt-0.5">Completed</div>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID, student name, or item..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9.5 h-11 rounded-2xl bg-card border-border/80 text-xs sm:text-sm"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {[
                  { id: 'all', label: 'All Orders' },
                  { id: 'confirmed', label: 'Confirmed' },
                  { id: 'processing', label: 'Processing' },
                  { id: 'ready', label: 'Ready' },
                  { id: 'delivered', label: 'Completed' },
                  { id: 'cancelled', label: 'Cancelled' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={cn(
                      'px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all active:scale-95',
                      statusFilter === tab.id
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            {loaded && filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/90 bg-card/50 py-16 px-6 text-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
                  <ShoppingBag className="h-7 w-7" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">No orders matching filter</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
                  {search || statusFilter !== 'all'
                    ? 'Try switching your status filter or clearing search terms.'
                    : 'New campus orders for your products and gigs will appear here in real-time.'}
                </p>
                {statusFilter !== 'all' && (
                  <Button variant="outline" size="sm" onClick={() => setStatusFilter('all')} className="rounded-xl text-xs">
                    Show All Orders
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((order) => {
                  const sellerItems = order.items.filter((i) => {
                    const itemUser = i.sellerUsername?.toLowerCase() || '';
                    return (
                      itemUser === username ||
                      (isGuhanOrAdmin && (itemUser === 'guhan' || itemUser === 'guhan24td0781'))
                    );
                  });
                  const sellerTotal = sellerItems.reduce(
                    (s, i) => s + (i.discountPrice ?? i.price) * i.quantity, 0
                  );

                  const isDelivered = order.status === 'delivered';
                  const isCancelled = order.status === 'cancelled';
                  const isConfirmed = order.status === 'confirmed';
                  const isProcessing = order.status === 'processing';
                  const isReady = order.status === 'ready_for_pickup' || order.status === 'out_for_delivery';

                  return (
                    <div
                      key={order.id}
                      className={cn(
                        'rounded-3xl border bg-card p-4 sm:p-6 transition-all shadow-xs space-y-4',
                        isDelivered ? 'border-emerald-500/30 bg-emerald-500/5' :
                        isCancelled ? 'border-border/60 opacity-75 bg-secondary/20' :
                        'border-border/80 hover:border-primary/40 hover:shadow-md'
                      )}
                    >
                      {/* Top Order Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className={cn(
                            'flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl shrink-0 shadow-2xs',
                            isDelivered ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                            isCancelled ? 'bg-secondary text-muted-foreground' :
                            isProcessing ? 'bg-amber-500/15 text-amber-600' :
                            'bg-primary/10 text-primary'
                          )}>
                            <ShoppingBag className="h-5.5 w-5.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs sm:text-sm font-extrabold text-foreground truncate">
                                {order.id}
                              </span>
                              <Badge className={cn('text-xs font-bold px-2.5 py-0.5 rounded-full', statusColors[order.status])}>
                                {statusLabels[order.status]}
                              </Badge>
                            </div>
                            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 font-medium">
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                day: 'numeric', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                              {order.buyerName && ` • Buyer: ${order.buyerName}`}
                            </p>
                          </div>
                        </div>

                        {/* Earnings & View details */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                          <div className="text-left sm:text-right">
                            <span className="text-[11px] text-muted-foreground font-medium block leading-none">Your Earnings</span>
                            <span className="font-display text-lg sm:text-xl font-black text-foreground mt-0.5 block">
                              ₹{sellerTotal}
                            </span>
                          </div>
                          <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs font-bold text-primary">
                            <Link href={`/account/orders/${order.id}`}>
                              View Details
                              <ChevronRight className="h-3.5 w-3.5 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </div>

                      {/* Items Snapshot */}
                      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                        {sellerItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-2.5 rounded-2xl border border-border/70 bg-secondary/30 p-2.5 shrink-0">
                            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-secondary border border-border/50 shrink-0">
                              <Image src={item.image} alt={item.name} fill sizes="40px" className="object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground line-clamp-1 max-w-[150px]">{item.name}</p>
                              <p className="text-[11px] text-muted-foreground font-medium">Qty: {item.quantity} • ₹{(item.discountPrice ?? item.price) * item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Handover Spot Landmark */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/40 p-2.5 rounded-2xl border border-border/50">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium">
                          Campus Pickup Spot: <strong className="text-foreground">{order.pickupPoint || 'Central Library Entrance'}</strong>
                        </span>
                      </div>

                      {/* ACTION CONTROLS: Cancel, Processing, Confirmed, Enter PIN */}
                      {!isDelivered && !isCancelled && (
                        <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2.5">
                          {/* Quick Workflow Status Transition Buttons */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {isConfirmed && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => handleUpdateStatus(order.id, 'processing', e)}
                                className="rounded-xl text-xs font-bold h-9 px-3 gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                              >
                                <Clock className="h-3.5 w-3.5" />
                                Mark as Processing
                              </Button>
                            )}

                            {isProcessing && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => handleUpdateStatus(order.id, 'ready_for_pickup', e)}
                                  className="rounded-xl text-xs font-bold h-9 px-3 gap-1.5 border-indigo-500/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/10"
                                >
                                  <Package className="h-3.5 w-3.5" />
                                  Ready for Pickup
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => handleUpdateStatus(order.id, 'confirmed', e)}
                                  className="rounded-xl text-xs font-medium h-9 px-2.5 text-muted-foreground hover:text-foreground"
                                >
                                  Revert to Confirmed
                                </Button>
                              </>
                            )}

                            {isReady && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => handleUpdateStatus(order.id, 'processing', e)}
                                className="rounded-xl text-xs font-medium h-9 px-2.5 text-muted-foreground hover:text-foreground"
                              >
                                Back to Processing
                              </Button>
                            )}

                            {/* Cancel Request Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => handleOpenCancelModal(order, e)}
                              className="rounded-xl text-xs font-semibold h-9 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Cancel Request
                            </Button>
                          </div>

                          {/* Primary PIN Verification Button */}
                          <Button
                            size="sm"
                            onClick={(e) => handleOpenPinModal(order, e)}
                            className="btn-gradient-primary rounded-xl text-xs sm:text-sm font-extrabold h-10 px-4 gap-2 shadow-xs ml-auto"
                          >
                            <KeyRound className="h-4 w-4" />
                            Enter Handover PIN
                          </Button>
                        </div>
                      )}

                      {/* Completed / Cancelled Notice Banner */}
                      {isDelivered && (
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 pt-1">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>Handover verified with PIN and completed. Revenue credited to balance.</span>
                        </div>
                      )}

                      {isCancelled && (
                        <div className="flex items-center gap-2 text-xs font-bold text-destructive pt-1">
                          <XCircle className="h-4 w-4 shrink-0" />
                          <span>This request/order was cancelled.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {/* 1. Enter Handover Security PIN Dialog */}
      <Dialog open={pinModalOpen} onOpenChange={setPinModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader className="space-y-2 text-center sm:text-left">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <KeyRound className="h-5 w-5 text-primary" />
              Enter Handover Security PIN
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Ask the student buyer for their secret 4-digit Handover PIN to verify identity and release order payment.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-3">
              <div className="p-3 rounded-2xl bg-secondary/50 border border-border/60 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-foreground">{selectedOrder.id}</span>
                  <span className="text-primary font-black">₹{selectedOrder.total}</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate font-medium">
                  {selectedOrder.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                </p>
              </div>

              <div className="space-y-2 text-center">
                <Label htmlFor="pin-input" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  4-Digit Security PIN
                </Label>
                <Input
                  id="pin-input"
                  placeholder="0000"
                  maxLength={4}
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="text-center font-mono text-3xl tracking-[0.35em] font-black h-14 rounded-2xl bg-background border-2 border-primary/40 focus-visible:border-primary"
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground">
                  The buyer can find this PIN in their <strong>My Orders</strong> tab.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPinModalOpen(false)}
              className="rounded-2xl text-xs h-11 px-4 font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleVerifyPin}
              disabled={verifying || inputPin.length < 4}
              className="btn-gradient-primary rounded-2xl text-xs sm:text-sm h-11 px-6 font-bold shadow-xs"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying PIN...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1.5 stroke-[2.5]" />
                  Verify & Complete Handover
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Cancel Order Confirmation Dialog */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader className="space-y-2 text-center sm:text-left">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-destructive">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel Order Request?
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to cancel this order request? This will mark the order as cancelled and notify the student buyer.
            </DialogDescription>
          </DialogHeader>

          {orderToCancel && (
            <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs space-y-1 my-2">
              <div className="font-bold text-foreground">{orderToCancel.id}</div>
              <p className="text-muted-foreground truncate">
                {orderToCancel.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')} • ₹{orderToCancel.total}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelModalOpen(false)}
              className="rounded-2xl text-xs h-11 px-4 font-semibold"
            >
              Keep Order
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancelling}
              className="rounded-2xl text-xs sm:text-sm h-11 px-6 font-bold"
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
