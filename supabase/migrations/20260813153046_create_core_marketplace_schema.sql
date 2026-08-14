/*
# CampusCart Core Marketplace Schema

## Overview
Creates the foundational database schema for CampusCart, a college-only
student marketplace. This migration establishes all core tables needed
for the MVP: user profiles, seller profiles, categories, products,
product images, cart, orders, order items, reviews, and wishlist.

## New Tables
1. profiles — Extends Supabase auth.users with student-specific data
2. categories — Product categories managed by admins
3. products — Student-created product listings
4. product_images — Multiple images per product
5. cart_items — Shopping cart items per user
6. orders — Order records with status lifecycle
7. order_items — Individual items within an order
8. reviews — Product reviews from verified buyers
9. wishlist_items — Saved products per user

## Security
- RLS enabled on ALL tables
- Public tables (categories, products, product_images, profiles):
  readable by anon + authenticated; writable only by authenticated owners
- Private tables (cart_items, orders, order_items, reviews, wishlist_items):
  readable/writable only by authenticated owners
- Owner columns default to auth.uid() so inserts work without client passing user_id
*/

-- ============================================
-- 1. PROFILES (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL,
  username text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'seller', 'admin')),
  department text,
  year text,
  bio text,
  avatar_url text,
  skills text[] DEFAULT '{}',
  social_links jsonb DEFAULT '{}',
  is_verified boolean NOT NULL DEFAULT false,
  is_seller boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view profiles" ON profiles;
CREATE POLICY "Public can view profiles"
ON profiles FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view categories" ON categories;
CREATE POLICY "Public can view categories"
ON categories FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
CREATE POLICY "Admins can insert categories"
ON categories FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update categories" ON categories;
CREATE POLICY "Admins can update categories"
ON categories FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
CREATE POLICY "Admins can delete categories"
ON categories FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- ============================================
-- 3. PRODUCTS
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  discount_price numeric(10, 2) CHECK (discount_price >= 0),
  tags text[] DEFAULT '{}',
  inventory int NOT NULL DEFAULT 0 CHECK (inventory >= 0),
  sku text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'paused', 'out_of_stock')),
  seller_notes text,
  pickup_available boolean NOT NULL DEFAULT true,
  delivery_available boolean NOT NULL DEFAULT false,
  rating numeric(2, 1) NOT NULL DEFAULT 0.0,
  review_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

DROP POLICY IF EXISTS "Public can view active products" ON products;
CREATE POLICY "Public can view active products"
ON products FOR SELECT
TO anon, authenticated USING (status IN ('active', 'out_of_stock'));

DROP POLICY IF EXISTS "Sellers can view own products" ON products;
CREATE POLICY "Sellers can view own products"
ON products FOR SELECT
TO authenticated USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers can insert own products" ON products;
CREATE POLICY "Sellers can insert own products"
ON products FOR INSERT
TO authenticated WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers can update own products" ON products;
CREATE POLICY "Sellers can update own products"
ON products FOR UPDATE
TO authenticated USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers can delete own products" ON products;
CREATE POLICY "Sellers can delete own products"
ON products FOR DELETE
TO authenticated USING (auth.uid() = seller_id);

-- ============================================
-- 4. PRODUCT IMAGES
-- ============================================
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

DROP POLICY IF EXISTS "Public can view product images" ON product_images;
CREATE POLICY "Public can view product images"
ON product_images FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Sellers can insert own product images" ON product_images;
CREATE POLICY "Sellers can insert own product images"
ON product_images FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM products WHERE products.id = product_id AND products.seller_id = auth.uid())
);

DROP POLICY IF EXISTS "Sellers can update own product images" ON product_images;
CREATE POLICY "Sellers can update own product images"
ON product_images FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM products WHERE products.id = product_id AND products.seller_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM products WHERE products.id = product_id AND products.seller_id = auth.uid())
);

DROP POLICY IF EXISTS "Sellers can delete own product images" ON product_images;
CREATE POLICY "Sellers can delete own product images"
ON product_images FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM products WHERE products.id = product_id AND products.seller_id = auth.uid())
);

-- ============================================
-- 5. CART ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

DROP POLICY IF EXISTS "Users can view own cart" ON cart_items;
CREATE POLICY "Users can view own cart"
ON cart_items FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add to own cart" ON cart_items;
CREATE POLICY "Users can add to own cart"
ON cart_items FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cart" ON cart_items;
CREATE POLICY "Users can update own cart"
ON cart_items FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete from own cart" ON cart_items;
CREATE POLICY "Users can delete from own cart"
ON cart_items FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- 6. ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN (
    'pending_payment', 'paid', 'confirmed', 'processing',
    'ready_for_pickup', 'out_for_delivery', 'delivered',
    'cancelled', 'refunded'
  )),
  subtotal numeric(10, 2) NOT NULL DEFAULT 0,
  discount numeric(10, 2) NOT NULL DEFAULT 0,
  delivery_fee numeric(10, 2) NOT NULL DEFAULT 0,
  total numeric(10, 2) NOT NULL DEFAULT 0,
  fulfillment_type text NOT NULL DEFAULT 'pickup' CHECK (fulfillment_type IN ('pickup', 'delivery')),
  pickup_point text,
  shipping_address jsonb,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method text,
  transaction_id text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own orders" ON orders;
CREATE POLICY "Users can create own orders"
ON orders FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own orders" ON orders;
CREATE POLICY "Users can update own orders"
ON orders FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 7. ORDER ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  product_image text,
  unit_price numeric(10, 2) NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0),
  subtotal numeric(10, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller_id ON order_items(seller_id);

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items"
ON order_items FOR SELECT
TO authenticated USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Sellers can view their order items" ON order_items;
CREATE POLICY "Sellers can view their order items"
ON order_items FOR SELECT
TO authenticated USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
CREATE POLICY "Users can insert own order items"
ON order_items FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = auth.uid())
);

-- Now add the seller policy on orders (after order_items exists)
DROP POLICY IF EXISTS "Sellers can view orders with their products" ON orders;
CREATE POLICY "Sellers can view orders with their products"
ON orders FOR SELECT
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM order_items
    JOIN products ON products.id = order_items.product_id
    WHERE order_items.order_id = orders.id AND products.seller_id = auth.uid()
  )
);

-- ============================================
-- 8. REVIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  images text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

DROP POLICY IF EXISTS "Public can view reviews" ON reviews;
CREATE POLICY "Public can view reviews"
ON reviews FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Users can create reviews for purchased products" ON reviews;
CREATE POLICY "Users can create reviews for purchased products"
ON reviews FOR INSERT
TO authenticated WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM order_items
    JOIN orders ON orders.id = order_items.order_id
    WHERE order_items.product_id = reviews.product_id
    AND orders.user_id = auth.uid()
    AND orders.status IN ('delivered', 'confirmed', 'processing', 'ready_for_pickup', 'out_for_delivery')
  )
);

DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews"
ON reviews FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
CREATE POLICY "Users can delete own reviews"
ON reviews FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- 9. WISHLIST ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items(user_id);

DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlist_items;
CREATE POLICY "Users can view own wishlist"
ON wishlist_items FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add to own wishlist" ON wishlist_items;
CREATE POLICY "Users can add to own wishlist"
ON wishlist_items FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove from own wishlist" ON wishlist_items;
CREATE POLICY "Users can remove from own wishlist"
ON wishlist_items FOR DELETE
TO authenticated USING (auth.uid() = user_id);
