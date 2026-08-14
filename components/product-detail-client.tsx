'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Star, Heart, ShoppingBag, Minus, Plus, Truck, MapPin,
  ChevronRight, Store, Share2, Shield, Check,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/components/cart-provider';
import type { Product } from '@/lib/types';

type Props = { product: Product; relatedProducts: Product[] };

export function ProductDetailClient({ product, relatedProducts }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { toast } = useToast();
  const { addToCart } = useCart();

  const hasDiscount = product.discountPrice !== undefined;
  const displayPrice = product.discountPrice ?? product.price;
  const router = useRouter();
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  function handleAddToCart() {
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
    }, quantity);
    toast({
      title: 'Added to cart',
      description: `${quantity} × ${product.name} added to your cart.`,
    });
  }

  function handleBuyNow() {
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
    }, quantity);
    router.push('/cart');
  }

  const mockReviews = [
    { id: '1', author: 'Sneha K.', rating: 5, comment: 'Absolutely loved the quality! Even better than the photos.', date: '2 weeks ago' },
    { id: '2', author: 'Vikram R.', rating: 5, comment: 'Great product and quick pickup on campus. Highly recommend!', date: '1 month ago' },
    { id: '3', author: 'Aditi M.', rating: 4, comment: 'Good value for the price. Would buy again.', date: '1 month ago' },
  ];

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-6">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/categories/${product.category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}`} className="hover:text-foreground transition-colors">
            {product.category}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-secondary/30 aspect-square">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              {hasDiscount && (
                <Badge variant="destructive" className="absolute top-4 left-4 shadow-md">
                  {discountPercent}% OFF
                </Badge>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImage === idx ? 'border-primary' : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <img src={img} alt={`${product.name} view ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{product.category}</Badge>
                  {product.inventory > 0 ? (
                    <Badge className="bg-success/10 text-success hover:bg-success/10">
                      <Check className="h-3 w-3 mr-1" />
                      In Stock
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                </div>
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  {product.name}
                </h1>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(product.rating)
                            ? 'fill-warning text-warning'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-sm font-medium">{product.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.reviewCount} reviews
                  </span>
                </div>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="font-display text-3xl font-bold">₹{displayPrice}</span>
                {hasDiscount && (
                  <span className="text-lg text-muted-foreground line-through">
                    ₹{product.price}
                  </span>
                )}
                {hasDiscount && (
                  <span className="text-sm font-medium text-success">
                    You save ₹{product.price - product.discountPrice!}
                  </span>
                )}
              </div>

              <p className="text-muted-foreground leading-relaxed">{product.description}</p>

              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${product.pickupAvailable ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">Campus Pickup</div>
                    <div className="text-muted-foreground">
                      {product.pickupAvailable ? 'Available at Main Block Pickup Counter' : 'Not available'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${product.deliveryAvailable ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">Campus Delivery</div>
                    <div className="text-muted-foreground">
                      {product.deliveryAvailable ? 'Seller-managed delivery available' : 'Pickup only'}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-lg border border-input">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.inventory, q + 1))}
                    className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.inventory} available
                </span>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={product.inventory === 0}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1"
                  onClick={handleBuyNow}
                  disabled={product.inventory === 0}
                >
                  Buy Now
                </Button>
                <Button size="lg" variant="ghost" className="px-3" aria-label="Add to wishlist">
                  <Heart className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-primary" />
                  Verified student seller
                </div>
                <div className="flex items-center gap-1.5">
                  <Store className="h-4 w-4 text-primary" />
                  Campus-only marketplace
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-card p-6">
          <Link
            href={`/seller/${product.seller.username}`}
            className="flex items-center gap-4 transition-opacity hover:opacity-80"
          >
            <Avatar className="h-14 w-14">
              <AvatarImage src={product.seller.avatar} alt={product.seller.displayName} />
              <AvatarFallback>{product.seller.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{product.seller.displayName}</h3>
                <Badge variant="secondary" className="text-xs">
                  <Star className="h-3 w-3 fill-warning text-warning mr-1" />
                  {product.seller.rating.toFixed(1)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {product.seller.department} · {product.seller.year} · {product.seller.productCount} products
              </p>
            </div>
            <Button variant="outline" size="sm">
              View Profile
            </Button>
          </Link>
        </div>

        <div className="mt-10">
          <Tabs defaultValue="reviews">
            <TabsList>
              <TabsTrigger value="reviews">
                Reviews ({product.reviewCount})
              </TabsTrigger>
              <TabsTrigger value="description">
                Full Description
              </TabsTrigger>
              <TabsTrigger value="policies">
                Shipping & Policies
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reviews" className="mt-6">
              <div className="space-y-4">
                {mockReviews.map((review) => (
                  <div key={review.id} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {review.author.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{review.author}</div>
                          <div className="text-xs text-muted-foreground">{review.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? 'fill-warning text-warning'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="description" className="mt-6">
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border p-4">
                    <dt className="text-xs font-medium text-muted-foreground">Category</dt>
                    <dd className="mt-1 text-sm font-medium">{product.category}</dd>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <dt className="text-xs font-medium text-muted-foreground">Inventory</dt>
                    <dd className="mt-1 text-sm font-medium">{product.inventory} units</dd>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="policies" className="mt-6">
              <div className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h4 className="font-medium text-foreground mb-1">Pickup</h4>
                  <p>{product.pickupAvailable ? 'Available at Main Block Pickup Counter during college hours.' : 'Pickup not available for this product.'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">Delivery</h4>
                  <p>{product.deliveryAvailable ? 'Seller-managed campus delivery. Coordinate with the seller after placing your order.' : 'This product is pickup only.'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">Returns</h4>
                  <p>Returns accepted within 3 days if the product is damaged or not as described. Food items are non-returnable.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-xl font-bold tracking-tight mb-6">
              Related Products
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
