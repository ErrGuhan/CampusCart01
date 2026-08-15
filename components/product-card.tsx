'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, ShoppingBag, BadgeCheck, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/components/cart-provider';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';

const WISHLIST_KEY = 'campuscart-wishlist';

type ProductCardProps = {
  product: Product;
  className?: string;
  priority?: boolean;
};

export function ProductCard({ product, className, priority = false }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const hasDiscount =
    product.discountPrice !== undefined && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const stored = localStorage.getItem(WISHLIST_KEY);
      let list: string[] = stored ? JSON.parse(stored) : [];
      if (list.includes(product.id)) {
        list = list.filter((id) => id !== product.id);
        setIsWishlisted(false);
        toast({ title: 'Removed from wishlist', description: product.name });
      } else {
        list.push(product.id);
        setIsWishlisted(true);
        toast({ title: 'Added to wishlist! ❤️', description: product.name });
      }
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    } catch {}
  }

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      discountPrice: product.discountPrice,
      image: product.images[0],
      sellerName: product.seller.displayName,
      sellerUsername: product.seller.username,
      maxQuantity: product.inventory,
      isDigital: product.isDigital,
      digitalFileUrl: product.digitalFileUrl,
    });
    toast({ title: 'Added to cart 🛍️', description: product.name });
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card transition-all duration-300 hover:shadow-lg hover:border-primary/40 active:scale-[0.98]',
        className
      )}
    >
      {/* Optimized Product Image Container with zero CLS layout reservation */}
      <div className="relative aspect-square w-full overflow-hidden bg-secondary/50 select-none">
        <Image
          src={product.images[0] || 'https://images.pexels.com/photos/28867382/pexels-photo-28867382.jpeg'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority={priority}
        />

        {/* Condition & Discount Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
          {product.isUsed && (
            <span className="rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white shadow-xs capitalize">
              {product.condition ? product.condition.replace('_', ' ') : 'Used'}
            </span>
          )}
          {product.isDigital && (
            <span className="rounded-md bg-indigo-600 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white shadow-xs">
              Digital
            </span>
          )}
          {hasDiscount && !product.isDigital && (
            <span className="rounded-md bg-destructive px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-destructive-foreground shadow-xs">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          aria-label="Add to wishlist"
          onClick={toggleWishlist}
          className="absolute top-2 right-2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-background/85 text-muted-foreground shadow-xs backdrop-blur-md transition-all hover:text-destructive hover:scale-110 active:scale-90 z-10"
        >
          <Heart className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', isWishlisted && 'fill-destructive text-destructive')} />
        </button>

        {product.status === 'out_of_stock' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[1px] z-10">
            <span className="rounded-full bg-foreground/90 px-2.5 py-0.5 text-[10px] font-bold text-background">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3.5">
        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-muted-foreground">
          <span className="truncate max-w-[70px] sm:max-w-[100px] font-medium">{product.category}</span>
          <span>•</span>
          <span className="truncate max-w-[70px] sm:max-w-[100px]">{product.seller.displayName}</span>
        </div>

        <h3 className="mt-1 line-clamp-2 text-xs sm:text-sm font-bold leading-snug text-foreground group-hover:text-primary transition-colors min-h-[2.25rem] sm:min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Rating & Trust */}
        <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px] sm:text-xs">
          <div className="flex items-center gap-1">
            {product.reviewCount > 0 ? (
              <>
                <Star className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />
                <span className="font-bold text-foreground">{product.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({product.reviewCount})</span>
              </>
            ) : (
              <span className="text-muted-foreground text-[10px]">New listing</span>
            )}
          </div>

          {product.pickupAvailable && (
            <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">
              📍 Pickup
            </span>
          )}
        </div>

        {/* Price & Quick Add Button */}
        <div className="mt-auto pt-2 sm:pt-3 flex items-end justify-between gap-1 border-t border-border/50">
          <div className="flex flex-col min-w-0">
            {hasDiscount ? (
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-sm sm:base font-extrabold text-foreground">
                  ₹{product.discountPrice}
                </span>
                <span className="text-[10px] text-muted-foreground line-through">
                  ₹{product.price}
                </span>
              </div>
            ) : (
              <span className="text-sm sm:text-base font-extrabold text-foreground">
                ₹{product.price}
              </span>
            )}
          </div>

          <button
            type="button"
            aria-label="Quick add to cart"
            onClick={handleQuickAdd}
            className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-90 shadow-2xs"
          >
            <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
