import Link from 'next/link';
import { ArrowRight, Package, Plus, Sparkles } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import { EmptyState } from '@/components/ui/empty-state';
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
    <section className="container-px mx-auto max-w-7xl py-8 sm:py-14">
      <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary mb-1.5">
            <Sparkles className="h-4 w-4" />
            <span>Featured Marketplace</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1.5 text-sm sm:text-base text-muted-foreground font-medium">{subtitle}</p>
          )}
        </div>
        {products.length > 0 && (
          <Link
            href={viewAllHref}
            className="hidden sm:flex items-center gap-1 text-sm font-bold text-primary hover:gap-2 transition-all pb-1 shrink-0"
          >
            View all listings
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={`No listings yet in ${title}`}
          description="Welcome to CampusCart! Be the first student to list textbooks, lab equipment, project kits, or components!"
          actionLabel="+ List Your First Item"
          actionHref="/seller/dashboard/products"
          secondaryActionLabel="Post a Request"
          secondaryActionHref="/requests"
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-6 flex sm:hidden justify-center">
            <Link
              href={viewAllHref}
              className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-primary min-h-[44px] py-2.5 px-6 rounded-2xl border border-primary/25 bg-primary/5 active:scale-95 shadow-2xs"
            >
              Explore all campus listings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
