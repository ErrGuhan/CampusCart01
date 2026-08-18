'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePWA } from '@/hooks/use-pwa';
import { PWAInstallBanner } from '@/components/pwa-install-banner';
import { PWAInstallDialog } from '@/components/pwa-install-dialog';
import { toast } from '@/hooks/use-toast';

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  promptInstall: () => Promise<boolean>;
  applyUpdate: () => void;
  openInstallDialog: () => void;
}

const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  isInstalled: false,
  isIOS: false,
  isOnline: true,
  hasUpdate: false,
  promptInstall: async () => false,
  applyUpdate: () => {},
  openInstallDialog: () => {},
});

export const usePWAContext = () => useContext(PWAContext);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const pwa = usePWA();
  const [dialogOpen, setDialogOpen] = useState(false);
  const prevOnlineRef = useRef<boolean | null>(null);

  // Online / Offline transitions
  useEffect(() => {
    if (prevOnlineRef.current !== null && prevOnlineRef.current !== pwa.isOnline) {
      if (!pwa.isOnline) {
        toast({
          title: '⚡ Offline Mode Active',
          description: 'CampusCart is running in offline mode. Cached items and pages remain available.',
        });
      } else {
        toast({
          title: '🌐 Back Online',
          description: 'Connection restored. Real-time updates and marketplace actions are live.',
        });
      }
    }
    prevOnlineRef.current = pwa.isOnline;
  }, [pwa.isOnline]);

  // App Update notification
  useEffect(() => {
    if (pwa.hasUpdate) {
      toast({
        title: '🚀 Update Available',
        description: 'A new version of CampusCart is ready. Refresh now for the latest features.',
      });
    }
  }, [pwa.hasUpdate]);

  const openInstallDialog = () => {
    setDialogOpen(true);
  };

  return (
    <PWAContext.Provider
      value={{
        ...pwa,
        openInstallDialog,
      }}
    >
      {children}
      <PWAInstallBanner />
      <PWAInstallDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </PWAContext.Provider>
  );
}
