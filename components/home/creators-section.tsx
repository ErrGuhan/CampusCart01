import Link from 'next/link';
import { Star, ArrowRight } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { Seller } from '@/lib/types';

export function CreatorsSection({ sellers }: { sellers: Seller[] }) {
  return (
    <section className="bg-secondary/30 border-y border-border">
      <div className="container-px mx-auto max-w-7xl py-16">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Meet the Creators
            </h2>
            <p className="mt-2 text-muted-foreground">
              Talented students building products and businesses on campus
            </p>
          </div>
          <Link
            href="/sellers"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {sellers.map((seller) => (
            <Link
              key={seller.id}
              href={`/seller/${seller.username}`}
              className="group flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center transition-all hover:shadow-lg hover:border-primary/20 hover:-translate-y-1"
            >
              <Avatar className="h-20 w-20 ring-2 ring-border group-hover:ring-primary/30 transition-all">
                <AvatarImage src={seller.avatar} alt={seller.displayName} />
                <AvatarFallback>
                  {seller.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <h3 className="mt-4 text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                {seller.displayName}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {seller.department} · {seller.year}
              </p>

              <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {seller.bio}
              </p>

              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="text-sm font-medium">
                    {seller.rating.toFixed(1)}
                  </span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="text-sm text-muted-foreground">
                  {seller.productCount} products
                </div>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {seller.skills.slice(0, 2).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
