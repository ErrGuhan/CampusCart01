'use client';

import Link from 'next/link';
import { Flame, ArrowRight, Recycle, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DealsBannerSection() {
  return (
    <section className="container-px mx-auto max-w-7xl py-6 sm:py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Used Items Card */}
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-amber-500/5 p-5 sm:p-7 flex flex-col justify-between shadow-xs hover:border-amber-500/50 transition-all duration-300">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400 mb-3">
              <Recycle className="h-3.5 w-3.5" />
              <span>Senior-to-Junior Circular Economy</span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">
              Second-Hand & Used Essentials
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Passed down by seniors: Engineering drawing boards, lab coats, Casio calculators & semester guides at 50–70% off.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-amber-500/20 flex items-center justify-between">
            <Button asChild size="sm" className="rounded-xl gap-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs">
              <Link href="/used">
                Browse Used Items
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
              Verified by Students
            </span>
          </div>
        </div>

        {/* Student Deals Card */}
        <div className="rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-card to-orange-500/5 p-5 sm:p-7 flex flex-col justify-between shadow-xs hover:border-rose-500/50 transition-all duration-300">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-0.5 text-xs font-bold text-rose-600 mb-3">
              <Flame className="h-3.5 w-3.5" />
              <span>Pocket-Friendly Student Bargains</span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">
              Deals Under ₹99 & ₹199
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Curated study notes, handwritten summaries, Canva templates, 3D printed keychains, and IoT components.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-rose-500/20 flex items-center justify-between">
            <Button asChild size="sm" variant="outline" className="rounded-xl gap-2 text-xs font-bold border-rose-500/40 text-rose-600 hover:bg-rose-500/10">
              <Link href="/deals">
                View All Deals
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-rose-500" />
              Updated Daily
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
