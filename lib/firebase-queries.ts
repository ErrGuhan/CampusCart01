import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Category, Product, Seller, Review, ServiceGig, GigOrder, GigRequest,
  ProductRequest, RequestOffer, CommunityPost, CommunityComment,
  CampusEvent, ChatMessage, Conversation, NotificationItem,
} from './types';

// Default categories list for instant availability & seeding
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-handmade', name: 'Handmade', slug: 'handmade', icon: 'Hammer', productCount: 0 },
  { id: 'cat-art-design', name: 'Art & Design', slug: 'art-design', icon: 'Palette', productCount: 0 },
  { id: 'cat-electronics', name: 'Electronics', slug: 'electronics', icon: 'Cpu', productCount: 0 },
  { id: 'cat-digital', name: 'Digital Products', slug: 'digital', icon: 'Monitor', productCount: 0 },
  { id: 'cat-books', name: 'Books', slug: 'books', icon: 'BookOpen', productCount: 0 },
  { id: 'cat-fashion', name: 'Fashion', slug: 'fashion', icon: 'Shirt', productCount: 0 },
  { id: 'cat-accessories', name: 'Accessories', slug: 'accessories', icon: 'Watch', productCount: 0 },
  { id: 'cat-stationery', name: 'Stationery', slug: 'stationery', icon: 'PenTool', productCount: 0 },
  { id: 'cat-food', name: 'Food', slug: 'food', icon: 'Cookie', productCount: 0 },
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

export const DEFAULT_SELLERS: Seller[] = [
  {
    id: 'seller-guhan',
    username: 'guhan',
    displayName: 'Guhan M',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GuhanSVCET&backgroundColor=b6e3f4,c0aede',
    department: 'Computer Science & Engineering (CSE)',
    year: '4th Year (Final Year)',
    bio: 'Full-stack developer, IoT builder, and founder of CampusCart SVCET.',
    skills: ['Next.js', 'React', 'Python', 'IoT', 'UI/UX Design'],
    rating: 0,
    productCount: 0,
    joinedAt: '2024-01-10T00:00:00Z',
  },
];

export const DEFAULT_PRODUCTS: Product[] = [];


export const DEFAULT_GIGS: ServiceGig[] = [];

export const DEFAULT_GIG_REQUESTS: GigRequest[] = [];


// ---------- Reviews ----------

export async function getProductReviews(productId: string): Promise<Review[]> {
  const reviews: Review[] = [];
  try {
    const q = query(
      collection(db, 'reviews'),
      where('product_id', '==', productId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        reviews.push({
          id: docSnap.id,
          author: d.author || d.display_name || 'Student Buyer',
          authorAvatar: d.author_avatar || d.authorAvatar || '',
          rating: Number(d.rating) || 5,
          comment: d.comment || '',
          createdAt: d.created_at || d.createdAt || new Date().toISOString(),
          isVerifiedPurchase: d.is_verified_purchase ?? true,
        });
      });
    }
  } catch (err) {
    console.warn('Notice in getProductReviews from Firestore:', err);
  }

  // Merge client storage reviews
  if (typeof window !== 'undefined') {
    try {
      const localReviewsStr = localStorage.getItem(`campuscart_reviews_${productId}`);
      if (localReviewsStr) {
        const localReviews = JSON.parse(localReviewsStr);
        if (Array.isArray(localReviews)) {
          localReviews.forEach((r: Review) => {
            if (!reviews.some((ex) => ex.id === r.id)) {
              reviews.push(r);
            }
          });
        }
      }
    } catch {}
  }

  return reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addProductReview(
  productId: string,
  review: { author: string; authorAvatar?: string; rating: number; comment: string; userId?: string }
): Promise<Review> {
  const newReview: Review = {
    id: 'rev_' + Date.now(),
    author: review.author || 'Student Buyer',
    authorAvatar: review.authorAvatar || '',
    rating: Number(review.rating) || 5,
    comment: review.comment || '',
    createdAt: new Date().toISOString(),
    isVerifiedPurchase: true,
  };

  // 1. Client storage
  if (typeof window !== 'undefined') {
    try {
      const key = `campuscart_reviews_${productId}`;
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(newReview);
      localStorage.setItem(key, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('campuscart_review_updated', { detail: { productId, review: newReview } }));
    } catch {}
  }

  // 2. Firestore
  try {
    await setDoc(doc(db, 'reviews', newReview.id), {
      ...newReview,
      product_id: productId,
      user_id: review.userId || '',
    });
  } catch (err) {
    console.warn('Firestore addProductReview notice:', err);
  }

  return newReview;
}

