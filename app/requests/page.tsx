'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
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
import type { CollaborationRequest, CollaborationTag } from '@/lib/types';
import { cn } from '@/lib/utils';

// Standard API fetcher for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Unable to connect to campus network.');
  }
  const json = await res.json();
  return json.data as CollaborationRequest[];
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
  const initialTag = (searchParams?.get('tag') as CollaborationTag) || 'ALL';

  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<CollaborationTag | 'ALL'>(initialTag);

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
      dedupingInterval: 4000,
    }
  );

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

  // Handle Form Submission (Create Request)
  async function handleCreateRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }
    if (!reqTitle.trim() || !reqDesc.trim()) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
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
          title: reqTitle,
          description: reqDesc,
          tags: reqTag,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to post discussion. Please try again.');
      }

      toast({
        title: 'Pitch Published! 🚀',
        description: 'Your discussion is now visible on the campus collaboration forum.',
      });

      setReqTitle('');
      setReqDesc('');
      setCreateModalOpen(false);
      // Revalidate cached requests
      mutate();
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
    setSelectedReqForConnect(req);
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

    try {
      await sendChatMessage({
        conversationId: convId,
        senderId: user.uid,
        senderName: profile?.display_name || user.email?.split('@')[0] || 'Student',
        senderAvatar: profile?.avatar_url || '',
        recipientId: selectedReqForConnect.authorId,
        text: `[Re: "${selectedReqForConnect.title}"] ${connectMessage.trim()}`,
      });

      toast({
        title: 'Message Sent! ✉️',
        description: `Your response has been sent to ${selectedReqForConnect.authorName}. Opening chat...`,
      });

      const targetAuthorId = selectedReqForConnect.authorId;
      const targetAuthorName = selectedReqForConnect.authorName;
      setConnectMessage('');
      setConnectModalOpen(false);
      router.push(`/messages?user=${targetAuthorId}&name=${encodeURIComponent(targetAuthorName)}`);
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
      <main className="container-px mx-auto max-w-5xl py-6 sm:py-10 min-h-screen pb-28 sm:pb-32 bg-radial-wash">
        {/* Forum Top Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
              <Rocket className="h-4 w-4" />
              <span>Campus Incubator & Collaboration Forum</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Pitch Ideas, Find Co-Founders
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground font-medium max-w-2xl">
              Post what you are building, request peer feedback, recruit hackathon teammates, or ask for hardware troubleshooting.
            </p>
          </div>

          <Button
            onClick={() => {
              if (!user) {
                setAuthPromptOpen(true);
                return;
              }
              setCreateModalOpen(true);
            }}
            className="btn-gradient-primary rounded-2xl h-11 px-5 font-bold text-xs sm:text-sm shadow-md touch-target min-h-[44px]"
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
              className="pl-10 pr-8 h-11 rounded-2xl bg-card text-xs border-border/80 shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Horizontal Tag Filters - 44px Touch Target */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            {FORUM_TAGS.map((tag) => {
              const active = selectedTag === tag.id;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setSelectedTag(tag.id)}
                  className={cn(
                    'px-4 py-2.5 min-h-[44px] rounded-2xl text-xs font-bold whitespace-nowrap transition-all select-none shadow-2xs border flex items-center gap-1.5',
                    active
                      ? 'bg-gradient-to-r from-primary to-cyan-500 text-white border-transparent shadow-xs'
                      : 'bg-card border-border/80 text-foreground/80 hover:text-foreground'
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
          /* 1. Skeleton Loading Feed (Zero Layout Jumps) */
          <SkeletonRequestFeed count={4} />
        ) : error && !requests ? (
          /* 2. Connection Error State */
          <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 sm:p-12 text-center my-6 shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-3">
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
              className="btn-gradient-primary mt-5 rounded-xl text-xs font-bold px-5 h-10 shadow-xs"
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
            onAction={() => {
              if (!user) {
                setAuthPromptOpen(true);
              } else {
                setCreateModalOpen(true);
              }
            }}
            secondaryActionLabel={selectedTag !== 'ALL' || search ? 'Show All Discussions' : 'Explore Marketplace'}
            onSecondaryAction={
              selectedTag !== 'ALL' || search
                ? () => {
                    setSelectedTag('ALL');
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
                onConnect={handleOpenConnect}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />

      {/* Pitch Idea Dialog */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              Pitch an Idea or Request Co-Founder
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Describe your project, what skills you need, or what challenge you are facing.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRequestSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Topic / Tag</label>
              <Select value={reqTag} onValueChange={(v) => setReqTag(v as CollaborationTag)}>
                <SelectTrigger className="rounded-xl h-10 text-xs">
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
              <label className="text-xs font-bold text-foreground block mb-1.5">Discussion Title</label>
              <Input
                value={reqTitle}
                onChange={(e) => setReqTitle(e.target.value)}
                placeholder="e.g. Need an IoT co-founder for smart irrigation prototype..."
                className="rounded-xl h-10 text-xs"
                maxLength={150}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Project Details & Requirements</label>
              <Textarea
                value={reqDesc}
                onChange={(e) => setReqDesc(e.target.value)}
                placeholder="Describe your tech stack, hardware parts needed, and what you are looking for in a collaborator..."
                className="rounded-xl text-xs min-h-[120px]"
                maxLength={3000}
              />
            </div>

            <DialogFooter className="pt-3">
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
                className="btn-gradient-primary rounded-xl text-xs font-bold px-5"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publish Pitch'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Connect & Message Dialog */}
      <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
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
              className="rounded-xl text-xs min-h-[110px]"
            />
          </div>

          <DialogFooter className="pt-3">
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
              className="btn-gradient-primary rounded-xl text-xs font-bold px-5"
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
