'use client';

import { supabase } from './supabase-client';
import type { Category } from './types';

/**
 * Client-side queries for CampusCart
 * These can be called from client components
 */

export async function getClientCategories(): Promise<Category[]> {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  if (!categories) return [];

  // Derive product counts from active products
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
