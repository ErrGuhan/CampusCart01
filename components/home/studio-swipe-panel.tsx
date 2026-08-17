'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { CreatorsSection } from '@/components/home/creators-section';
import { SellerDashboardContent } from '@/components/seller-dashboard-content';
import { Button } from '@/components/ui/button';
import type { Seller } from '@/lib/types';

export function StudioSwipePanel({ sellers }: { sellers: Seller[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="pt-3 pb-28 sm:pb-32 px-3.5 sm:px-6 max-w-7xl mx-auto space-y-6">
        <div className="h-48 animate-pulse rounded-2xl bg-secondary/50" />
        <div className="h-64 animate-pulse rounded-3xl bg-secondary/30" />
      </div>
    );
  }

  // 1. Authenticated User -> Render Seller Studio Dashboard inside swipe panel
  if (user) {
    return <SellerDashboardContent isEmbedded={true} />;
  }

  // 2. Unauthenticated Visitor -> Render Public Student Creator Directory
  return (
    <div className="pt-3 pb-28 sm:pb-32 px-3.5 sm:px-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight">Creator & Seller Studio</h2>
          <p className="text-xs text-muted-foreground font-medium">Discover campus creators and manage your store</p>
        </div>
        <Button asChild size="sm" variant="outline" className="rounded-xl text-xs touch-target min-h-[44px] sm:min-h-auto">
          <Link href="/studio">Open Studio</Link>
        </Button>
      </div>
      <CreatorsSection sellers={sellers} />
      <div className="p-6 rounded-3xl bg-card border border-border text-center space-y-3 shadow-xs">
        <h3 className="font-bold text-sm text-foreground">Want to start earning on campus?</h3>
        <p className="text-xs text-muted-foreground font-medium">List your notes, project components, or offer your skills as a freelancer.</p>
        <div className="flex justify-center gap-2.5 pt-1">
          <Button asChild size="sm" className="btn-gradient-primary rounded-xl text-xs touch-target min-h-[44px] sm:min-h-auto">
            <Link href="/login">Sign In / Join Studio</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-xl text-xs touch-target min-h-[44px] sm:min-h-auto">
            <Link href="/register">Create Account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
