'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles, Plus, Search, Clock, DollarSign, Send,
  User, CheckCircle2, MessageSquare, AlertCircle,
  ArrowRight, ShieldCheck, Tag, X, Rocket, Lightbulb,
  TestTube2, Wrench, Users, Loader2,
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
import { getRequests, createRequest } from '@/lib/collaboration-hub';
import { AuthPromptDialog } from '@/components/auth-prompt-dialog';
import type { CollaborationRequest, CollaborationTag } from '@/lib/types';
import { cn } from '@/lib/utils';

const FORUM_TAGS: { id: CollaborationTag | 'ALL'; label: string; icon: any }[] = [
  { id: 'ALL', label: 'All Discussions', icon: Sparkles },
  { id: 'LOOKING_FOR_COFOUNDER', label: '🚀 Looking for Co-Founder', icon: Rocket },
  { id: 'NEED_FEEDBACK', label: '💡 Need Feedback', icon: Lightbulb },
  { id: 'HARDWARE_HELP', label: '🛠️ Hardware Help', icon: Wrench },
  { id: 'BETA_TESTERS', label: '🧪 Beta Testers', icon: TestTube2 },
  { id: 'GENERAL', label: '🤝 Teammates & General', icon: Users },
];

export default function RequestsForumPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTag = (searchParams?.get('tag') as CollaborationTag) || 'ALL';

  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<CollaborationTag | 'ALL'>(initialTag);

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

  const loadForumRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRequests(selectedTag);
      setRequests(data);
    } catch (e) {
      console.error('Failed to load forum requests:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedTag]);

  useEffect(() => {
    loadForumRequests();

    if (typeof window !== 'undefined') {
      window.addEventListener('campuscart_collaboration_updated', loadForumRequests);
      window.addEventListener('storage', loadForumRequests);
      window.addEventListener('focus', loadForumRequests);

      return () => {
        window.removeEventListener('campuscart_collaboration_updated', loadForumRequests);
        window.removeEventListener('storage', loadForumRequests);
        window.removeEventListener('focus', loadForumRequests);
      };
    }
  }, [loadForumRequests]);

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
      await createRequest({
        authorId: user.uid || 'user_demo',
        authorName: profile?.display_name || user.email?.split('@')[0] || 'Student Maker',
        authorUsername: profile?.username || 'maker',
        authorAvatar: profile?.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
        authorMajor: profile?.department || 'Computer Science & Engineering',
        authorYear: profile?.year || '4th Year',
        title: reqTitle,
        description: reqDesc,
        tags: reqTag,
      });

      toast({
        title: 'Pitch Published! 🚀',
        description: 'Your discussion is now visible on the campus collaboration forum.',
      });

      setReqTitle('');
      setReqDesc('');
      setCreateModalOpen(false);
      loadForumRequests();
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

  function handleSendConnect() {
    if (!connectMessage.trim()) {
      toast({ title: 'Please enter a message', variant: 'destructive' });
      return;
    }
    toast({
      title: 'Message Sent! ✉️',
      description: `Your response has been sent to ${selectedReqForConnect?.authorName}.`,
    });
    setConnectMessage('');
    setConnectModalOpen(false);
  }

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.authorName.toLowerCase().includes(q) ||
        r.authorMajor.toLowerCase().includes(q);

      return matchesSearch;
    });
  }, [requests, search]);

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-5xl py-6 sm:py-10 min-h-screen pb-28 sm:pb-32 bg-radial-wash">
        {/* Forum Header */}
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

        {/* Search and Filter Row */}
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

          {/* Forum Category Filter Pills - 44px touch target */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            {FORUM_TAGS.map((tag) => {
              const active = selectedTag === tag.id;
              return (
                <button
                  key={tag.id}
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

        {/* Forum Posts Feed */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-40 rounded-3xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/40 p-12 text-center my-6">
            <Lightbulb className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-display text-lg font-bold text-foreground">No discussions found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto font-medium">
              Be the first student to pitch an idea or ask for a co-founder in this category!
            </p>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="btn-gradient-primary mt-4 rounded-xl text-xs font-bold"
            >
              Start Discussion
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="group p-5 sm:p-6 rounded-3xl border border-border/80 bg-card hover:border-primary/40 hover:shadow-md transition-all flex flex-col gap-3.5"
              >
                {/* Author row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-border/80 shrink-0">
                      <AvatarImage src={req.authorAvatar} alt={req.authorName} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {req.authorName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-foreground">{req.authorName}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs font-semibold text-primary">{req.authorMajor}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-medium">
                        {req.authorYear} • {new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className="text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-xl bg-secondary/80 border-border/80"
                  >
                    {req.tags.replace(/_/g, ' ')}
                  </Badge>
                </div>

                {/* Post Title & Description */}
                <div>
                  <h2 className="font-display text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                    {req.title}
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                    {req.description}
                  </p>
                </div>

                {/* Footer Action Row */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold">
                    <span>👀 {req.viewsCount} views</span>
                    <span>💬 {req.responsesCount} offers</span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      if (!user) {
                        setAuthPromptOpen(true);
                        return;
                      }
                      setSelectedReqForConnect(req);
                      setConnectModalOpen(true);
                    }}
                    className="btn-gradient-primary rounded-xl text-xs font-bold shadow-xs px-4 touch-target min-h-[38px]"
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    Connect & Message
                  </Button>
                </div>
              </div>
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
