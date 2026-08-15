'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell, CheckCircle2, ShoppingBag, Sparkles,
  MessageSquare, ShieldCheck, ArrowRight, Check,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  getNotifications,
  markNotificationRead,
} from '@/lib/firebase-queries';
import type { NotificationItem } from '@/lib/types';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      try {
        const notifs = await getNotifications(user!.uid);
        setNotifications(notifs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  async function handleMarkRead(id: string) {
    if (!user) return;
    await markNotificationRead(user.uid, id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  function handleMarkAllRead() {
    if (!user) return;
    notifications.forEach((n) => markNotificationRead(user.uid, n.id));
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast({ title: 'All notifications marked as read' });
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.isRead;
    return n.type === filter;
  });

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-4xl py-8 sm:py-12 min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border mb-8">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Notifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Stay updated on your product orders, freelance proposals, and campus activities.
            </p>
          </div>

          {notifications.some((n) => !n.isRead) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="rounded-xl text-xs gap-1.5 self-start sm:self-auto"
            >
              <Check className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="rounded-xl text-xs whitespace-nowrap"
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
            className="rounded-xl text-xs whitespace-nowrap"
          >
            Unread ({notifications.filter((n) => !n.isRead).length})
          </Button>
        </div>

        {/* Notification Feed */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-secondary/50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-16 text-center bg-card/40">
            <Bell className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="font-display text-lg font-bold">No notifications to show</h3>
            <p className="text-xs text-muted-foreground mt-1">You are completely up to date!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkRead(n.id)}
                className={`rounded-2xl border p-4 sm:p-5 transition-all flex items-start justify-between gap-4 ${
                  !n.isRead
                    ? 'border-primary/40 bg-primary/[0.03] shadow-sm'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary mt-0.5">
                    {n.type === 'order' ? (
                      <ShoppingBag className="h-5 w-5" />
                    ) : n.type === 'message' ? (
                      <MessageSquare className="h-5 w-5" />
                    ) : n.type === 'approval' ? (
                      <ShieldCheck className="h-5 w-5" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-foreground">{n.title}</h4>
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-muted-foreground mt-2 block">
                      {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {n.link && (
                  <Button asChild size="sm" variant="ghost" className="rounded-xl text-xs gap-1 shrink-0 self-center">
                    <Link href={n.link}>
                      View
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
