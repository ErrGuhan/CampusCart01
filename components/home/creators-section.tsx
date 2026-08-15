'use client';

import Link from 'next/link';
import { Star, ArrowRight, Store, Plus } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Seller } from '@/lib/types';

export function CreatorsSection({ sellers }: { sellers: Seller[] }) {
  return (
    <section className="bg-secondary/30 border-y border-border">
      <div className="container-px mx-auto max-w-7xl py-16">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Meet Campus Creators
            </h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Talented students building products and freelance services on campus
            </p>
          </div>
          <Link
            href="/sellers"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all"
          >
            Explore all creators
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sellers.map((seller) => (
            <Link
              key={seller.id}
              href={`/seller/${seller.username}`}
              className="group flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
            >
              <Avatar className="h-20 w-20 ring-2 ring-border group-hover:ring-primary/40 transition-all">
                <AvatarImage src={seller.avatar} alt={seller.displayName} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                  {seller.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="mt-4 flex items-center gap-1.5 justify-center">
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  {seller.displayName}
                </h3>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  Verified
                </Badge>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {seller.department} {seller.year ? `· ${seller.year}` : ''}
              </p>

              <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {seller.bio}
              </p>

              <div className="mt-4 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <span className="font-semibold">{seller.rating.toFixed(1)}</span>
                </div>
                <div className="h-3 w-px bg-border" />
                <div className="text-muted-foreground">
                  {seller.productCount} {seller.productCount === 1 ? 'item' : 'items'}
                </div>
              </div>

              {seller.skills && seller.skills.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {seller.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
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
            className="group flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center transition-all hover:bg-primary/10 hover:border-primary/50"
          >
            <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Store className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
              Become a Student Creator
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground max-w-xs">
              Start selling your handmade goods, project kits, notes, or freelance services on CampusCart.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary">
              <Plus className="h-3.5 w-3.5" />
              <span>Join Platform</span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
