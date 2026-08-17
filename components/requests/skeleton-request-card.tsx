'use client';

import { cn } from '@/lib/utils';

export function SkeletonRequestCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-5 sm:p-6 rounded-3xl border border-[#E2E4F6]/80 dark:border-white/10 bg-[#F5FFFA]/70 dark:bg-slate-900/30 backdrop-blur-xl shadow-[0_4px_30px_rgba(29,91,241,0.04)] animate-pulse flex flex-col gap-4 select-none',
        className
      )}
    >
      {/* Header: Author details & Tag pill */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar circle */}
          <div className="h-10 w-10 rounded-full bg-[#E2E4F6] dark:bg-white/10 shrink-0" />
          <div className="space-y-1.5">
            {/* Author Name + Major */}
            <div className="flex items-center gap-2">
              <div className="h-4 w-28 bg-[#E2E4F6] dark:bg-white/10 rounded-md" />
              <div className="h-3 w-3 bg-[#E2E4F6]/60 dark:bg-white/5 rounded-full" />
              <div className="h-3.5 w-36 bg-[#E2E4F6]/80 dark:bg-white/10 rounded-md" />
            </div>
            {/* Year & Date */}
            <div className="h-3 w-24 bg-[#E2E4F6]/70 dark:bg-white/5 rounded-md" />
          </div>
        </div>

        {/* Tag Pill */}
        <div className="h-6 w-32 bg-[#E2E4F6] dark:bg-white/10 rounded-xl" />
      </div>

      {/* Title & Description blocks */}
      <div className="space-y-2.5 my-1">
        {/* Title */}
        <div className="h-5 w-4/5 bg-[#E2E4F6] dark:bg-white/10 rounded-lg" />
        {/* Description line 1 & 2 */}
        <div className="space-y-1.5">
          <div className="h-3.5 w-full bg-[#E2E4F6]/60 dark:bg-white/5 rounded" />
          <div className="h-3.5 w-11/12 bg-[#E2E4F6]/60 dark:bg-white/5 rounded" />
        </div>
      </div>

      {/* Footer: Views & Connect Button */}
      <div className="pt-3 border-t border-[#E2E4F6]/80 dark:border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <div className="h-3.5 w-16 bg-[#E2E4F6]/70 dark:bg-white/5 rounded-md" />
          <div className="h-3.5 w-16 bg-[#E2E4F6]/70 dark:bg-white/5 rounded-md" />
        </div>
        <div className="h-9 w-36 bg-[#1D5BF1]/20 dark:bg-white/10 rounded-xl" />
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
