import { Suspense } from 'react';
import { getAllProducts, getCategories } from '@/lib/firebase-queries';
import { ProductsBrowser } from '@/components/products-browser';

export const metadata = {
  title: 'Campus Marketplace | CampusCart',
  description: 'Browse, buy, and discover textbooks, electronics, notes, project kits, and digital materials created by fellow college students.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MarketplacePage() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getCategories(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="container-px mx-auto max-w-7xl py-12">
          <div className="h-96 animate-pulse rounded-2xl bg-secondary/50" />
        </div>
      }
    >
      <ProductsBrowser products={products} categories={categories} />
    </Suspense>
  );
}
