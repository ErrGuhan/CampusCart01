import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Package, ArrowRight, Tag } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { getCategories, getProductsByCategory, DEFAULT_CATEGORIES } from '@/lib/firebase-queries';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = { params: { slug: string } | Promise<{ slug: string }> };

export default async function CategoryDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const categories = await getCategories();
  const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const category =
    categories.find(
      (c) =>
        c.slug.toLowerCase() === normalizedSlug ||
        c.slug.toLowerCase() === slug.toLowerCase() ||
        c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === normalizedSlug
    ) ||
    DEFAULT_CATEGORIES.find(
      (c) =>
        c.slug.toLowerCase() === normalizedSlug ||
        c.slug.toLowerCase() === slug.toLowerCase() ||
        c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === normalizedSlug
    );

  if (!category) notFound();

  const categoryProducts = await getProductsByCategory(slug);

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-6 sm:py-10 min-h-screen">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 overflow-x-auto pb-1">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/categories" className="hover:text-foreground transition-colors">Categories</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-semibold truncate">{category.name}</span>
        </nav>

        <div className="mb-8 rounded-3xl border border-border/80 bg-gradient-to-br from-primary/10 via-card to-background p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold shadow-xs">
              <Package className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">{category.name}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {categoryProducts.length} {categoryProducts.length === 1 ? 'product' : 'products'} available from student creators
              </p>
            </div>
          </div>
        </div>

        {categoryProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title={`No products in ${category.name} yet`}
            description="Be the first student to list textbooks, lab equipment, or project components in this category!"
            actionLabel="+ List Item in this Category"
            actionHref="/seller/dashboard/products"
            secondaryActionLabel="Browse All Categories"
            secondaryActionHref="/categories"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {categoryProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
