'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Sparkles, Plus, Search, Clock, DollarSign, Send,
  User, CheckCircle2, MessageSquare, AlertCircle,
  ArrowRight, ShieldCheck, Tag,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  getAllProductRequests,
  createProductRequest,
  addRequestOffer,
  DEFAULT_CATEGORIES,
} from '@/lib/firebase-queries';
import type { ProductRequest, RequestOffer } from '@/lib/types';

export default function ProductRequestsPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProductRequest | null>(null);

  // Form States - Create Request
  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqCategory, setReqCategory] = useState(DEFAULT_CATEGORIES[0].name);
  const [reqBudget, setReqBudget] = useState('');
  const [reqDeadline, setReqDeadline] = useState('Within 3 days');
  const [submitting, setSubmitting] = useState(false);

  // Form States - Make Offer
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerCondition, setOfferCondition] = useState<string>('excellent');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllProductRequests();
      setRequests(data);
    } catch (e) {
      console.error('Failed to load requests:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();

    if (typeof window !== 'undefined') {
      window.addEventListener('campuscart_request_updated', loadRequests);
      window.addEventListener('storage', loadRequests);
      window.addEventListener('focus', loadRequests);

      return () => {
        window.removeEventListener('campuscart_request_updated', loadRequests);
        window.removeEventListener('storage', loadRequests);
        window.removeEventListener('focus', loadRequests);
      };
    }
  }, [loadRequests]);

  async function handleCreateRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) {
      toast({ title: 'Sign in required', description: 'Please sign in to post a request.', variant: 'destructive' });
      return;
    }
    if (!reqTitle.trim() || !reqDesc.trim()) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await createProductRequest({
        requesterId: user.uid,
        requesterName: profile.display_name,
        requesterUsername: profile.username,
        requesterAvatar: profile.avatar_url || '',
        requesterDepartment: profile.department || 'SVCET Student',
        requesterYear: profile.year || 'Student',
        title: reqTitle.trim(),
        description: reqDesc.trim(),
        category: reqCategory,
        budget: parseFloat(reqBudget) || 0,
        deadlineDate: reqDeadline,
      });

      toast({
        title: 'Request Posted! 📢',
        description: 'Your request is live for other campus students to respond.',
      });

      setCreateModalOpen(false);
      setReqTitle('');
      setReqDesc('');
      setReqBudget('');
      loadRequests();
    } catch (err: any) {
      toast({ title: 'Failed to post request', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMakeOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile || !selectedRequest) {
      toast({ title: 'Sign in required', description: 'Please sign in to make an offer.', variant: 'destructive' });
      return;
    }
    if (!offerPrice || !offerMessage.trim()) {
      toast({ title: 'Please enter your proposed price and message', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await addRequestOffer(selectedRequest.id, {
        requestId: selectedRequest.id,
        sellerId: user.uid,
        sellerName: profile.display_name,
        sellerUsername: profile.username,
        sellerAvatar: profile.avatar_url || '',
        sellerDepartment: profile.department || 'SVCET Student',
        price: parseFloat(offerPrice),
        message: offerMessage.trim(),
        condition: offerCondition as any,
      });

      toast({
        title: 'Offer Sent! 🤝',
        description: `Your offer has been submitted to ${selectedRequest.requesterName}.`,
      });

      setOfferModalOpen(false);
      setSelectedRequest(null);
      setOfferPrice('');
      setOfferMessage('');
      loadRequests();
    } catch (err: any) {
      toast({ title: 'Failed to submit offer', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchesSearch =
        !search ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.requesterName.toLowerCase().includes(search.toLowerCase()) ||
        r.category.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-8 sm:py-12 min-h-screen">
        {/* Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-3">
              <Sparkles className="h-4 w-4" />
              <span>Campus Student Request Board</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              What Campus Students Need
            </h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Looking for specific semester notes, engineering drafters, lab equipment, or project sensors? Post your request and classmates will offer their items.
            </p>
          </div>

          <Button
            onClick={() => {
              if (!user) {
                toast({ title: 'Sign in required', description: 'Please sign in to post requests.' });
                return;
              }
              setCreateModalOpen(true);
            }}
            className="rounded-2xl gap-2 h-12 px-6 shadow-sm shrink-0"
          >
            <Plus className="h-5 w-5" />
            Post a Request
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests by item name, department, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
              className="rounded-xl text-xs whitespace-nowrap"
            >
              All Requests ({requests.length})
            </Button>
            <Button
              variant={statusFilter === 'open' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('open')}
              className="rounded-xl text-xs whitespace-nowrap"
            >
              Open ({requests.filter((r) => r.status === 'open').length})
            </Button>
            <Button
              variant={statusFilter === 'offers_received' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('offers_received')}
              className="rounded-xl text-xs whitespace-nowrap"
            >
              Offers Received ({requests.filter((r) => r.status === 'offers_received').length})
            </Button>
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="mt-8 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-secondary/50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-border p-16 text-center bg-card/40">
            <Sparkles className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-display text-lg font-bold">No requests found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {search ? 'Try adjusting your search terms.' : 'Be the first student to post what you need on campus!'}
            </p>
            <Button onClick={() => setCreateModalOpen(true)} className="mt-5 rounded-xl">
              Post Your Request
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5">
            {filtered.map((req) => {
              const isOwnRequest = user?.uid === req.requesterId;
              const hasOffers = req.offers && req.offers.length > 0;

              return (
                <div
                  key={req.id}
                  className="rounded-3xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                    {/* User & Request Info */}
                    <div className="flex items-start gap-4 min-w-0">
                      <Avatar className="h-12 w-12 shrink-0 ring-2 ring-border">
                        <AvatarImage src={req.requesterAvatar} alt={req.requesterName} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {req.requesterName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="font-bold text-sm text-foreground">{req.requesterName}</span>
                          <span className="text-xs text-muted-foreground">• {req.requesterDepartment} ({req.requesterYear})</span>
                          <Badge variant="outline" className="text-[10px]">
                            {req.category}
                          </Badge>
                          <Badge
                            className={
                              req.status === 'open'
                                ? 'bg-success/10 text-success text-[10px]'
                                : req.status === 'offers_received'
                                ? 'bg-indigo-500/10 text-indigo-500 text-[10px]'
                                : 'bg-secondary text-muted-foreground text-[10px]'
                            }
                          >
                            {req.status === 'open' ? '🟢 Open' : req.status === 'offers_received' ? `⚡ ${req.offersCount} Offers` : req.status}
                          </Badge>
                        </div>

                        <h3 className="font-display text-lg font-bold text-foreground leading-snug">
                          {req.title}
                        </h3>

                        <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {req.description}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1 font-bold text-foreground">
                            <span>Max Budget:</span>
                            <span className="text-primary text-sm">₹{req.budget}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Needed by: <strong>{req.deadlineDate}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0 flex items-center gap-2 self-end md:self-start">
                      {!isOwnRequest ? (
                        <Button
                          onClick={() => {
                            setSelectedRequest(req);
                            setOfferModalOpen(true);
                          }}
                          className="rounded-xl gap-2 shadow-sm text-xs"
                        >
                          <DollarSign className="h-4 w-4" />
                          I Have This / Make Offer
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="px-3 py-1.5 text-xs font-semibold">
                          Your Request
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Offers Accordion / List if any */}
                  {hasOffers && (
                    <div className="mt-5 pt-4 border-t border-border/70">
                      <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                        <span>Submitted Offers ({req.offers?.length})</span>
                      </h4>
                      <div className="space-y-2.5">
                        {req.offers?.map((offer) => (
                          <div
                            key={offer.id}
                            className="rounded-2xl border border-secondary bg-secondary/20 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={offer.sellerAvatar} alt={offer.sellerName} />
                                <AvatarFallback className="text-xs">{offer.sellerName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground">{offer.sellerName}</span>
                                  <span className="font-bold text-primary">₹{offer.price}</span>
                                  {offer.condition && (
                                    <Badge variant="outline" className="text-[9px] capitalize">
                                      {offer.condition}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-muted-foreground text-xs mt-0.5">{offer.message}</p>
                              </div>
                            </div>

                            <Button asChild size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 self-end sm:self-center">
                              <Link href="/messages">
                                <MessageSquare className="h-3.5 w-3.5" />
                                Chat with Seller
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Create Request Modal */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="sm:max-w-lg rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Post a Product Request</DialogTitle>
              <DialogDescription>
                Tell classmates what item or notes you are searching for and your budget.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateRequest} className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Item Name / Title *</label>
                <Input
                  placeholder="e.g. Need Engineering Drawing Board & Mini Drafter"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Details / Specific Requirements *</label>
                <Textarea
                  placeholder="Mention subject, semester, brand, required condition, or lab specifications..."
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  rows={3}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Category</label>
                  <Select value={reqCategory} onValueChange={setReqCategory}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_CATEGORIES.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Max Budget (₹) *</label>
                  <Input
                    type="number"
                    placeholder="e.g. 500"
                    value={reqBudget}
                    onChange={(e) => setReqBudget(e.target.value)}
                    className="rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">When do you need it by?</label>
                <Input
                  placeholder="e.g. Tomorrow morning / Within 3 days"
                  value={reqDeadline}
                  onChange={(e) => setReqDeadline(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="rounded-xl text-xs gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  Publish Request
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Make Offer Modal */}
        <Dialog open={offerModalOpen} onOpenChange={setOfferModalOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-display">Make an Offer</DialogTitle>
              <DialogDescription>
                Respond to <strong>{selectedRequest?.requesterName}</strong> for "{selectedRequest?.title}".
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleMakeOffer} className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Your Price (₹) *</label>
                  <Input
                    type="number"
                    placeholder={`Budget: ₹${selectedRequest?.budget}`}
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Item Condition</label>
                  <Select value={offerCondition} onValueChange={setOfferCondition}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="like_new">Like New (Mint)</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good Condition</SelectItem>
                      <SelectItem value="fair">Fair / Functional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Message / Pickup Suggestion *</label>
                <Textarea
                  placeholder="e.g. I have this board from last semester. Can handover at Library lobby tomorrow."
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  rows={3}
                  className="rounded-xl"
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOfferModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="rounded-xl text-xs gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  Submit Offer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </>
  );
}
