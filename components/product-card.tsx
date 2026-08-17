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
      image: product.images?.[0] || 'https://images.pexels.com/photos/28867382/pexels-photo-28867382.jpeg',
      sellerId: product.seller?.id,
      sellerName: product.seller?.displayName || 'Campus Creator',
      sellerUsername: product.seller?.username || 'seller',
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
        'group relative flex flex-col overflow-hidden rounded-[22px] sm:rounded-3xl border border-[#E2E4F6] dark:border-border/80 bg-[#FFFDD0] dark:bg-card/80 backdrop-blur-md shadow-2xs transition-all duration-300 hover:shadow-xl hover:border-[#1D5BF1]/40 hover:-translate-y-1 active:scale-[0.98]',
        className
      )}
    >
      {/* Optimized Product Image Container with zero CLS layout reservation */}
      <div className="relative aspect-square w-full overflow-hidden bg-secondary/40 select-none">
        <Image
          src={product.images[0] || 'https://images.pexels.com/photos/28867382/pexels-photo-28867382.jpeg'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority={priority}
        />

        {/* Condition & Discount Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10">
          {product.isUsed && (
            <span className="rounded-xl bg-amber-500/90 backdrop-blur-md px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold text-white shadow-2xs capitalize border border-white/20">
              {product.condition ? product.condition.replace('_', ' ') : 'Used'}
            </span>
          )}
          {product.isDigital && (
            <span className="rounded-xl bg-[#3B42C4]/90 backdrop-blur-md px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold text-white shadow-2xs border border-white/20">
              Digital
            </span>
          )}
          {hasDiscount && !product.isDigital && (
            <span className="rounded-xl bg-rose-500/90 backdrop-blur-md px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold text-white shadow-2xs border border-white/20">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Wishlist Button - 44px touch target on mobile */}
        <button
          type="button"
          aria-label="Add to wishlist"
          onClick={toggleWishlist}
          className="absolute top-2.5 right-2.5 flex h-9 w-9 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[#FFFDD0]/90 dark:bg-card/90 text-foreground/80 shadow-2xs backdrop-blur-md transition-all hover:text-destructive hover:scale-110 active:scale-90 z-10 border border-[#E2E4F6] dark:border-border/60"
        >
          <Heart className={cn('h-4 w-4', isWishlisted && 'fill-destructive text-destructive')} />
        </button>

        {product.status === 'out_of_stock' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-xs z-10">
            <span className="rounded-full bg-foreground/90 px-3 py-1 text-[11px] font-bold text-background shadow-xs">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Card Content - Increased padding for airy, de-cluttered feel */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4.5 gap-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground/75">
          <span className="truncate max-w-[80px] sm:max-w-[110px] text-primary font-bold">{product.category}</span>
          <span className="text-muted-foreground/60">•</span>
          <span className="truncate max-w-[80px] sm:max-w-[110px] text-muted-foreground font-medium">{product.seller?.displayName || 'Campus Creator'}</span>
        </div>

        <h3 className="line-clamp-2 text-xs sm:text-sm font-extrabold leading-snug text-foreground group-hover:text-primary transition-colors min-h-[2.25rem] sm:min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Rating & Trust */}
        <div className="mt-1 flex items-center justify-between gap-1 text-[11px] sm:text-xs">
          <div className="flex items-center gap-1">
            {product.reviewCount > 0 ? (
              <>
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />
                <span className="font-black text-foreground">{product.rating.toFixed(1)}</span>
                <span className="text-muted-foreground font-medium text-[11px]">({product.reviewCount})</span>
              </>
            ) : (
              <span className="text-muted-foreground font-medium text-[11px]">New listing</span>
            )}
          </div>

          {product.pickupAvailable && (
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
              📍 Pickup
            </span>
          )}
        </div>

        {/* Price & Quick Add Button */}
        <div className="mt-auto pt-2.5 sm:pt-3.5 flex items-end justify-between gap-1.5 border-t border-border/50">
          <div className="flex flex-col min-w-0">
            {hasDiscount ? (
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-sm sm:text-base font-black text-foreground">
                  ₹{product.discountPrice}
                </span>
                <span className="text-[11px] text-muted-foreground line-through font-medium">
                  ₹{product.price}
                </span>
              </div>
            ) : (
              <span className="text-sm sm:text-base font-black text-foreground">
                ₹{product.price}
              </span>
            )}
          </div>

          <button
            type="button"
            aria-label="Quick add to cart"
            onClick={handleQuickAdd}
            className="flex h-9 w-9 sm:h-9.5 sm:w-9.5 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white active:scale-90 shadow-2xs border border-primary/20"
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
