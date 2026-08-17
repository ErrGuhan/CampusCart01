import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { SwipeLayout, type SwipePanelConfig } from '@/components/layout/swipe-layout';
import { Button } from '@/components/ui/button';
import { HeroSection } from '@/components/home/hero-section';
import { CategoriesSection } from '@/components/home/categories-section';
import { ProductSection } from '@/components/home/product-section';
import { CreatorsSection } from '@/components/home/creators-section';
import { ServicesSection } from '@/components/home/services-section';
import { DealsBannerSection } from '@/components/home/deals-banner-section';
import { RequestsPreviewSection } from '@/components/home/requests-preview-section';
import { HowItWorksSection } from '@/components/home/how-it-works-section';
import { CtaSection } from '@/components/home/cta-section';
import { QuickConnectSection } from '@/components/home/quick-connect-section';
import { StudioSwipePanel } from '@/components/home/studio-swipe-panel';
import {
  getCategories,
  getFeaturedProducts,
  getTrendingProducts,
  getNewArrivals,
  getAllSellers,
} from '@/lib/firebase-queries';

export const revalidate = 60;

export default async function Home() {
  const [categories, featured, trending, newArrivals, sellers] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
    getTrendingProducts(),
    getNewArrivals(4),
    getAllSellers(),
  ]);

  const panels: SwipePanelConfig[] = [
    /* 0. Market Panel */
    {
      id: 'market',
      label: 'Campus Marketplace',
      content: (
        <div className="pt-3 pb-28 sm:pb-32 px-3.5 sm:px-6 max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xl font-bold font-display tracking-tight">Campus Marketplace</h2>
              <p className="text-xs text-muted-foreground font-medium">Textbooks, project kits & student essentials</p>
            </div>
            <Button asChild size="sm" variant="outline" className="rounded-xl text-xs touch-target min-h-[44px] sm:min-h-auto">
              <Link href="/marketplace">Full Market</Link>
            </Button>
          </div>
          <ProductSection
            title="Explore Trending Items"
            subtitle="Top-rated listings available now"
            products={trending}
            viewAllHref="/marketplace"
          />
          <CategoriesSection categories={categories} />
        </div>
      ),
    },

    /* 1. Freelance Panel */
    {
      id: 'freelance',
      label: 'Freelance & Gigs',
      content: (
        <div className="pt-3 pb-28 sm:pb-32 px-3.5 sm:px-6 max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xl font-bold font-display tracking-tight">Student Freelance Hub</h2>
              <p className="text-xs text-muted-foreground font-medium">Designers, coders, tutors & content creators</p>
            </div>
            <Button asChild size="sm" variant="outline" className="rounded-xl text-xs touch-target min-h-[44px] sm:min-h-auto">
              <Link href="/services">All Services</Link>
            </Button>
          </div>
          <ServicesSection />
        </div>
      ),
    },

    /* 2. Home Panel (EXACT CENTER) */
    {
      id: 'home',
      label: 'Home Feed',
      isHome: true,
      content: (
        <div className="pb-28 sm:pb-32 md:pb-0 space-y-4 sm:space-y-6">
          <HeroSection />
          <CategoriesSection categories={categories} />
          <ProductSection
            title="Featured Campus Listings"
            subtitle="Top-rated textbooks, project kits & student essentials"
            products={featured.slice(0, 4)}
            viewAllHref="/marketplace"
          />
          <ServicesSection />
          <RequestsPreviewSection />
          <CreatorsSection sellers={sellers.slice(0, 3)} />
          <Footer />
        </div>
      ),
    },

    /* 3. Requests Panel */
    {
      id: 'requests',
      label: 'Campus Requests',
      content: (
        <div className="pt-3 pb-28 sm:pb-32 px-3.5 sm:px-6 max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-xl font-bold font-display tracking-tight">Campus Request Board</h2>
              <p className="text-xs text-muted-foreground font-medium">Post what you need or make offers to classmates</p>
            </div>
            <Button asChild size="sm" variant="outline" className="rounded-xl text-xs touch-target min-h-[44px] sm:min-h-auto">
              <Link href="/requests">Open Board</Link>
            </Button>
          </div>
          <RequestsPreviewSection />
        </div>
      ),
    },

    /* 4. Studio Panel */
    {
      id: 'studio',
      label: 'Creator Studio',
      content: <StudioSwipePanel sellers={sellers} />,
    },
  ];

  return (
    <>
      <Navbar />
      <main className="w-full max-w-[100vw]">
        <SwipeLayout panels={panels} initialIndex={2} />
      </main>
    </>
  );
}


