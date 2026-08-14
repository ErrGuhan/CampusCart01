import Link from 'next/link';
import { Star, ArrowRight, Store } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getAllSellers } from '@/lib/supabase-queries';

export default async function SellersPage() {
  const sellers = await getAllSellers();

  return (
    <>
      <Navbar />
      <main className="container-px mx-auto max-w-7xl py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">Student Creators</h1>
          <p className="mt-1.5 text-muted-foreground">
            Meet the talented students building products and businesses on campus
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sellers.map((seller) => (
            <Link
              key={seller.id}
              href={`/seller/${seller.username}`}
              className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/20 hover:-translate-y-1"
            >
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 ring-2 ring-border group-hover:ring-primary/30 transition-all">
                  <AvatarImage src={seller.avatar} alt={seller.displayName} />
                  <AvatarFallback>{seller.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                    {seller.displayName}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {seller.department} · {seller.year}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="text-sm font-medium">{seller.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {seller.productCount} products
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {seller.bio}
              </p>

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

              <div className="mt-5 flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                View store
                <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-border bg-secondary/30 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <Store className="h-7 w-7" />
          </div>
          <h2 className="font-display text-xl font-bold">Are you a student creator?</h2>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto">
            Join CampusCart and start selling your products to students on your campus. No fees, no friction.
          </p>
          <Button className="mt-5" asChild>
            <Link href="/register">Start Selling</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
