'use client';

import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function ShareProfileButton() {
  const { toast } = useToast();

  function handleShare() {
    toast({
      title: 'Profile link copied',
      description: 'Share this creator with your friends!',
    });
  }

  return (
    <Button variant="outline" size="icon" onClick={handleShare} aria-label="Share profile" className="shrink-0">
      <Share2 className="h-4 w-4" />
    </Button>
  );
}
