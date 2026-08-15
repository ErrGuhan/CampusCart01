'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Clock,
  Package, Sparkles, Store, Users, ExternalLink, RefreshCw,
  Search, Eye, AlertCircle, Check, X, FileText, ArrowRight,
  Filter, Tag, DollarSign, MapPin, Download, AlertTriangle,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  getAllProductsAdmin,
  getAllGigsAdmin,
  getAllSellers,
  approveProduct,
  rejectProduct,
  approveGig,
  rejectGig,
} from '@/lib/firebase-queries';
import type { Product, ServiceGig, Seller } from '@/lib/types';

export default function AdminDashboardPage() {
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [gigs, setGigs] = useState<ServiceGig[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Search and filters
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'pending_approval' | 'active' | 'rejected'>('pending_approval');

  const [gigSearch, setGigSearch] = useState('');
  const [gigStatusFilter, setGigStatusFilter] = useState<'all' | 'pending_approval' | 'active' | 'rejected'>('pending_approval');

  // Review Dialogs
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [rejectProductModalOpen, setRejectProductModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

  const [selectedGig, setSelectedGig] = useState<ServiceGig | null>(null);
  const [rejectGigModalOpen, setRejectGigModalOpen] = useState(false);
  const [gigRejectReason, setGigRejectReason] = useState('');

  const loadAdminData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [prodsData, gigsData, sellersData] = await Promise.all([
        getAllProductsAdmin(),
        getAllGigsAdmin(),
        getAllSellers(),
      ]);
      setProducts(prodsData);
      setGigs(gigsData);
      setSellers(sellersData);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();

    if (typeof window !== 'undefined') {
      window.addEventListener('campuscart_product_updated', loadAdminData);
      window.addEventListener('campuscart_gig_updated', loadAdminData);
      window.addEventListener('campuscart_seller_updated', loadAdminData);
      window.addEventListener('storage', loadAdminData);
      window.addEventListener('focus', loadAdminData);

      return () => {
        window.removeEventListener('campuscart_product_updated', loadAdminData);
        window.removeEventListener('campuscart_gig_updated', loadAdminData);
        window.removeEventListener('campuscart_seller_updated', loadAdminData);
        window.removeEventListener('storage', loadAdminData);
        window.removeEventListener('focus', loadAdminData);
      };
    }
  }, [loadAdminData]);

  // Product Actions with optimistic UI updates
  async function handleApproveProduct(product: Product) {
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, status: 'active', isVerified: true } : p))
    );
    setActionInProgress(true);
    try {
      await approveProduct(product.id);
      toast({
        title: 'Product Approved & Live! 🎉',
        description: `"${product.name}" is now live on the public marketplace.`,
      });
      loadAdminData();
    } catch (err: any) {
      toast({ title: 'Approval failed', variant: 'destructive' });
      loadAdminData();
    } finally {
      setActionInProgress(false);
    }
  }

  async function handleRejectProduct() {
    if (!selectedProduct) return;
    const targetId = selectedProduct.id;
    const reason = rejectReason.trim() || 'Product details need revision before marketplace approval.';
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === targetId ? { ...p, status: 'rejected', isVerified: false, rejectionReason: reason } : p))
    );
    setRejectProductModalOpen(false);
    setSelectedProduct(null);
    setRejectReason('');

    setActionInProgress(true);
    try {
      await rejectProduct(targetId, reason);
      toast({
        title: 'Revision Requested',
        description: `Seller notified with review feedback.`,
      });
      loadAdminData();
    } catch (err: any) {
      toast({ title: 'Rejection failed', variant: 'destructive' });
      loadAdminData();
    } finally {
      setActionInProgress(false);
    }
  }

  // Gig Actions with optimistic UI updates
  async function handleApproveGig(gig: ServiceGig) {
    // Optimistic update
    setGigs((prev) =>
      prev.map((g) => (g.id === gig.id ? { ...g, status: 'active', isVerified: true } : g))
    );
    setActionInProgress(true);
    try {
      await approveGig(gig.id);
      toast({
        title: 'Freelance Gig Approved! ✨',
        description: `"${gig.title}" is now active in the campus services catalog.`,
      });
      loadAdminData();
    } catch (err: any) {
      toast({ title: 'Approval failed', variant: 'destructive' });
      loadAdminData();
    } finally {
      setActionInProgress(false);
    }
  }

  async function handleRejectGig() {
    if (!selectedGig) return;
    const targetId = selectedGig.id;
    const reason = gigRejectReason.trim() || 'Gig details require modification.';
    // Optimistic update
    setGigs((prev) =>
      prev.map((g) => (g.id === targetId ? { ...g, status: 'rejected', isVerified: false, rejectionReason: reason } : g))
    );
    setRejectGigModalOpen(false);
    setSelectedGig(null);
    setGigRejectReason('');

    setActionInProgress(true);
    try {
      await rejectGig(targetId, reason);
      toast({
        title: 'Gig Revision Requested',
        description: `Creator notified with review feedback.`,
      });
      loadAdminData();
    } catch (err: any) {
      toast({ title: 'Rejection failed', variant: 'destructive' });
      loadAdminData();
    } finally {
      setActionInProgress(false);
    }
  }

  // Calculations
  const pendingProducts = useMemo(() => products.filter((p) => p.status === 'pending_approval'), [products]);
  const activeProducts = useMemo(() => products.filter((p) => p.status === 'active'), [products]);
  const rejectedProducts = useMemo(() => products.filter((p) => p.status === 'rejected'), [products]);

  const pendingGigs = useMemo(() => gigs.filter((g) => g.status === 'pending_approval'), [gigs]);
  const activeGigs = useMemo(() => gigs.filter((g) => g.status === 'active'), [gigs]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !productSearch ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.seller?.displayName?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase());

      const matchesStatus =
        productStatusFilter === 'all' || p.status === productStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [products, productSearch, productStatusFilter]);

  const filteredGigs = useMemo(() => {
    return gigs.filter((g) => {
      const matchesSearch =
        !gigSearch ||
        g.title.toLowerCase().includes(gigSearch.toLowerCase()) ||
        g.seller?.displayName?.toLowerCase().includes(gigSearch.toLowerCase()) ||
        g.category.toLowerCase().includes(gigSearch.toLowerCase());

      const matchesStatus =
        gigStatusFilter === 'all' || g.status === gigStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [gigs, gigSearch, gigStatusFilter]);

  if (authLoading) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-7xl py-16">
          <div className="h-64 animate-pulse rounded-2xl bg-secondary" />
        </main>
        <Footer />
      </>
    );
  }

  // Unauthorized screen
  if (!isAdmin) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-4xl py-20">
          <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
              <ShieldAlert className="h-9 w-9" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Admin Access Restricted</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              This panel is exclusively reserved for CampusCart Administrator (<strong>guhan24td0781@svcet.ac.in</strong>) to review, verify originality, and approve student listings.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild className="rounded-xl">
                <Link href="/login">Sign In with Admin Account</Link>
              </Button>
              <Button variant="outline" asChild className="rounded-xl">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-6 sm:py-8 min-h-screen w-full min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 sm:pb-8 border-b border-border w-full min-w-0">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-2">
              <ShieldCheck className="h-4 w-4" />
              <span>CampusCart Admin Authority</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground break-words">
              Product & Quality Approval Center
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Review student submissions, maintain campus originality standards, and approve marketplace listings.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAdminData}
              disabled={dataLoading}
              className="rounded-xl gap-1.5 text-xs h-9"
            >
              <RefreshCw className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} />
              Refresh Feed
            </Button>
            <Button asChild size="sm" className="rounded-xl gap-1.5 text-xs h-9">
              <Link href="/products">
                <ExternalLink className="h-4 w-4" />
                Live Marketplace
              </Link>
            </Button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4 w-full min-w-0">
          <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Pending Products</span>
              <Clock className="h-4 w-4 text-warning" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-warning">
              {pendingProducts.length}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Awaiting your approval</p>
          </div>

          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Pending Gigs</span>
              <Sparkles className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-indigo-500">
              {pendingGigs.length}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Freelance services to review</p>
          </div>

          <div className="rounded-2xl border border-success/30 bg-success/5 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Live Products</span>
              <Package className="h-4 w-4 text-success" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-success">
              {activeProducts.length}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Published in marketplace</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Campus Creators</span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {sellers.length}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Registered student sellers</p>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="mt-8 sm:mt-10">
          <Tabs defaultValue="products" className="w-full">
            <div className="w-full overflow-x-auto pb-1 mb-6 scrollbar-none">
              <TabsList className="bg-secondary/50 p-1 rounded-2xl inline-flex w-auto min-w-full sm:w-auto h-auto gap-1">
                <TabsTrigger value="products" className="rounded-xl text-xs gap-1.5 py-2 px-3 whitespace-nowrap">
                  <Package className="h-3.5 w-3.5 shrink-0" />
                  Product Submissions ({pendingProducts.length > 0 ? `🔥 ${pendingProducts.length} Pending` : products.length})
                </TabsTrigger>
                <TabsTrigger value="gigs" className="rounded-xl text-xs gap-1.5 py-2 px-3 whitespace-nowrap">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  Freelance Gigs ({pendingGigs.length > 0 ? `🔥 ${pendingGigs.length} Pending` : gigs.length})
                </TabsTrigger>
                <TabsTrigger value="creators" className="rounded-xl text-xs gap-1.5 py-2 px-3 whitespace-nowrap">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  Student Creators ({sellers.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: PRODUCT APPROVALS */}
            <TabsContent value="products" className="space-y-6 mt-0">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by product name, category, or student creator..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <Button
                    variant={productStatusFilter === 'pending_approval' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProductStatusFilter('pending_approval')}
                    className="rounded-xl text-xs whitespace-nowrap"
                  >
                    Pending Review ({pendingProducts.length})
                  </Button>
                  <Button
                    variant={productStatusFilter === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProductStatusFilter('active')}
                    className="rounded-xl text-xs whitespace-nowrap"
                  >
                    Active / Approved ({activeProducts.length})
                  </Button>
                  <Button
                    variant={productStatusFilter === 'rejected' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProductStatusFilter('rejected')}
                    className="rounded-xl text-xs whitespace-nowrap"
                  >
                    Needs Revision ({rejectedProducts.length})
                  </Button>
                  <Button
                    variant={productStatusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProductStatusFilter('all')}
                    className="rounded-xl text-xs whitespace-nowrap"
                  >
                    All ({products.length})
                  </Button>
                </div>
              </div>

              {/* Products List */}
              {filteredProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-success/50 mx-auto mb-3" />
                  <h3 className="font-display text-base font-bold">All caught up!</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    No products currently matching this filter status.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredProducts.map((product) => {
                    const isPending = product.status === 'pending_approval';
                    const isRejected = product.status === 'rejected';
                    const isLive = product.status === 'active';

                    return (
                      <div
                        key={product.id}
                        className={`rounded-2xl border bg-card p-5 sm:p-6 transition-all ${
                          isPending
                            ? 'border-warning/40 shadow-sm bg-warning/[0.02]'
                            : isRejected
                            ? 'border-destructive/30 bg-destructive/[0.01]'
                            : 'border-border'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-start gap-5">
                          {/* Image */}
                          <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl bg-secondary/50 border border-border">
                            <Image
                              src={product.images[0] || 'https://images.pexels.com/photos/28867382/pexels-photo-28867382.jpeg'}
                              alt={product.name}
                              fill
                              sizes="128px"
                              className="object-cover"
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={
                                  isPending
                                    ? 'bg-warning/10 text-warning border-warning/30 font-semibold'
                                    : isLive
                                    ? 'bg-success/10 text-success border-success/30 font-semibold'
                                    : isRejected
                                    ? 'bg-destructive/10 text-destructive border-destructive/30 font-semibold'
                                    : 'bg-secondary'
                                }
                              >
                                {isPending ? '🟡 Pending Approval' : isLive ? '🟢 Approved & Live' : isRejected ? '🔴 Needs Revision' : product.status}
                              </Badge>

                              <span className="text-xs text-muted-foreground">
                                Category: <strong>{product.category}</strong>
                              </span>

                              {product.isDigital && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Digital Download
                                </Badge>
                              )}
                            </div>

                            <h3 className="font-display text-lg font-bold text-foreground">
                              {product.name}
                            </h3>

                            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {product.description}
                            </p>

                            {/* Seller & Pricing Details */}
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                              <div className="flex items-center gap-1.5 font-bold text-foreground">
                                <span>₹{product.discountPrice ?? product.price}</span>
                                {product.discountPrice && (
                                  <span className="text-muted-foreground line-through font-normal">
                                    ₹{product.price}
                                  </span>
                                )}
                              </div>

                              <span className="text-muted-foreground">•</span>

                              <div className="flex items-center gap-1 text-muted-foreground">
                                <span>Stock: <strong>{product.inventory} units</strong></span>
                              </div>

                              <span className="text-muted-foreground">•</span>

                              <div className="flex items-center gap-1 text-muted-foreground">
                                <span>Seller: <strong>{product.seller?.displayName || product.seller?.username}</strong></span>
                                <span className="text-[10px] text-muted-foreground">({product.seller?.department || 'Student'})</span>
                              </div>

                              {product.digitalFileUrl && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <a
                                    href={product.digitalFileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary hover:underline inline-flex items-center gap-1"
                                  >
                                    <Download className="h-3 w-3" />
                                    <span>Verify Digital Asset</span>
                                  </a>
                                </>
                              )}
                            </div>

                            {/* Rejection notice if any */}
                            {isRejected && product.rejectionReason && (
                              <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                <div>
                                  <strong>Admin Review Note:</strong> {product.rejectionReason}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Approval Actions */}
                          <div className="flex md:flex-col items-center gap-2 shrink-0 pt-2 md:pt-0">
                            {isPending && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveProduct(product)}
                                  disabled={actionInProgress}
                                  className="w-full bg-success text-white hover:bg-success/90 rounded-xl gap-1.5 text-xs shadow-sm"
                                >
                                  <Check className="h-4 w-4" />
                                  Approve & Publish
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setRejectProductModalOpen(true);
                                  }}
                                  disabled={actionInProgress}
                                  className="w-full text-destructive hover:bg-destructive/10 rounded-xl gap-1.5 text-xs border-destructive/30"
                                >
                                  <X className="h-4 w-4" />
                                  Reject / Revision
                                </Button>
                              </>
                            )}

                            {isLive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setRejectProductModalOpen(true);
                                }}
                                disabled={actionInProgress}
                                className="w-full text-muted-foreground hover:text-destructive rounded-xl text-xs"
                              >
                                Revoke Approval
                              </Button>
                            )}

                            {isRejected && (
                              <Button
                                size="sm"
                                onClick={() => handleApproveProduct(product)}
                                disabled={actionInProgress}
                                className="w-full bg-success text-white hover:bg-success/90 rounded-xl gap-1.5 text-xs shadow-sm"
                              >
                                <Check className="h-4 w-4" />
                                Re-Approve
                              </Button>
                            )}

                            <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground">
                              <Link href={`/products/${product.slug}`} target="_blank">
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                Preview
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: FREELANCE GIG APPROVALS */}
            <TabsContent value="gigs" className="space-y-6 mt-0">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search freelance services by title or student..."
                    value={gigSearch}
                    onChange={(e) => setGigSearch(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <Button
                    variant={gigStatusFilter === 'pending_approval' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGigStatusFilter('pending_approval')}
                    className="rounded-xl text-xs whitespace-nowrap"
                  >
                    Pending Review ({pendingGigs.length})
                  </Button>
                  <Button
                    variant={gigStatusFilter === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGigStatusFilter('active')}
                    className="rounded-xl text-xs whitespace-nowrap"
                  >
                    Active ({activeGigs.length})
                  </Button>
                  <Button
                    variant={gigStatusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGigStatusFilter('all')}
                    className="rounded-xl text-xs whitespace-nowrap"
                  >
                    All Gigs ({gigs.length})
                  </Button>
                </div>
              </div>

              {filteredGigs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-success/50 mx-auto mb-3" />
                  <h3 className="font-display text-base font-bold">No freelance gigs to review</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    All student freelance commissions have been evaluated.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredGigs.map((gig) => {
                    const isPending = gig.status === 'pending_approval';
                    const isLive = gig.status === 'active';
                    const isRejected = gig.status === 'rejected';

                    return (
                      <div
                        key={gig.id}
                        className={`rounded-2xl border bg-card p-5 sm:p-6 transition-all ${
                          isPending ? 'border-indigo-500/40 bg-indigo-500/[0.02]' : 'border-border'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-start gap-5">
                          <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-xl bg-secondary/50 border border-border">
                            <Image src={gig.coverImage} alt={gig.title} fill sizes="160px" className="object-cover" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={
                                  isPending
                                    ? 'bg-warning/10 text-warning border-warning/30 font-semibold'
                                    : isLive
                                    ? 'bg-success/10 text-success border-success/30 font-semibold'
                                    : 'bg-destructive/10 text-destructive'
                                }
                              >
                                {isPending ? '🟡 Pending Approval' : isLive ? '🟢 Approved' : '🔴 Rejected'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">Category: <strong>{gig.category}</strong></span>
                            </div>

                            <h3 className="font-display text-base font-bold text-foreground">{gig.title}</h3>
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{gig.description}</p>

                            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                              <span className="font-bold text-foreground">Starts at ₹{gig.startingPrice}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">{gig.deliveryTimeDays} Days Delivery</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">Creator: <strong>{gig.seller?.displayName || gig.seller?.username}</strong></span>
                            </div>
                          </div>

                          <div className="flex md:flex-col items-center gap-2 shrink-0 pt-2 md:pt-0">
                            {isPending && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveGig(gig)}
                                  disabled={actionInProgress}
                                  className="w-full bg-success text-white hover:bg-success/90 rounded-xl gap-1.5 text-xs shadow-sm"
                                >
                                  <Check className="h-4 w-4" />
                                  Approve Gig
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedGig(gig);
                                    setRejectGigModalOpen(true);
                                  }}
                                  disabled={actionInProgress}
                                  className="w-full text-destructive hover:bg-destructive/10 rounded-xl gap-1.5 text-xs border-destructive/30"
                                >
                                  <X className="h-4 w-4" />
                                  Reject
                                </Button>
                              </>
                            )}

                            {isLive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedGig(gig);
                                  setRejectGigModalOpen(true);
                                }}
                                disabled={actionInProgress}
                                className="w-full text-muted-foreground hover:text-destructive rounded-xl text-xs"
                              >
                                Revoke Gig
                              </Button>
                            )}

                            <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground">
                              <Link href={`/services/${gig.slug}`} target="_blank">
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                Preview
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* TAB 3: CREATORS DIRECTORY */}
            <TabsContent value="creators" className="space-y-6 mt-0">
              {sellers.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">No registered student creators yet</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    When students register on CampusCart and list products or gigs, their verified creator profiles will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sellers.map((seller) => (
                    <div key={seller.id} className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors shadow-sm">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 ring-2 ring-border">
                          <AvatarImage src={seller.avatar} alt={seller.displayName} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {seller.displayName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm truncate">{seller.displayName}</h4>
                          <p className="text-xs text-muted-foreground truncate">{seller.department} • {seller.year}</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Listings: <strong>{seller.productCount}</strong></span>
                        <Link href={`/seller/${seller.username}`} className="text-primary font-semibold hover:underline flex items-center gap-1">
                          Store Page
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Product Reject Modal */}
        <Dialog open={rejectProductModalOpen} onOpenChange={setRejectProductModalOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">Request Product Revision</DialogTitle>
              <DialogDescription>
                Provide feedback to <strong>{selectedProduct?.seller?.displayName}</strong> explaining what needs to be changed before this item can be approved.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <label className="text-xs font-semibold text-foreground">
                Revision Reason / Admin Feedback:
              </label>
              <Textarea
                placeholder="e.g. Please provide clearer photos of the circuit board and specify which components are included."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="rounded-xl text-sm"
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRejectProductModalOpen(false)}
                disabled={actionInProgress}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectProduct}
                disabled={actionInProgress}
                className="rounded-xl text-xs"
              >
                Submit Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Gig Reject Modal */}
        <Dialog open={rejectGigModalOpen} onOpenChange={setRejectGigModalOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">Request Gig Revision</DialogTitle>
              <DialogDescription>
                Provide review notes for <strong>{selectedGig?.title}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <label className="text-xs font-semibold text-foreground">
                Review Notes:
              </label>
              <Textarea
                placeholder="e.g. Please specify turnaround timeline and sample deliverable formats."
                value={gigRejectReason}
                onChange={(e) => setGigRejectReason(e.target.value)}
                rows={4}
                className="rounded-xl text-sm"
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRejectGigModalOpen(false)}
                disabled={actionInProgress}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectGig}
                disabled={actionInProgress}
                className="rounded-xl text-xs"
              >
                Submit Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </>
  );
}
