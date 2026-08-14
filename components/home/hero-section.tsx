import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="container-px mx-auto max-w-7xl relative">
        <div className="grid grid-cols-1 gap-8 py-12 sm:py-16 lg:grid-cols-2 lg:gap-8 lg:py-24 items-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Trusted by students by our college
            </div>

            <h1 className="mt-4 sm:mt-6 font-display text-3xl sm:text-4xl font-bold leading-[1.1] tracking-tight text-balance md:text-5xl lg:text-6xl">
              Discover what our{' '}
              <span className="text-primary">campus creates</span>
            </h1>

            <p className="mt-3 sm:mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg text-balance">
              Buy, sell, and discover products created by our students in our
              college. From handmade crafts to digital designs, find it all in
              one trusted marketplace.
            </p>

            <div className="mt-6 sm:mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="w-full sm:w-auto sm:h-12 sm:px-6 text-base">
                <Link href="/products">
                  Explore Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto sm:h-12 sm:px-6 text-base">
                <Link href="/seller/dashboard">Start Selling</Link>
              </Button>
            </div>

            <div className="mt-8 sm:mt-10 grid grid-cols-3 gap-6">
              {[
                { value: '400+', label: 'Products listed' },
                { value: '120+', label: 'Student creators' },
                { value: '4.9', label: 'Avg. rating' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-display text-xl sm:text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-in-up [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards] mt-8 sm:mt-0">
            <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-3 sm:space-y-4">
                <div className="overflow-hidden rounded-lg sm:rounded-2xl border border-border shadow-sm aspect-square">
                  <img
                    src="https://images.pexels.com/photos/28867382/pexels-photo-28867382.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                    alt="Handmade ceramic vases"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="overflow-hidden rounded-lg sm:rounded-2xl border border-border shadow-sm aspect-[4/3]">
                  <img
                    src="https://images.pexels.com/photos/33428339/pexels-photo-33428339.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                    alt="Handcrafted leather wallets"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="overflow-hidden rounded-2xl border border-border shadow-sm aspect-[4/3]">
                  <img
                    src="https://images.pexels.com/photos/14580494/pexels-photo-14580494.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                    alt="Homemade cookies"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="overflow-hidden rounded-2xl border border-border shadow-sm aspect-square">
                  <img
                    src="https://images.pexels.com/photos/30925664/pexels-photo-30925664.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                    alt="Abstract painting"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 rounded-xl border border-border bg-card p-4 shadow-lg animate-scale-in [animation-delay:500ms] opacity-0 [animation-fill-mode:forwards]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success text-lg">
                  ✓
                </div>
                <div>
                  <div className="text-sm font-semibold">Verified Students</div>
                  <div className="text-xs text-muted-foreground">
                    College email only
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
