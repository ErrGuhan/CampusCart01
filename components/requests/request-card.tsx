'use client';

import { useMemo } from 'react';
import {
  Rocket, Lightbulb, Wrench, TestTube2, Users,
  MessageSquare, Eye, Sparkles, CheckCircle2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CollaborationRequest, CollaborationTag } from '@/lib/types';
import { cn } from '@/lib/utils';

// Helper function to format timestamp into human-readable relative time
export function formatTimeAgo(timestamp: string | Date | undefined): string {
  if (!timestamp) return 'Recently';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return 'Yesterday';
    }
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }

    // Older than 7 days: format as '16 Aug'
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}

// Tag metadata map for vibrant badges and clear typography
const TAG_META: Record<
  CollaborationTag,
  { label: string; icon: any; badgeClass: string }
> = {
  LOOKING_FOR_COFOUNDER: {
    label: '🚀 Looking for Co-Founder',
    icon: Rocket,
    badgeClass: 'bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400 dark:bg-blue-500/20 backdrop-blur-sm shadow-[0_2px_10px_rgba(59,130,246,0.12)]',
  },
  NEED_FEEDBACK: {
    label: '💡 Need Feedback',
    icon: Lightbulb,
    badgeClass: 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400 dark:bg-amber-500/20 backdrop-blur-sm shadow-[0_2px_10px_rgba(245,158,11,0.12)]',
  },
  HARDWARE_HELP: {
    label: '🛠️ Hardware Help',
    icon: Wrench,
    badgeClass: 'bg-cyan-500/15 text-cyan-600 border-cyan-500/30 dark:text-cyan-400 dark:bg-cyan-500/20 backdrop-blur-sm shadow-[0_2px_10px_rgba(6,182,212,0.12)]',
  },
  BETA_TESTERS: {
    label: '🧪 Beta Testers',
    icon: TestTube2,
    badgeClass: 'bg-purple-500/15 text-purple-600 border-purple-500/30 dark:text-purple-400 dark:bg-purple-500/20 backdrop-blur-sm shadow-[0_2px_10px_rgba(168,85,247,0.12)]',
  },
  GENERAL: {
    label: '🤝 Teammates & General',
    icon: Users,
    badgeClass: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400 dark:bg-emerald-500/20 backdrop-blur-sm shadow-[0_2px_10px_rgba(16,185,129,0.12)]',
  },
};

type RequestCardProps = {
  data: CollaborationRequest;
  onConnect: (request: CollaborationRequest) => void;
  currentUserId?: string;
  className?: string;
};

export function RequestCard({ data, onConnect, currentUserId, className }: RequestCardProps) {
  const timeAgo = useMemo(() => formatTimeAgo(data.createdAt), [data.createdAt]);
  const tagInfo = TAG_META[data.tags] || TAG_META.GENERAL;
  const isOwner = Boolean(currentUserId && currentUserId === data.authorId);

  const initials = data.authorName
    ? data.authorName
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <article
      className={cn(
        'group relative p-5 sm:p-6 rounded-3xl border border-white/40 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-lg shadow-[0_4px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.18)] hover:border-cyan-400/50 transition-all duration-300 flex flex-col justify-between gap-4',
        className
      )}
    >
      {/* 1. Header: Author Metadata & Tag Pill */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        {/* Author details */}
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 sm:h-11 sm:w-11 ring-2 ring-white/60 dark:ring-white/20 shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
            {data.authorAvatar && <AvatarImage src={data.authorAvatar} alt={data.authorName} />}
            <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-display font-bold text-sm text-foreground truncate">
                {data.authorName}
              </span>
              {isOwner && (
                <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                  You
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 truncate max-w-[200px] sm:max-w-none">
                {data.authorMajor || 'Computer Science & Engineering'}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
              <span>{data.authorYear || '4th Year'}</span>
              <span>•</span>
              <time dateTime={data.createdAt} className="font-semibold text-foreground/70">
                {timeAgo}
              </time>
            </p>
          </div>
        </div>

        {/* Dynamic Filter Pill */}
        <Badge
          variant="outline"
          className={cn(
            'text-[11px] font-bold px-3 py-1 rounded-xl shrink-0 border whitespace-nowrap',
            tagInfo.badgeClass
          )}
        >
          {tagInfo.label}
        </Badge>
      </div>

      {/* 2. Content: Title and Description */}
      <div className="space-y-1.5">
        <h2 className="font-display text-base sm:text-lg font-bold text-foreground group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:via-indigo-600 group-hover:to-cyan-600 dark:group-hover:from-blue-400 dark:group-hover:via-indigo-300 dark:group-hover:to-cyan-300 group-hover:bg-clip-text transition-all leading-snug">
          {data.title}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium line-clamp-3">
          {data.description}
        </p>
      </div>

      {/* 3. Footer: Interaction Metrics and Action Button */}
      <div className="pt-3 border-t border-white/30 dark:border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 text-xs text-muted-foreground font-semibold">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span>{data.viewsCount || 0} views</span>
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>{data.responsesCount || 0} responses</span>
          </span>
        </div>

        {isOwner ? (
          <Badge
            variant="outline"
            className="rounded-xl text-xs font-semibold px-3 py-1.5 bg-secondary/60 text-muted-foreground border-white/20"
          >
            Your Active Pitch
          </Badge>
        ) : (
          <Button
            size="sm"
            onClick={() => onConnect(data)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-[0_4px_16px_rgba(6,182,212,0.3)] px-4 touch-target min-h-[38px] transition-all active:scale-95 border border-white/20"
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            Connect & Message
          </Button>
        )}
      </div>
    </article>
  );
}
