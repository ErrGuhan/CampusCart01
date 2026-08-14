import Link from 'next/link';
import {
  Hammer, Palette, Cpu, Watch, Shirt, BookOpen,
  PenTool, Cookie, Monitor, Backpack, Wrench, Package,
  ArrowRight,
} from 'lucide-react';
import type { Category } from '@/lib/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Hammer, Palette, Cpu, Watch, Shirt, BookOpen,
  PenTool, Cookie, Monitor, Backpack, Wrench, Package,
};

export function CategoriesSection({ categories }: { categories: Category[] }) {
  return (
    <section className="container-px mx-auto max-w-7xl py-16">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Shop by Category
          </h2>
          <p className="mt-2 text-muted-foreground">
            Explore the diverse range of products made by your peers
          </p>
        </div>
        <Link
          href="/categories"
          className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {categories.map((category) => {
          const Icon = iconMap[category.icon] ?? Package;
          return (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {category.name}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {category.productCount} items
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
