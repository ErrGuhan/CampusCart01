'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Sparkles, Plus, Search, Send, X, Rocket, Lightbulb,
  TestTube2, Wrench, Users, WifiOff, RefreshCw, Loader2,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { AuthPromptDialog } from '@/components/auth-prompt-dialog';
import { RequestCard } from '@/components/requests/request-card';
import { SkeletonRequestFeed } from '@/components/requests/skeleton-request-card';
import { EmptyState } from '@/components/ui/empty-state';
import { sendChatMessage } from '@/lib/firebase-queries';
import { incrementRequestResponses } from '@/lib/collaboration-hub';
import type { CollaborationRequest, CollaborationTag } from '@/lib/types';
import { cn } from '@/lib/utils';

// Standard resilient API fetcher with timeout
const fetcher = async (url: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error('Unable to connect to campus network.');
    }
    const json = await res.json();
    return (json.data || []) as CollaborationRequest[];
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw new Error(err.message || 'Unable to connect to campus network.');
  }
};

const FORUM_TAGS: { id: CollaborationTag | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All Discussions' },
  { id: 'LOOKING_FOR_COFOUNDER', label: '🚀 Looking for Co-Founder' },
  { id: 'NEED_FEEDBACK', label: '💡 Need Feedback' },
  { id: 'HARDWARE_HELP', label: '🛠️ Hardware Help' },
  { id: 'BETA_TESTERS', label: '🧪 Beta Testers' },
  { id: 'GENERAL', label: '🤝 Teammates & General' },
];

