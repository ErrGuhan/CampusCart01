'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Clock, RotateCcw, CheckCircle2, Star, ShieldCheck,
  Send, Sparkles, MessageSquare, ArrowLeft, Loader2,
} from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { getGigBySlug } from '@/lib/firebase-queries';
import type { ServiceGig } from '@/lib/types';

export default function GigDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const slug = params?.slug as string;
  const [gig, setGig] = useState<ServiceGig | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [requirements, setRequirements] = useState('');
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    if (slug) {
      getGigBySlug(slug)
        .then((data) => {
          setGig(data || null);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [slug]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-5xl py-16">
          <div className="h-96 animate-pulse rounded-2xl bg-secondary/50" />
        </main>
        <Footer />
      </>
    );
  }

  if (!gig) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-5xl py-24 text-center">
          <h2 className="text-2xl font-bold">Freelance Gig Not Found</h2>
          <p className="mt-2 text-muted-foreground">This service listing may have been moved or paused.</p>
          <Button className="mt-6" asChild>
            <Link href="/services">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Freelance Services
            </Link>
          </Button>
        </main>
        <Footer />
      </>
    );
  }

  const initials = gig.seller.displayName
    ? gig.seller.displayName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'CC';

  async function handleHire() {
    if (!gig) return;
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in with your college account to place an order.',
      });
      router.push('/login');
      return;
    }

    if (!requirements.trim()) {
      toast({
        title: 'Project requirements needed',
        description: 'Please share a few details about what you need done.',
        variant: 'destructive',
      });
      return;
    }

    setOrdering(true);
    const orderData = {
      id: 'gord_' + Date.now(),
      gigId: gig.id,
      gigTitle: gig.title,
      sellerId: gig.sellerId,
      sellerName: gig.seller.displayName,
      buyerId: user.uid,
      buyerName: profile?.display_name || user.email?.split('@')[0],
      buyerEmail: user.email,
      price: gig.startingPrice,
      requirements: requirements.trim(),
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    try {
      const stored = localStorage.getItem('campuscart_gig_orders');
      const list = stored ? JSON.parse(stored) : [];
      list.push(orderData);
      localStorage.setItem('campuscart_gig_orders', JSON.stringify(list));
    } catch {}

    try {
      await addDoc(collection(db, 'gig_orders'), orderData);
    } catch (err: any) {
      console.warn('Firestore gig order notice:', err);
    }

    toast({
      title: 'Order submitted to freelancer! 🎉',
      description: `${gig.seller.displayName} will review your request and coordinate with you.`,
    });

    setOrderModalOpen(false);
    setRequirements('');
    setOrdering(false);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-8 sm:py-12">
        <div className="container-px mx-auto max-w-6xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
            <Link href="/services" className="hover:text-foreground">Freelance Services</Link>
            <span>/</span>
            <span>{gig.category}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Details (Left 2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-3">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  {gig.category}
                </Badge>
                <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight">
                  {gig.title}
                </h1>
              </div>

              {/* Freelancer Header */}
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card">
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarImage src={gig.seller.avatar} alt={gig.seller.displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/seller/${gig.seller.username}`}
                      className="font-semibold text-sm hover:text-primary transition-colors"
                    >
                      {gig.seller.displayName}
                    </Link>
                    {gig.isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {gig.seller.department || 'Student Creator'} • Year {gig.seller.year || '2026'}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/seller/${gig.seller.username}`}>View Portfolio</Link>
                </Button>
              </div>

              {/* Cover Image */}
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border bg-secondary/30">
                <img
                  src={gig.coverImage}
                  alt={gig.title}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Description */}
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h2 className="font-display text-lg font-bold">About This Freelance Service</h2>
                <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {gig.description || 'Custom student service provided with personalized requirements.'}
                </div>

                {/* Tags */}
                {gig.tags && gig.tags.length > 0 && (
                  <div className="pt-4 border-t border-border flex flex-wrap gap-2">
                    {gig.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs rounded-lg bg-secondary px-2.5 py-1 text-muted-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pricing & Order Card (Right col) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-md space-y-6">
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Starting Package</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-display text-3xl font-extrabold">₹{gig.startingPrice}</span>
                    <span className="text-xs text-muted-foreground">/ project</span>
                  </div>
                </div>

                <div className="space-y-3 border-y border-border py-4 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-foreground font-medium">
                      <Clock className="h-4 w-4 text-primary" /> Delivery Time
                    </span>
                    <span>{gig.deliveryTimeDays} {gig.deliveryTimeDays === 1 ? 'Day' : 'Days'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-foreground font-medium">
                      <RotateCcw className="h-4 w-4 text-primary" /> Revisions
                    </span>
                    <span>{gig.revisions} Revisions Included</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-foreground font-medium">
                      <ShieldCheck className="h-4 w-4 text-primary" /> Verification
                    </span>
                    <span className="text-success font-medium">SVCET Verified</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    size="lg"
                    className="w-full rounded-xl shadow-md font-semibold text-sm"
                    onClick={() => setOrderModalOpen(true)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Hire This Student
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl text-xs"
                    asChild
                  >
                    <Link href={`/seller/${gig.seller.username}`}>
                      <MessageSquare className="h-3.5 w-3.5 mr-2" />
                      Contact Freelancer
                    </Link>
                  </Button>
                </div>

                <div className="rounded-xl bg-secondary/50 p-3 text-[11px] text-muted-foreground text-center">
                  🛡️ 100% Peer-to-Peer Campus Delivery. Funds verified upon project completion.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Hire Action Bar */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 bg-background/95 backdrop-blur-xl border-t border-border/80 p-2.5 shadow-2xl animate-fade-in-up">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground font-medium">Starting from</span>
            <span className="font-display text-lg font-extrabold text-foreground">₹{gig.startingPrice}</span>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <Button
              size="sm"
              variant="outline"
              asChild
              className="rounded-xl h-10 px-3 text-xs"
              aria-label="Contact freelancer"
            >
              <Link href={`/seller/${gig.seller.username}`}>
                <MessageSquare className="h-4 w-4 text-primary" />
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={() => setOrderModalOpen(true)}
              className="rounded-xl h-10 px-4 text-xs font-bold flex-1 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Hire Student
            </Button>
          </div>
        </div>
      </div>

      <Footer />

      {/* Hire Modal */}
      <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hire {gig.seller.displayName}</DialogTitle>
            <DialogDescription>
              Submit your project brief and requirements. Turnaround time is ~{gig.deliveryTimeDays} days.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 rounded-xl bg-secondary/50 flex items-center justify-between text-xs font-semibold">
              <span>{gig.title}</span>
              <span className="text-primary font-bold">₹{gig.startingPrice}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reqs" className="text-xs font-semibold">Project Brief & Instructions *</Label>
              <Textarea
                id="reqs"
                placeholder="Explain what you need: color themes, club details, required deadline, file formats, or links to references..."
                rows={4}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleHire} disabled={ordering}>
              {ordering ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : 'Confirm & Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
