'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap, Plus, Search, Calendar, IndianRupee, Clock,
  CheckCircle2, ArrowRight, User, AlertCircle, Loader2,
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { getAllGigRequests, GIG_CATEGORIES } from '@/lib/firebase-queries';
import { AuthPromptDialog } from '@/components/auth-prompt-dialog';
import type { GigRequest } from '@/lib/types';

export default function CampusBountiesPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [bounties, setBounties] = useState<GigRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(GIG_CATEGORIES[0].name);
  const [budget, setBudget] = useState('500');
  const [deadlineDays, setDeadlineDays] = useState('3');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBounties();

    if (typeof window !== 'undefined') {
      window.addEventListener('campuscart_bounty_updated', fetchBounties);
      window.addEventListener('storage', fetchBounties);
      window.addEventListener('focus', fetchBounties);

      return () => {
        window.removeEventListener('campuscart_bounty_updated', fetchBounties);
        window.removeEventListener('storage', fetchBounties);
        window.removeEventListener('focus', fetchBounties);
      };
    }
  }, []);

  function fetchBounties() {
    getAllGigRequests()
      .then((data) => {
        setBounties(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }

  async function handleCreateBounty() {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to post a campus bounty.',
      });
      router.push('/login');
      return;
    }

    if (!title.trim() || !description.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide a title and detailed description for your request.',
        variant: 'destructive',
      });
      return;
    }

    const budgetNum = parseFloat(budget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      toast({
        title: 'Valid budget required',
        description: 'Please enter a valid budget amount in ₹.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    const newBounty: GigRequest = {
      id: 'req_' + Date.now(),
      requesterId: user.uid,
      requesterName: profile?.display_name || user.email?.split('@')[0] || 'Student',
      requesterEmail: user.email || '',
      title: title.trim(),
      description: description.trim(),
      category,
      budget: budgetNum,
      deadlineDays: parseInt(deadlineDays, 10) || 3,
      status: 'open',
      proposalsCount: 0,
      createdAt: new Date().toISOString(),
    };

    setBounties((prev) => [newBounty, ...prev]);

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('campuscart_gig_requests');
        const list = raw ? JSON.parse(raw) : [];
        list.unshift(newBounty);
        localStorage.setItem('campuscart_gig_requests', JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('campuscart_bounty_updated'));
      } catch {}
    }

    try {
      await addDoc(collection(db, 'gig_requests'), {
        requesterId: user.uid,
        requesterName: profile?.display_name || user.email?.split('@')[0] || 'Student',
        requesterEmail: user.email || '',
        title: title.trim(),
        description: description.trim(),
        category,
        budget: budgetNum,
        deadlineDays: parseInt(deadlineDays, 10) || 3,
        status: 'open',
        proposalsCount: 0,
        created_at: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn('Firestore gig_requests notice:', err);
    }

    toast({
      title: 'Bounty posted successfully! ⚡',
      description: 'Student freelancers on campus can now view and apply for your task.',
    });

    setPostModalOpen(false);
    setTitle('');
    setDescription('');
    setSubmitting(false);
  }

  const filtered = bounties.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.description.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-10">
        <div className="container-px mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-border">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary mb-2">
                <Zap className="h-3.5 w-3.5" />
                <span>Campus Bounties Board</span>
              </div>
              <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight">
                Work Requests & Student Bounties
              </h1>
              <p className="mt-1 text-sm sm:text-base text-muted-foreground">
                Looking for someone to design a poster, code a feature, 3D print an enclosure, or edit a video? Post your task here.
              </p>
            </div>

            <Button
              size="lg"
              className="rounded-xl shrink-0"
              onClick={() => {
                if (!user) {
                  setAuthPromptOpen(true);
                  return;
                }
                setPostModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Post a Request
            </Button>
          </div>

          {/* Search */}
          <div className="py-6 flex items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bounties by skill or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 rounded-xl bg-card text-sm"
              />
            </div>
            <div className="text-xs text-muted-foreground hidden sm:block">
              {filtered.length} open requests
            </div>
          </div>

          {/* Bounties List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-36 animate-pulse rounded-2xl bg-secondary/40" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center bg-card/40">
              <Zap className="h-12 w-12 text-primary/40 mb-3" />
              <h3 className="text-lg font-bold">No open bounties at the moment</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md">
                Need something done for your club event or semester project? Post a bounty and let skilled classmates help you out.
              </p>
              <Button
                className="mt-5 rounded-xl"
                onClick={() => {
                  if (!user) {
                    setAuthPromptOpen(true);
                    return;
                  }
                  setPostModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Post the First Bounty
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filtered.map((bounty) => (
                <div
                  key={bounty.id}
                  className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="text-xs font-medium bg-primary/10 text-primary border-0">
                        {bounty.category}
                      </Badge>
                      <div className="flex items-center gap-1 font-display font-extrabold text-base text-foreground">
                        <span>₹{bounty.budget}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">budget</span>
                      </div>
                    </div>

                    <h3 className="font-display text-base font-bold leading-snug">
                      {bounty.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {bounty.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{bounty.deadlineDays} days deadline</span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 rounded-lg"
                      onClick={() => {
                        window.location.href = `mailto:${bounty.requesterEmail}?subject=Application for Campus Bounty: ${encodeURIComponent(bounty.title)}`;
                      }}
                    >
                      Apply / Contact
                      <ArrowRight className="h-3 w-3 ml-1.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Post Bounty Dialog */}
      <Dialog open={postModalOpen} onOpenChange={setPostModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Post a Campus Bounty / Work Request</DialogTitle>
            <DialogDescription>
              Describe what you need done. Talented students from your campus will reach out with proposals.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="b-title">Task Title *</Label>
              <Input
                id="b-title"
                placeholder="e.g. Design 3 Instagram posters for Mechanical Symposium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="b-desc">Details & Requirements *</Label>
              <Textarea
                id="b-desc"
                placeholder="Specify dimensions, deadline, required tools (Figma, Python, Blender), themes, or any reference links..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="b-cat">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="b-cat">
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
                <Label htmlFor="b-budget">Your Budget (₹) *</Label>
                <Input
                  id="b-budget"
                  type="number"
                  placeholder="500"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="b-days">Needed within (Days)</Label>
              <Input
                id="b-days"
                type="number"
                placeholder="3"
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPostModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateBounty} disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Posting...</> : 'Publish Bounty'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auth Prompt Dialog */}
      <AuthPromptDialog
        isOpen={authPromptOpen}
        onClose={() => setAuthPromptOpen(false)}
        title="Sign In to Post Bounties"
        description="Please sign in with your college student account to post freelance task bounties or submit proposals."
        actionName="Post a Bounty"
        redirectTo="/services/bounties"
      />
    </>
  );
}
