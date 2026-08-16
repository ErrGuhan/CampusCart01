'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Star, Heart, ShoppingBag, Minus, Plus, Truck, MapPin,
  ChevronRight, Store, Share2, Shield, Check, BadgeCheck,
  MessageSquare, Handshake,
} from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product-card';
import { ChatDialog } from '@/components/chat-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/components/cart-provider';
import { useAuth } from '@/components/auth-provider';
import { addProductReview } from '@/lib/firebase-queries';
import type { Product, Review } from '@/lib/types';

type Props = { product: Product; relatedProducts: Product[]; reviews?: Review[] };

export function ProductDetailClient({ product, relatedProducts, reviews = [] }: Props) {
  const { user, profile } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [productReviews, setProductReviews] = useState<Review[]>(reviews);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();

  useEffect(() => {
    setProductReviews(reviews);
  }, [reviews]);

  const currentReviewCount = productReviews.length;
  const currentRating =
    currentReviewCount > 0
      ? productReviews.reduce((acc, r) => acc + r.rating, 0) / currentReviewCount
      : 0;

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to rate this product.', variant: 'destructive' });
      return;
    }
    if (!reviewComment.trim()) {
      toast({ title: 'Review comment required', description: 'Please write a brief feedback comment.', variant: 'destructive' });
      return;
    }

    setSubmittingReview(true);
    try {
      const newRev = await addProductReview(product.id, {
        author: profile?.display_name || user.email?.split('@')[0] || 'Verified Student Buyer',
        authorAvatar: profile?.avatar_url || '',
        rating: reviewRating,
        comment: reviewComment.trim(),
        userId: user.uid,
      });

      setProductReviews((prev) => [newRev, ...prev]);
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
      toast({ title: 'Review Submitted! ⭐', description: 'Thank you for your verified rating!' });
    } catch {
      toast({ title: 'Failed to submit review', variant: 'destructive' });
    } finally {
      setSubmittingReview(false);
    }
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem('campuscart-wishlist');
      const list: string[] = stored ? JSON.parse(stored) : [];
      setIsWishlisted(list.includes(product.id));
    } catch {}
  }, [product.id]);

  function toggleWishlist() {
    try {
      const stored = localStorage.getItem('campuscart-wishlist');
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
      localStorage.setItem('campuscart-wishlist', JSON.stringify(list));
    } catch {}
  }

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
      image: product.images?.[0] || 'https://images.pexels.com/photos/28867382/pexels-photo-28867382.jpeg',
      sellerId: product.seller?.id,
      sellerName: product.seller?.displayName || 'Campus Creator',
      sellerUsername: product.seller?.username || 'seller',
      maxQuantity: product.inventory,
      isDigital: product.isDigital,
      digitalFileUrl: product.digitalFileUrl,
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
      image: product.images?.[0] || 'https://images.pexels.com/photos/28867382/pexels-photo-28867382.jpeg',
      sellerId: product.seller?.id,
      sellerName: product.seller?.displayName || 'Campus Creator',
      sellerUsername: product.seller?.username || 'seller',
      maxQuantity: product.inventory,
      isDigital: product.isDigital,
      digitalFileUrl: product.digitalFileUrl,
    }, quantity);
    router.push('/checkout');
  }

  const categorySlug = product.category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-4 sm:py-6 pb-28 md:pb-8">
        <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 overflow-x-auto pb-1">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/categories/${categorySlug}`} className="hover:text-foreground transition-colors">
            {product.category}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-secondary/30 aspect-square">
              <Image
                src={product.images[selectedImage] || 'https://images.pexels.com/photos/28867382/pexels-photo-28867382.jpeg'}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-all duration-300"
              />
              {hasDiscount && (
                <Badge variant="destructive" className="absolute top-3 left-3 shadow-md text-xs z-10">
                  {discountPercent}% OFF
                </Badge>
              )}

              {/* Mobile Image Pagination Dots */}
              {product.images.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10 sm:hidden">
                  {product.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      aria-label={`View image ${idx + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        selectedImage === idx ? 'w-5 bg-white shadow-md' : 'w-2 bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 sm:pb-0">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                      selectedImage === idx ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
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
                  {product.isVerified && (
                    <Badge className="bg-success/10 text-success hover:bg-success/10">
                      <BadgeCheck className="h-3 w-3 mr-1" />
                      Verified Original
                    </Badge>
                  )}
                </div>
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  {product.name}
                </h1>
                <div className="mt-2 flex items-center gap-3">
                  {currentReviewCount > 0 ? (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.round(currentRating)
                              ? 'fill-warning text-warning'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-sm font-medium">{currentRating.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full">
                      No ratings yet
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {currentReviewCount} {currentReviewCount === 1 ? 'review' : 'reviews'}
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
                <Button
                  size="lg"
                  variant="ghost"
                  className={`px-3 transition-colors ${isWishlisted ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`}
                  aria-label="Add to wishlist"
                  onClick={toggleWishlist}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </Button>
              </div>

              {/* Chat & Make Offer Actions */}
              <div className="flex gap-2.5 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 rounded-xl text-xs font-semibold h-9"
                  onClick={() => setChatOpen(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-1.5 text-primary" />
                  Chat with Seller
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1 rounded-xl text-xs font-semibold h-9 text-primary bg-primary/10 hover:bg-primary/20"
                  onClick={() => setChatOpen(true)}
                >
                  <Handshake className="h-4 w-4 mr-1.5" />
                  Make an Offer
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
                {product.seller.rating > 0 ? (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 fill-warning text-warning mr-1" />
                    {product.seller.rating.toFixed(1)}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Creator
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {product.seller.department} {product.seller.year ? `· ${product.seller.year}` : ''} · {product.seller.productCount} items
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
                Reviews ({currentReviewCount})
              </TabsTrigger>
              <TabsTrigger value="description">
                Full Description
              </TabsTrigger>
              <TabsTrigger value="policies">
                Shipping & Policies
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reviews" className="mt-6 space-y-6">
              {/* Write Review Trigger / Form */}
              <div className="rounded-2xl border border-border bg-card p-5">
                {!showReviewForm ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-sm">Verified Student Reviews</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Have you used or purchased this item? Share your experience with classmates.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setShowReviewForm(true)}
                      className="rounded-xl text-xs shrink-0"
                    >
                      <Star className="h-3.5 w-3.5 mr-1.5 fill-current" />
                      Write a Review
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-foreground">Rate this product</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowReviewForm(false)}
                        className="text-xs h-7"
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-muted-foreground">Rating</label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                star <= reviewRating
                                  ? 'fill-warning text-warning'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="ml-2 font-bold text-sm text-foreground">
                          {reviewRating} of 5 stars
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-muted-foreground">Your Feedback Comment *</label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Describe the product condition, handover experience, or usefulness for your semester..."
                        rows={3}
                        required
                        className="w-full rounded-xl border border-input bg-background p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReviewForm(false)}
                        className="rounded-xl text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submittingReview}
                        size="sm"
                        className="rounded-xl text-xs"
                      >
                        {submittingReview ? 'Submitting...' : 'Submit Verified Review'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              {productReviews.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center bg-card/50">
                  <Star className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <h3 className="text-base font-semibold">No reviews yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                    Be the first student to review this item after checking it out!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {productReviews.map((review) => {
                    const formattedDate = new Date(review.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    return (
                      <div key={review.id} className="rounded-xl border border-border bg-card p-5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                              {review.author.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{review.author}</div>
                              <div className="text-xs text-muted-foreground">{formattedDate}</div>
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
                        {review.comment && (
                          <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 bg-background/95 backdrop-blur-xl border-t border-border/80 p-2.5 shadow-2xl animate-fade-in-up">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-lg font-bold text-foreground">₹{displayPrice}</span>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">₹{product.price}</span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">
              {product.inventory > 0 ? `${product.inventory} in stock` : 'Out of stock'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setChatOpen(true)}
              className="rounded-xl h-10 px-3 text-xs"
              aria-label="Chat with seller"
            >
              <MessageSquare className="h-4 w-4 text-primary" />
            </Button>
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={product.inventory === 0}
              className="rounded-xl h-10 px-4 text-xs font-bold flex-1 shadow-sm"
            >
              <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>

      <Footer />

      {/* Real-time Student Chat & Offer Dialog */}
      <ChatDialog
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        recipientId={product.seller?.id || product.seller?.username || 'seller'}
        recipientName={product.seller?.displayName || 'Campus Creator'}
        recipientAvatar={product.seller?.avatar}
        recipientUsername={product.seller?.username}
        product={{
          id: product.id,
          name: product.name,
          price: product.discountPrice ?? product.price,
          image: product.images[0],
        }}
      />
    </>
  );
}
