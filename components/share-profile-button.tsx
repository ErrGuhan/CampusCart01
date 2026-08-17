'use client';

import { Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function ShareProfileButton({ className }: { className?: string }) {
  const { toast } = useToast();

  function handleShare() {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    toast({
      title: 'Profile link copied! 📋',
      description: 'Share this student creator with your campus friends!',
    });
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Share creator profile"
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-full bg-amber-200/70 hover:bg-amber-300 text-amber-950 dark:bg-amber-900/60 dark:text-amber-100 transition-all active:scale-90 shadow-2xs shrink-0 border border-amber-300/50 dark:border-amber-700/40',
        className
      )}
    >
      <Share2 className="h-4.5 w-4.5" />
    </button>
  );
}