// ---------- Freelance Gigs & Services ----------

function mapDocToGig(data: any, id: string): ServiceGig {
  const seller: Seller = {
    id: data.seller_id || data.sellerId || 'seller',
    username: data.sellerUsername || data.seller_username || 'creator',
    displayName: data.sellerName || data.seller_name || 'Student Freelancer',
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

export async function getAllGigsAdmin(): Promise<ServiceGig[]> {
  const gigMap = new Map<string, ServiceGig>();

  // 1. Initial base gigs
  DEFAULT_GIGS.forEach((g) => gigMap.set(g.id, g));

  // 2. Fetch from Firestore
  try {
    const snap = await getDocs(collection(db, 'gigs'));
    if (!snap.empty) {
      snap.forEach((docSnap) => {
        const gig = mapDocToGig(docSnap.data(), docSnap.id);
        gigMap.set(gig.id, gig);
      });
    }
  } catch (err) {
    console.warn('Notice in getAllGigsAdmin from Firestore:', err);
  }

  // 3. Merge locally created gigs
  if (typeof window !== 'undefined') {
    try {
      const localGigsStr = localStorage.getItem('campuscart_gigs');
      if (localGigsStr) {
        const localGigs = JSON.parse(localGigsStr);
        if (Array.isArray(localGigs)) {
          localGigs.forEach((g: ServiceGig) => {
            if (g.id) gigMap.set(g.id, g);
          });
        }
      }
    } catch {}
  }

  return Array.from(gigMap.values());
}

export async function getAllGigs(): Promise<ServiceGig[]> {
  const all = await getAllGigsAdmin();
  return all.filter((g) => g.status === 'active');
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
  const all = await getAllGigs();
  return all.filter((g) => g.sellerId === sellerId || g.seller?.id === sellerId);
}

// ---------- Campus Bounties / Service Requests ----------

export async function getAllGigRequests(): Promise<GigRequest[]> {
  const reqMap = new Map<string, GigRequest>();

  // 1. Base bounties
  DEFAULT_GIG_REQUESTS.forEach((r) => reqMap.set(r.id, r));

  // 2. Fetch from Firestore
  try {
    const q = query(collection(db, 'gig_requests'), where('status', '==', 'open'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        const req: GigRequest = {
          id: docSnap.id,
          requesterId: d.requester_id || d.requesterId,
          requesterName: d.requester_name || d.requesterName || 'Student',
          requesterEmail: d.requester_email || d.requesterEmail || '',
          title: d.title || 'Student Project Assistance',
          description: d.description || '',
          category: d.category || 'General',
          budget: Number(d.budget) || 100,
          deadlineDays: Number(d.deadline_days || d.deadlineDays) || 3,
          status: d.status || 'open',
          proposalsCount: Number(d.proposals_count || d.proposalsCount) || 0,
          createdAt: d.created_at || new Date().toISOString(),
        };
        reqMap.set(req.id, req);
      });
    }
  } catch (err) {
    console.warn('Notice in getAllGigRequests:', err);
  }

  // 3. Merge locally posted bounties from client session
  if (typeof window !== 'undefined') {
    try {
      const localBountiesStr = localStorage.getItem('campuscart_gig_requests');
      if (localBountiesStr) {
        const localBounties = JSON.parse(localBountiesStr);
        if (Array.isArray(localBounties)) {
          localBounties.forEach((b: GigRequest) => {
            if (b.id) reqMap.set(b.id, b);
          });
        }
      }
    } catch {}
  }

  return Array.from(reqMap.values());
}

export async function getGigsBySeller(username: string): Promise<ServiceGig[]> {
  const all = await getAllGigs();
  return all.filter((g) => g.seller?.username?.toLowerCase() === username.toLowerCase());
}

// ---------- Products & Mappers ----------

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
    rating: stats?.rating ?? data.rating ?? 5.0,
    productCount: stats?.productCount ?? data.productCount ?? 1,
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
    rating: Number(data.rating) || 5.0,
    reviewCount: Number(data.review_count ?? data.reviewCount) || 0,
    seller,
    pickupAvailable: data.pickup_available ?? data.pickupAvailable ?? true,
    deliveryAvailable: data.delivery_available ?? data.deliveryAvailable ?? false,
    isDigital: data.is_digital ?? data.isDigital ?? false,
    digitalFileUrl: data.digital_file_url ?? data.digitalFileUrl ?? '',
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    isVerified: data.is_verified ?? data.isVerified ?? false,
    rejectionReason: data.rejection_reason || data.rejectionReason,
  };
}

