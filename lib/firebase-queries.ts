import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Category, Product, Seller, Review, ServiceGig, GigOrder, GigRequest } from './types';

// Default categories list for instant availability & seeding
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-handmade', name: 'Handmade', slug: 'handmade', icon: 'Hammer', productCount: 0 },
  { id: 'cat-art-design', name: 'Art & Design', slug: 'art-design', icon: 'Palette', productCount: 0 },
  { id: 'cat-electronics', name: 'Electronics', slug: 'electronics', icon: 'Cpu', productCount: 0 },
  { id: 'cat-accessories', name: 'Accessories', slug: 'accessories', icon: 'Watch', productCount: 0 },
  { id: 'cat-fashion', name: 'Fashion', slug: 'fashion', icon: 'Shirt', productCount: 0 },
  { id: 'cat-books', name: 'Books', slug: 'books', icon: 'BookOpen', productCount: 0 },
  { id: 'cat-stationery', name: 'Stationery', slug: 'stationery', icon: 'PenTool', productCount: 0 },
  { id: 'cat-food', name: 'Food', slug: 'food', icon: 'Cookie', productCount: 0 },
  { id: 'cat-digital', name: 'Digital Products', slug: 'digital', icon: 'Monitor', productCount: 0 },
  { id: 'cat-college-supplies', name: 'College Supplies', slug: 'college-supplies', icon: 'Backpack', productCount: 0 },
  { id: 'cat-services', name: 'Services', slug: 'services', icon: 'Wrench', productCount: 0 },
  { id: 'cat-other', name: 'Other', slug: 'other', icon: 'Package', productCount: 0 },
];

export const GIG_CATEGORIES = [
  { name: 'Design & Posters', slug: 'design-posters', icon: 'Palette', description: 'Symposium posters, Instagram banners, club logos & UI/UX' },
  { name: 'Coding & Tech Projects', slug: 'coding-tech', icon: 'Code', description: 'Fullstack web, React, Python scripting, Arduino & IoT circuits' },
  { name: 'Video & Photography', slug: 'video-photography', icon: 'Video', description: 'Reels editing, campus photography, drone shots & promo clips' },
  { name: '3D Printing & CAD', slug: '3d-printing-cad', icon: 'Box', description: 'SolidWorks, AutoCAD blueprints, 3D printing slicing & models' },
  { name: 'Tutoring & Academics', slug: 'tutoring-academics', icon: 'BookOpen', description: 'Exam prep, lab records assistance, coding tutoring & math' },
  { name: 'Writing & Resumes', slug: 'writing-resumes', icon: 'FileText', description: 'ATS resume formatting, SOP writing, project reports & content' },
  { name: 'Music & Events', slug: 'music-events', icon: 'Music', description: 'Event DJing, emceeing/anchoring, sound mixing & live music' },
  { name: 'Other Freelance', slug: 'other-freelance', icon: 'Sparkles', description: 'Custom student commissions and miscellaneous gigs' },
];

// ---------- Reviews ----------

export async function getProductReviews(productId: string): Promise<Review[]> {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('product_id', '==', productId)
    );
    const snap = await getDocs(q);
    const reviews: Review[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      reviews.push({
        id: docSnap.id,
        author: d.author || d.display_name || 'Student Buyer',
        rating: Number(d.rating) || 5,
        comment: d.comment || '',
        createdAt: d.created_at || new Date().toISOString(),
      });
    });
    return reviews;
  } catch (err) {
    console.error('Error in getProductReviews:', err);
    return [];
  }
}

// ---------- Freelance Gigs & Services ----------

function mapDocToGig(data: any, id: string): ServiceGig {
  const seller: Seller = {
    id: data.seller_id || data.sellerId || 'seller',
    username: data.sellerUsername || data.seller_username || 'freelancer',
    displayName: data.sellerName || data.seller_name || 'Student Freelancer',
    avatar: data.sellerAvatar || '',
    department: data.sellerDepartment || '',
    year: data.sellerYear || '',
    bio: '',
    skills: data.tags || [],
    rating: Number(data.rating) || 5.0,
    productCount: 1,
    joinedAt: data.created_at || new Date().toISOString(),
  };

  return {
    id: id || data.id,
    sellerId: data.seller_id || data.sellerId,
    seller,
    title: data.title || 'Student Freelance Service',
    slug: data.slug || id,
    description: data.description || '',
    category: data.category || 'Design & Posters',
    startingPrice: Number(data.starting_price ?? data.startingPrice) || 200,
    deliveryTimeDays: Number(data.delivery_time_days ?? data.deliveryTimeDays) || 2,
    revisions: Number(data.revisions) || 2,
    tags: Array.isArray(data.tags) ? data.tags : [],
    coverImage: data.cover_image || data.coverImage || 'https://images.pexels.com/photos/3182773/pexels-photo-3182773.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    portfolioImages: Array.isArray(data.portfolio_images) ? data.portfolio_images : [],
    rating: Number(data.rating) || 5.0,
    reviewCount: Number(data.review_count ?? data.reviewCount) || 0,
    isVerified: data.is_verified ?? true,
    status: data.status || 'active',
    createdAt: data.created_at || new Date().toISOString(),
  };
}

