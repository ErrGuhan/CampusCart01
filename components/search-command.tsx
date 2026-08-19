'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ShoppingBag, Sparkles, Tag, ArrowRight,
  Zap, Recycle, Store, MessageSquare, Layers,
  Compass, User, Package,
} from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { getAllProducts, getAllGigs, getCategories } from '@/lib/firebase-queries';
import type { Product, ServiceGig, Category } from '@/lib/types';

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [gigs, setGigs] = useState<ServiceGig[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Background pre-fetch for instant zero-latency search results
    getAllProducts().then(setProducts).catch(() => {});
    getAllGigs().then(setGigs).catch(() => {});
    getCategories().then(setCategories).catch(() => {});

    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [router, onOpenChange]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search campus products, freelance gigs, categories, or pages... (⌘K)" />
      <CommandList className="max-h-[75vh] sm:max-h-[420px] overflow-y-auto p-2">
        <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
          No campus items found matching your search.
        </CommandEmpty>

        {/* Quick Pages & Campus Links */}
        <CommandGroup heading="Campus Hub Navigation">
          <CommandItem
            value="Marketplace All Products Textbooks Electronics"
            onSelect={() => handleSelect('/marketplace')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">Campus Marketplace</p>
              <p className="text-[11px] text-muted-foreground truncate">Explore student textbooks, notes & electronics</p>
            </div>
          </CommandItem>

          <CommandItem
            value="Freelance Gigs Services Coding Design Tutoring"
            onSelect={() => handleSelect('/services')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">Student Freelance & Gigs</p>
              <p className="text-[11px] text-muted-foreground truncate">Hire verified student developers, designers & tutors</p>
            </div>
          </CommandItem>

          <CommandItem
            value="Used Pre-owned Second hand Budget Hostel Items"
            onSelect={() => handleSelect('/used')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <Recycle className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">Pre-Owned & Used Items</p>
              <p className="text-[11px] text-muted-foreground truncate">Affordable second-hand campus essentials</p>
            </div>
          </CommandItem>

          <CommandItem
            value="Campus Requests What I Need Post Request"
            onSelect={() => handleSelect('/requests')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
              <Tag className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">Campus Requests</p>
              <p className="text-[11px] text-muted-foreground truncate">Post what you need or help fellow students</p>
            </div>
          </CommandItem>

          <CommandItem
            value="Deals Discounts Under 99 Under 199"
            onSelect={() => handleSelect('/deals')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0">
              <Zap className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">Student Deals & Steals</p>
              <p className="text-[11px] text-muted-foreground truncate">Special student discounts & clearance</p>
            </div>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="my-1.5" />

        {/* Featured Campus Products */}
        {products.length > 0 && (
          <CommandGroup heading="Products & Academic Items">
            {products.slice(0, 8).map((product) => {
              const activePrice = product.discountPrice ?? product.price;
              return (
                <CommandItem
                  key={product.id}
                  value={`${product.name} ${product.category} ${product.seller?.displayName || ''}`}
                  onSelect={() => handleSelect(`/products/${product.slug}`)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer"
                >
                  <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-secondary/50 shrink-0 border border-border/60">
                    <Image
                      src={product.images[0] || 'https://images.pexels.com/photos/3182773/pexels-photo-3182773.jpeg'}
                      alt={product.name}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-foreground truncate">{product.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{product.category} • by {product.seller?.displayName || 'Campus Creator'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-primary">₹{activePrice}</span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        <CommandSeparator className="my-1.5" />

        {/* Freelance Services */}
        {gigs.length > 0 && (
          <CommandGroup heading="Freelance Gigs">
            {gigs.slice(0, 6).map((gig) => (
              <CommandItem
                key={gig.id}
                value={`${gig.title} ${gig.category} ${gig.seller?.displayName || ''}`}
                onSelect={() => handleSelect(`/services/${gig.slug}`)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer"
              >
                <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-secondary/50 shrink-0 border border-border/60">
                  <Image
                    src={gig.coverImage || 'https://images.pexels.com/photos/3182773/pexels-photo-3182773.jpeg'}
                    alt={gig.title}
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-extrabold text-foreground truncate">{gig.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{gig.category} • by {gig.seller?.displayName || 'Freelancer'}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">From ₹{gig.startingPrice}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator className="my-1.5" />

        {/* Categories */}
        {categories.length > 0 && (
          <CommandGroup heading="Categories">
            {categories.map((cat) => (
              <CommandItem
                key={cat.id}
                value={`Category ${cat.name} ${cat.slug}`}
                onSelect={() => handleSelect(`/categories/${cat.slug}`)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-foreground/80 shrink-0">
                  <Layers className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-bold text-foreground flex-1 truncate">{cat.name}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