// ---------- Categories ----------

// ---------- Categories ----------

export async function getCategories(): Promise<Category[]> {
  let baseCats = DEFAULT_CATEGORIES;
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
          productCount: 0,
        });
      });
      if (cats.length > 0) baseCats = cats;
    }
  } catch (err) {
    console.warn('Firestore getCategories notice:', err);
  }

  try {
    const [products, gigs] = await Promise.all([getAllProducts(), getAllGigs()]);
    return baseCats.map((cat) => {
      const catSlug = cat.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const catName = cat.name.toLowerCase();

      let count = 0;
      if (catSlug === 'services' || catName === 'services') {
        count = gigs.length;
      } else {
        count = products.filter((p) => {
          const pCatSlug = (p.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const pCatName = (p.category || '').toLowerCase();
          return pCatSlug === catSlug || pCatName === catName;
        }).length;
      }

      return {
        ...cat,
        productCount: count,
      };
    });
  } catch {
    return baseCats;
  }
}

// ---------- Products (All / Admin / Public) ----------

export async function getAllProductsAdmin(): Promise<Product[]> {
  const prodMap = new Map<string, Product>();

  // 1. Base verified catalog
  DEFAULT_PRODUCTS.forEach((p) => prodMap.set(p.id, { ...p }));

  // 2. Fetch from Firestore
  try {
    const snap = await getDocs(collection(db, 'products'));
    if (!snap.empty) {
      snap.forEach((docSnap) => {
        const prod = mapDocToProduct(docSnap.data(), docSnap.id);
        prodMap.set(prod.id, prod);
      });
    }
  } catch (err) {
    console.warn('Notice in getAllProductsAdmin:', err);
  }

  // 3. Merge locally created/edited products
  if (typeof window !== 'undefined') {
    try {
      const localProdsStr = localStorage.getItem('campuscart_products');
      if (localProdsStr) {
        const localProds = JSON.parse(localProdsStr);
        if (Array.isArray(localProds)) {
          localProds.forEach((p: Product) => {
            if (p.id) prodMap.set(p.id, p);
          });
        }
      }
    } catch {}
  }

  const products = Array.from(prodMap.values());

  // 4. Attach dynamically computed reviews & ratings to every product from client session
  if (typeof window !== 'undefined') {
    products.forEach((p) => {
      try {
        const key = `campuscart_reviews_${p.id}`;
        const raw = localStorage.getItem(key);
        if (raw) {
          const list: Review[] = JSON.parse(raw);
          if (Array.isArray(list) && list.length > 0) {
            p.reviewCount = list.length;
            const sum = list.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
            p.rating = Number((sum / list.length).toFixed(1));
          }
        }
      } catch {}
    });
  }

  return products;
}

export async function getAllProducts(): Promise<Product[]> {
  const all = await getAllProductsAdmin();
  return all.filter((p) => p.status === 'active' || p.status === 'out_of_stock');
}

export async function approveProduct(productId: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('campuscart_products');
      if (raw) {
        let list: Product[] = JSON.parse(raw);
        list = list.map((p) =>
          p.id === productId
            ? { ...p, status: 'active', isVerified: true, rejectionReason: undefined }
            : p
        );
        localStorage.setItem('campuscart_products', JSON.stringify(list));
      }
      window.dispatchEvent(new CustomEvent('campuscart_product_updated'));
    } catch {}
  }

  try {
    await setDoc(
      doc(db, 'products', productId),
      { status: 'active', is_verified: true, rejection_reason: null },
      { merge: true }
    );
  } catch (e) {
    console.warn('Firestore approveProduct notice:', e);
  }
  return true;
}

