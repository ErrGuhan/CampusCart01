'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, SlidersHorizontal, X, Sparkles, Tag, ArrowRight, Check, Plus } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { getAllProducts } from '@/lib/firebase-queries';
import type { Product, Category } from '@/lib/types';

const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest Listings' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
];

type Props = { products: Product[]; categories: Category[] };

export function ProductsBrowser({ products: initialProducts, categories }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlSearch = searchParams?.get('search') || '';
  const urlCategory = searchParams?.get('category') || '';

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState(urlSearch);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    urlCategory ? [urlCategory] : []
  );
  const [priceRange, setPriceRange] = useState<number[]>([0, 2000]);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState('relevance');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    const refresh = () => {
      getAllProducts().then((data) => setProducts(data));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('campuscart_product_updated', refresh);
      window.addEventListener('storage', refresh);
      window.addEventListener('focus', refresh);

      return () => {
        window.removeEventListener('campuscart_product_updated', refresh);
        window.removeEventListener('storage', refresh);
        window.removeEventListener('focus', refresh);
      };
    }
  }, []);

  useEffect(() => {
    const q = searchParams?.get('search');
    if (q !== null && q !== undefined) {
      setSearch(q);
    }
    const cat = searchParams?.get('category');
    if (cat) {
      setSelectedCategories([cat]);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    let result = [...products];

    if (search) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.seller.displayName.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    if (selectedCategories.length > 0) {
      const selectedNames = categories
        .filter((c) => selectedCategories.includes(c.slug))
        .map((c) => c.name.toLowerCase());

      result = result.filter((p) =>
        selectedNames.includes(p.category.toLowerCase()) ||
        selectedCategories.includes(p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
      );
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
  }, [products, search, selectedCategories, priceRange, minRating, sort, categories]);

  function toggleCategory(slug: string) {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  }

  function clearFilters() {
    setSelectedCategories([]);
    setPriceRange([0, 2000]);
    setMinRating(0);
    setSearch('');
  }

  const activeFilterCount =
    selectedCategories.length +
    (minRating > 0 ? 1 : 0) +
    (priceRange[0] !== 0 || priceRange[1] !== 2000 ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-6 text-xs">
      <div>
        <h3 className="font-bold text-foreground mb-3 text-xs uppercase tracking-wider">
          Categories
        </h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${cat.id}`}
                checked={selectedCategories.includes(cat.slug)}
                onCheckedChange={() => toggleCategory(cat.slug)}
              />
              <Label htmlFor={`cat-${cat.id}`} className="text-xs cursor-pointer flex-1 font-medium">
                {cat.name}
              </Label>
              <span className="text-[10px] text-muted-foreground">({cat.productCount})</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-border/70">
        <h3 className="font-bold text-foreground mb-3 text-xs uppercase tracking-wider">
          Price Range (₹)
        </h3>
        <div className="px-1">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={0}
            max={2000}
            step={50}
            className="mb-3"
          />
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>₹{priceRange[0]}</span>
            <span>₹{priceRange[1]}</span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-border/70">
        <h3 className="font-bold text-foreground mb-3 text-xs uppercase tracking-wider">
          Minimum Rating
        </h3>
        <div className="space-y-2">
          {[0, 4, 4.5, 4.8].map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox
                id={`rating-${rating}`}
                checked={minRating === rating}
                onCheckedChange={() => setMinRating(rating)}
              />
              <Label htmlFor={`rating-${rating}`} className="text-xs cursor-pointer font-medium">
                {rating === 0 ? 'All ratings' : `★ ${rating}+ stars`}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="outline" size="sm" onClick={clearFilters} className="w-full rounded-xl text-xs">
          <X className="h-3.5 w-3.5 mr-1" />
          Clear all filters ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-6 sm:py-8 min-h-screen">
        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Campus Marketplace</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              All Products & Study Supplies
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Showing <strong className="text-foreground">{filtered.length}</strong> listings from student creators
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="rounded-xl text-xs gap-1.5">
              <Link href="/requests">
                <Tag className="h-3.5 w-3.5 text-emerald-600" />
                Post Request
              </Link>
            </Button>
          </div>
        </div>

        {/* Search, Filter Bar, and Sort */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search products by title, category, or creator..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 h-10 rounded-xl bg-card text-xs border-border/80"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Mobile Filter Button Sheet Trigger */}
            <Sheet open={showFiltersMobile} onOpenChange={setShowFiltersMobile}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden h-10 px-3 rounded-xl gap-1.5 text-xs font-semibold shrink-0"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4 ml-0.5">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-xs overflow-y-auto bg-background p-5">
                <SheetHeader className="pb-4 border-b border-border">
                  <SheetTitle className="text-left font-display">Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <FilterContent />
                </div>
                <SheetFooter className="pt-6 border-t border-border mt-6">
                  <Button
                    onClick={() => setShowFiltersMobile(false)}
                    className="w-full rounded-xl text-xs font-bold"
                  >
                    Show {filtered.length} Results
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {/* Sort Dropdown */}
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[140px] sm:w-[170px] h-10 rounded-xl text-xs font-semibold shrink-0">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategories([])}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all select-none ${
                selectedCategories.length === 0
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategories.includes(cat.slug);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.slug)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all select-none flex items-center gap-1 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{cat.name}</span>
                  {isSelected && <Check className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Products Grid & Sidebar Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-20 rounded-3xl border border-border/80 bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
                <h2 className="text-sm font-bold text-foreground">Filters</h2>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    {activeFilterCount} active
                  </Badge>
                )}
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="flex-1 min-w-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-16 px-4 text-center bg-card/40">
                <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <h3 className="text-base font-bold text-foreground">No products match your criteria</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                  Try adjusting your search terms, changing categories, or post a request on the campus board.
                </p>
                <div className="mt-5 flex flex-wrap gap-2.5 justify-center">
                  {activeFilterCount > 0 && (
                    <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={clearFilters}>
                      Clear all filters
                    </Button>
                  )}
                  <Button asChild size="sm" className="rounded-xl text-xs font-bold shadow-xs">
                    <Link href="/seller/dashboard/products">
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      List a Product
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="rounded-xl text-xs">
                    <Link href="/requests">Post Product Request</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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
