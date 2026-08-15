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
        {hasDiscount && (
          <Badge
            variant="destructive"
            className="absolute top-3 left-3 shadow-sm"
          >
            {discountPercent}% OFF
          </Badge>
        )}
        <button
          type="button"
          aria-label="Add to wishlist"
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-muted-foreground opacity-0 shadow-sm backdrop-blur transition-all hover:text-destructive group-hover:opacity-100"
          onClick={(e) => {
            e.preventDefault();
            try {
              const stored = localStorage.getItem(WISHLST_KEY);
              const ids: string[] = stored ? JSON.parse(stored) : [];
              if (!ids.includes(product.id)) {
                ids.push(product.id);
                localStorage.setItem(WISHLST_KEY, JSON.stringify(ids));
                toast({ title: 'Added to wishlist', description: product.name });
              } else {
                toast({ title: 'Already in your wishlist' });
              }
            } catch {
              // ignore
            }
          }}
        >
          <Heart className="h-4 w-4" />
        </button>
        {product.status === 'out_of_stock' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <span className="rounded-full bg-foreground/90 px-4 py-1.5 text-xs font-semibold text-background">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
          <span className="truncate">{product.category}</span>
          <span className="text-border">·</span>
          <span className="truncate">{product.seller.displayName}</span>
        </div>

        <h3 className="mt-1.5 line-clamp-2 text-sm sm:text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {product.isVerified && (
          <span className="mt-1 inline-flex w-fit items-center gap-1 text-[11px] font-medium text-success">
            <BadgeCheck className="h-3 w-3" />
            Verified original
          </span>
        )}

        <div className="mt-2 flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          <span className="text-xs sm:text-sm font-medium text-foreground">
            {product.rating.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({product.reviewCount})
          </span>
        </div>

        <div className="mt-auto pt-3 flex items-end justify-between">
          <div className="flex flex-col">
            {hasDiscount ? (
              <>
                <span className="text-base font-bold text-foreground">
                  ₹{product.discountPrice}
                </span>
                <span className="text-xs text-muted-foreground line-through">
                  ₹{product.price}
                </span>
              </>
            ) : (
              <span className="text-base font-bold text-foreground">
                ₹{product.price}
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="Quick add to cart"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground"
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
              });
              toast({ title: 'Added to cart', description: product.name });
            }}
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