export async function rejectProduct(productId: string, reason = 'Product details need revision before marketplace approval.'): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('campuscart_products');
      if (raw) {
        let list: Product[] = JSON.parse(raw);
        list = list.map((p) =>
          p.id === productId
            ? { ...p, status: 'rejected', isVerified: false, rejectionReason: reason }
            : p
        );
        localStorage.setItem('campuscart_products', JSON.stringify(list));
      }
      window.dispatchEvent(new CustomEvent('campuscart_product_updated'));
    } catch {}
  }

  try {
    await setDoc(
      doc(db, 'products', productId),
      { status: 'rejected', is_verified: false, rejection_reason: reason },
      { merge: true }
    );
  } catch (e) {
    console.warn('Firestore rejectProduct notice:', e);
  }
  return true;
}

export async function approveGig(gigId: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('campuscart_gigs');
      if (raw) {
        let list: ServiceGig[] = JSON.parse(raw);
        list = list.map((g) =>
          g.id === gigId
            ? { ...g, status: 'active', isVerified: true, rejectionReason: undefined }
            : g
        );
        localStorage.setItem('campuscart_gigs', JSON.stringify(list));
      }
      window.dispatchEvent(new CustomEvent('campuscart_gig_updated'));
    } catch {}
  }

  try {
    await setDoc(
      doc(db, 'gigs', gigId),
      { status: 'active', is_verified: true, rejection_reason: null },
      { merge: true }
    );
  } catch (e) {
    console.warn('Firestore approveGig notice:', e);
  }
  return true;
}

export async function rejectGig(gigId: string, reason = 'Freelance gig details need revision.'): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('campuscart_gigs');
      if (raw) {
        let list: ServiceGig[] = JSON.parse(raw);
        list = list.map((g) =>
          g.id === gigId
            ? { ...g, status: 'rejected', isVerified: false, rejectionReason: reason }
            : g
        );
        localStorage.setItem('campuscart_gigs', JSON.stringify(list));
      }
      window.dispatchEvent(new CustomEvent('campuscart_gig_updated'));
    } catch {}
  }

  try {
    await setDoc(
      doc(db, 'gigs', gigId),
      { status: 'rejected', is_verified: false, rejection_reason: reason },
      { merge: true }
    );
  } catch (e) {
    console.warn('Firestore rejectGig notice:', e);
  }
  return true;
}

export async function getFeaturedProducts(limitCount = 4): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.isVerified || p.inventory > 0).slice(0, limitCount);
}

