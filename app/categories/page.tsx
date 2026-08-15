import Link from 'next/link';
import {
  Hammer, Palette, Cpu, Watch, Shirt, BookOpen,
  PenTool, Cookie, Monitor, Backpack, Wrench, Package,
  ArrowRight,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { getCategories } from '@/lib/firebase-queries';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Hammer, Palette, Cpu, Watch, Shirt, BookOpen,
  PenTool, Cookie, Monitor, Backpack, Wrench, Package,
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">Categories</h1>
          <p className="mt-1.5 text-muted-foreground">
            Browse products by category — from handmade crafts to digital designs
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => {
            const Icon = iconMap[category.icon] ?? Package;
            return (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                prefetch={true}
                className="group relative flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-6 sm:p-8 text-center transition-all hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 active:scale-95"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                  <Icon className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-base font-semibold group-hover:text-primary transition-colors">
                    {category.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {category.productCount} products
                  </p>
                </div>
                <ArrowRight className="absolute top-5 right-5 h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
              </Link>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
