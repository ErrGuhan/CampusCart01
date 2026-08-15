'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, ShieldAlert, Sparkles } from 'lucide-react';

type AuthPromptDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  actionName?: string;
  redirectTo?: string;
};

export function AuthPromptDialog({
  isOpen,
  onClose,
  title = 'Sign In to CampusCart',
  description = 'You must be signed in with your college account to perform this action on campus.',
  actionName = 'continue',
  redirectTo,
}: AuthPromptDialogProps) {
  const pathname = usePathname();
  const targetRedirect = encodeURIComponent(redirectTo || pathname || '/');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 sm:p-7 border-border shadow-2xl">
        <DialogHeader className="text-center sm:text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-7 w-7" />
          </div>
          <DialogTitle className="font-display text-xl font-bold tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground flex items-center gap-2.5">
          <ShieldAlert className="h-4 w-4 text-primary shrink-0" />
          <span>SVCET Campus student verification ensures safety and trusted handovers.</span>
        </div>

        <DialogFooter className="flex flex-col sm:flex-col gap-2 pt-2">
          <Button asChild className="w-full rounded-xl h-11 font-bold text-xs shadow-xs" size="lg">
            <Link href={`/login?redirect=${targetRedirect}`}>
              <LogIn className="h-4 w-4 mr-2" />
              Sign In to {actionName}
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full rounded-xl h-10 text-xs font-semibold">
            <Link href={`/register?redirect=${targetRedirect}`}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Campus Account
            </Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-xl text-xs text-muted-foreground mt-1"
            onClick={onClose}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
