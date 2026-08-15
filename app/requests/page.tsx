'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Sparkles, Plus, Search, Clock, DollarSign, Send,
  User, CheckCircle2, MessageSquare, AlertCircle,
  ArrowRight, ShieldCheck, Tag, X,
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
import { AuthPromptDialog } from '@/components/auth-prompt-dialog';
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
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [authPromptAction, setAuthPromptAction] = useState('Post a Request');

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
      <main className="container-px mx-auto max-w-7xl py-6 sm:py-10 min-h-screen">
        {/* Header Banner */}
        <div className="rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-card to-background p-5 sm:p-8 mb-6 sm:mb-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-0.5 text-xs font-bold text-emerald-600 mb-2">
                <Tag className="h-3.5 w-3.5" />
                <span>Campus Student Request Board</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                What Campus Students Need
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Looking for specific semester notes, engineering drafters, lab equipment, or project sensors? Post your request and classmates will offer their items.
              </p>
            </div>

            <Button
              onClick={() => {
                if (!user) {
                  setAuthPromptAction('Post a Request');
                  setAuthPromptOpen(true);
                  return;
                }
                setCreateModalOpen(true);
              }}
              className="rounded-2xl gap-2 h-11 px-5 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shrink-0 w-full sm:w-auto justify-center"
            >
              <Plus className="h-4 w-4" />
              Post a Request
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search requests by item name, department, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 h-10 rounded-xl bg-card text-xs border-border/80"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all select-none ${
                statusFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
              }`}
            >
              All Requests ({requests.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('open')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all select-none ${
                statusFilter === 'open'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
              }`}
            >
              Open ({requests.filter((r) => r.status === 'open').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('offers_received')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all select-none ${
                statusFilter === 'offers_received'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
              }`}
            >
              Offers ({requests.filter((r) => r.status === 'offers_received').length})
            </button>
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-secondary/50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-14 text-center bg-card/40 my-6">
            <Sparkles className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-display text-base font-bold">No requests found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {search ? 'Try adjusting your search terms.' : 'Be the first student to post what you need on campus!'}
            </p>
            <Button
              onClick={() => {
                if (!user) {
                  setAuthPromptAction('Post a Request');
                  setAuthPromptOpen(true);
                  return;
                }
                setCreateModalOpen(true);
              }}
              className="mt-5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Post Your Request
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((req) => {
              const isOwnRequest = user?.uid === req.requesterId;
              const hasOffers = req.offers && req.offers.length > 0;

              return (
                <div
                  key={req.id}
                  className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-4 sm:p-6 transition-all hover:border-emerald-500/30 hover:shadow-xs"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* User & Request Info */}
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                      <Avatar className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 ring-1 ring-border">
                        <AvatarImage src={req.requesterAvatar} alt={req.requesterName} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {req.requesterName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="font-bold text-xs sm:text-sm text-foreground">{req.requesterName}</span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">• {req.requesterDepartment}</span>
                          <Badge variant="outline" className="text-[9px]">
                            {req.category}
                          </Badge>
                          <Badge
                            className={
                              req.status === 'open'
                                ? 'bg-success/10 text-success text-[9px]'
                                : req.status === 'offers_received'
                                ? 'bg-indigo-500/10 text-indigo-500 text-[9px]'
                                : 'bg-secondary text-muted-foreground text-[9px]'
                            }
                          >
                            {req.status === 'open' ? '🟢 Open' : req.status === 'offers_received' ? `⚡ ${req.offersCount} Offers` : req.status}
                          </Badge>
                        </div>

                        <h3 className="font-display text-sm sm:text-base font-bold text-foreground leading-snug">
                          {req.title}
                        </h3>

                        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                          {req.description}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1 font-bold text-foreground">
                            <span>Max Budget:</span>
                            <span className="text-emerald-600 font-extrabold text-xs sm:text-sm">₹{req.budget}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>Needed by: <strong>{req.deadlineDate}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0 flex items-center gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
                      {!isOwnRequest ? (
                        <Button
                          onClick={() => {
                            if (!user) {
                              setAuthPromptAction('Make an Offer');
                              setAuthPromptOpen(true);
                              return;
                            }
                            setSelectedRequest(req);
                            setOfferModalOpen(true);
                          }}
                          className="w-full md:w-auto rounded-xl gap-1.5 font-bold text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                          Make an Offer
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
                    <div className="mt-4 pt-3 border-t border-border/60">
                      <h4 className="text-xs font-bold text-foreground mb-2.5">
                        Submitted Offers ({req.offers?.length})
                      </h4>
                      <div className="space-y-2">
                        {req.offers?.map((offer) => (
                          <div
                            key={offer.id}
                            className="rounded-xl border border-border/80 bg-secondary/30 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={offer.sellerAvatar} alt={offer.sellerName} />
                                <AvatarFallback className="text-[10px]">{offer.sellerName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-foreground">{offer.sellerName}</span>
                                  <span className="font-extrabold text-emerald-600">₹{offer.price}</span>
                                  {offer.condition && (
                                    <Badge variant="outline" className="text-[9px] capitalize">
                                      {offer.condition}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-muted-foreground text-[11px] mt-0.5">{offer.message}</p>
                              </div>
                            </div>

                            <Button asChild size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 h-7.5 self-end sm:self-center">
                              <Link href={`/messages?user=${offer.sellerId}&name=${encodeURIComponent(offer.sellerName)}`}>
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
          <DialogContent className="sm:max-w-lg rounded-3xl p-5 sm:p-6">
            <DialogHeader>
              <DialogTitle className="font-display text-lg sm:text-xl">Post a Product Request</DialogTitle>
              <DialogDescription className="text-xs">
                Tell classmates what item or notes you are searching for and your budget.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateRequest} className="space-y-3.5 py-1 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Item Name / Title *</label>
                <Input
                  placeholder="e.g. Need Engineering Drawing Board & Mini Drafter"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="rounded-xl h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Details / Specific Requirements *</label>
                <Textarea
                  placeholder="Mention subject, semester, brand, required condition, or lab specifications..."
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  rows={3}
                  className="rounded-xl text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Category</label>
                  <Select value={reqCategory} onValueChange={setReqCategory}>
                    <SelectTrigger className="rounded-xl h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {DEFAULT_CATEGORIES.map((c) => (
                        <SelectItem key={c.id} value={c.name} className="text-xs">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Max Budget (₹) *</label>
                  <Input
                    type="number"
                    placeholder="e.g. 500"
                    value={reqBudget}
                    onChange={(e) => setReqBudget(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">When do you need it by?</label>
                <Input
                  placeholder="e.g. Tomorrow morning / Within 3 days"
                  value={reqDeadline}
                  onChange={(e) => setReqDeadline(e.target.value)}
                  className="rounded-xl h-9 text-xs"
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl text-xs h-9"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="rounded-xl text-xs h-9 font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  Publish Request
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Make Offer Modal */}
        <Dialog open={offerModalOpen} onOpenChange={setOfferModalOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl p-5 sm:p-6">
            <DialogHeader>
              <DialogTitle className="font-display text-lg">Make an Offer</DialogTitle>
              <DialogDescription className="text-xs">
                Respond to <strong>{selectedRequest?.requesterName}</strong> for "{selectedRequest?.title}".
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleMakeOffer} className="space-y-3.5 py-1 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Your Price (₹) *</label>
                  <Input
                    type="number"
                    placeholder={`Budget: ₹${selectedRequest?.budget}`}
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="rounded-xl h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Item Condition</label>
                  <Select value={offerCondition} onValueChange={setOfferCondition}>
                    <SelectTrigger className="rounded-xl h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="like_new" className="text-xs">Like New (Mint)</SelectItem>
                      <SelectItem value="excellent" className="text-xs">Excellent</SelectItem>
                      <SelectItem value="good" className="text-xs">Good Condition</SelectItem>
                      <SelectItem value="fair" className="text-xs">Fair / Functional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Message / Handover Suggestion *</label>
                <Textarea
                  placeholder="e.g. I have this board from last semester. Can handover at Library counter tomorrow."
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  rows={3}
                  className="rounded-xl text-xs"
                  required
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOfferModalOpen(false)}
                  className="rounded-xl text-xs h-9"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="rounded-xl text-xs h-9 font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  Submit Offer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Auth Required Prompt Dialog */}
        <AuthPromptDialog
          isOpen={authPromptOpen}
          onClose={() => setAuthPromptOpen(false)}
          title="Sign In to Continue"
          description="You must be signed in with your college email to post requests or make offers to classmates."
          actionName={authPromptAction}
          redirectTo="/requests"
        />
      </main>
      <Footer />
    </>
  );
}
