'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Check, ChevronRight, MapPin, Truck, CreditCard,
  Package, ArrowLeft, Copy, Clock,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  getOrderById, statusLabels, statusColors,
  type Order, type OrderStatus,
} from '@/lib/order-storage';

type Props = { params: Promise<{ id: string }> };

const lifecycleSteps: { status: OrderStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { status: 'confirmed', label: 'Confirmed', icon: Check },
  { status: 'processing', label: 'Processing', icon: Package },
  { status: 'ready_for_pickup', label: 'Ready for Pickup', icon: MapPin },
  { status: 'delivered', label: 'Delivered', icon: Truck },
];

export default function OrderDetailPage({ params }: Props) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setOrder(getOrderById(id));
    setLoaded(true);
  }, [id]);

  if (!loaded) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-7xl py-16">
          <div className="h-64 animate-pulse rounded-xl bg-secondary" />
        </main>
        <Footer />
      </>
    );
  }

  if (!order) notFound();

  const currentStepIndex = lifecycleSteps.findIndex((s) => s.status === order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';

  function copyOrderId() {
    if (!order) return;
    navigator.clipboard?.writeText(order.id);
    toast({ title: 'Order ID copied' });
  }

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-4xl py-8">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/account/orders" className="hover:text-foreground transition-colors">My Orders</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{order.id}</span>
        </nav>

        <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl font-bold tracking-tight">{order.id}</h1>
                <button onClick={copyOrderId} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Copy order ID">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              <div className="mt-2">
                <Badge className={`${statusColors[order.status]} hover:${statusColors[order.status]}`}>
                  {statusLabels[order.status]}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="font-display text-2xl font-bold">₹{order.total}</div>
            </div>
          </div>
        </div>

        {!isCancelled && (
          <div className="rounded-2xl border border-border bg-card p-6 mb-6">
            <h2 className="font-display text-base font-bold mb-6">Order Status</h2>
            <div className="flex items-center justify-between">
              {lifecycleSteps.map((step, idx) => {
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step.status} className="flex flex-1 flex-col items-center relative">
                    {idx > 0 && (
                      <div className={`absolute right-1/2 top-5 h-px w-full ${idx <= currentStepIndex ? 'bg-primary' : 'bg-border'}`} />
                    )}
                    <div
                      className={`relative flex h-10 w-10 items-center justify-center rounded-full z-10 transition-all ${
                        isCompleted
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground'
                      } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className={`mt-2 text-xs font-medium text-center ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold text-sm mb-4">Items in this order</h2>
              <div className="space-y-4">
                {order.items.map((item) => {
                  const itemPrice = item.discountPrice ?? item.price;
                  return (
                    <div key={item.id} className="flex gap-4">
                      <Link
                        href={`/products/${item.slug}`}
                        className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary/50"
                      >
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      </Link>
                      <div className="flex flex-1 flex-col">
                        <Link href={`/products/${item.slug}`} className="text-sm font-medium hover:text-primary transition-colors line-clamp-1">
                          {item.name}
                        </Link>
                        <Link href={`/seller/${item.sellerUsername}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                          by {item.sellerName}
                        </Link>
                        <div className="mt-auto flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                          <span className="text-sm font-semibold">₹{itemPrice * item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {order.notes && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-semibold text-sm mb-2">Order Notes</h2>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold text-sm mb-4">Payment Details</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={`${order.paymentStatus === 'paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                    {order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4" />
                    {order.paymentMethod}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs">{order.transactionId}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold text-sm mb-4">Fulfillment</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  {order.fulfillmentType === 'pickup' ? (
                    <><MapPin className="h-4 w-4 text-primary" /> Campus Pickup</>
                  ) : (
                    <><Truck className="h-4 w-4 text-primary" /> Campus Delivery</>
                  )}
                </div>
                {order.pickupPoint && (
                  <p className="text-muted-foreground">{order.pickupPoint}</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold text-sm mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{order.subtotal}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-success">-₹{order.discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery fee</span>
                  <span>{order.deliveryFee === 0 ? 'Free' : `₹${order.deliveryFee}`}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="font-display text-lg">₹{order.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