export async function getTrendingProducts(limitCount = 4): Promise<Product[]> {
  const all = await getAllProducts();
  return all.sort((a, b) => {
    if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }).slice(0, limitCount);
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
  return all.filter((p) => p.seller.username.toLowerCase() === username.toLowerCase());
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const all = await getAllProducts();
  const prod = all.find((p) => p.slug === slug || p.id === slug);
  if (prod) {
    const reviews = await getProductReviews(prod.id);
    if (reviews.length > 0) {
      prod.reviewCount = reviews.length;
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      prod.rating = Number((sum / reviews.length).toFixed(1));
    } else {
      prod.reviewCount = 0;
      prod.rating = 0;
    }
  }
  return prod;
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

export async function getAllSellers(): Promise<Seller[]> {
  const sellersMap = new Map<string, Seller>();

  // 1. Founding verified creator (Guhan M)
  sellersMap.set(DEFAULT_SELLERS[0].username.toLowerCase(), { ...DEFAULT_SELLERS[0] });

  // 2. Query Firestore profiles for registered sellers
  try {
    const q = query(collection(db, 'profiles'), where('is_seller', '==', true));
    const snap = await getDocs(q);
    if (!snap.empty) {
      snap.forEach((docSnap) => {
        const s = mapDocToSeller(docSnap.data(), docSnap.id);
        if (s.username) {
          sellersMap.set(s.username.toLowerCase(), s);
        }
      });
    }
  } catch (err) {
    console.warn('Notice in getAllSellers:', err);
  }

  // 3. Include any locally registered/logged-in sellers from client session
  if (typeof window !== 'undefined') {
    try {
      const authProfileStr = localStorage.getItem('campuscart_auth_profile');
      if (authProfileStr) {
        const p = JSON.parse(authProfileStr);
        if (p?.is_seller && p?.username) {
          sellersMap.set(p.username.toLowerCase(), {
            id: p.id || 'seller-' + p.username,
            username: p.username,
            displayName: p.display_name || p.username,
            avatar: p.avatar_url || '',
            department: p.department || 'SVCET Student',
            year: p.year || 'Student',
            bio: p.bio || 'Student Creator building on CampusCart.',
            skills: Array.isArray(p.skills) && p.skills.length > 0 ? p.skills : ['Campus Seller', 'Student Creator'],
            rating: 0,
            productCount: 0,
            joinedAt: p.created_at || new Date().toISOString(),
          });
        }
      }

      const registeredAccsStr = localStorage.getItem('campuscart_registered_accounts');
      if (registeredAccsStr) {
        const accs = JSON.parse(registeredAccsStr);
        if (Array.isArray(accs)) {
          accs.forEach((acc: any) => {
            const p = acc.profile;
            if (p?.is_seller && p?.username) {
              sellersMap.set(p.username.toLowerCase(), {
                id: p.id || 'seller-' + p.username,
                username: p.username,
                displayName: p.display_name || p.username,
                avatar: p.avatar_url || '',
                department: p.department || 'SVCET Student',
                year: p.year || 'Student',
                bio: p.bio || 'Student Creator building on CampusCart.',
                skills: Array.isArray(p.skills) && p.skills.length > 0 ? p.skills : ['Campus Seller', 'Student Creator'],
                rating: 0,
                productCount: 0,
                joinedAt: p.created_at || new Date().toISOString(),
              });
            }
          });
        }
      }
    } catch {}
  }

  const allSellers = Array.from(sellersMap.values());

  // Dynamically compute real productCount and average rating for each seller
  try {
    const [allProducts, allGigs] = await Promise.all([getAllProducts(), getAllGigs()]);
    return allSellers.map((seller) => {
      const u = seller.username.toLowerCase();
      const sId = seller.id;
      const isGuhan = u.includes('guhan') || sId === 'seller-guhan';

      const sProducts = allProducts.filter((p) => {
        const pU = (p.seller?.username || '').toLowerCase();
        const pId = p.seller?.id || '';
        return pId === sId || pU === u || (isGuhan && (pU === 'guhan' || pId === 'seller-guhan'));
      });

      const sGigs = allGigs.filter((g) => {
        const gU = (g.seller?.username || '').toLowerCase();
        const gId = g.sellerId || g.seller?.id || '';
        return gId === sId || gU === u || (isGuhan && (gU === 'guhan' || gId === 'seller-guhan'));
      });

      const totalItems = sProducts.length + sGigs.length;
      const ratedItems = [...sProducts, ...sGigs].filter((i) => i.reviewCount > 0 && i.rating > 0);
      const avgRating =
        ratedItems.length > 0
          ? Number((ratedItems.reduce((acc, i) => acc + i.rating, 0) / ratedItems.length).toFixed(1))
          : 0;

      return {
        ...seller,
        productCount: totalItems,
        rating: avgRating,
      };
    });
  } catch {
    return allSellers;
  }
}

export async function getSellerByUsername(username: string): Promise<Seller | undefined> {
  const all = await getAllSellers();
  return all.find((s) => s.username.toLowerCase() === username.toLowerCase());
}

export async function getMyProducts(sellerId: string): Promise<Product[]> {
  try {
    const q = query(collection(db, 'products'), where('seller_id', '==', sellerId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const products: Product[] = [];
      snap.forEach((docSnap) => {
        products.push(mapDocToProduct(docSnap.data(), docSnap.id));
      });
      return products;
    }
  } catch (err) {
    console.warn('Notice in getMyProducts:', err);
  }
  return [];
}

// ---------- Used & Deals Queries ----------

export async function getUsedProducts(): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.isUsed || (p.tags && p.tags.some((t) => ['used', 'second-hand', 'preowned'].includes(t.toLowerCase()))));
}

export async function getDealsProducts(): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => (p.discountPrice !== undefined && p.discountPrice < p.price) || p.price <= 199);
}

// ---------- Product Requests ("What I Need") ----------

export const DEFAULT_REQUESTS: ProductRequest[] = [];


