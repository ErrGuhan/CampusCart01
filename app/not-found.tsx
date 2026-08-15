import Link from 'next/link';
import { ShoppingBag, ArrowLeft, Search, Compass, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-16 sm:py-24 flex items-center justify-center min-h-[65vh]">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <Compass className="h-3.5 w-3.5" />
            <span>404 • Page Not Found</span>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
              Lost on Campus?
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              The product, store, or page you are looking for might have been moved, sold out, or renamed by the seller.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center pt-2">
            <Button asChild className="rounded-xl gap-2 font-medium">
              <Link href="/marketplace">
                <ShoppingBag className="h-4 w-4" />
                Browse Marketplace
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl gap-2 font-medium">
              <Link href="/services">
                <Sparkles className="h-4 w-4" />
                Freelance Services
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
