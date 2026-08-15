import { Suspense } from 'react';
import { getAllProducts, getCategories } from '@/lib/firebase-queries';
import { ProductsBrowser } from '@/components/products-browser';

export const metadata = {
  title: 'Products | CampusCart',
  description: 'Explore campus textbooks, electronics, engineering tools, and handmade supplies.',
};

export const revalidate = 60;

export default async function ProductsPage() {
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
