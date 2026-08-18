'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, Clock, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { ServiceGig } from '@/lib/types';

export function GigCard({ gig }: { gig: ServiceGig }) {
  const sellerDisplayName = gig.seller?.displayName || 'Campus Creator';
  const sellerUsername = gig.seller?.username || 'creator';
  const sellerAvatar = gig.seller?.avatar || 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg';
  const sellerDepartment = gig.seller?.department || '';

  const initials = sellerDisplayName
    ? sellerDisplayName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'CC';

  return (
    <div className="group relative flex flex-col rounded-[22px] sm:rounded-3xl border border-[#E2E4F6]/80 dark:border-border/80 bg-[#F5FFFA]/85 dark:bg-card/80 backdrop-blur-md shadow-2xs overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-[#3B42C4]/40 hover:-translate-y-1 active:scale-[0.98]">
      {/* Optimized Cover Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden shimmer-placeholder select-none">
        <Image
          src={gig.coverImage || 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg'}
          alt={gig.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2.5 left-2.5 z-10">
          <Badge className="bg-[#F5FFFA]/90 dark:bg-card/90 backdrop-blur-md text-foreground font-extrabold text-[10px] sm:text-[11px] shadow-2xs border border-[#E2E4F6]/80">
            {gig.category}
          </Badge>
        </div>
      </div>

      {/* Content - Spacious padding for airy feel */}
      <div className="flex flex-1 flex-col p-4 sm:p-5 gap-1.5">
        {/* Freelancer Header */}
        <Link
          href={`/seller/${sellerUsername}`}
          prefetch={true}
          className="flex items-center gap-2.5 mb-1.5 group/seller"
        >
          <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-1 ring-border shrink-0">
            <AvatarImage src={sellerAvatar} alt={sellerDisplayName} />
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold group-hover/seller:text-primary transition-colors truncate text-foreground">
              {sellerDisplayName}
            </p>
            {sellerDepartment && (
              <p className="text-[11px] text-muted-foreground truncate font-medium">
                {sellerDepartment}
              </p>
            )}
          </div>
          {gig.isVerified && (
            <span title="Verified Student Freelancer" className="text-[#1D5BF1]">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          )}
        </Link>

        {/* Title */}
        <Link href={`/services/${gig.slug}`} prefetch={true} className="flex-1">
          <h3 className="font-display text-xs sm:text-sm font-extrabold leading-snug line-clamp-2 text-foreground group-hover:text-[#3B42C4] transition-colors min-h-[2rem]">
            {gig.title}
          </h3>
        </Link>

        {/* Tags */}
        {gig.tags && gig.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {gig.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] sm:text-[11px] rounded-lg bg-[#F5FFFA] dark:bg-secondary/80 border border-[#E2E4F6]/80 px-2 py-0.5 text-foreground/80 font-semibold"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer info: Delivery time & Price */}
        <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold">
            <Clock className="h-3.5 w-3.5" />
            <span>{gig.deliveryTimeDays} {gig.deliveryTimeDays === 1 ? 'day' : 'days'}</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-muted-foreground block leading-none font-medium">Starting from</span>
            <span className="text-xs sm:text-sm font-black text-foreground group-hover:text-[#3B42C4] transition-colors">
              ₹{gig.startingPrice}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
