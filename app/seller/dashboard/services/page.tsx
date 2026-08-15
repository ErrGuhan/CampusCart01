'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Pencil, Trash2, Clock, Sparkles,
  Eye, CheckCircle2, AlertCircle, Loader2, DollarSign,
  FileText, ArrowRight,
} from 'lucide-react';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { SellerSidebar } from '@/components/seller-sidebar';
import { ImageUploader } from '@/components/image-uploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { getMyGigs, GIG_CATEGORIES } from '@/lib/firebase-queries';
import type { ServiceGig, GigStatus } from '@/lib/types';

export default function SellerServicesPage() {
  const { user, profile, isAdmin } = useAuth();
  const { toast } = useToast();

  const [gigs, setGigs] = useState<ServiceGig[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGig, setEditGig] = useState<ServiceGig | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceGig | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(GIG_CATEGORIES[0].name);
  const [price, setPrice] = useState('200');
  const [deliveryDays, setDeliveryDays] = useState('2');
  const [revisions, setRevisions] = useState('2');
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState<GigStatus>('active');

  const loadGigs = useCallback(async () => {
    if (!user) return;
    setFetching(true);
    try {
      const data = await getMyGigs(user.uid);
      setGigs(data);
    } catch (err) {
      console.warn('Error fetching gigs:', err);
    } finally {
      setFetching(false);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadGigs();
  }, [loadGigs]);

  function openCreate() {
    setEditGig(null);
    setTitle('');
    setDescription('');
    setCategory(GIG_CATEGORIES[0].name);
    setPrice('200');
    setDeliveryDays('2');
    setRevisions('2');
    setTags('');
    setCoverImage('');
    setStatus(isAdmin ? 'active' : 'pending_approval');
    setDialogOpen(true);
  }

  function openEdit(gig: ServiceGig) {
    setEditGig(gig);
    setTitle(gig.title);
    setDescription(gig.description);
    setCategory(gig.category);
    setPrice(gig.startingPrice.toString());
    setDeliveryDays(gig.deliveryTimeDays.toString());
    setRevisions(gig.revisions.toString());
    setTags(gig.tags.join(', '));
    setCoverImage(gig.coverImage);
    setStatus(gig.status);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!user || !profile) return;
    if (!title.trim() || !description.trim()) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast({ title: 'Please enter a valid price', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const slug = editGig?.slug || (
        title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40) +
        '-' + Math.floor(1000 + Math.random() * 9000)
      );

      const calculatedStatus: GigStatus = isAdmin
        ? status
        : (editGig ? (editGig.status === 'active' ? 'active' : 'pending_approval') : 'pending_approval');

      const isGigVerified: boolean = isAdmin ? true : (editGig?.isVerified || false);

      const gigPayload = {
        seller_id: user.uid,
        sellerName: profile.display_name,
        sellerUsername: profile.username,
        sellerAvatar: profile.avatar_url || '',
        sellerDepartment: profile.department || '',
        sellerYear: profile.year || '',
        title: title.trim(),
        slug,
        description: description.trim(),
        category,
        starting_price: priceNum,
        delivery_time_days: parseInt(deliveryDays, 10) || 2,
        revisions: parseInt(revisions, 10) || 2,
        tags: tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
        cover_image: coverImage || 'https://images.pexels.com/photos/3182773/pexels-photo-3182773.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
        status: calculatedStatus,
        rating: editGig?.rating ?? 5.0,
        review_count: editGig?.reviewCount ?? 0,
        is_verified: isGigVerified,
        updated_at: new Date().toISOString(),
      };

      const localGig: ServiceGig = {
        id: editGig?.id || ('gig_' + Date.now()),
        sellerId: user.uid,
        seller: {
          id: user.uid,
          username: profile.username,
          displayName: profile.display_name,
          avatar: profile.avatar_url || '',
          department: profile.department || '',
          year: profile.year || '',
          bio: profile.bio || '',
          skills: profile.skills || [],
          rating: 5.0,
          productCount: 1,
          joinedAt: new Date().toISOString(),
        },
        title: title.trim(),
        slug,
        description: description.trim(),
        category,
        startingPrice: priceNum,
        deliveryTimeDays: parseInt(deliveryDays, 10) || 2,
        revisions: parseInt(revisions, 10) || 2,
        tags: tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
        coverImage: coverImage || 'https://images.pexels.com/photos/3182773/pexels-photo-3182773.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
        portfolioImages: [],
        rating: editGig?.rating ?? 5.0,
        reviewCount: editGig?.reviewCount ?? 0,
        isVerified: isGigVerified,
        status: calculatedStatus,
        createdAt: editGig?.createdAt || new Date().toISOString(),
      };

      if (editGig) {
        setGigs((prev) => prev.map((g) => (g.id === editGig.id ? localGig : g)));

        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('campuscart_gigs');
            let list = raw ? JSON.parse(raw) : [];
            list = list.map((g: any) => (g.id === editGig.id ? localGig : g));
            localStorage.setItem('campuscart_gigs', JSON.stringify(list));
            window.dispatchEvent(new CustomEvent('campuscart_gig_updated'));
          } catch {}
        }

        try {
          await setDoc(doc(db, 'gigs', editGig.id), gigPayload, { merge: true });
        } catch (err) {
          console.warn('Firestore update gig notice:', err);
        }
        toast({ title: 'Gig updated! 🎉', description: `"${title}" has been saved.` });
      } else {
        setGigs((prev) => [localGig, ...prev]);

        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('campuscart_gigs');
            const list = raw ? JSON.parse(raw) : [];
            list.unshift(localGig);
            localStorage.setItem('campuscart_gigs', JSON.stringify(list));
            window.dispatchEvent(new CustomEvent('campuscart_gig_updated'));
          } catch {}
        }

        try {
          await addDoc(collection(db, 'gigs'), {
            ...gigPayload,
            created_at: new Date().toISOString(),
          });
        } catch (err) {
          console.warn('Firestore add gig notice:', err);
        }
        toast({ title: 'Gig created! 🎉', description: `"${title}" is now live on Campus Freelance.` });
      }

      setDialogOpen(false);
    } catch (err: any) {
      console.warn('Gig save notice:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('campuscart_gigs');
          let list = raw ? JSON.parse(raw) : [];
          list = list.filter((g: any) => g.id !== deleteTarget.id);
          localStorage.setItem('campuscart_gigs', JSON.stringify(list));
          window.dispatchEvent(new CustomEvent('campuscart_gig_updated'));
        } catch {}
      }

      await deleteDoc(doc(db, 'gigs', deleteTarget.id));
      toast({ title: 'Gig deleted', description: deleteTarget.title });
      setDeleteTarget(null);
      loadGigs();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Could not delete gig', variant: 'destructive' });
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-7xl py-8">
          <div className="h-96 animate-pulse rounded-xl bg-secondary" />
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-7xl py-16 text-center">
          <h1 className="text-2xl font-bold">Sign in required</h1>
          <Button className="mt-4" asChild><Link href="/login">Sign In</Link></Button>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Student Freelance Studio</span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Freelance Services</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Offer your specialized skills (posters, code, video editing, CAD) to classmates and college clubs.
            </p>
          </div>
          <Button onClick={openCreate} className="rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            Offer a Service
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="hidden lg:block">
            <SellerSidebar />
          </aside>

          <div className="lg:col-span-3 space-y-6">
            {gigs.some((g) => g.status === 'pending_approval') && (
              <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 flex items-start gap-3 text-xs">
                <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-warning">Some services are Under Admin Review</p>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">
                    Freelance services are reviewed by Administrator (<strong>Guhan M</strong>) for quality and safety. Once approved, they will appear in the Campus Freelance directory.
                  </p>
                </div>
              </div>
            )}

            {fetching ? (
              <div className="h-64 animate-pulse rounded-2xl bg-secondary/50" />
            ) : gigs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center bg-card/40">
                <Sparkles className="h-12 w-12 text-primary/40 mb-3" />
                <h3 className="text-lg font-bold">No active freelance gigs yet</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-md">
                  Turn your design, coding, or video editing skills into cash by creating your first campus gig.
                </p>
                <Button className="mt-5 rounded-xl" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Gig
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="divide-y divide-border">
                  {gigs.map((gig) => {
                    const isPending = gig.status === 'pending_approval';
                    const isRejected = gig.status === 'rejected';

                    return (
                      <div
                        key={gig.id}
                        className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-accent/10 transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary/40 border border-border">
                            <img src={gig.coverImage} alt={gig.title} className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[10px] font-medium">
                                {gig.category}
                              </Badge>
                              <Badge
                                className={
                                  gig.status === 'active' ? 'bg-success/10 text-success hover:bg-success/10 text-[10px]' :
                                  isPending ? 'bg-warning/10 text-warning hover:bg-warning/10 text-[10px] font-semibold' :
                                  isRejected ? 'bg-destructive/10 text-destructive hover:bg-destructive/10 text-[10px] font-semibold' :
                                  'bg-secondary text-muted-foreground text-[10px]'
                                }
                              >
                                {isPending ? '🟡 Under Review' :
                                 isRejected ? '🔴 Needs Revision' :
                                 gig.status === 'active' ? '🟢 Live' :
                                 gig.status}
                              </Badge>
                            </div>
                            <Link
                              href={`/services/${gig.slug}`}
                              className="block font-semibold text-sm hover:text-primary transition-colors truncate"
                            >
                              {gig.title}
                            </Link>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Starting at <strong className="text-foreground">₹{gig.startingPrice}</strong> • {gig.deliveryTimeDays} days delivery
                            </p>
                            {isRejected && gig.rejectionReason && (
                              <p className="text-[11px] text-destructive mt-1">
                                <strong>Admin Note:</strong> {gig.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(gig)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(gig)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {/* Create / Edit Gig Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editGig ? 'Edit Freelance Gig' : 'Offer a New Freelance Service'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="g-title">Service Title *</Label>
              <Input
                id="g-title"
                placeholder="e.g., I will design eye-catching posters for your college symposium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="g-desc">Service Details & Inclusions *</Label>
              <Textarea
                id="g-desc"
                placeholder="Explain what is included in your service, software used (Figma, Canva, Premiere Pro, SolidWorks), required inputs from the client, and deliverables..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="g-cat">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="g-cat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GIG_CATEGORIES.map((c) => (
                      <SelectItem key={c.slug} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="g-price">Starting Price (₹) *</Label>
                <Input
                  id="g-price"
                  type="number"
                  placeholder="250"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="g-days">Turnaround Time (Days)</Label>
                <Input
                  id="g-days"
                  type="number"
                  placeholder="2"
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="g-revs">Revisions Included</Label>
                <Input
                  id="g-revs"
                  type="number"
                  placeholder="2"
                  value={revisions}
                  onChange={(e) => setRevisions(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="g-tags">Tags (comma-separated)</Label>
              <Input
                id="g-tags"
                placeholder="poster, symposium, canva, figma, photoshop"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            {/* Direct Image Uploader */}
            <div className="space-y-1.5">
              <ImageUploader
                label="Gig Cover Image / Work Sample"
                value={coverImage}
                onChange={setCoverImage}
                folder="gigs"
                userId={user.uid}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Save Service Gig'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this service gig?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{deleteTarget?.title}" from the freelance catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
