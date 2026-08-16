'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  onSecondaryAction?: () => void;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryActionLabel,
  secondaryActionHref,
  onSecondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-dashed border-border/80 bg-card/40 text-center flex flex-col items-center justify-center transition-all',
        compact ? 'p-6 sm:p-8' : 'p-8 sm:p-14 my-4',
        className
      )}
    >
      {/* Decorative ambient background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Icon Badge */}
      <div className="relative mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary ring-8 ring-primary/5 shadow-inner animate-in zoom-in-75 duration-300">
        <Icon className="h-8 w-8 sm:h-10 sm:w-10" />
        <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Text Hierarchy */}
      <h3 className="font-display text-lg sm:text-xl font-bold text-foreground tracking-tight max-w-md">
        {title}
      </h3>
      <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-sm sm:max-w-md leading-relaxed">
        {description}
      </p>

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full max-w-xs sm:max-w-md">
          {actionLabel && (
            actionHref ? (
              <Button asChild className="btn-gradient-primary rounded-xl font-bold text-xs sm:text-sm h-10 px-5 shadow-sm flex-1">
                <Link href={actionHref}>{actionLabel}</Link>
              </Button>
            ) : (
              <Button
                onClick={onAction}
                className="btn-gradient-primary rounded-xl font-bold text-xs sm:text-sm h-10 px-5 shadow-sm flex-1"
              >
                {actionLabel}
              </Button>
            )
          )}

          {secondaryActionLabel && (
            secondaryActionHref ? (
              <Button asChild variant="outline" className="rounded-xl font-semibold text-xs sm:text-sm h-10 px-4 border-border/80 flex-1">
                <Link href={secondaryActionHref}>{secondaryActionLabel}</Link>
              </Button>
            ) : (
              <Button
                onClick={onSecondaryAction}
                variant="outline"
                className="rounded-xl font-semibold text-xs sm:text-sm h-10 px-4 border-border/80 flex-1"
              >
                {secondaryActionLabel}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
