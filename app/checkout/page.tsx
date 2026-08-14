'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Check, ChevronRight, MapPin, Truck, CreditCard,
  Shield, Loader2, ArrowLeft, ShoppingBag, Lock,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/components/cart-provider';
import { useToast } from '@/hooks/use-toast';
import {
  saveOrder, generateOrderId, generateTransactionId,
  type Order, type OrderItem, type OrderStatus,
} from '@/lib/order-storage';

const steps = ['Review', 'Fulfillment', 'Payment'] as const;
type Step = (typeof steps)[number];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, totalSavings, clearCart } = useCart();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('Review');
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('pickup');
  const [pickupPoint, setPickupPoint] = useState('Main Block Pickup Counter');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [processing, setProcessing] = useState(false);

  const deliveryFee = fulfillment === 'delivery' ? 30 : 0;
  const total = subtotal + deliveryFee;

  const stepIndex = steps.indexOf(step);

  if (items.length === 0 && !processing) {
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
              Add some products to your cart before checking out.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  function goToNextStep() {
    if (step === 'Review') setStep('Fulfillment');
    else if (step === 'Fulfillment') {
      if (fulfillment === 'delivery' && !deliveryLocation.trim()) {
        toast({
          title: 'Delivery location required',
          description: 'Please enter your campus delivery location.',
          variant: 'destructive',
        });
        return;
      }
      setStep('Payment');
    }
  }

  function goToPrevStep() {
    if (step === 'Fulfillment') setStep('Review');
    else if (step === 'Payment') setStep('Fulfillment');
  }

  async function handlePlaceOrder() {
    setProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 1800));

    const orderItems: OrderItem[] = items.map((item) => ({
      id: item.id,
      productId: item.id,
      slug: item.slug,
      name: item.name,
      image: item.image,
      price: item.price,
      discountPrice: item.discountPrice,
      quantity: item.quantity,
      sellerName: item.sellerName,
      sellerUsername: item.sellerUsername,
    }));

    const order: Order = {
      id: generateOrderId(),
      status: 'confirmed' as OrderStatus,
      items: orderItems,
      subtotal,
      discount: totalSavings,
      deliveryFee,
      total,
      fulfillmentType: fulfillment,
      pickupPoint: fulfillment === 'pickup' ? pickupPoint : null,
      notes: notes.trim() || null,
      paymentStatus: 'paid',
      paymentMethod: paymentMethod === 'upi' ? 'UPI' : 'Card',
      transactionId: generateTransactionId(),
      createdAt: new Date().toISOString(),
    };

    saveOrder(order);
    clearCart();
    setProcessing(false);

    toast({
      title: 'Order placed successfully!',
      description: `Order ${order.id} has been confirmed.`,
    });

    router.push(`/account/orders/${order.id}`);
  }

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-5xl py-8">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/cart" className="hover:text-foreground transition-colors">Cart</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Checkout</span>
        </nav>

        <h1 className="font-display text-3xl font-bold tracking-tight mb-6">Checkout</h1>

        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, idx) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                  idx <= stepIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {idx < stepIndex ? <Check className="h-4 w-4" /> : idx + 1}
              </div>
              <span className={`text-sm font-medium ${idx <= stepIndex ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s}
              </span>
              {idx < steps.length - 1 && (
                <div className={`h-px w-8 sm:w-12 ${idx < stepIndex ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {step === 'Review' && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold">Review Your Items</h2>
                {items.map((item) => {
                  const itemPrice = item.discountPrice ?? item.price;
                  return (
                    <div key={item.id} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary/50">
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <Link href={`/products/${item.slug}`} className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1">
                          {item.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">by {item.sellerName}</p>
                        <div className="mt-auto flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                          <div className="text-right">
                            {item.discountPrice && (
                              <span className="text-xs text-muted-foreground line-through mr-2">
                                ₹{item.price * item.quantity}
                              </span>
                            )}
                            <span className="text-base font-bold">₹{itemPrice * item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Button onClick={goToNextStep} size="lg" className="w-full">
                  Continue to Fulfillment
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {step === 'Fulfillment' && (
              <div className="space-y-6">
                <h2 className="font-display text-lg font-bold">Fulfillment Options</h2>

                <RadioGroup value={fulfillment} onValueChange={(v) => setFulfillment(v as 'pickup' | 'delivery')}>
                  <div className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${fulfillment === 'pickup' ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'}`}>
                    <RadioGroupItem value="pickup" id="checkout-pickup" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="checkout-pickup" className="text-sm font-semibold cursor-pointer flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        Campus Pickup — Free
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pick up your order at a designated campus pickup point.
                      </p>
                      {fulfillment === 'pickup' && (
                        <div className="mt-3">
                          <Label htmlFor="pickupPoint" className="text-xs text-muted-foreground">Pickup point</Label>
                          <Input
                            id="pickupPoint"
                            value={pickupPoint}
                            onChange={(e) => setPickupPoint(e.target.value)}
                            className="mt-1"
                            placeholder="e.g., Main Block Pickup Counter"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${fulfillment === 'delivery' ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'}`}>
                    <RadioGroupItem value="delivery" id="checkout-delivery" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="checkout-delivery" className="text-sm font-semibold cursor-pointer flex items-center gap-2">
                        <Truck className="h-4 w-4 text-primary" />
                        Campus Delivery — ₹30
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Seller-managed delivery to your campus location.
                      </p>
                      {fulfillment === 'delivery' && (
                        <div className="mt-3">
                          <Label htmlFor="deliveryLocation" className="text-xs text-muted-foreground">Delivery location</Label>
                          <Input
                            id="deliveryLocation"
                            value={deliveryLocation}
                            onChange={(e) => setDeliveryLocation(e.target.value)}
                            className="mt-1"
                            placeholder="e.g., Hostel Block C, Room 204"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </RadioGroup>

                <div>
                  <Label htmlFor="notes" className="text-sm font-medium">Order Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1.5"
                    placeholder="Any special instructions for the seller..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={goToPrevStep} size="lg">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={goToNextStep} size="lg" className="flex-1">
                    Continue to Payment
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 'Payment' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-lg font-bold">Payment Method</h2>
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
                    <Lock className="h-4 w-4 text-warning shrink-0" />
                    <p className="text-xs text-warning">
                      This is a sandbox/mock payment for demonstration. No real charges will be made.
                    </p>
                  </div>
                </div>

                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className={`flex items-center gap-3 rounded-xl border p-4 transition-colors ${paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'}`}>
                    <RadioGroupItem value="upi" id="pay-upi" />
                    <Label htmlFor="pay-upi" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <div>
                          <div className="text-sm font-semibold">UPI</div>
                          <div className="text-xs text-muted-foreground">Pay via UPI app (Google Pay, PhonePe, etc.)</div>
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className={`flex items-center gap-3 rounded-xl border p-4 transition-colors ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'}`}>
                    <RadioGroupItem value="card" id="pay-card" />
                    <Label htmlFor="pay-card" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <div>
                          <div className="text-sm font-semibold">Credit / Debit Card</div>
                          <div className="text-xs text-muted-foreground">Visa, Mastercard, RuPay</div>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {processing && (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-secondary/30 py-12">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <h3 className="font-semibold">Processing your payment...</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Please don't close this page.</p>
                  </div>
                )}

                {!processing && (
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={goToPrevStep} size="lg">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button onClick={handlePlaceOrder} size="lg" className="flex-1">
                      <Shield className="h-4 w-4 mr-2" />
                      Place Order — ₹{total}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-6 space-y-4">
              <h3 className="font-display text-base font-bold">Order Summary</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{subtotal}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">You save</span>
                    <span className="font-medium text-success">-₹{totalSavings}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-medium">{deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-display text-xl font-bold">₹{total}</span>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Items ({items.length})</p>
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-xs">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-secondary/50">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <span className="line-clamp-1 text-muted-foreground">{item.name} × {item.quantity}</span>
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
