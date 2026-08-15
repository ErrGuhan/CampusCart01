'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Users, Plus, Search, Heart, MessageSquare, Tag,
  Share2, Sparkles, Send, BookOpen, Award, Flame,
  CheckCircle2, ArrowRight,
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
  getCommunityPosts,
  createCommunityPost,
  likeCommunityPost,
} from '@/lib/firebase-queries';
import type { CommunityPost, CommunityCategory } from '@/lib/types';

export default function CampusCommunityPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');

  // Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<CommunityCategory>('academic');
  const [postTags, setPostTags] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const channels = [
    { value: 'all', label: '🌟 All Posts' },
    { value: 'academic', label: '📚 Academic & Tips' },
    { value: 'clubs', label: '🏆 Club Updates' },
    { value: 'opportunities', label: '🚀 Hackathons & TeamUp' },
    { value: 'marketplace', label: '🛍️ Marketplace Chat' },
    { value: 'general', label: '💬 General Campus' },
  ];

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCommunityPosts(selectedChannel);
      setPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedChannel]);

  useEffect(() => {
    loadPosts();

    if (typeof window !== 'undefined') {
      window.addEventListener('campuscart_community_updated', loadPosts);
      return () => window.removeEventListener('campuscart_community_updated', loadPosts);
    }
  }, [loadPosts]);

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) {
      toast({ title: 'Sign in required', description: 'Please sign in to post.', variant: 'destructive' });
      return;
    }
    if (!postTitle.trim() || !postContent.trim()) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await createCommunityPost({
        authorId: user.uid,
        authorName: profile.display_name,
        authorUsername: profile.username,
        authorAvatar: profile.avatar_url || '',
        authorDepartment: profile.department || 'SVCET Student',
        category: postCategory,
        title: postTitle.trim(),
        content: postContent.trim(),
        tags: postTags.split(',').map((t) => t.trim()).filter(Boolean),
        likedBy: [],
      });

      toast({
        title: 'Post Published! 🚀',
        description: 'Your discussion is now visible to the campus community.',
      });

      setCreateModalOpen(false);
      setPostTitle('');
      setPostContent('');
      setPostTags('');
      loadPosts();
    } catch (err: any) {
      toast({ title: 'Failed to create post', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike(post: CommunityPost) {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Sign in to like posts.' });
      return;
    }
    await likeCommunityPost(post.id, user.uid);
  }

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      return (
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.content.toLowerCase().includes(search.toLowerCase()) ||
        p.authorName.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [posts, search]);

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-8 sm:py-12 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-3">
              <Users className="h-4 w-4" />
              <span>Campus Community & Feed</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              Connect, Collaborate & Share
            </h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Find hackathon teammates, share project tips, announce club symposiums, and talk directly with student makers.
            </p>
          </div>

          <Button
            onClick={() => {
              if (!user) {
                toast({ title: 'Sign in required', description: 'Please sign in to post.' });
                return;
              }
              setCreateModalOpen(true);
            }}
            className="rounded-2xl gap-2 h-12 px-6 shadow-sm shrink-0"
          >
            <Plus className="h-5 w-5" />
            Create a Post
          </Button>
        </div>

        {/* Channels / Tags Filter */}
        <div className="mt-6 sm:mt-8 space-y-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {channels.map((c) => (
              <Button
                key={c.value}
                variant={selectedChannel === c.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedChannel(c.value)}
                className="rounded-xl text-xs whitespace-nowrap h-9"
              >
                {c.label}
              </Button>
            ))}
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search community discussions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
        </div>

        {/* Posts Grid / Feed */}
        {loading ? (
          <div className="mt-8 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-3xl bg-secondary/50" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-border p-16 text-center bg-card/40">
            <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-display text-lg font-bold">No discussions in this channel yet</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Start the conversation by publishing the first post for your peers!
            </p>
            <Button onClick={() => setCreateModalOpen(true)} className="mt-5 rounded-xl">
              Create a Post
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5">
            {filteredPosts.map((post) => {
              const isLiked = user ? post.likedBy?.includes(user.uid) : false;

              return (
                <div
                  key={post.id}
                  className="rounded-3xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 ring-1 ring-border">
                        <AvatarImage src={post.authorAvatar} alt={post.authorName} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {post.authorName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{post.authorName}</span>
                          <span className="text-xs text-muted-foreground">@{post.authorUsername}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{post.authorDepartment}</p>
                      </div>
                    </div>

                    <Badge variant="outline" className="capitalize text-[10px]">
                      {post.category}
                    </Badge>
                  </div>

                  <h3 className="font-display text-lg font-bold text-foreground">
                    {post.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <span key={tag} className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="mt-5 pt-4 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(post)}
                        className={`flex items-center gap-1.5 font-semibold transition-colors ${
                          isLiked ? 'text-rose-500' : 'hover:text-rose-500'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                        <span>{post.likes}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.commentsCount} comments</span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (typeof navigator !== 'undefined') {
                          navigator.clipboard.writeText(window.location.href);
                          toast({ title: 'Link copied to clipboard!' });
                        }
                      }}
                      className="rounded-xl text-xs gap-1.5 h-8"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Post Modal */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="sm:max-w-lg rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Create Community Post</DialogTitle>
              <DialogDescription>
                Share insights, find teammates, or discuss campus projects.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreatePost} className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Post Title *</label>
                <Input
                  placeholder="e.g. Tips for Circuit Demo at IEEE Symposium"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Channel / Category</label>
                <Select value={postCategory} onValueChange={(v: any) => setPostCategory(v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic & Tips</SelectItem>
                    <SelectItem value="clubs">Club Updates</SelectItem>
                    <SelectItem value="opportunities">Hackathons & TeamUp</SelectItem>
                    <SelectItem value="marketplace">Marketplace Chat</SelectItem>
                    <SelectItem value="general">General Campus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Content *</label>
                <Textarea
                  placeholder="Write your discussion details, questions, or announcements..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={4}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Tags (comma separated)</label>
                <Input
                  placeholder="e.g. Symposium, Projects, CSE, Tips"
                  value={postTags}
                  onChange={(e) => setPostTags(e.target.value)}
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
                  Publish Post
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
