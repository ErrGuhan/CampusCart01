import Link from 'next/link';
import {
  Hammer, Palette, Cpu, Watch, Shirt, BookOpen,
  PenTool, Cookie, Monitor, Backpack, Wrench, Package,
  ArrowRight, Sparkles,
} from 'lucide-react';
import type { Category } from '@/lib/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Hammer, Palette, Cpu, Watch, Shirt, BookOpen,
  PenTool, Cookie, Monitor, Backpack, Wrench, Package,
};

export function CategoriesSection({ categories }: { categories: Category[] }) {
  return (
    <section className="container-px mx-auto max-w-7xl py-10 sm:py-14">
      <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Campus Categories</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Browse by Department & Needs
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Find gear and study resources curated for engineering & tech students
          </p>
        </div>
        <Link
          href="/categories"
          className="hidden sm:flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:gap-2 transition-all"
        >
          View all categories
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
        {categories.map((category) => {
          const Icon = iconMap[category.icon] ?? Package;
          return (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border/80 bg-card p-3 sm:p-4 text-center transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
            >
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-accent/60 text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 w-full">
                <div className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                  {category.name}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                  {category.productCount} {category.productCount === 1 ? 'item' : 'items'}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-5 flex sm:hidden justify-center">
        <Link
          href="/categories"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary py-2 px-4 rounded-xl border border-primary/25 bg-primary/5 active:scale-95"
        >
          View all 12 categories
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
