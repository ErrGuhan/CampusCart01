import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
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
        <Link
          href={viewAllHref}
          className="hidden sm:flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:gap-2 transition-all"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

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
    </section>
  );
}
