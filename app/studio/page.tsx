'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { PublicCreatorDirectory } from '@/components/public-creator-directory';
import { SellerDashboardContent } from '@/components/seller-dashboard-content';
import { Loader2 } from 'lucide-react';

export default function StudioPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Automatically redirect authenticated creators/students to their dedicated Seller Studio
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/seller/dashboard');
    }
  }, [user, authLoading, router]);

  // 1. Loading State Check (prevents flashing public directory to a logged-in user while verifying session token)
  if (authLoading) {
    return (
      <>
        <Navbar />
        <main className="container-px mx-auto max-w-7xl py-16 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3.5 text-center">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Loading Studio...</p>
              <p className="text-xs text-muted-foreground mt-0.5">Redirecting to your Seller Studio</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // 2. Conditional Rendering: Logged-out visitor -> Public Creator Directory
  if (!user) {
    return <PublicCreatorDirectory />;
  }

  // 3. Fallback for authenticated creator/student while router redirects
  return <SellerDashboardContent />;
}
