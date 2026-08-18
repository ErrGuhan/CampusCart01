'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, X, Sparkles, Smartphone, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/use-pwa';
import { PWAInstallDialog } from '@/components/pwa-install-dialog';

const DISMISS_DURATION_DAYS = 5;

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWA();
  const [visible, setVisible] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem('campuscart_pwa_banner_dismissed');
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_DURATION_DAYS) {
        return;
      }
    }

    // If already running standalone or not eligible, don't show
    if (isInstalled) {
      setVisible(false);
      return;
    }

    // Trigger banner with subtle delay for smooth entry
    if (isInstallable || isIOS) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, isIOS]);

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem('campuscart_pwa_banner_dismissed', String(Date.now()));
    } catch {}
  };

  const handleAction = async () => {
    if (isIOS) {
      setDialogOpen(true);
      return;
    }

    setInstalling(true);
    try {
      const installed = await promptInstall();
      if (installed) {
        setVisible(false);
      }
    } finally {
      setInstalling(false);
    }
  };

  if (!visible || isInstalled) return null;

  return (
    <>
      <aside
        aria-label="Install CampusCart App"
        className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-45 animate-in slide-in-from-bottom-5 fade-in duration-300"
      >
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card/90 p-4 shadow-2xl backdrop-blur-xl transition-all hover:border-primary/50">
          {/* Ambient background glow */}
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-cyan-500/15 blur-2xl" />

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="absolute top-3 right-3 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3.5 pr-6">
            {/* App Icon */}
            <div className="relative h-12 w-12 shrink-0 rounded-2xl bg-linear-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 p-2 flex items-center justify-center shadow-inner">
              <Image
                src="/icons/icon-192x192.svg"
                alt="CampusCart"
                width={36}
                height={36}
                className="rounded-lg object-contain"
              />
            </div>

            {/* Content */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-foreground">Install CampusCart</h4>
                <span className="inline-flex items-center rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                  App
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Install on your {isIOS ? 'iPhone / iPad' : 'device'} for faster browsing, offline mode, and instant updates.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3.5 flex items-center justify-end gap-2 pt-2 border-t border-border/40">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-xs text-muted-foreground h-8 px-2.5 hover:text-foreground"
            >
              Not now
            </Button>

            <Button
              size="sm"
              onClick={handleAction}
              disabled={installing}
              className="h-8 gap-1.5 bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-98"
            >
              {isIOS ? (
                <>
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>How to Install</span>
                  <ChevronRight className="h-3 w-3" />
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>{installing ? 'Installing...' : 'Install App'}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </aside>

      {/* Guide dialog for iOS */}
      <PWAInstallDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
