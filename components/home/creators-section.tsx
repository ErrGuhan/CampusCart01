'use client';

import Link from 'next/link';
import { Star, ArrowRight, Store, Plus, Sparkles, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Seller } from '@/lib/types';

export function CreatorsSection({ sellers }: { sellers: Seller[] }) {
  return (
    <section className="bg-secondary/30 border-y border-border/80 py-12 sm:py-16">
      <div className="container-px mx-auto max-w-7xl">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Campus Entrepreneur Directory</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Meet Student Creators & Makers
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Talented peers building products, handmade gear, and freelance services on campus
            </p>
          </div>
          <Link
            href="/sellers"
            className="hidden sm:flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:gap-2 transition-all"
          >
            Explore all creators
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {sellers.map((seller) => (
            <Link
              key={seller.id}
              href={`/seller/${seller.username}`}
              className="group flex flex-col rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-5 sm:p-6 transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 active:scale-95"
            >
              <div className="flex items-start gap-3.5">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-border/80 group-hover:ring-primary/40 transition-all shrink-0">
                  <AvatarImage src={seller.avatar} alt={seller.displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                    {seller.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {seller.displayName}
                    </h3>
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                      Verified
                    </Badge>
                  </div>

                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                    {seller.department} {seller.year ? `· ${seller.year}` : ''}
                  </p>

                  <div className="mt-2 flex items-center gap-3 text-xs">
                    {seller.rating > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        <span className="font-bold text-foreground text-xs">{seller.rating.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground font-medium">New Creator</span>
                    )}
                    <span className="text-border">•</span>
                    <span className="text-[11px] text-muted-foreground">
                      {seller.productCount} {seller.productCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-3.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                {seller.bio}
              </p>

              {seller.skills && seller.skills.length > 0 && (
                <div className="mt-3.5 flex flex-wrap gap-1">
                  {seller.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground"
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
            className="group flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center transition-all hover:bg-primary/10 hover:border-primary/50 active:scale-95"
          >
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
              <Store className="h-6 w-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors">
              Become a Student Creator
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs leading-relaxed">
              Start selling your handmade goods, project kits, notes, or freelance services with zero fees.
            </p>
            <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">
              <Plus className="h-3.5 w-3.5" />
              <span>Join Platform</span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
