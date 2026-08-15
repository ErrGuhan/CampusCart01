'use client';

import Link from 'next/link';
import { Star, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { ServiceGig } from '@/lib/types';

export function GigCard({ gig }: { gig: ServiceGig }) {
  const initials = gig.seller.displayName
    ? gig.seller.displayName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'CC';

  return (
    <div className="group relative flex flex-col rounded-2xl border border-border/80 bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/40 hover:-translate-y-1">
      {/* Cover Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary/40">
        <img
          src={gig.coverImage}
          alt={gig.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <Badge className="bg-background/90 backdrop-blur-md text-foreground font-medium text-[11px] shadow-sm border-0">
            {gig.category}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Freelancer Header */}
        <Link
          href={`/seller/${gig.seller.username}`}
          className="flex items-center gap-2.5 mb-3 group/seller"
        >
          <Avatar className="h-7 w-7 border border-border">
            <AvatarImage src={gig.seller.avatar} alt={gig.seller.displayName} />
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold group-hover/seller:text-primary transition-colors truncate">
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
          <h3 className="font-display text-sm sm:text-base font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {gig.title}
          </h3>
        </Link>

        {/* Tags */}
        {gig.tags && gig.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {gig.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] rounded-md bg-secondary px-1.5 py-0.5 text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer info: Rating, Delivery, Price */}
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{gig.deliveryTimeDays} {gig.deliveryTimeDays === 1 ? 'day' : 'days'}</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-muted-foreground block leading-none">Starting at</span>
            <span className="text-sm font-bold text-foreground">₹{gig.startingPrice}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
