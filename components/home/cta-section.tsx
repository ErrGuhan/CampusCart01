import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CtaSection() {
  return (
    <section className="container-px mx-auto max-w-7xl py-16">
      <div className="relative overflow-hidden rounded-3xl bg-foreground px-6 py-14 sm:px-12 sm:py-20 text-center">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, hsl(0 0% 100%) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium text-primary-foreground/90">
            <Sparkles className="h-3.5 w-3.5" />
            Built on Campus
          </div>
          <h2 className="mt-6 font-display text-3xl font-bold tracking-tight text-primary-foreground text-balance sm:text-4xl">
            Turn your creativity into a campus business
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/70 max-w-xl mx-auto text-balance">
            Join 120+ student creators selling their products to peers. Set up
            your shop in minutes — no fees, no friction.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center">
            <Button size="lg" asChild>
              <Link href="/register">
                Start Selling Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link href="/how-it-works">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
