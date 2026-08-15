import Link from 'next/link';
import { ArrowRight, Sparkles, Plus, Store, Package } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/types';

type ProductSectionProps = {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllHref?: string;
};

export function ProductSection({
  title,
  subtitle,
  products,
  viewAllHref = '/marketplace',
}: ProductSectionProps) {
  return (
    <section className="container-px mx-auto max-w-7xl py-8 sm:py-12">
      <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {products.length > 0 && (
          <Link
            href={viewAllHref}
            className="hidden sm:flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:gap-2 transition-all"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/90 bg-card/50 p-10 sm:p-14 text-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3.5 shadow-xs">
            <Package className="h-6 w-6" />
          </div>
          <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
            No listings yet in {title}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-md">
            Be the first SVCET student to list your textbooks, tools, project kits, or handwritten notes!
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5 justify-center">
            <Button asChild size="sm" className="rounded-xl text-xs font-bold shadow-xs">
              <Link href="/seller/dashboard/products">
                <Plus className="h-4 w-4 mr-1.5" />
                List a Product
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl text-xs">
              <Link href="/requests">
                Post a Request
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-5 flex sm:hidden justify-center">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary py-2 px-4 rounded-xl border border-primary/25 bg-primary/5 active:scale-95"
            >
              Explore all in {title}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
