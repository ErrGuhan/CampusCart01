import Link from 'next/link';
import {
  Hammer, Palette, Cpu, Watch, Shirt, BookOpen,
  PenTool, Cookie, Monitor, Backpack, Wrench, Package,
  ArrowRight, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Hammer, Palette, Cpu, Watch, Shirt, BookOpen,
  PenTool, Cookie, Monitor, Backpack, Wrench, Package,
};

export function CategoriesSection({ categories }: { categories: Category[] }) {
  return (
    <section className="container-px mx-auto max-w-7xl py-8 sm:py-14">
      <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary mb-1.5">
            <Sparkles className="h-4 w-4" />
            <span>Campus Categories</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            Browse by Department & Needs
          </h2>
          <p className="mt-1.5 text-sm sm:text-base text-muted-foreground font-medium">
            Find gear and study resources curated for engineering & tech students
          </p>
        </div>
        <Link
          href="/categories"
          className="hidden sm:flex items-center gap-1 text-sm font-bold text-primary hover:gap-2 transition-all"
        >
          View all categories
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-5">
        {categories.map((category) => {
          const Icon = iconMap[category.icon] ?? Package;
          const isEmpty = category.productCount === 0;

          return (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className={cn(
                'group flex flex-col items-center gap-3 rounded-3xl border border-border/80 bg-card p-4 sm:p-5 text-center transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 active:scale-95 shadow-2xs',
                isEmpty && 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100 border-dashed bg-card/60'
              )}
            >
              <div className={cn(
                'flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-accent/70 text-accent-foreground transition-all group-hover:bg-gradient-to-br group-hover:from-[#1D5BF1] group-hover:to-[#3B42C4] group-hover:text-white group-hover:scale-105 shadow-2xs',
                isEmpty && 'bg-secondary text-muted-foreground'
              )}>
                <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
              </div>
              <div className="min-w-0 w-full">
                <div className="text-sm sm:text-base font-extrabold text-foreground group-hover:text-primary transition-colors leading-tight">
                  {category.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-semibold">
                  {isEmpty ? (
                    <span className="text-muted-foreground/80">Coming soon</span>
                  ) : (
                    <span>{category.productCount} {category.productCount === 1 ? 'item' : 'items'}</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 flex sm:hidden justify-center">
        <Link
          href="/categories"
          className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-primary min-h-[44px] py-2.5 px-6 rounded-2xl border border-primary/25 bg-primary/5 active:scale-95 shadow-2xs"
        >
          View all 12 categories
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
