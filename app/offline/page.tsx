'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  WifiOff, RefreshCw, ShoppingBag, Sparkles, Home,
  ArrowRight, ShieldCheck, Zap, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function OfflinePage() {
  const [isChecking, setIsChecking] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsChecking(true);
    try {
      // Attempt a fast lightweight fetch to verify internet access
      const res = await fetch('/favicon.svg?t=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
      if (res.ok) {
        setIsOnline(true);
        window.location.reload();
      }
    } catch {
      setIsOnline(navigator.onLine);
    } finally {
      setIsChecking(false);
      setLastChecked(new Date());
    }
  };

  return (
    <main className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="max-w-xl w-full mx-auto text-center space-y-8 animate-in fade-in-50 zoom-in-95 duration-300">
        
        {/* Animated Visual Beacon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-destructive/10 animate-ping duration-1000 opacity-75" />
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-linear-to-b from-muted/80 to-muted/30 border border-border/80 shadow-2xl flex items-center justify-center text-primary backdrop-blur-xl">
            <WifiOff className="h-12 w-12 sm:h-14 sm:w-14 text-amber-500 animate-pulse" />
          </div>
        </div>

        {/* Title and Description */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Offline Mode Active</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif text-foreground">
            No Internet Connection
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            CampusCart is running in offline mode. You can still explore previously cached listings or retry your connection.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={handleRetry}
            disabled={isChecking}
            className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all active:scale-98"
          >
            <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking Connection...' : 'Retry Connection'}
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto border-border/60 hover:bg-muted/50"
          >
            <Link href="/" className="gap-2">
              <Home className="h-4 w-4" />
              Return Home
            </Link>
          </Button>
        </div>

        {lastChecked && !isOnline && (
          <p className="text-xs text-muted-foreground/80">
            Checked at {lastChecked.toLocaleTimeString()} — Still offline
          </p>
        )}

        {/* Cached Section Cards */}
        <div className="pt-4">
          <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-4">
            Available While Offline
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <Link href="/marketplace" className="group">
              <Card className="p-4 border-border/40 bg-card/60 backdrop-blur-md hover:border-primary/40 hover:bg-card/90 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      Marketplace
                    </h3>
                    <p className="text-xs text-muted-foreground">Cached listings & deals</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </Card>
            </Link>

            <Link href="/services" className="group">
              <Card className="p-4 border-border/40 bg-card/60 backdrop-blur-md hover:border-primary/40 hover:bg-card/90 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-cyan-400 transition-colors">
                      Freelance & Gigs
                    </h3>
                    <p className="text-xs text-muted-foreground">Cached student services</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
              </Card>
            </Link>
          </div>
        </div>

        {/* Offline Features Info */}
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 text-xs text-muted-foreground flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Secure Offline Cache</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-400" />
            <span>Instant Reconnect</span>
          </div>
        </div>

      </div>
    </main>
  );
}
