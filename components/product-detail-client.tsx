'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Star, Heart, ShoppingBag, Minus, Plus, Truck, MapPin,
  ChevronRight, Store, Share2, Shield, Check, BadgeCheck,
  MessageSquare, Handshake, Zap, Sparkles, AlertCircle,
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
import { cn } from '@/lib/utils';

type Props = { product: Product; relatedProducts: Product[]; reviews?: Review[] };

export function ProductDetailClient({ product, relatedProducts, reviews = [] }: Props) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [productReviews, setProductReviews] = useState<Review[]>(reviews);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

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
      toast({ title: 'Review Submitted! ⭐', description: 'Thank you for your verified student feedback!' });
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

  const hasDiscount = product.discountPrice !== undefined && product.discountPrice < product.price;
  const displayPrice = product.discountPrice ?? product.price;
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
      title: 'Added to cart! 🛒',
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
      <main className="container-px mx-auto max-w-7xl py-5 sm:py-8 pb-28 md:pb-12">
        
        {/* Minimal Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-6 overflow-x-auto pb-1">
          <Link href="/" className="hover:text-foreground transition-colors font-medium">Home</Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-60 shrink-0" />
          <Link href="/marketplace" className="hover:text-foreground transition-colors font-medium">Marketplace</Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-60 shrink-0" />
          <Link href={`/categories/${categorySlug}`} className="hover:text-foreground transition-colors font-medium">
            {product.category}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-60 shrink-0" />
          <span className="text-foreground font-semibold truncate">{product.name}</span>
        </nav>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12 items-start">
          
          {/* Left Column: Media Gallery (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-secondary/20 aspect-square shadow-sm group">
              <Image
                src={product.images[selectedImage] || 'https://images.pexels.com/photos/28867382/pexels-photo-28867382.jpeg'}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Badges on image */}
              <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-10">
                {hasDiscount && (
                  <Badge className="bg-destructive text-destructive-foreground font-extrabold text-xs px-2.5 py-1 rounded-full shadow-md">
                    {discountPercent}% OFF
                  </Badge>
                )}
                {product.isDigital && (
                  <Badge className="bg-indigo-600 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-md">
                    Digital Download
                  </Badge>
                )}
              </div>

              {/* Wishlist Button on Image */}
              <button
                onClick={toggleWishlist}
                aria-label="Add to Wishlist"
                className={cn(
                  'absolute top-3.5 right-3.5 z-10 h-10 w-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all active:scale-90 shadow-md',
                  isWishlisted
                    ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/80 dark:border-rose-800'
                    : 'bg-background/80 border-border/60 text-muted-foreground hover:text-foreground'
                )}
              >
                <Heart className={cn('h-5 w-5', isWishlisted && 'fill-rose-600 text-rose-600')} />
              </button>

              {/* Mobile Image Dots */}
              {product.images.length > 1 && (
                <div className="absolute bottom-3.5 left-0 right-0 flex justify-center gap-1.5 z-10 sm:hidden">
                  {product.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      aria-label={`View image ${idx + 1}`}
                      className={cn(
                        'h-2 rounded-full transition-all',
                        selectedImage === idx ? 'w-6 bg-white shadow-md' : 'w-2 bg-white/60'
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail Carousel */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={cn(
                      'relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-all active:scale-95',
                      selectedImage === idx
                        ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                        : 'border-border/70 hover:border-muted-foreground/40 opacity-70 hover:opacity-100'
                    )}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Clean Product Information & Actions (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Header Block: Badges, Title, Ratings */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="font-semibold text-xs px-3 py-1 rounded-full">
                  {product.category}
                </Badge>
                {product.inventory > 0 ? (
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1">
                    <Check className="h-3 w-3 stroke-[2.5]" />
                    In Stock
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="font-bold text-xs px-3 py-1 rounded-full">
                    Out of Stock
                  </Badge>
                )}
                {product.isVerified && (
                  <Badge className="bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified Original
                  </Badge>
                )}
              </div>

              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 flex-wrap">
                {currentReviewCount > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            'h-4 w-4',
                            star <= Math.round(currentRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-muted-foreground/30'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-foreground">{currentRating.toFixed(1)}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full font-medium">
                    No ratings yet
                  </span>
                )}
                <span className="text-xs text-muted-foreground font-medium">
                  {currentReviewCount} {currentReviewCount === 1 ? 'student review' : 'student reviews'}
                </span>
                <span className="text-xs text-muted-foreground">• Verified Peer Listing</span>
              </div>
            </div>

            {/* Price Hero Section */}
            <div className="p-4 sm:p-5 rounded-3xl bg-secondary/40 border border-border/60 flex items-baseline justify-between gap-4">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-display text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                  ₹{displayPrice}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-base sm:text-lg text-muted-foreground line-through font-medium">
                      ₹{product.price}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      Save ₹{product.price - product.discountPrice!}
                    </span>
                  </>
                )}
              </div>
              <span className="text-xs text-muted-foreground font-medium shrink-0">
                {product.inventory} available
              </span>
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs px-2.5 py-0.5 rounded-lg text-muted-foreground">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Campus Delivery & Pickup Info Card */}
            <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3.5">
              <div className="flex items-center gap-3 text-sm">
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl shrink-0',
                  product.pickupAvailable ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-secondary text-muted-foreground'
                )}>
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-foreground">Campus Pickup Spot</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {product.pickupAvailable ? 'Available at Main Block Pickup Counter' : 'Direct meetup on campus'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm pt-2 border-t border-border/50">
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl shrink-0',
                  product.deliveryAvailable ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-secondary text-muted-foreground'
                )}>
                  <Truck className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-foreground">Hostel & Campus Delivery</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {product.deliveryAvailable ? 'Seller-managed delivery to your department/hostel' : 'Meetup & pickup only'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quantity</span>
              <div className="flex items-center rounded-2xl border border-border bg-secondary/50 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-card hover:text-foreground transition-all active:scale-90"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-sm font-bold text-foreground">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.inventory, q + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-card hover:text-foreground transition-all active:scale-90"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground">
                (Max {product.inventory} units)
              </span>
            </div>

            {/* PRIMARY CALL-TO-ACTION BUTTONS (Large, Clean & Impactful) */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.inventory === 0}
                  className="rounded-2xl h-12 sm:h-14 text-sm sm:text-base font-extrabold gap-2 shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
                >
                  <ShoppingBag className="h-5 w-5 stroke-[2.2]" />
                  <span>Add to Cart</span>
                </Button>

                <Button
                  onClick={handleBuyNow}
                  disabled={product.inventory === 0}
                  variant="outline"
                  className="rounded-2xl h-12 sm:h-14 text-sm sm:text-base font-extrabold gap-2 border-2 border-primary/30 hover:bg-primary/5 active:scale-[0.98] transition-all text-foreground bg-card shadow-xs"
                >
                  <Zap className="h-5 w-5 text-primary fill-primary/20" />
                  <span>Buy Now</span>
                </Button>
              </div>

              {/* Chat with Seller & Make an Offer Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setChatOpen(true)}
                  className="rounded-2xl h-11 sm:h-12 text-xs sm:text-sm font-bold gap-2 bg-secondary hover:bg-secondary/80 text-foreground transition-all active:scale-[0.98]"
                >
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span>Chat with Seller</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setChatOpen(true)}
                  className="rounded-2xl h-11 sm:h-12 text-xs sm:text-sm font-bold gap-2 border-primary/25 text-primary hover:bg-primary/10 transition-all active:scale-[0.98]"
                >
                  <Handshake className="h-4 w-4" />
                  <span>Make an Offer</span>
                </Button>
              </div>
            </div>

            {/* Trust Assurance Row */}
            <div className="flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-secondary/30 border border-border/50 text-[11px] sm:text-xs text-muted-foreground font-medium">
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-primary shrink-0" />
                <span>Verified Student Seller</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Store className="h-4 w-4 text-primary shrink-0" />
                <span>Campus-Only Handover</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>PIN-Secured Pickup</span>
              </div>
            </div>

          </div>
        </div>

        {/* Campus Creator / Seller Profile Card */}
        <div className="mt-12 rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Link
              href={`/seller/${product.seller.username}`}
              className="flex items-center gap-4 group min-w-0"
            >
              <Avatar className="h-14 w-14 ring-2 ring-primary/20 shrink-0">
                <AvatarImage src={product.seller.avatar} alt={product.seller.displayName} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {product.seller.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors truncate">
                    {product.seller.displayName}
                  </h3>
                  {product.seller.rating > 0 ? (
                    <Badge variant="secondary" className="text-xs font-bold gap-1 px-2 py-0">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {product.seller.rating.toFixed(1)}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs font-bold">
                      Campus Seller
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {product.seller.department} {product.seller.year ? `· ${product.seller.year}` : ''} • {product.seller.productCount} active listings
                </p>
              </div>
            </Link>

            <Button asChild variant="outline" className="rounded-2xl h-11 px-5 text-xs sm:text-sm font-bold shrink-0">
              <Link href={`/seller/${product.seller.username}`}>
                View Storefront
                <ChevronRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Tabbed Info: Reviews, Description, Policies */}
        <div className="mt-10">
          <Tabs defaultValue="reviews" className="space-y-6">
            <TabsList className="p-1 rounded-2xl bg-secondary/70 border border-border/60 h-12">
              <TabsTrigger value="reviews" className="rounded-xl text-xs sm:text-sm font-bold px-4">
                Reviews ({currentReviewCount})
              </TabsTrigger>
              <TabsTrigger value="description" className="rounded-xl text-xs sm:text-sm font-bold px-4">
                Full Description
              </TabsTrigger>
              <TabsTrigger value="policies" className="rounded-xl text-xs sm:text-sm font-bold px-4">
                Campus Handover Policies
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reviews" className="space-y-6">
              {/* Write Review Trigger / Form */}
              <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
                {!showReviewForm ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-foreground">Verified Student Reviews</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Have you used or purchased this item? Share your experience with classmates.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setShowReviewForm(true)}
                      className="rounded-xl text-xs font-bold shrink-0 h-10 px-4 gap-1.5"
                    >
                      <Star className="h-3.5 w-3.5 fill-current" />
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
                        className="text-xs h-8 rounded-lg"
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
                              className={cn(
                                'h-6 w-6',
                                star <= reviewRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-muted-foreground/30'
                              )}
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
                        className="w-full rounded-2xl border border-input bg-background p-3.5 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReviewForm(false)}
                        className="rounded-xl text-xs h-9 px-4 font-semibold"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submittingReview}
                        size="sm"
                        className="rounded-xl text-xs h-9 px-4 font-bold"
                      >
                        {submittingReview ? 'Submitting...' : 'Submit Verified Review'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              {productReviews.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border p-8 text-center bg-card/50">
                  <Star className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-foreground">No reviews yet</h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                    Be the first student to review this item after checking it out!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {productReviews.map((review) => {
                    const formattedDate = new Date(review.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    return (
                      <div key={review.id} className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                              {review.author.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-foreground">{review.author}</div>
                              <div className="text-[11px] text-muted-foreground">{formattedDate}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  'h-3.5 w-3.5',
                                  star <= review.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-muted-foreground/30'
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="description" className="mt-6">
              <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4">
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{product.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4">
                    <span className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider">Category</span>
                    <span className="text-sm font-bold text-foreground mt-0.5 block">{product.category}</span>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4">
                    <span className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider">Inventory Stock</span>
                    <span className="text-sm font-bold text-foreground mt-0.5 block">{product.inventory} units available</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="policies" className="mt-6">
              <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                <div>
                  <h4 className="font-bold text-foreground mb-1 text-sm">📍 Campus Pickup & Handover</h4>
                  <p>{product.pickupAvailable ? 'Available for physical verification & handover at the designated campus pickup spot during college hours.' : 'Direct student-to-student meetup coordinated after order.'}</p>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <h4 className="font-bold text-foreground mb-1 text-sm">🚚 Direct Campus Delivery</h4>
                  <p>{product.deliveryAvailable ? 'Seller can deliver to your department block or hostel gate. Details coordinated via in-app Campus Messages.' : 'This product is pickup/meetup only.'}</p>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <h4 className="font-bold text-foreground mb-1 text-sm">🔒 Handover PIN Security</h4>
                  <p>Upon ordering, you will receive a secure 4-digit Handover PIN. Give this PIN to the seller only after inspecting and receiving your item to confirm completion.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products Carousel / Grid */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                More Campus Listings
              </h2>
              <Button asChild variant="ghost" size="sm" className="text-xs font-bold text-primary">
                <Link href="/marketplace">View Marketplace →</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </main>

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
