'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Minus, Plus, Trash2, ShoppingBag, ArrowRight,
  MapPin, Truck, Shield, ChevronRight,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useCart } from '@/components/cart-provider';
import { useToast } from '@/hooks/use-toast';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart, subtotal, totalSavings, totalItems } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [fulfillment, setFulfillment] = useState('pickup');

  const deliveryFee = fulfillment === 'delivery' ? 30 : 0;
  const total = subtotal + deliveryFee;

  function handleCheckout() {
    router.push('/checkout');
  }

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-7xl py-16">
          <div className="flex flex-col items-center justify-center text-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-6">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Your cart is empty</h1>
            <p className="mt-2 text-muted-foreground max-w-sm">
              Looks like you haven't added any products yet. Explore what your campus creates!
            </p>
            <Button className="mt-6" asChild>
              <Link href="/products">
                Browse Products
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
          <span className="text-foreground">Cart</span>
        </nav>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold tracking-tight">Shopping Cart</h1>
          <span className="text-sm text-muted-foreground">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const itemPrice = item.discountPrice ?? item.price;
              const hasDiscount = item.discountPrice !== undefined;

              return (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-xl border border-border bg-card p-4"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary/50"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </Link>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/products/${item.slug}`}
                          className="text-sm font-semibold hover:text-primary transition-colors line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <Link
                          href={`/seller/${item.sellerUsername}`}
                          className="mt-0.5 block text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          by {item.sellerName}
                        </Link>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors shrink-0"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-auto flex items-end justify-between pt-2">
                      <div className="flex items-center rounded-lg border border-input">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        {hasDiscount && (
                          <div className="text-xs text-muted-foreground line-through">
                            ₹{item.price * item.quantity}
                          </div>
                        )}
                        <div className="text-base font-bold">
                          ₹{itemPrice * item.quantity}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={clearCart}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear cart
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/products">
                  Continue Shopping
                </Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-6 space-y-5">
              <h2 className="font-display text-lg font-bold">Order Summary</h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{subtotal}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">You save</span>
                    <span className="font-medium text-success">-₹{totalSavings}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Delivery fee</span>
                  <span className="font-medium">
                    {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Fulfillment</h3>
                <RadioGroup value={fulfillment} onValueChange={setFulfillment}>
                  <div className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/50">
                    <RadioGroupItem value="pickup" id="pickup" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="pickup" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" />
                        Campus Pickup
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Main Block Pickup Counter · Free
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/50">
                    <RadioGroupItem value="delivery" id="delivery" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="delivery" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-primary" />
                        Campus Delivery
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Seller-managed · ₹30
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-display text-2xl font-bold">₹{total}</span>
              </div>

              <Button size="lg" className="w-full" onClick={handleCheckout}>
                Proceed to Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-primary" />
                Secure checkout · Verified student sellers
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Checkout Bar */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 bg-background/95 backdrop-blur-xl border-t border-border/80 p-2.5 shadow-2xl animate-fade-in-up">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div>
            <span className="text-[10px] text-muted-foreground block">Total ({totalItems} items)</span>
            <span className="font-display text-lg font-bold text-foreground">₹{total}</span>
          </div>
          <Button size="sm" className="rounded-xl px-5 h-10 text-xs font-bold shadow-sm" onClick={handleCheckout}>
            Checkout
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Footer />
    </>
  );
}
