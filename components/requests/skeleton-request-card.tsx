'use client';

import { cn } from '@/lib/utils';

export function SkeletonRequestCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-5 sm:p-6 rounded-3xl border border-border/80 bg-card/70 dark:bg-card/50 backdrop-blur-xl shadow-xs animate-pulse flex flex-col gap-4 select-none',
        className
      )}
    >
      {/* Header: Author details & Tag pill */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar circle */}
          <div className="h-10 w-10 rounded-full bg-secondary shrink-0" />
          <div className="space-y-1.5">
            {/* Author Name + Major */}
            <div className="flex items-center gap-2">
              <div className="h-4 w-28 bg-secondary rounded-md" />
              <div className="h-3 w-3 bg-secondary/60 rounded-full" />
              <div className="h-3.5 w-36 bg-secondary/80 rounded-md" />
            </div>
            {/* Year & Date */}
            <div className="h-3 w-24 bg-secondary/70 rounded-md" />
          </div>
        </div>

        {/* Tag Pill */}
        <div className="h-6 w-32 bg-secondary rounded-xl" />
      </div>

      {/* Title & Description blocks */}
      <div className="space-y-2.5 my-1">
        {/* Title */}
        <div className="h-5 w-4/5 bg-secondary rounded-lg" />
        {/* Description line 1 & 2 */}
        <div className="space-y-1.5">
          <div className="h-3.5 w-full bg-secondary/60 rounded" />
          <div className="h-3.5 w-11/12 bg-secondary/60 rounded" />
        </div>
      </div>

      {/* Footer: Views & Connect Button */}
      <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <div className="h-3.5 w-16 bg-secondary/70 rounded-md" />
          <div className="h-3.5 w-16 bg-secondary/70 rounded-md" />
        </div>
        <div className="h-9 w-36 bg-secondary rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonRequestFeed({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading collaboration discussions">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonRequestCard key={`skeleton-card-${idx}`} />
      ))}
      <span className="sr-only">Loading discussions...</span>
    </div>
  );
}