export async function getAllProductRequests(): Promise<ProductRequest[]> {
  const reqMap = new Map<string, ProductRequest>();
  DEFAULT_REQUESTS.forEach((r) => reqMap.set(r.id, { ...r }));

  try {
    const snap = await getDocs(collection(db, 'product_requests'));
    if (!snap.empty) {
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        const offers = Array.isArray(d.offers) ? d.offers : [];
        reqMap.set(docSnap.id, {
          id: docSnap.id,
          requesterId: d.requester_id || d.requesterId,
          requesterName: d.requester_name || d.requesterName,
          requesterUsername: d.requester_username || d.requesterUsername,
          requesterAvatar: d.requester_avatar || d.requesterAvatar,
          requesterDepartment: d.requester_department || d.requesterDepartment,
          requesterYear: d.requester_year || d.requesterYear,
          title: d.title,
          description: d.description,
          category: d.category,
          budget: Number(d.budget) || 0,
          deadlineDate: d.deadline_date || d.deadlineDate,
          status: d.status || 'open',
          offersCount: offers.length,
          createdAt: d.created_at || d.createdAt,
          offers,
        });
      });
    }
  } catch (e) {
    console.warn('Firestore getAllProductRequests notice:', e);
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('campuscart_requests');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((r: ProductRequest) => {
            if (r.id) {
              const count = Array.isArray(r.offers) ? r.offers.length : Number(r.offersCount) || 0;
              reqMap.set(r.id, { ...r, offersCount: count });
            }
          });
        }
      }
    } catch {}
  }

  return Array.from(reqMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createProductRequest(req: Omit<ProductRequest, 'id' | 'createdAt' | 'offersCount' | 'status'>): Promise<ProductRequest> {
  const newReq: ProductRequest = {
    ...req,
    id: 'req_' + Date.now(),
    status: 'open',
    offersCount: 0,
    createdAt: new Date().toISOString(),
    offers: [],
  };

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('campuscart_requests');
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(newReq);
      localStorage.setItem('campuscart_requests', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('campuscart_request_updated'));
    } catch {}
  }

  try {
    await setDoc(doc(db, 'product_requests', newReq.id), newReq);
  } catch (e) {
    console.warn('Firestore createProductRequest notice:', e);
  }

  return newReq;
}

export async function addRequestOffer(requestId: string, offer: Omit<RequestOffer, 'id' | 'createdAt' | 'status'>): Promise<RequestOffer> {
  const newOffer: RequestOffer = {
    ...offer,
    id: 'off_' + Date.now(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('campuscart_requests');
      let list: ProductRequest[] = raw ? JSON.parse(raw) : [];
      list = list.map((r) => {
        if (r.id === requestId) {
          const offers = r.offers ? [...r.offers, newOffer] : [newOffer];
          return { ...r, offers, offersCount: offers.length, status: 'offers_received' };
        }
        return r;
      });
      localStorage.setItem('campuscart_requests', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('campuscart_request_updated'));
    } catch {}
  }

  return newOffer;
}

// ---------- Campus Community & Posts ----------

export const DEFAULT_COMMUNITY_POSTS: CommunityPost[] = [];


export async function getCommunityPosts(category?: string): Promise<CommunityPost[]> {
  const postsMap = new Map<string, CommunityPost>();
  DEFAULT_COMMUNITY_POSTS.forEach((p) => postsMap.set(p.id, { ...p }));

  try {
    const snap = await getDocs(collection(db, 'community_posts'));
    if (!snap.empty) {
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        postsMap.set(docSnap.id, {
          id: docSnap.id,
          authorId: d.author_id || d.authorId,
          authorName: d.author_name || d.authorName,
          authorUsername: d.author_username || d.authorUsername,
          authorAvatar: d.author_avatar || d.authorAvatar,
          authorDepartment: d.author_department || d.authorDepartment,
          category: d.category,
          title: d.title,
          content: d.content,
          tags: Array.isArray(d.tags) ? d.tags : [],
          likes: Number(d.likes) || 0,
          likedBy: d.liked_by || d.likedBy || [],
          commentsCount: Number(d.comments_count || d.commentsCount) || 0,
          createdAt: d.created_at || d.createdAt,
        });
      });
    }
  } catch (e) {
    console.warn('Firestore getCommunityPosts notice:', e);
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('campuscart_community_posts');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((p: CommunityPost) => {
            if (p.id) postsMap.set(p.id, p);
          });
        }
      }
    } catch {}
  }

  let result = Array.from(postsMap.values());
  if (category && category !== 'all') {
    result = result.filter((p) => p.category === category);
  }

  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createCommunityPost(post: Omit<CommunityPost, 'id' | 'likes' | 'commentsCount' | 'createdAt'>): Promise<CommunityPost> {
  const newPost: CommunityPost = {
    ...post,
    id: 'post_' + Date.now(),
    likes: 0,
    commentsCount: 0,
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('campuscart_community_posts');
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(newPost);
      localStorage.setItem('campuscart_community_posts', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('campuscart_community_updated'));
    } catch {}
  }

  try {
    await setDoc(doc(db, 'community_posts', newPost.id), newPost);
  } catch (e) {
    console.warn('Firestore createCommunityPost notice:', e);
  }

  return newPost;
}

