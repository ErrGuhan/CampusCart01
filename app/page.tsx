import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { SwipeLayout } from '@/components/layout/swipe-layout';
import { HeroSection } from '@/components/home/hero-section';
import { CategoriesSection } from '@/components/home/categories-section';
import { ProductSection } from '@/components/home/product-section';
import { CreatorsSection } from '@/components/home/creators-section';
import { ServicesSection } from '@/components/home/services-section';
import { DealsBannerSection } from '@/components/home/deals-banner-section';
import { RequestsPreviewSection } from '@/components/home/requests-preview-section';
import { HowItWorksSection } from '@/components/home/how-it-works-section';
import { CtaSection } from '@/components/home/cta-section';
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

  return (
    <>
      <Navbar />
      <main className="w-full max-w-[100vw]">
        <SwipeLayout
          /* LEFT PANEL: Quick Marketplace & Category Exploration */
          leftPanelContent={
            <div className="pt-2 pb-20">
              <CategoriesSection categories={categories} />
              <ProductSection
                title="Explore Campus Marketplace"
                subtitle="Browse student items, gadgets, and textbooks"
                products={trending.slice(0, 6)}
                viewAllHref="/marketplace"
              />
            </div>
          }
          /* CENTER PANEL: Default Home Landing Screen */
          homeCenterContent={
            <div className="pb-20 md:pb-0">
              <HeroSection />
              <CategoriesSection categories={categories} />
              <DealsBannerSection />
              <ProductSection
                title="Trending Campus Favorites"
                subtitle="Top-rated textbooks, project kits & essentials loved by students"
                products={featured.slice(0, 4)}
                viewAllHref="/marketplace"
              />
              <ServicesSection />
              <RequestsPreviewSection />
              <CreatorsSection sellers={sellers.slice(0, 3)} />
              <ProductSection
                title="Fresh Campus Arrivals"
                subtitle="Latest listings and semester resources published this week"
                products={newArrivals.slice(0, 4)}
                viewAllHref="/marketplace"
              />
              <HowItWorksSection />
              <CtaSection />
              <Footer />
            </div>
          }
          /* RIGHT PANEL: Freelance Services & Requests Hub */
          rightPanelContent={
            <div className="pt-2 pb-20">
              <ServicesSection />
              <RequestsPreviewSection />
            </div>
          }
        />
      </main>
    </>
  );
}