export async function getAllGigs(): Promise<ServiceGig[]> {
  try {
    const q = query(collection(db, 'gigs'), where('status', '==', 'active'));
    const snap = await getDocs(q);
    const gigs: ServiceGig[] = [];
    snap.forEach((docSnap) => {
      gigs.push(mapDocToGig(docSnap.data(), docSnap.id));
    });
    return gigs;
  } catch (err) {
    console.error('Error fetching gigs from Firestore:', err);
    return [];
  }
}

export async function getFeaturedGigs(limitCount = 4): Promise<ServiceGig[]> {
  const all = await getAllGigs();
  return all.slice(0, limitCount);
}

export async function getGigBySlug(slug: string): Promise<ServiceGig | undefined> {
  const all = await getAllGigs();
  return all.find((g) => g.slug === slug || g.id === slug);
}

export async function getMyGigs(sellerId: string): Promise<ServiceGig[]> {
  try {
    const q = query(collection(db, 'gigs'), where('seller_id', '==', sellerId));
    const snap = await getDocs(q);
    const gigs: ServiceGig[] = [];
    snap.forEach((docSnap) => {
      gigs.push(mapDocToGig(docSnap.data(), docSnap.id));
    });
    return gigs;
  } catch (err) {
    console.error('Error fetching my gigs:', err);
    return [];
  }
}

// ---------- Campus Bounties / Service Requests ----------

export async function getAllGigRequests(): Promise<GigRequest[]> {
  try {
    const q = query(collection(db, 'gig_requests'), where('status', '==', 'open'));
    const snap = await getDocs(q);
    const requests: GigRequest[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      requests.push({
        id: docSnap.id,
        requesterId: d.requester_id || d.requesterId,
        requesterName: d.requester_name || d.requesterName || 'Student',
        requesterEmail: d.requester_email || d.requesterEmail || '',
        title: d.title,
        description: d.description,
        category: d.category,
        budget: Number(d.budget) || 500,
        deadlineDays: Number(d.deadline_days ?? d.deadlineDays) || 3,
        status: d.status || 'open',
        proposalsCount: Number(d.proposals_count ?? d.proposalsCount) || 0,
        createdAt: d.created_at || new Date().toISOString(),
      });
    });
    return requests;
  } catch (err) {
    console.error('Error fetching gig requests:', err);
    return [];
  }
}

function mapDocToSeller(data: any, id: string, stats?: { rating: number; productCount: number }): Seller {
  return {
    id: id || data.id,
    username: data.username || 'student',
    displayName: data.display_name || data.displayName || 'Student',
    avatar: data.avatar_url || data.avatar || '',
    department: data.department || '',
    year: data.year || '',
    bio: data.bio || '',
    skills: data.skills || [],
    rating: stats?.rating ?? data.rating ?? 0,
    productCount: stats?.productCount ?? data.productCount ?? 0,
    joinedAt: data.created_at || data.createdAt || new Date().toISOString(),
  };
}

