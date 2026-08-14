import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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
  viewAllHref = '/products',
}: ProductSectionProps) {
  return (
    <section className="container-px mx-auto max-w-7xl py-16">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <Link
          href={viewAllHref}
          className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
