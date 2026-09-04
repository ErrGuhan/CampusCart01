'use client';

import Link from 'next/link';
import { Star, ArrowRight, Store, Plus, Sparkles } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Seller } from '@/lib/types';

export function CreatorsSection({ sellers }: { sellers: Seller[] }) {
  // Exclude admin from the student creators showcase
  const studentSellers = sellers.filter((seller) => {
    const u = (seller.username || '').toLowerCase();
    const name = (seller.displayName || '').toLowerCase();
    const bio = (seller.bio || '').toLowerCase();
    const id = (seller.id || '').toLowerCase();

    return !(
      u === 'guhan' ||
      u.includes('guhan24td0781') ||
      name.includes('guhan murugaiyan') ||
      id.includes('guhan') ||
      bio.includes('administrator') ||
      bio.includes('platform administrator')
    );
  });

  return (
    <section className="bg-secondary/30 border-y border-border/80 py-10 sm:py-16">
      <div className="container-px mx-auto max-w-7xl">
        <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary mb-1.5">
              <Sparkles className="h-4 w-4" />
              <span>Campus Entrepreneur Directory</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              Meet Student Creators & Makers
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-muted-foreground font-medium">
              Talented peers building products, handmade gear, and freelance services on campus
            </p>
          </div>
          <Link
            href="/sellers"
            className="hidden sm:flex items-center gap-1 text-sm font-bold text-primary hover:gap-2 transition-all pb-1 shrink-0"
          >
            Explore all creators
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {studentSellers.map((seller) => (
            <Link
              key={seller.id}
              href={`/seller/${seller.username}`}
              className="group flex flex-col h-full rounded-3xl border border-border/80 bg-card/85 dark:bg-card/75 backdrop-blur-md p-5 sm:p-6 transition-all hover:shadow-lg hover:border-primary/40 hover:-translate-y-1 active:scale-95 shadow-2xs"
            >
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all shrink-0">
                  <AvatarImage src={seller.avatar} alt={seller.displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                    {seller.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-base sm:text-lg font-extrabold text-foreground group-hover:text-primary transition-colors truncate">
                      {seller.displayName}
                    </h3>
                    <Badge variant="secondary" className="text-xs px-2 py-0 h-5 font-bold">
                      Verified
                    </Badge>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate font-medium">
                    {seller.department} {seller.year ? `· ${seller.year}` : ''}
                  </p>

                  <div className="mt-2.5 flex items-center gap-3 text-xs sm:text-sm">
                    {seller.rating > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-extrabold text-foreground text-xs sm:text-sm">{seller.rating.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground font-medium">New Creator</span>
                    )}
                    <span className="text-border">•</span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {seller.productCount} {seller.productCount === 1 ? 'listing' : 'listings'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1 font-medium">
                {seller.bio}
              </p>

              {seller.skills && seller.skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {seller.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-xl bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}

          {/* Become a Creator Card */}
          <Link
            href="/register"
            className="group flex flex-col h-full items-center justify-center rounded-3xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center transition-all hover:bg-primary/10 hover:border-primary/50 active:scale-95 shadow-2xs"
          >
            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform shadow-xs">
              <Store className="h-7 w-7" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-foreground group-hover:text-primary transition-colors">
              Become a Student Creator
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-xs leading-relaxed font-medium">
              Start selling your handmade goods, project kits, notes, or freelance services with zero fees.
            </p>
            <div className="mt-5 inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-primary">
              <Plus className="h-4 w-4" />
              <span>Join Platform</span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
