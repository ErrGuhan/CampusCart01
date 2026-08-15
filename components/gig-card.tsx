'use client';

import Link from 'next/link';
import { Star, Clock, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { ServiceGig } from '@/lib/types';

export function GigCard({ gig }: { gig: ServiceGig }) {
  const initials = gig.seller.displayName
    ? gig.seller.displayName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'CC';

  return (
    <div className="group relative flex flex-col rounded-2xl sm:rounded-3xl border border-border/80 bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-indigo-500/40 hover:-translate-y-0.5 active:scale-[0.98]">
      {/* Cover Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary/40 select-none">
        <img
          src={gig.coverImage}
          alt={gig.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-2.5 left-2.5">
          <Badge className="bg-background/90 backdrop-blur-md text-foreground font-semibold text-[10px] sm:text-[11px] shadow-xs border-0">
            {gig.category}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {/* Freelancer Header */}
        <Link
          href={`/seller/${gig.seller.username}`}
          className="flex items-center gap-2 mb-2.5 group/seller"
        >
          <Avatar className="h-6 w-6 sm:h-7 sm:w-7 ring-1 ring-border shrink-0">
            <AvatarImage src={gig.seller.avatar} alt={gig.seller.displayName} />
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold group-hover/seller:text-primary transition-colors truncate text-foreground">
              {gig.seller.displayName}
            </p>
            {gig.seller.department && (
              <p className="text-[10px] text-muted-foreground truncate">
                {gig.seller.department}
              </p>
            )}
          </div>
          {gig.isVerified && (
            <span title="Verified Student Freelancer" className="text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
          )}
        </Link>

        {/* Title */}
        <Link href={`/services/${gig.slug}`} className="flex-1">
          <h3 className="font-display text-xs sm:text-sm font-bold leading-snug line-clamp-2 text-foreground group-hover:text-indigo-600 transition-colors">
            {gig.title}
          </h3>
        </Link>

        {/* Tags */}
        {gig.tags && gig.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {gig.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[9px] sm:text-[10px] rounded-md bg-secondary/80 px-1.5 py-0.5 text-muted-foreground font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer info: Delivery time & Price */}
        <div className="mt-3.5 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
            <Clock className="h-3 w-3" />
            <span>{gig.deliveryTimeDays} {gig.deliveryTimeDays === 1 ? 'day' : 'days'}</span>
          </div>

          <div className="text-right">
            <span className="text-[9px] text-muted-foreground block leading-none">Starting from</span>
            <span className="text-xs sm:text-sm font-extrabold text-foreground group-hover:text-indigo-600 transition-colors">
              ₹{gig.startingPrice}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
