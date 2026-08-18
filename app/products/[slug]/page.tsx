import { notFound } from 'next/navigation';
import { getProductBySlug, getRelatedProducts, getProductReviews } from '@/lib/firebase-queries';
import { ProductDetailClient } from '@/components/product-detail-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = { params: { slug: string } | Promise<{ slug: string }> };

export default async function ProductDetailPage({ params }: Props) {
  const resolved = await params;
  const slug = resolved.slug;
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
