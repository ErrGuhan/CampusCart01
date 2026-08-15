'use client';

import Link from 'next/link';
import { Heart, Star, ShoppingBag, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/components/cart-provider';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';

const WISHLST_KEY = 'campuscart-wishlist';

type ProductCardProps = {
  product: Product;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const hasDiscount =
    product.discountPrice !== undefined && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.price - product.discountPrice!) / product.price) * 100
      )
    : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-lg hover:border-primary/20',
        className
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-secondary/50">
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {product.isUsed && product.condition && (
          <Badge
            className="absolute top-3 left-3 bg-amber-500 text-white shadow-sm hover:bg-amber-600 capitalize text-[10px]"
          >
            {product.condition.replace('_', ' ')}
          </Badge>
        )}
        {product.isDigital && (
          <Badge
            className="absolute top-3 left-3 bg-indigo-600/90 text-white shadow-sm hover:bg-indigo-600 text-[10px]"
          >
            Instant Digital
          </Badge>
        )}
        {hasDiscount && !product.isDigital && !product.isUsed && (
          <Badge
            variant="destructive"
            className="absolute top-3 left-3 shadow-sm text-[10px]"
          >
            {discountPercent}% OFF
          </Badge>
        )}
        <button
          type="button"
          aria-label="Add to wishlist"
          className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-background/85 text-muted-foreground shadow-sm backdrop-blur-md transition-all hover:text-destructive hover:scale-110 active:scale-95 group-hover:opacity-100"
          onClick={(e) => {
            e.preventDefault();
            try {
              const stored = localStorage.getItem(WISHLST_KEY);
              const list: string[] = stored ? JSON.parse(stored) : [];
              if (!list.includes(product.id)) {
                list.push(product.id);
                localStorage.setItem(WISHLST_KEY, JSON.stringify(list));
                toast({ title: 'Added to wishlist ❤️', description: product.name });
              } else {
                toast({ title: 'Already in wishlist', description: product.name });
              }
            } catch {
              // ignore
            }
          }}
        >
          <Heart className="h-4 w-4" />
        </button>
        {product.status === 'out_of_stock' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <span className="rounded-full bg-foreground/90 px-3 py-1 text-[11px] font-semibold text-background">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground">
          <span className="truncate max-w-[80px] sm:max-w-none">{product.category}</span>
          <span className="text-border">·</span>
          <span className="truncate max-w-[80px] sm:max-w-none">{product.seller.displayName}</span>
        </div>

        <h3 className="mt-1 line-clamp-2 text-xs sm:text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {product.isVerified && (
            <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold text-success">
              <BadgeCheck className="h-3 w-3 shrink-0" />
              <span className="truncate">Verified</span>
            </span>
          )}
          {product.pickupAvailable && (
            <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-medium text-muted-foreground bg-secondary/80 px-1 py-0.5 rounded">
              📍 Pickup
            </span>
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-1">
          {product.reviewCount > 0 ? (
            <>
              <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-warning text-warning shrink-0" />
              <span className="text-xs font-semibold text-foreground">
                {product.rating.toFixed(1)}
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                ({product.reviewCount})
              </span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-muted-foreground/80">
              <Star className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />
              No reviews
            </span>
          )}
        </div>

        <div className="mt-auto pt-2.5 sm:pt-3 flex items-end justify-between gap-1">
          <div className="flex flex-col min-w-0">
            {hasDiscount ? (
              <>
                <span className="text-sm sm:text-base font-bold text-foreground truncate">
                  ₹{product.discountPrice}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                  ₹{product.price}
                </span>
              </>
            ) : (
              <span className="text-sm sm:text-base font-bold text-foreground truncate">
                ₹{product.price}
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="Quick add to cart"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground active:scale-90"
            onClick={(e) => {
              e.preventDefault();
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
            }}
          >
            <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