export async function likeCommunityPost(postId: string, userId: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('campuscart_community_posts');
      let list: CommunityPost[] = raw ? JSON.parse(raw) : [];
      list = list.map((p) => {
        if (p.id === postId) {
          const liked = p.likedBy?.includes(userId);
          const likedBy = liked ? p.likedBy?.filter((u) => u !== userId) : [...(p.likedBy || []), userId];
          return { ...p, likes: liked ? Math.max(0, p.likes - 1) : p.likes + 1, likedBy };
        }
        return p;
      });
      localStorage.setItem('campuscart_community_posts', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('campuscart_community_updated'));
    } catch {}
  }
  return true;
}

// ---------- Campus Events ----------

export const DEFAULT_EVENTS: CampusEvent[] = [];


export async function getCampusEvents(category?: string): Promise<CampusEvent[]> {
  const eventsMap = new Map<string, CampusEvent>();
  DEFAULT_EVENTS.forEach((e) => eventsMap.set(e.id, e));

  try {
    const snap = await getDocs(collection(db, 'campus_events'));
    if (!snap.empty) {
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        eventsMap.set(docSnap.id, {
          id: docSnap.id,
          title: d.title,
          category: d.category,
          description: d.description,
          date: d.date,
          time: d.time,
          venue: d.venue,
          organizer: d.organizer,
          organizerClub: d.organizer_club || d.organizerClub,
          registrationUrl: d.registration_url || d.registrationUrl,
          image: d.image,
          price: Number(d.price) || 0,
          registeredCount: Number(d.registered_count || d.registeredCount) || 0,
          createdAt: d.created_at || d.createdAt,
        });
      });
    }
  } catch (e) {
    console.warn('Firestore getCampusEvents notice:', e);
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('campuscart_events');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((e: CampusEvent) => {
            if (e.id) eventsMap.set(e.id, e);
          });
        }
      }
    } catch {}
  }

  let result = Array.from(eventsMap.values());
  if (category && category !== 'all') {
    result = result.filter((e) => e.category === category);
  }
  return result;
}

// ---------- Messaging System ----------

export async function getConversations(userId: string): Promise<Conversation[]> {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('campuscart_conversations');
      if (raw) {
        const list: Conversation[] = JSON.parse(raw);
        return list.filter((c) => c.participantIds.includes(userId));
      }
    } catch {}
  }
  return [];
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`campuscart_msgs_${conversationId}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
  }
  return [];
}

export async function sendChatMessage(msg: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
  const newMsg: ChatMessage = {
    ...msg,
    id: 'msg_' + Date.now(),
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      // 1. Append to message thread
      const key = `campuscart_msgs_${msg.conversationId}`;
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      list.push(newMsg);
      localStorage.setItem(key, JSON.stringify(list));

      // 2. Update conversation list
      const convRaw = localStorage.getItem('campuscart_conversations');
      let convList: Conversation[] = convRaw ? JSON.parse(convRaw) : [];
      const convIndex = convList.findIndex((c) => c.id === msg.conversationId);
      if (convIndex >= 0) {
        convList[convIndex].lastMessage = msg.text;
        convList[convIndex].lastMessageTimestamp = newMsg.createdAt;
      }
      localStorage.setItem('campuscart_conversations', JSON.stringify(convList));

      window.dispatchEvent(new CustomEvent('campuscart_message_sent', { detail: newMsg }));
    } catch {}
  }

  return newMsg;
}

// ---------- Notifications ----------

export async function getNotifications(userId: string): Promise<NotificationItem[]> {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`campuscart_notifs_${userId}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
  }
  return [
    {
      id: 'notif-welcome',
      userId,
      title: 'Welcome to CampusCart! 🎓',
      message: 'Explore student creations, post freelance gigs, and connect with campus peers.',
      type: 'announcement',
      link: '/marketplace',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
  ];
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`campuscart_notifs_${userId}`);
      if (raw) {
        let list: NotificationItem[] = JSON.parse(raw);
        list = list.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n));
        localStorage.setItem(`campuscart_notifs_${userId}`, JSON.stringify(list));
      }
    } catch {}
  }
}
