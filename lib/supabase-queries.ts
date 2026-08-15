import { supabase } from './supabase-server';
import type { Category, Product, Seller } from './types';

/**
 * Real data layer for CampusCart, backed by Supabase.
 * Every function here mirrors a function that used to live in lib/mock-data.ts,
 * with the same name and return shape — the difference is these are async
 * and hit Postgres instead of returning hardcoded arrays.
 */

// Shared select string: pulls a product row plus its images and its
// seller's profile in a single round trip via Postgres foreign-key joins.
const PRODUCT_SELECT = `
  *,
  images:product_images(url),
  seller:profiles!products_seller_id_fkey(*),
  category:categories(name)
`;

// ---------- Row -> app-type mappers ----------

function mapSeller(row: any, stats?: { rating: number; productCount: number }): Seller {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatar: row.avatar_url ?? '',
    department: row.department ?? '',
    year: row.year ?? '',
    bio: row.bio ?? '',
    skills: row.skills ?? [],
    rating: stats?.rating ?? 0,
    productCount: stats?.productCount ?? 0,
    joinedAt: row.created_at,
  };
}

function mapProduct(row: any): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? '',
    price: Number(row.price),
    discountPrice: row.discount_price != null ? Number(row.discount_price) : undefined,
    category: row.category?.name ?? 'Other',
    tags: row.tags ?? [],
    images: (row.images ?? []).map((img: any) => img.url),
    inventory: row.inventory,
    status: row.status,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    seller: mapSeller(row.seller),
    pickupAvailable: row.pickup_available,
    deliveryAvailable: row.delivery_available,
    createdAt: row.created_at,
    isVerified: row.is_verified ?? false,
  };
}

// ---------- Categories ----------

export async function getCategories(): Promise<Category[]> {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  if (!categories) return [];

  // categories has no productCount column — derive it from live product counts
  // instead of trusting a value that could drift out of sync.
  const { data: activeProducts } = await supabase
    .from('products')
    .select('category_id')
    .eq('status', 'active');

  const counts = new Map<string, number>();
  for (const p of activeProducts ?? []) {
    if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
  }

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon ?? 'Package',
    productCount: counts.get(c.id) ?? 0,
  }));
}

// ---------- Products ----------

export async function getFeaturedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'active')
    .gte('rating', 4.8)
    .gte('review_count', 10)
    .order('rating', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function getTrendingProducts(limit = 4): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'active')
    .order('review_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function getNewArrivals(limit = 4): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function getDiscountedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'active')
    .not('discount_price', 'is', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

// All active products — used where the old code imported the raw `products`
// array directly (product listing/search pages, seller dashboard, etc).
export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  // Filtering on a joined table's column requires an inner join (!inner) —
  // otherwise Postgrest returns all products with category as null-joined.
  const { data, error } = await supabase
    .from('products')
    .select(`*, images:product_images(url), seller:profiles!products_seller_id_fkey(*), category:categories!inner(name, slug)`)
    .eq('status', 'active')
    .eq('category.slug', categorySlug);

  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function getProductsBySeller(username: string): Promise<Product[]> {
  const { data: seller } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (!seller) return [];

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('seller_id', seller.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data ? mapProduct(data) : undefined;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .in('id', ids);

  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`*, images:product_images(url), seller:profiles!products_seller_id_fkey(*), category:categories!inner(name)`)
    .eq('status', 'active')
    .eq('category.name', product.category)
    .neq('id', product.id)
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

// ---------- Sellers ----------

export async function getSellerByUsername(username: string): Promise<Seller | undefined> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .eq('is_seller', true)
    .maybeSingle();

  if (error) throw error;
  if (!profile) return undefined;

  // profiles has no rating/productCount columns — derive both from
  // that seller's active products, same as the storefront does.
  const { data: sellerProducts } = await supabase
    .from('products')
    .select('rating')
    .eq('seller_id', profile.id)
    .eq('status', 'active');

  const productCount = sellerProducts?.length ?? 0;
  const rating = productCount
    ? sellerProducts!.reduce((sum, p) => sum + Number(p.rating), 0) / productCount
    : 0;

  return mapSeller(profile, { rating, productCount });
}

export async function getAllSellers(): Promise<Seller[]> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_seller', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!profiles) return [];

  const { data: allProducts } = await supabase
    .from('products')
    .select('seller_id, rating')
    .eq('status', 'active');

  const bySeller = new Map<string, number[]>();
  for (const p of allProducts ?? []) {
    const list = bySeller.get(p.seller_id) ?? [];
    list.push(Number(p.rating));
    bySeller.set(p.seller_id, list);
  }

  return profiles.map((profile) => {
    const ratings = bySeller.get(profile.id) ?? [];
    const productCount = ratings.length;
    const rating = productCount ? ratings.reduce((a, b) => a + b, 0) / productCount : 0;
    return mapSeller(profile, { rating, productCount });
  });
}

// For the seller's own dashboard — returns every status (draft/paused/etc),
// not just 'active'. Relies on the "Sellers can view own products" RLS
// policy, so this only returns real data when called with the signed-in
// seller's own id.
export async function getMyProducts(sellerId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapProduct);
}
