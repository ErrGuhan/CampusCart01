import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Package } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product-card';
import { getCategories, getProductsByCategory } from '@/lib/supabase-queries';

type Props = { params: Promise<{ slug: string }> };

export default async function CategoryDetailPage({ params }: Props) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) notFound();

  const categoryProducts = await getProductsByCategory(slug);

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-8">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/categories" className="hover:text-foreground transition-colors">Categories</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{category.name}</span>
        </nav>

        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Package className="h-7 w-7" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">{category.name}</h1>
              <p className="mt-1 text-muted-foreground">
                {categoryProducts.length} {categoryProducts.length === 1 ? 'product' : 'products'} in this category
              </p>
            </div>
          </div>
        </div>

        {categoryProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">No products yet</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              No products have been listed in this category yet. Check back soon or explore other categories.
            </p>
            <Link
              href="/categories"
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Browse all categories
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
