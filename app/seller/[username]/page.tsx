import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, Calendar, ArrowRight, Store } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/product-card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShareProfileButton } from '@/components/share-profile-button';
import { getSellerByUsername, getProductsBySeller } from '@/lib/firebase-queries';

type Props = { params: Promise<{ username: string }> };

export default async function SellerProfilePage({ params }: Props) {
  const { username } = await params;
  const seller = await getSellerByUsername(username);

  if (!seller) notFound();

  const sellerProducts = await getProductsBySeller(username);

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

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-6">
            <Avatar className="h-24 w-24 ring-2 ring-border shrink-0">
              <AvatarImage src={seller.avatar} alt={seller.displayName} />
              <AvatarFallback className="text-2xl">{seller.displayName.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight">
                  {seller.displayName}
                </h1>
                <Badge className="bg-success/10 text-success hover:bg-success/10 w-fit">
                  Verified Student
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground">
                @{seller.username} · {seller.department} · {seller.year}
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed max-w-2xl">
                {seller.bio}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="text-sm font-medium">{seller.rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">rating</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Store className="h-4 w-4" />
                  {seller.productCount} products
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Joined {joinDate}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {seller.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <ShareProfileButton />
          </div>
        </div>

        <div className="mt-10">
          <div className="flex items-end justify-between mb-6">
            <h2 className="font-display text-xl font-bold tracking-tight">
              Products by {seller.displayName}
            </h2>
            <Link
              href="/products"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {sellerProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
              <Store className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No products yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This creator hasn't listed any products yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {sellerProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
