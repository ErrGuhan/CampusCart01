'use client';

import Link from 'next/link';
import { Flame, ArrowRight, Zap, Recycle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DealsBannerSection() {
  return (
    <section className="container-px mx-auto max-w-7xl py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Used Items Card */}
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-amber-500/5 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-0.5 text-xs font-semibold text-amber-600 mb-3">
              <Recycle className="h-3.5 w-3.5" />
              <span>Campus Circular Economy</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground">
              Second-Hand & Used Essentials
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Passed down by seniors: Engineering drawing boards, lab coats, Casio calculators & semester notes at 50–70% off.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button asChild size="sm" className="rounded-xl gap-2 text-xs">
              <Link href="/used">
                Browse Used Items
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <span className="text-xs text-muted-foreground font-medium">Verified by Students</span>
          </div>
        </div>

        {/* Student Deals Card */}
        <div className="rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-background to-orange-500/5 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-0.5 text-xs font-semibold text-rose-600 mb-3">
              <Flame className="h-3.5 w-3.5" />
              <span>Pocket-Friendly Bargains</span>
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground">
              Deals Under ₹99 & ₹199
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Curated student study guides, digital templates, handmade keychains, and hardware components.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button asChild size="sm" variant="outline" className="rounded-xl gap-2 text-xs border-rose-500/30 text-rose-600 hover:bg-rose-500/10">
              <Link href="/deals">
                View All Deals
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <span className="text-xs text-muted-foreground font-medium">Updated Daily</span>
          </div>
        </div>
      </div>
    </section>
  );
}
