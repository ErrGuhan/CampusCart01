'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Check, ChevronRight, MapPin, Truck, CreditCard,
  Shield, Loader2, ArrowLeft, ShoppingBag, Lock,
  QrCode, Copy, ExternalLink, Zap,
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/auth-provider';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useCart } from '@/components/cart-provider';
import { useToast } from '@/hooks/use-toast';
import {
  saveOrder, generateOrderId, generateTransactionId, generatePickupPin,
  CAMPUS_PICKUP_POINTS,
  type Order, type OrderItem, type OrderStatus,
} from '@/lib/order-storage';

const steps = ['Review', 'Fulfillment', 'Payment'] as const;
type Step = (typeof steps)[number];

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, subtotal, totalSavings, clearCart } = useCart();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('Review');
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('pickup');
  const [pickupPoint, setPickupPoint] = useState(CAMPUS_PICKUP_POINTS[0]);
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [processing, setProcessing] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');

  const deliveryFee = fulfillment === 'delivery' ? 30 : 0;
  const total = subtotal + deliveryFee;

  const collegeUpiId = 'guhan24td0781@svcet.ac.in';
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(collegeUpiId)}&pn=${encodeURIComponent('CampusCart SVCET')}&am=${total}&cu=INR&tn=${encodeURIComponent('CampusCart Order')}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(upiDeepLink)}`;

  function copyUpiId() {
    navigator.clipboard?.writeText(collegeUpiId);
    setCopiedUpi(true);
    toast({ title: 'UPI ID copied to clipboard!', description: collegeUpiId });
    setTimeout(() => setCopiedUpi(false), 2500);
  }

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

    await new Promise((resolve) => setTimeout(resolve, 1500));

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
      isDigital: item.isDigital,
      digitalFileUrl: item.digitalFileUrl,
    }));

    const pickupPin = generatePickupPin();

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
      pickupPin,
      notes: notes.trim() || null,
      paymentStatus: 'paid',
      paymentMethod: paymentMethod === 'upi' ? 'UPI' : 'Card',
      transactionId: generateTransactionId(),
      createdAt: new Date().toISOString(),
      buyerId: user?.uid || 'guest',
      buyerEmail: user?.email || '',
      buyerName: user?.displayName || user?.email?.split('@')[0] || 'Student',
    };

    saveOrder(order);

    try {
      await setDoc(doc(db, 'orders', order.id), {
        ...order,
        buyer_id: user?.uid || 'guest',
        buyer_email: user?.email || '',
        buyer_name: user?.displayName || user?.email?.split('@')[0] || 'Student',
      });
    } catch (err) {
      console.warn('Firestore order sync notice:', err);
    }

    clearCart();
    setProcessing(false);

    toast({
      title: 'Order placed successfully!',
      description: `Order ${order.id} confirmed. Your Security Pickup PIN is ${pickupPin}.`,
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

        <div className="flex items-center gap-1.5 sm:gap-2 mb-6 sm:mb-8 overflow-x-auto pb-1 scrollbar-none">
          {steps.map((s, idx) => (
            <div key={s} className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div
                className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  idx <= stepIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {idx < stepIndex ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : idx + 1}
              </div>
              <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${idx <= stepIndex ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                {s}
              </span>
              {idx < steps.length - 1 && (
                <div className={`h-px w-4 sm:w-12 ${idx < stepIndex ? 'bg-primary' : 'bg-border'}`} />
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
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary/50">
                        <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
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
                          <Label htmlFor="pickupPoint" className="text-xs text-muted-foreground mb-1 block">
                            Designated Campus Pickup Landmark
                          </Label>
                          <Select value={pickupPoint} onValueChange={setPickupPoint}>
                            <SelectTrigger id="pickupPoint" className="bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CAMPUS_PICKUP_POINTS.map((pt) => (
                                <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <QrCode className="h-5 w-5 text-primary" />
                          <div>
                            <div className="text-sm font-semibold flex items-center gap-2">
                              <span>UPI (Instant 0% Fee)</span>
                              <Badge className="bg-success text-white text-[10px] px-1.5 py-0">Recommended</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">Google Pay, PhonePe, Paytm, BHIM</div>
                          </div>
                        </div>
                        <span className="font-bold text-sm text-foreground">₹{total}</span>
                      </div>
                    </Label>
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="rounded-2xl border-2 border-primary/30 bg-card p-5 space-y-4 shadow-sm animate-in fade-in-50">
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        {/* Dynamic Live QR Code */}
                        <div className="relative bg-white p-3 rounded-2xl border shadow-md flex flex-col items-center shrink-0">
                          <div className="relative h-44 w-44">
                            <Image
                              src={qrCodeUrl}
                              alt="Scan UPI QR Code to Pay"
                              fill
                              unoptimized
                              className="object-contain rounded-lg"
                            />
                          </div>
                          <span className="mt-1.5 text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                            Scan to Pay ₹{total}
                          </span>
                        </div>

                        {/* UPI Details & DeepLink */}
                        <div className="flex-1 space-y-3 text-center sm:text-left">
                          <div>
                            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-1">
                              <Zap className="h-3 w-3" /> Direct Student-to-Student Settlement
                            </div>
                            <h4 className="font-display text-sm font-bold">SVCET Official Merchant VPA</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Scan this dynamic QR code with any UPI app on your phone, or copy the UPI ID below.
                            </p>
                          </div>

                          {/* Copy UPI ID Bar */}
                          <div className="flex items-center justify-between gap-2 bg-secondary/60 border border-border p-2.5 rounded-xl text-xs">
                            <span className="font-mono font-semibold truncate text-foreground">{collegeUpiId}</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2.5 text-xs font-semibold text-primary shrink-0"
                              onClick={copyUpiId}
                            >
                              {copiedUpi ? <><Check className="h-3.5 w-3.5 mr-1 text-success" /> Copied</> : <><Copy className="h-3.5 w-3.5 mr-1" /> Copy</>}
                            </Button>
                          </div>

                          {/* Quick Mobile UPI Intent Link */}
                          <div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full text-xs font-semibold h-8 border-primary/40 text-primary hover:bg-primary/10"
                              asChild
                            >
                              <a href={upiDeepLink}>
                                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                Pay via Installed UPI App
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Optional UTR Input */}
                      <div className="pt-3 border-t border-border/80 space-y-1.5">
                        <Label htmlFor="utr-ref" className="text-xs text-muted-foreground">
                          UPI Reference / UTR Number (Optional)
                        </Label>
                        <Input
                          id="utr-ref"
                          placeholder="e.g. 423871928472"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value)}
                          className="h-9 text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}

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
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-secondary/50">
                      <Image src={item.image} alt={item.name} fill sizes="40px" className="object-cover" />
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
