import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { HeroSection } from '@/components/home/hero-section';
import { CategoriesSection } from '@/components/home/categories-section';
import { ProductSection } from '@/components/home/product-section';
import { CreatorsSection } from '@/components/home/creators-section';
import { ServicesSection } from '@/components/home/services-section';
import { HowItWorksSection } from '@/components/home/how-it-works-section';
import { CtaSection } from '@/components/home/cta-section';
import {
  getCategories,
  getFeaturedProducts,
  getTrendingProducts,
  getNewArrivals,
  getAllSellers,
} from '@/lib/firebase-queries';

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
      <main>
        <HeroSection />
        <CategoriesSection categories={categories} />
        <ServicesSection />
        <ProductSection
          title="Featured Products"
          subtitle="Handpicked favorites loved by the campus community"
          products={featured.slice(0, 4)}
        />
        <CreatorsSection sellers={sellers.slice(0, 4)} />
        <ProductSection
          title="Trending Now"
          subtitle="The most popular products this week"
          products={trending}
        />
        <ProductSection
          title="New Arrivals"
          subtitle="Fresh listings from student creators"
          products={newArrivals}
        />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
