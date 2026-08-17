import Link from 'next/link';
import { ArrowRight, Sparkles, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CtaSection() {
  return (
    <section className="container-px mx-auto max-w-7xl py-10 sm:py-14">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#3B42C4] px-6 py-12 sm:px-12 sm:py-16 text-center shadow-xl border border-[#3B42C4]/30">
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #F5FFFA 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-[#F5FFFA] mb-4 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-[#F5FFFA]" />
            <span>Join 120+ SVCET Student Creators</span>
          </div>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-[#F5FFFA] text-balance">
            Turn your skills, notes & unused gear into campus cash
          </h2>
          <p className="mt-3 text-xs sm:text-base text-[#F5FFFA]/80 leading-relaxed text-balance">
            Set up your student shop in 2 minutes. Sell textbooks, kits, crafts, or offer freelance services directly to classmates with zero fees.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild className="rounded-2xl font-bold shadow-md h-12 text-xs sm:text-sm bg-[#1D5BF1] hover:bg-[#184ECC] text-[#F5FFFA] border border-[#1D5BF1]/40">
              <Link href="/register">
                Start Selling Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="rounded-2xl h-12 text-xs sm:text-sm bg-transparent border-white/30 text-[#F5FFFA] hover:bg-white/10 hover:text-[#F5FFFA]"
            >
              <Link href="/how-it-works">Learn How It Works</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
