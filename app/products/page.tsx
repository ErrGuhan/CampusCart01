import { getAllProducts, getCategories } from '@/lib/supabase-queries';
import { ProductsBrowser } from '@/components/products-browser';

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getCategories(),
  ]);

  return <ProductsBrowser products={products} categories={categories} />;
}
