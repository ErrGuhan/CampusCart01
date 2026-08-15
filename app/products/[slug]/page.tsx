import { notFound } from 'next/navigation';
import { getProductBySlug, getRelatedProducts, getProductReviews } from '@/lib/supabase-queries';
import { ProductDetailClient } from '@/components/product-detail-client';

type Props = { params: Promise<{ slug: string }> };

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const [relatedProducts, reviews] = await Promise.all([
    getRelatedProducts(product),
    getProductReviews(product.id),
  ]);

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts}
      reviews={reviews}
    />
  );
}
