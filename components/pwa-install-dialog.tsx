'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Share2, PlusSquare, Smartphone, Download,
  CheckCircle2, Sparkles, Zap, ShieldCheck
} from 'lucide-react';
import { usePWA } from '@/hooks/use-pwa';

interface PWAInstallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PWAInstallDialog({ open, onOpenChange }: PWAInstallDialogProps) {
  const { isIOS, isInstallable, promptInstall } = usePWA();
  const [installing, setInstalling] = useState(false);

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const accepted = await promptInstall();
      if (accepted) {
        onOpenChange(false);
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl">
        <DialogHeader className="text-center sm:text-left space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-2xl bg-card border border-border/80 p-1 flex items-center justify-center shadow-md">
              <Image
                src="/images/logo/logo-icon.png"
                alt="CampusCart"
                width={40}
                height={40}
                className="object-contain w-full h-full filter drop-shadow-xs"
              />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Install CampusCart</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Get the full native student marketplace experience
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isIOS ? (
          /* iOS Step-by-Step Instructions */
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Install directly from Safari without going to the App Store!</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-xs">
                  1
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    Tap the Share Button
                    <Share2 className="h-3.5 w-3.5 text-blue-400 inline" />
                  </p>
                  <p className="text-muted-foreground">
                    Tap the Safari toolbar Share icon at the bottom of your screen.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-xs">
                  2
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    Select "Add to Home Screen"
                    <PlusSquare className="h-3.5 w-3.5 text-emerald-400 inline" />
                  </p>
                  <p className="text-muted-foreground">
                    Scroll down the share sheet and tap <span className="text-foreground font-semibold">Add to Home Screen</span>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-xs">
                  3
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-foreground">Tap "Add" on Top Right</p>
                  <p className="text-muted-foreground">
                    CampusCart will now appear on your home screen with instant full-screen access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Android / Desktop / Standard PWA Prompt */
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/40 flex flex-col gap-1.5">
                <Zap className="h-4 w-4 text-amber-400" />
                <span className="font-bold text-foreground">Lightning Fast</span>
                <span className="text-muted-foreground text-[11px]">Instant load with zero lag</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/40 flex flex-col gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-foreground">Works Offline</span>
                <span className="text-muted-foreground text-[11px]">Browse cached items</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Installing CampusCart adds an app icon to your home screen or desktop, launches in a standalone window, and gives you quick access to orders, chats, and student gigs.
            </p>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          {isInstallable && !isIOS ? (
            <Button
              onClick={handleInstallClick}
              disabled={installing}
              className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20"
            >
              <Download className="h-4 w-4" />
              {installing ? 'Installing...' : 'Install App Now'}
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full border-border/60"
          >
            {isIOS ? 'Got It' : 'Maybe Later'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