function mapDocToProduct(data: any, id: string, sellerData?: Seller): Product {
  const images = Array.isArray(data.images)
    ? data.images
    : data.imageUrl
    ? [data.imageUrl]
    : data.image
    ? [data.image]
    : ['https://images.pexels.com/photos/28867382/pexels-photo-28867382.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'];

  const seller: Seller = sellerData || {
    id: data.seller_id || data.sellerId || 'seller',
    username: data.sellerUsername || data.seller_username || 'creator',
    displayName: data.sellerName || data.seller_name || 'Campus Creator',
    avatar: data.sellerAvatar || '',
    department: data.sellerDepartment || '',
    year: data.sellerYear || '',
    bio: '',
    skills: [],
    rating: Number(data.rating) || 5.0,
    productCount: 1,
    joinedAt: data.created_at || new Date().toISOString(),
  };

  return {
    id: id || data.id,
    slug: data.slug || id,
    name: data.name || 'Product',
    description: data.description || '',
    price: Number(data.price) || 0,
    discountPrice: data.discount_price != null ? Number(data.discount_price) : data.discountPrice != null ? Number(data.discountPrice) : undefined,
    category: data.category || 'Other',
    tags: Array.isArray(data.tags) ? data.tags : [],
    images,
    inventory: Number(data.inventory) || 0,
    status: data.status || 'active',
    rating: Number(data.rating) || 0,
    reviewCount: Number(data.review_count ?? data.reviewCount) || 0,
    seller,
    pickupAvailable: data.pickup_available ?? data.pickupAvailable ?? true,
    deliveryAvailable: data.delivery_available ?? data.deliveryAvailable ?? false,
    isDigital: data.is_digital ?? data.isDigital ?? false,
    digitalFileUrl: data.digital_file_url ?? data.digitalFileUrl ?? '',
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    isVerified: data.is_verified ?? data.isVerified ?? false,
  };
}

// ---------- Categories ----------

export async function getCategories(): Promise<Category[]> {
  try {
    const snap = await getDocs(collection(db, 'categories'));
    if (!snap.empty) {
      const cats: Category[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        cats.push({
          id: docSnap.id,
          name: d.name,
          slug: d.slug,
          icon: d.icon || 'Package',
          productCount: Number(d.productCount) || 0,
        });
      });
      return cats;
    }
  } catch (err) {
    console.warn('Firestore getCategories notice:', err);
  }

  // Derive counts from products if categories collection is not yet populated
  return DEFAULT_CATEGORIES;
}

// ---------- Products ----------

export async function getAllProducts(): Promise<Product[]> {
  try {
    const q = query(collection(db, 'products'), where('status', 'in', ['active', 'out_of_stock']));
    const snap = await getDocs(q);
    const products: Product[] = [];
    snap.forEach((docSnap) => {
      products.push(mapDocToProduct(docSnap.data(), docSnap.id));
    });
    return products;
  } catch (err) {
    console.error('Error in getAllProducts:', err);
    return [];
  }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.rating >= 4.5).slice(0, 4);
}

export async function getTrendingProducts(limitCount = 4): Promise<Product[]> {
  const all = await getAllProducts();
  return all.sort((a, b) => b.reviewCount - a.reviewCount).slice(0, limitCount);
}

export async function getNewArrivals(limitCount = 4): Promise<Product[]> {
  const all = await getAllProducts();
  return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limitCount);
}

export async function getDiscountedProducts(): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.discountPrice !== undefined);
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter(
    (p) =>
      p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') ===
      categorySlug.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  );
}

export async function getProductsBySeller(username: string): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.seller.username === username);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const all = await getAllProducts();
  return all.find((p) => p.slug === slug || p.id === slug);
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const all = await getAllProducts();
  return all.filter((p) => ids.includes(p.id));
}

export async function getRelatedProducts(product: Product, limitCount = 4): Promise<Product[]> {
  const all = await getAllProducts();
  return all
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limitCount);
}

// ---------- Sellers ----------

export async function getSellerByUsername(username: string): Promise<Seller | undefined> {
  try {
    const q = query(collection(db, 'profiles'), where('username', '==', username));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      return mapDocToSeller(docSnap.data(), docSnap.id);
    }
  } catch (err) {
    console.error('Error fetching seller by username:', err);
  }
  return undefined;
}

export async function getAllSellers(): Promise<Seller[]> {
  try {
    const q = query(collection(db, 'profiles'), where('is_seller', '==', true));
    const snap = await getDocs(q);
    const sellers: Seller[] = [];
    snap.forEach((docSnap) => {
      sellers.push(mapDocToSeller(docSnap.data(), docSnap.id));
    });
    return sellers;
  } catch (err) {
    console.error('Error in getAllSellers:', err);
    return [];
  }
}

export async function getMyProducts(sellerId: string): Promise<Product[]> {
  try {
    const q = query(collection(db, 'products'), where('seller_id', '==', sellerId));
    const snap = await getDocs(q);
    const products: Product[] = [];
    snap.forEach((docSnap) => {
      products.push(mapDocToProduct(docSnap.data(), docSnap.id));
    });
    return products;
  } catch (err) {
    console.error('Error in getMyProducts:', err);
    return [];
  }
}