export default function RequestsForumPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tagFromUrl = (searchParams?.get('tag') as CollaborationTag) || 'ALL';

  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { mutate: globalMutate } = useSWRConfig();

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<CollaborationTag | 'ALL'>(tagFromUrl);

  // Sync state if URL searchParam changes (e.g. browser back/forward or navigation from links)
  useEffect(() => {
    if (tagFromUrl !== selectedTag) {
      setSelectedTag(tagFromUrl);
    }
  }, [tagFromUrl]);

  // SWR Data Fetching & Caching Hook
  const {
    data: requests,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<CollaborationRequest[]>(
    `/api/collaboration/requests?tag=${selectedTag}`,
    fetcher,
    {
      revalidateOnFocus: true,
      keepPreviousData: true,
      dedupingInterval: 3000,
    }
  );

  // Real-time synchronization (Storage, Custom Events & Firestore onSnapshot)
  useEffect(() => {
    const handleUpdate = () => {
      mutate();
    };

    window.addEventListener('campuscart_collaboration_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    let unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(collection(db, 'collaboration_requests'), () => {
        mutate();
      }, (err) => {
        console.warn('Realtime requests snapshot note:', err);
      });
    } catch {}

    return () => {
      window.removeEventListener('campuscart_collaboration_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      unsubscribe();
    };
  }, [mutate]);

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedReqForConnect, setSelectedReqForConnect] = useState<CollaborationRequest | null>(null);
  const [connectMessage, setConnectMessage] = useState('');
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form States - Create Request
  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqTag, setReqTag] = useState<CollaborationTag>('LOOKING_FOR_COFOUNDER');

  // Handle Tag Change with smooth URL sync
  const handleTagSelect = useCallback((tagId: CollaborationTag | 'ALL') => {
    setSelectedTag(tagId);
    const newUrl = tagId === 'ALL' ? '/requests' : `/requests?tag=${tagId}`;
    router.replace(newUrl, { scroll: false });
  }, [router]);

  // Open Create Pitch modal with contextual tag
  const handleOpenCreateModal = useCallback(() => {
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }
    setReqTag(selectedTag !== 'ALL' ? selectedTag : 'LOOKING_FOR_COFOUNDER');
    setCreateModalOpen(true);
  }, [user, selectedTag]);

  // Handle Form Submission (Create Request)
  async function handleCreateRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }

    const cleanTitle = reqTitle.trim();
    const cleanDesc = reqDesc.trim();

    if (cleanTitle.length < 5) {
      toast({
        title: 'Title is too short',
        description: 'Please provide at least 5 characters for your pitch title.',
        variant: 'destructive',
      });
      return;
    }

    if (cleanDesc.length < 10) {
      toast({
        title: 'Description is too short',
        description: 'Please describe your project or needs with at least 10 characters.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/collaboration/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: user.uid || 'user_demo',
          authorName: profile?.display_name || user.email?.split('@')[0] || 'Student Maker',
          authorUsername: profile?.username || 'maker',
          authorAvatar: profile?.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
          authorMajor: profile?.department || 'Computer Science & Engineering',
          authorYear: profile?.year || '4th Year',
          title: cleanTitle,
          description: cleanDesc,
          tags: reqTag,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to post discussion. Please try again.');
      }

      toast({
        title: 'Pitch Published! 🚀',
        description: 'Your discussion is now live on the campus collaboration forum.',
      });

      setReqTitle('');
      setReqDesc('');
      setCreateModalOpen(false);

      // Invalidate all SWR collaboration tag queries globally
      globalMutate(
        (key) => typeof key === 'string' && key.startsWith('/api/collaboration/requests'),
        undefined,
        { revalidate: true }
      );
    } catch (err: any) {
      toast({
        title: 'Error posting pitch',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenConnect(req: CollaborationRequest) {
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }

    // Prevent self-messaging loop
    if (user.uid === req.authorId) {
      toast({
        title: 'Your Active Pitch 📌',
        description: 'You are the author of this pitch. Responses from collaborators will arrive in your Messages.',
      });
      return;
    }

    setSelectedReqForConnect(req);
    setConnectMessage(`Hi ${req.authorName}, I saw your pitch on "${req.title}". Let's connect!`);
    setConnectModalOpen(true);
  }

  async function handleSendConnect() {
    if (!user || !selectedReqForConnect) return;
    if (!connectMessage.trim()) {
      toast({ title: 'Please enter a message', variant: 'destructive' });
      return;
    }

    const sorted = [user.uid, selectedReqForConnect.authorId].sort();
    const convId = `chat_${sorted[0]}_${sorted[1]}`;
    const targetAuthorId = selectedReqForConnect.authorId;
    const targetAuthorName = selectedReqForConnect.authorName;
    const targetAuthorAvatar = selectedReqForConnect.authorAvatar || '';

    try {
      await sendChatMessage({
        conversationId: convId,
        senderId: user.uid,
        senderName: profile?.display_name || user.email?.split('@')[0] || 'Student',
        senderAvatar: profile?.avatar_url || '',
        recipientId: targetAuthorId,
        recipientName: targetAuthorName,
        recipientAvatar: targetAuthorAvatar,
        text: `[Re: "${selectedReqForConnect.title}"] ${connectMessage.trim()}`,
      });

      // Increment responses count for the pitch
      incrementRequestResponses(selectedReqForConnect.id).catch(() => {});

      toast({
        title: 'Message Sent! ✉️',
        description: `Your message has been delivered to ${targetAuthorName}. Opening chat...`,
      });

      setConnectMessage('');
      setConnectModalOpen(false);
      router.push(
        `/messages?user=${targetAuthorId}&name=${encodeURIComponent(targetAuthorName)}&avatar=${encodeURIComponent(targetAuthorAvatar)}`
      );
    } catch (err: any) {
      toast({ title: 'Error sending message', description: err.message, variant: 'destructive' });
    }
  }

  // Filter cached requests by client-side search query
  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    return requests.filter((r) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.authorName.toLowerCase().includes(q) ||
        (r.authorMajor && r.authorMajor.toLowerCase().includes(q));

      return matchesSearch;
    });
  }, [requests, search]);

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-5xl py-6 sm:py-10 min-h-screen pb-28 sm:pb-32">
        {/* Forum Top Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary mb-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 shadow-xs w-fit">
              <Rocket className="h-4 w-4 text-primary animate-pulse" />
              <span>Campus Incubator & Collaboration Forum</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Pitch Ideas, Find <span className="text-gradient-primary">Co-Founders</span>
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground font-medium max-w-2xl">
              Post what you are building, request peer feedback, recruit hackathon teammates, or ask for hardware troubleshooting.
            </p>
          </div>

          <Button
            onClick={handleOpenCreateModal}
            className="btn-gradient-primary text-white rounded-2xl h-11 px-5 font-bold text-xs sm:text-sm shadow-xs touch-target min-h-[44px] transition-all duration-200 active:scale-95"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Pitch an Idea / Need
          </Button>
        </div>

        {/* Search and Category Filter Pills */}
        <div className="space-y-3 mb-8">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pitches by topic, major, problem statement..."
              className="pl-10 pr-10 h-11 rounded-2xl bg-card/90 dark:bg-card/75 backdrop-blur-md text-xs border-border/80 shadow-xs focus-visible:border-primary/50 transition-all placeholder:text-muted-foreground/70 font-medium text-foreground"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Horizontal Tag Filters - 44px Touch Target with responsive right padding */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pr-4 scrollbar-none">
            {FORUM_TAGS.map((tag) => {
              const active = selectedTag === tag.id;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagSelect(tag.id)}
                  className={cn(
                    'px-4 py-2.5 min-h-[44px] rounded-2xl text-xs font-bold whitespace-nowrap transition-all select-none border flex items-center gap-1.5 shadow-2xs active:scale-95',
                    active
                      ? 'btn-gradient-primary text-white border-transparent shadow-sm'
                      : 'bg-card/85 dark:bg-card/75 backdrop-blur-md border-border/80 text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                  )}
                >
                  <span>{tag.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feed State Routing: Skeletons vs Error vs Empty vs Real Data */}
        {isLoading && !requests ? (
          /* 1. Skeleton Loading Feed */
          <SkeletonRequestFeed count={4} />
        ) : error && !requests ? (
          /* 2. Connection Error State */
          <div className="rounded-3xl border border-white/30 dark:border-destructive/30 bg-white/40 dark:bg-destructive/10 backdrop-blur-lg p-8 sm:p-12 text-center my-6 shadow-[0_4px_30px_rgba(0,0,0,0.08)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-3 shadow-[0_4px_20px_rgba(239,68,68,0.15)] border border-destructive/20">
              <WifiOff className="h-7 w-7" />
            </div>
            <h2 className="font-display text-lg font-bold text-foreground">
              Unable to connect to campus network
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto font-medium">
              We could not reach the collaboration forum. Please verify your internet connection or tap below to reconnect.
            </p>
            <Button
              onClick={() => mutate()}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white mt-5 rounded-xl text-xs font-bold px-5 h-10 shadow-[0_4px_16px_rgba(6,182,212,0.3)] border border-white/20"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Tap to Retry
            </Button>
          </div>
        ) : filteredRequests.length === 0 ? (
          /* 3. Empty State */
          <EmptyState
            icon={Rocket}
            title={selectedTag !== 'ALL' || search ? 'No discussions found in this view' : 'Welcome to the Collaboration Forum!'}
            description={
              selectedTag !== 'ALL' || search
                ? 'No student pitches match your active filter. Try resetting your tags or post a new request!'
                : 'The collaboration board is clean and open. Pitch your startup, find a hardware co-founder, or look for study teammates!'
            }
            actionLabel="+ Pitch an Idea"
            onAction={handleOpenCreateModal}
            secondaryActionLabel={selectedTag !== 'ALL' || search ? 'Show All Discussions' : 'Explore Marketplace'}
            onSecondaryAction={
              selectedTag !== 'ALL' || search
                ? () => {
                    handleTagSelect('ALL');
                    setSearch('');
                  }
                : undefined
            }
            secondaryActionHref={selectedTag === 'ALL' && !search ? '/marketplace' : undefined}
          />
        ) : (
          /* 4. Real-time Dynamic Feed */
          <div className="space-y-4">
            {filteredRequests.map((req) => (
              <RequestCard
                key={req.id}
                data={req}
                currentUserId={user?.uid}
                onConnect={handleOpenConnect}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />

      {/* Pitch Idea Dialog */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-6 bg-card border border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-foreground">
              Pitch an Idea or Request <span className="text-gradient-primary">Co-Founder</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Describe your project, what skills you need, or what challenge you are facing.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRequestSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Topic / Tag</label>
              <Select value={reqTag} onValueChange={(v) => setReqTag(v as CollaborationTag)}>
                <SelectTrigger className="rounded-xl h-10 text-xs bg-background border-border shadow-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl text-xs">
                  <SelectItem value="LOOKING_FOR_COFOUNDER">🚀 Looking for Co-Founder</SelectItem>
                  <SelectItem value="NEED_FEEDBACK">💡 Need Feedback / User Testing</SelectItem>
                  <SelectItem value="HARDWARE_HELP">🛠️ Hardware & Maker Assistance</SelectItem>
                  <SelectItem value="BETA_TESTERS">🧪 Seeking Beta Testers</SelectItem>
                  <SelectItem value="GENERAL">🤝 General Discussion & Teammates</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-foreground block">Discussion Title</label>
                <span className="text-[10px] text-muted-foreground">{reqTitle.length}/150</span>
              </div>
              <Input
                value={reqTitle}
                onChange={(e) => setReqTitle(e.target.value)}
                placeholder="e.g. Need an IoT co-founder for smart irrigation prototype..."
                className="rounded-xl h-10 text-xs bg-background border-border shadow-xs focus-visible:border-primary/50"
                maxLength={150}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-foreground block">Project Details & Requirements</label>
                <span className="text-[10px] text-muted-foreground">{reqDesc.length}/3000</span>
              </div>
              <Textarea
                value={reqDesc}
                onChange={(e) => setReqDesc(e.target.value)}
                placeholder="Describe your tech stack, hardware parts needed, and what you are looking for in a collaborator..."
                className="rounded-xl text-xs min-h-[120px] bg-background border-border shadow-xs focus-visible:border-primary/50"
                maxLength={3000}
              />
            </div>

            <DialogFooter className="pt-3 flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="btn-gradient-primary text-white rounded-xl text-xs font-bold px-5 shadow-xs"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publish Pitch'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Connect & Message Dialog */}
      <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-card border border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-foreground">
              Respond to {selectedReqForConnect?.authorName}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Regarding: &quot;{selectedReqForConnect?.title}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <Textarea
              value={connectMessage}
              onChange={(e) => setConnectMessage(e.target.value)}
              placeholder="Hi, I saw your pitch! I have experience with ESP32 and React. Let's meet at the library to discuss..."
              className="rounded-xl text-xs min-h-[110px] bg-background border-border shadow-xs focus-visible:border-primary/50"
            />
          </div>

          <DialogFooter className="pt-3 flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConnectModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendConnect}
              className="btn-gradient-primary text-white rounded-xl text-xs font-bold px-5 shadow-xs"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AuthPromptDialog
        isOpen={authPromptOpen}
        onClose={() => setAuthPromptOpen(false)}
        actionName="Pitch an Idea or Connect with Founders"
      />
    </>
  );
}
