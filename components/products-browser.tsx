'use client';

import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { Product, Category } from '@/lib/types';

const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
];

type Props = { products: Product[]; categories: Category[] };

export function ProductsBrowser({ products, categories }: Props) {
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([0, 1500]);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState('relevance');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const filtered = useMemo(() => {
    let result = [...products];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q)) ||
          p.seller.displayName.toLowerCase().includes(q)
      );
    }

    if (selectedCategories.length > 0) {
      const selectedNames = categories
        .filter((c) => selectedCategories.includes(c.slug))
        .map((c) => c.name);
      result = result.filter((p) => selectedNames.includes(p.category));
    }

    result = result.filter((p) => {
      const price = p.discountPrice ?? p.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    if (minRating > 0) {
      result = result.filter((p) => p.rating >= minRating);
    }

    switch (sort) {
      case 'price-low':
        result.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
        break;
      case 'price-high':
        result.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'popular':
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
    }

    return result;
  }, [search, selectedCategories, priceRange, minRating, sort]);

  function toggleCategory(slug: string) {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  }

  function clearFilters() {
    setSelectedCategories([]);
    setPriceRange([0, 1500]);
    setMinRating(0);
    setSearch('');
  }

  const activeFilterCount =
    selectedCategories.length +
    (minRating > 0 ? 1 : 0) +
    (priceRange[0] !== 0 || priceRange[1] !== 1500 ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.slice(0, 8).map((cat) => (
            <div key={cat.id} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${cat.id}`}
                checked={selectedCategories.includes(cat.slug)}
                onCheckedChange={() => toggleCategory(cat.slug)}
              />
              <Label htmlFor={`cat-${cat.id}`} className="text-sm cursor-pointer">
                {cat.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Price Range</h3>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={0}
            max={1500}
            step={50}
            className="mb-3"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>₹{priceRange[0]}</span>
            <span>₹{priceRange[1]}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Minimum Rating</h3>
        <div className="space-y-2">
          {[0, 4, 4.5, 4.8].map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox
                id={`rating-${rating}`}
                checked={minRating === rating}
                onCheckedChange={() => setMinRating(rating)}
              />
              <Label htmlFor={`rating-${rating}`} className="text-sm cursor-pointer">
                {rating === 0 ? 'All ratings' : `${rating}+ stars`}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
          <X className="h-4 w-4 mr-1" />
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold tracking-tight">All Products</h1>
          <p className="mt-1.5 text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? 'product' : 'products'} from student creators
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold">Filters</h2>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary">{activeFilterCount}</Badge>
                )}
              </div>
              <FilterContent />
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Sheet open={showFiltersMobile} onOpenChange={setShowFiltersMobile}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden shrink-0">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[180px] shrink-0">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">No products found</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                {activeFilterCount > 0 && (
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
