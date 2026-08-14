'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package, ChevronRight, MapPin, Truck,
  ShoppingBag, ArrowRight,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getOrders, statusLabels, statusColors, type Order } from '@/lib/order-storage';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setOrders(getOrders());
    setLoaded(true);
  }, []);

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

  if (orders.length === 0) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-7xl py-16">
          <div className="flex flex-col items-center justify-center text-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-6">
              <Package className="h-10 w-10" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight">No orders yet</h1>
            <p className="mt-2 text-muted-foreground max-w-sm">
              When you place your first order, it will show up here with tracking and details.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/products">
                Start Shopping
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
      <main className="container-px mx-auto max-w-7xl py-8">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">My Orders</span>
        </nav>

        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">My Orders</h1>
          <p className="mt-1.5 text-muted-foreground">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} placed
          </p>
        </div>

        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="group block rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground shrink-0">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{order.id}</h3>
                      <Badge className={`${statusColors[order.status]} hover:${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
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
                      <span>{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="font-display text-lg font-bold">₹{order.total}</div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide">
                {order.items.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary/50"
                  >
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                ))}
                {order.items.length > 5 && (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-xs font-medium text-muted-foreground">
                    +{order.items.length - 5}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <Button variant="outline" asChild>
            <Link href="/products">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
