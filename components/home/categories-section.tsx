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
    <section className="container-px mx-auto max-w-7xl py-10 sm:py-16">
      <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Shop by Category
          </h2>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
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

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {categories.map((category) => {
          const Icon = iconMap[category.icon] ?? Package;
          return (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group flex flex-col items-center gap-2 sm:gap-3 rounded-2xl border border-border bg-card p-3 sm:p-4 text-center transition-all hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
            >
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 w-full">
                <div className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {category.name}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  {category.productCount} {category.productCount === 1 ? 'item' : 'items'}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 flex sm:hidden justify-center">
        <Link
          href="/categories"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary py-2 px-4 rounded-xl border border-primary/20 bg-primary/5"
        >
          Explore all categories
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
