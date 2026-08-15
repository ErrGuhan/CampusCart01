import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, Calendar, ArrowRight, Store, Sparkles, Package } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product-card';
import { GigCard } from '@/components/gig-card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShareProfileButton } from '@/components/share-profile-button';
import { getSellerByUsername, getProductsBySeller, getGigsBySeller } from '@/lib/firebase-queries';

type Props = { params: Promise<{ username: string }> };

export default async function SellerProfilePage({ params }: Props) {
  const { username } = await params;
  const seller = await getSellerByUsername(username);

  if (!seller) notFound();

  const [sellerProducts, sellerGigs] = await Promise.all([
    getProductsBySeller(username),
    getGigsBySeller(username),
  ]);

  const joinDate = new Date(seller.joinedAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-8">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span className="text-border">/</span>
          <Link href="/sellers" className="hover:text-foreground transition-colors">Creators</Link>
          <span className="text-border">/</span>
          <span className="text-foreground">{seller.displayName}</span>
        </nav>

        {/* Creator Banner */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-6">
            <Avatar className="h-24 w-24 ring-2 ring-border shrink-0">
              <AvatarImage src={seller.avatar} alt={seller.displayName} />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {seller.displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight">
                  {seller.displayName}
                </h1>
                <Badge className="bg-success/10 text-success hover:bg-success/10 w-fit">
                  Verified Student Creator
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground">
                @{seller.username} · {seller.department} {seller.year ? `· ${seller.year}` : ''}
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed max-w-2xl text-sm">
                {seller.bio}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
                {seller.rating > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="font-semibold">{seller.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">rating</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Star className="h-4 w-4 text-muted-foreground/40" />
                    <span>New Creator</span>
                  </div>
                )}
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Store className="h-4 w-4" />
                  <span>{sellerProducts.length} products</span>
                </div>
                {sellerGigs.length > 0 && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Sparkles className="h-4 w-4 text-indigo-500" />
                      <span>{sellerGigs.length} freelance gigs</span>
                    </div>
                  </>
                )}
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Joined {joinDate}
                </div>
              </div>

              {seller.skills && seller.skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {seller.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <ShareProfileButton />
          </div>
        </div>

        {/* Store Offerings Tabs */}
        <div className="mt-8 sm:mt-10">
          <Tabs defaultValue="products" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-border pb-3">
              <TabsList className="bg-secondary/50 p-1 rounded-xl w-full sm:w-auto grid grid-cols-2 sm:flex">
                <TabsTrigger value="products" className="rounded-lg text-xs gap-1.5 py-2">
                  <Package className="h-3.5 w-3.5" />
                  Products ({sellerProducts.length})
                </TabsTrigger>
                <TabsTrigger value="services" className="rounded-lg text-xs gap-1.5 py-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Gigs ({sellerGigs.length})
                </TabsTrigger>
              </TabsList>

              <Link
                href="/products"
                className="hidden sm:flex items-center gap-1 text-xs font-medium text-primary hover:gap-2 transition-all"
              >
                Browse Marketplace
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <TabsContent value="products" className="mt-0">
              {sellerProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-14 px-4 text-center">
                  <Store className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <h3 className="text-base font-semibold">No products listed yet</h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                    This creator hasn't listed physical or digital goods yet. Check their freelance services tab!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {sellerProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="services" className="mt-0">
              {sellerGigs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
                  <Sparkles className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <h3 className="text-base font-semibold">No freelance services offered yet</h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                    This creator hasn't published freelance commissions yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {sellerGigs.map((gig) => (
                    <GigCard key={gig.id} gig={gig} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}
