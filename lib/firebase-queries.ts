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

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-hardware', name: 'Hardware & Tools', slug: 'hardware', icon: 'Cpu', productCount: 0 },
  { id: 'cat-digital-assets', name: 'Digital Assets & Code', slug: 'digital-assets', icon: 'Monitor', productCount: 0 },
  { id: 'cat-course-notes', name: 'Course Notes & Guides', slug: 'course-notes', icon: 'BookOpen', productCount: 0 },
  { id: 'cat-components', name: 'Component Parts & DIY', slug: 'components', icon: 'Hammer', productCount: 0 },
  { id: 'cat-design-templates', name: 'Design Templates', slug: 'design-templates', icon: 'Palette', productCount: 0 },
  { id: 'cat-study-gear', name: 'Lab & Study Gear', slug: 'study-gear', icon: 'Backpack', productCount: 0 },
  { id: 'cat-blueprints', name: 'Project Blueprints', slug: 'blueprints', icon: 'PenTool', productCount: 0 },
  { id: 'cat-prototypes', name: 'App Prototypes', slug: 'prototypes', icon: 'Shirt', productCount: 0 },
  { id: 'cat-media-audio', name: 'Audio & Media', slug: 'media-audio', icon: 'Watch', productCount: 0 },
  { id: 'cat-hostel-essentials', name: 'Hostel Essentials', slug: 'hostel-essentials', icon: 'Cookie', productCount: 0 },
  { id: 'cat-services', name: 'Services & Gigs', slug: 'services', icon: 'Wrench', productCount: 0 },
  { id: 'cat-other-innovations', name: 'Other Innovations', slug: 'other-innovations', icon: 'Package', productCount: 0 },
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

export const DEFAULT_SELLERS: Seller[] = [];

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

export async function getMyGigs(sellerId: string, username?: string): Promise<ServiceGig[]> {
  const all = await getAllGigsAdmin();
  const u = username?.toLowerCase() || '';
  const isGuhan = u.includes('guhan') || sellerId === 'seller-guhan';
  return all.filter((g) => {
    const gSellerId = g.sellerId || g.seller?.id || '';
    const gUser = (g.seller?.username || '').toLowerCase();
    return (
      gSellerId === sellerId ||
      (u && gUser === u) ||
      (isGuhan && (gUser === 'guhan' || gSellerId === 'seller-guhan'))
    );
  });
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
  const cleanU = (username || '').toLowerCase().trim();
  return all.filter((g) => {
    const gUser = (g.seller?.username || '').toLowerCase().trim();
    const gId = (g.sellerId || g.seller?.id || '').toLowerCase().trim();
    return gUser === cleanU || gId === cleanU;
  });
}

// ---------- Products & Mappers ----------

export function isUserAdmin(d: any): boolean {
  if (!d) return false;
  const email = (d.email || '').toLowerCase().trim();
  const role = (d.role || '').toLowerCase().trim();
  const username = (d.username || '').toLowerCase().trim();
  const displayName = (d.display_name || d.displayName || '').toLowerCase().trim();
  const id = (d.id || '').toLowerCase().trim();
  const bio = (d.bio || '').toLowerCase().trim();

  return (
    role === 'admin' ||
    d.isAdmin === true ||
    d.is_admin === true ||
    email === 'guhan24td0781@svcet.ac.in' ||
    email.includes('guhan24td0781') ||
    username === 'guhan' ||
    username === 'guhan24td0781' ||
    id === 'seller-guhan' ||
    displayName.includes('guhan murugaiyan') ||
    bio.includes('platform administrator') ||
    bio.includes('founder & platform administrator')
  );
}

export function mapDocToSeller(data: any, id: string, stats?: { rating?: number; productCount?: number }): Seller {
  const isAdmin = isUserAdmin(data);

  const cleanUsername = (data.username || (isAdmin ? 'guhan' : data.email?.split('@')[0] || 'student'))
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');

  return {
    id: id || data.id || 'seller-' + cleanUsername,
    username: cleanUsername,
    displayName: data.display_name || data.displayName || (isAdmin ? 'Guhan Murugaiyan' : 'Student Creator'),
    avatar:
      data.avatar_url ||
      data.avatarUrl ||
      data.avatar ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanUsername)}&backgroundColor=b6e3f4,c0aede`,
    department: data.department || (isAdmin ? 'Computer Science & Engineering (CSE)' : 'Engineering'),
    year: data.year || (isAdmin ? '4th Year (Final Year)' : 'Student'),
    bio: data.bio || (isAdmin ? 'Founder & Platform Administrator of CampusCart SVCET.' : 'Student creator building on CampusCart.'),
    skills: Array.isArray(data.skills) && data.skills.length > 0 ? data.skills : (isAdmin ? ['Next.js', 'React', 'Python', 'Platform Admin'] : ['Campus Seller']),
    rating: typeof stats?.rating === 'number' ? stats.rating : typeof data.rating === 'number' ? data.rating : 0,
    productCount: typeof stats?.productCount === 'number' ? stats.productCount : typeof data.productCount === 'number' ? data.productCount : 0,
    joinedAt: data.created_at || data.createdAt || data.joinedAt || new Date().toISOString(),
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

  const rawSeller = data.seller || {};
  const sellerId = rawSeller.id || data.seller_id || data.sellerId || 'seller';
  const sellerUsername = (rawSeller.username || data.sellerUsername || data.seller_username || 'creator').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const sellerDisplayName = rawSeller.displayName || rawSeller.display_name || data.sellerName || data.seller_name || 'Campus Creator';
  const sellerAvatar = rawSeller.avatar || rawSeller.avatar_url || data.sellerAvatar || data.seller_avatar || '';
  const sellerDept = rawSeller.department || data.sellerDepartment || data.seller_department || '';
  const sellerYear = rawSeller.year || data.sellerYear || data.seller_year || '';
  const sellerBio = rawSeller.bio || data.sellerBio || data.seller_bio || '';

  const seller: Seller = sellerData || {
    id: sellerId,
    username: sellerUsername,
    displayName: sellerDisplayName,
    avatar: sellerAvatar,
    department: sellerDept,
    year: sellerYear,
    bio: sellerBio,
    skills: Array.isArray(rawSeller.skills) ? rawSeller.skills : [],
    rating: Number(rawSeller.rating ?? data.rating) || 5.0,
    productCount: Number(rawSeller.productCount) || 1,
    joinedAt: rawSeller.joinedAt || data.created_at || new Date().toISOString(),
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

  // 4. Enrich & synchronize seller details with live profiles from Firestore and local cache
  try {
    const profileMap = new Map<string, any>();
    if (typeof window !== 'undefined') {
      try {
        const storedFallback = localStorage.getItem('campuscart_fallback_user');
        if (storedFallback) {
          const parsed = JSON.parse(storedFallback);
          if (parsed?.profile) {
            const p = parsed.profile;
            const uid = p.id || parsed?.user?.uid;
            if (uid) profileMap.set(uid.toLowerCase(), p);
            if (p.username) profileMap.set(p.username.toLowerCase(), p);
            if (p.email) profileMap.set(p.email.toLowerCase(), p);
          }
        }
      } catch {}
    }

    try {
      const pSnap = await getDocs(collection(db, 'profiles'));
      if (!pSnap.empty) {
        pSnap.forEach((docSnap) => {
          const d = docSnap.data();
          const uid = docSnap.id.toLowerCase();
          profileMap.set(uid, d);
          if (d.username) profileMap.set(d.username.toLowerCase(), d);
          if (d.email) profileMap.set(d.email.toLowerCase(), d);
        });
      }
    } catch {}

    if (profileMap.size > 0) {
      products.forEach((prod) => {
        const sId = (prod.seller?.id || '').toLowerCase();
        const sUser = (prod.seller?.username || '').toLowerCase();
        const liveProfile = profileMap.get(sId) || profileMap.get(sUser);
        if (liveProfile && prod.seller) {
          const liveName = liveProfile.display_name || liveProfile.displayName;
          const liveAvatar = liveProfile.avatar_url || liveProfile.avatarUrl || liveProfile.avatar;
          const liveDept = liveProfile.department;
          const liveYear = liveProfile.year;
          const liveBio = liveProfile.bio;
          const liveUsername = liveProfile.username;

          if (liveName) prod.seller.displayName = liveName;
          if (liveAvatar) prod.seller.avatar = liveAvatar;
          if (liveDept) prod.seller.department = liveDept;
          if (liveYear) prod.seller.year = liveYear;
          if (liveBio) prod.seller.bio = liveBio;
          if (liveUsername) prod.seller.username = liveUsername.toLowerCase();
        }
      });
    }
  } catch {}

  // 5. Attach dynamically computed reviews & ratings to every product from client session
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
  const cleanU = (username || '').toLowerCase().trim();
  return all.filter((p) => {
    const pU = (p.seller?.username || '').toLowerCase().trim();
    const pId = (p.seller?.id || '').toLowerCase().trim();
    return pU === cleanU || pId === cleanU;
  });
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

// ---------- Sellers / Creators ----------

export async function getAllSellers(): Promise<Seller[]> {
  const sellersMap = new Map<string, Seller>();

  // 1. Query Firestore profiles for registered accounts
  try {
    const snap = await getDocs(collection(db, 'profiles'));
    if (!snap.empty) {
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        // Exclude admin from public student creators list
        if (isUserAdmin(d) || isUserAdmin({ ...d, id: docSnap.id })) {
          return;
        }
        if (d.display_name || d.displayName || d.email || d.username) {
          const s = mapDocToSeller(d, docSnap.id);
          // Canonical key by email or username to ensure 0 duplicates
          const canonicalKey = (d.email || s.username || s.id).toLowerCase();
          sellersMap.set(canonicalKey, s);
        }
      });
    }
  } catch (err) {
    console.warn('Notice in getAllSellers Firestore query:', err);
  }

  // 2. Include any active logged-in user from client session if not already present and not admin
  if (typeof window !== 'undefined') {
    try {
      const storedFallback = localStorage.getItem('campuscart_fallback_user');
      if (storedFallback) {
        const parsed = JSON.parse(storedFallback);
        const p = parsed?.profile;
        if (p && !isUserAdmin(p) && !isUserAdmin(parsed?.user) && (p.display_name || p.email || p.username)) {
          const s = mapDocToSeller(p, p.id || parsed?.user?.uid || 'seller-user');
          const canonicalKey = (p.email || s.username || s.id).toLowerCase();
          if (!sellersMap.has(canonicalKey)) {
            sellersMap.set(canonicalKey, s);
          }
        }
      }
    } catch {}
  }

  const allSellers = Array.from(sellersMap.values()).filter((s) => !isUserAdmin(s));

  // Dynamically compute real productCount and average rating for each seller
  try {
    const [allProducts, allGigs] = await Promise.all([getAllProductsAdmin(), getAllGigsAdmin()]);
    return allSellers.map((seller) => {
      const u = seller.username.toLowerCase();
      const sId = seller.id;

      const sProducts = allProducts.filter((p) => {
        const pU = (p.seller?.username || '').toLowerCase();
        const pId = p.seller?.id || '';
        return pId === sId || (u && pU === u);
      });

      const sGigs = allGigs.filter((g) => {
        const gU = (g.seller?.username || '').toLowerCase();
        const gId = g.sellerId || g.seller?.id || '';
        return gId === sId || (u && gU === u);
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
  const cleanU = (username || '').toLowerCase().trim();
  const all = await getAllSellers();
  const found = all.find((s) => s.username.toLowerCase() === cleanU);
  if (found) return found;

  // Direct lookup for specific user profile in Firestore
  try {
    const snap = await getDocs(collection(db, 'profiles'));
    for (const docSnap of snap.docs) {
      const d = docSnap.data();
      const u = (d.username || d.email?.split('@')[0] || '').toLowerCase().trim();
      if (u === cleanU || docSnap.id.toLowerCase() === cleanU) {
        return mapDocToSeller(d, docSnap.id);
      }
    }
  } catch {}
  return undefined;
}

export async function getMyProducts(sellerId: string, username?: string): Promise<Product[]> {
  const all = await getAllProductsAdmin();
  const u = username?.toLowerCase() || '';
  const isGuhan = u.includes('guhan') || sellerId === 'seller-guhan';
  return all.filter((p) => {
    const pSellerId = p.seller?.id || '';
    const pUser = (p.seller?.username || '').toLowerCase();
    return (
      pSellerId === sellerId ||
      (u && pUser === u) ||
      (isGuhan && (pUser === 'guhan' || pSellerId === 'seller-guhan'))
    );
  });
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

  let targetReq: ProductRequest | undefined;

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('campuscart_requests');
      let list: ProductRequest[] = raw ? JSON.parse(raw) : [];
      list = list.map((r) => {
        if (r.id === requestId) {
          targetReq = r;
          const offers = r.offers ? [...r.offers, newOffer] : [newOffer];
          return { ...r, offers, offersCount: offers.length, status: 'offers_received' };
        }
        return r;
      });
      localStorage.setItem('campuscart_requests', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('campuscart_request_updated'));
    } catch {}
  }

  // Update in Firestore
  try {
    const docRef = doc(db, 'product_requests', requestId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      targetReq = targetReq || (data as ProductRequest);
      const existingOffers = Array.isArray(data.offers) ? data.offers : [];
      const updatedOffers = [...existingOffers, newOffer];
      await setDoc(docRef, {
        offers: updatedOffers,
        offersCount: updatedOffers.length,
        status: 'offers_received',
      }, { merge: true });
    }
  } catch (e) {
    console.warn('Firestore addRequestOffer notice:', e);
  }

  // Notify requester in real time
  if (targetReq?.requesterId && targetReq.requesterId !== offer.sellerId) {
    try {
      const notifDocId = 'notif_offer_' + requestId + '_' + newOffer.id;
      const notifPayload = {
        userId: targetReq.requesterId,
        title: 'New Offer on your Request! 🤝',
        message: `${offer.sellerName} offered an item for ₹${offer.price} on "${targetReq.title}"`,
        type: 'request',
        link: '/requests',
        isRead: false,
        created_at: new Date().toISOString(),
      };
      await setDoc(doc(db, 'notifications', notifDocId), notifPayload);

      if (typeof window !== 'undefined') {
        const notifKey = `campuscart_notifs_${targetReq.requesterId}`;
        const existing = JSON.parse(localStorage.getItem(notifKey) || '[]');
        existing.unshift({ id: notifDocId, ...notifPayload, isRead: false, createdAt: new Date().toISOString() });
        localStorage.setItem(notifKey, JSON.stringify(existing));
      }
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
  const convMap = new Map<string, Conversation>();

  // 1. Load from local storage first for instantaneous UI rendering
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('campuscart_conversations');
      if (raw) {
        const list: Conversation[] = JSON.parse(raw);
        list.filter((c) => c.participantIds?.includes(userId)).forEach((c) => convMap.set(c.id, c));
      }
    } catch {}
  }

  // 2. Fetch all matching chats from Firestore
  try {
    const snap = await getDocs(collection(db, 'chats'));
    if (!snap.empty) {
      snap.forEach((d) => {
        const data = d.data();
        const participants = Array.isArray(data.participants) ? data.participants : [];
        if (participants.includes(userId)) {
          const cId = d.id;
          const existing = convMap.get(cId);
          convMap.set(cId, {
            id: cId,
            participantIds: participants,
            participantNames: data.participantNames || existing?.participantNames || {},
            participantAvatars: data.participantAvatars || existing?.participantAvatars || {},
            lastMessage: data.lastMessage || existing?.lastMessage || 'Conversation active',
            lastMessageTimestamp: data.updatedAt || data.lastMessageTimestamp || existing?.lastMessageTimestamp || new Date().toISOString(),
            unreadCount: data.unreadCount || existing?.unreadCount || {},
          });
        }
      });
    }
  } catch (e) {
    console.warn('Firestore getConversations notice:', e);
  }

  const result = Array.from(convMap.values()).sort(
    (a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
  );

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('campuscart_conversations', JSON.stringify(result));
    } catch {}
  }

  return result;
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const msgMap = new Map<string, ChatMessage>();

  // 1. Load from local cache
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`campuscart_msgs_${conversationId}`);
      if (raw) {
        const list: ChatMessage[] = JSON.parse(raw);
        list.forEach((m) => msgMap.set(m.id, m));
      }
    } catch {}
  }

  // 2. Fetch from Firestore chats/{id}/messages
  try {
    const snap = await getDocs(
      query(collection(db, 'chats', conversationId, 'messages'), orderBy('createdAt', 'asc'))
    );
    if (!snap.empty) {
      snap.forEach((d) => {
        const data = d.data();
        msgMap.set(d.id, {
          id: d.id,
          conversationId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderAvatar: data.senderAvatar || '',
          recipientId: data.recipientId || '',
          text: data.text || '',
          createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
        });
      });
    }
  } catch (e) {
    console.warn('Firestore getMessages notice:', e);
  }

  const result = Array.from(msgMap.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Sync merged result back to local cache
  if (typeof window !== 'undefined' && result.length > 0) {
    try {
      localStorage.setItem(`campuscart_msgs_${conversationId}`, JSON.stringify(result));
    } catch {}
  }

  return result;
}

export async function sendChatMessage(msg: Partial<ChatMessage> & {
  conversationId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  text: string;
}): Promise<ChatMessage> {
  const newMsg: ChatMessage = {
    id: msg.id || ('msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    senderName: msg.senderName,
    senderAvatar: msg.senderAvatar || '',
    recipientId: msg.recipientId,
    text: msg.text,
    createdAt: msg.createdAt || new Date().toISOString(),
  };

  // 1. Save to local storage immediately
  if (typeof window !== 'undefined') {
    try {
      const key = `campuscart_msgs_${msg.conversationId}`;
      const raw = localStorage.getItem(key);
      const list: ChatMessage[] = raw ? JSON.parse(raw) : [];
      // Prevent duplicates by ID or by identical sender+text within 2 seconds
      const isDuplicate = list.some(
        (m) =>
          m.id === newMsg.id ||
          (m.senderId === newMsg.senderId &&
            m.text === newMsg.text &&
            Math.abs(new Date(m.createdAt).getTime() - new Date(newMsg.createdAt).getTime()) < 2000)
      );
      if (!isDuplicate) {
        list.push(newMsg);
      }
      localStorage.setItem(key, JSON.stringify(list));

      const convRaw = localStorage.getItem('campuscart_conversations');
      let convList: Conversation[] = convRaw ? JSON.parse(convRaw) : [];
      const convIndex = convList.findIndex((c) => c.id === msg.conversationId);
      
      if (convIndex >= 0) {
        convList[convIndex].lastMessage = msg.text;
        convList[convIndex].lastMessageTimestamp = newMsg.createdAt;
        if (!convList[convIndex].participantIds.includes(msg.senderId)) {
          convList[convIndex].participantIds.push(msg.senderId);
        }
        if (msg.recipientId && !convList[convIndex].participantIds.includes(msg.recipientId)) {
          convList[convIndex].participantIds.push(msg.recipientId);
        }
        if (msg.senderName) {
          convList[convIndex].participantNames = {
            ...(convList[convIndex].participantNames || {}),
            [msg.senderId]: msg.senderName,
          };
        }
      } else {
        convList.unshift({
          id: msg.conversationId,
          participantIds: [msg.senderId, msg.recipientId].filter(Boolean),
          participantNames: {
            [msg.senderId]: msg.senderName,
            ...(msg.recipientId ? { [msg.recipientId]: 'Campus Peer' } : {}),
          },
          participantAvatars: {
            [msg.senderId]: msg.senderAvatar || '',
            ...(msg.recipientId ? { [msg.recipientId]: '' } : {}),
          },
          lastMessage: msg.text,
          lastMessageTimestamp: newMsg.createdAt,
          unreadCount: msg.recipientId ? { [msg.recipientId]: 1 } : {},
        });
      }

      // Sort with newest on top
      convList.sort(
        (a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
      );
      localStorage.setItem('campuscart_conversations', JSON.stringify(convList));

      window.dispatchEvent(new CustomEvent('campuscart_message_sent', { detail: newMsg }));
      window.dispatchEvent(new Event('storage'));
    } catch {}
  }

  // 2. Persist to Firestore chats/{id}/messages and parent chat doc
  try {
    await setDoc(doc(db, 'chats', msg.conversationId, 'messages', newMsg.id), {
      senderId: newMsg.senderId,
      senderName: newMsg.senderName,
      senderAvatar: newMsg.senderAvatar || '',
      recipientId: newMsg.recipientId || '',
      text: newMsg.text,
      createdAt: newMsg.createdAt,
    });

    await setDoc(
      doc(db, 'chats', msg.conversationId),
      {
        participants: [msg.senderId, msg.recipientId].filter(Boolean),
        lastMessage: msg.text,
        updatedAt: newMsg.createdAt,
        participantNames: {
          [msg.senderId]: msg.senderName,
        },
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('Firestore sendChatMessage notice:', e);
  }

  // 3. Dispatch real-time notification to recipient
  if (msg.recipientId && msg.recipientId !== msg.senderId) {
    try {
      const notifDocId = 'notif_msg_' + newMsg.id;
      const notifPayload = {
        userId: msg.recipientId,
        title: `💬 Message from ${msg.senderName}`,
        message: msg.text.length > 60 ? msg.text.slice(0, 57) + '...' : msg.text,
        type: 'message',
        link: '/messages',
        isRead: false,
        created_at: new Date().toISOString(),
      };
      await setDoc(doc(db, 'notifications', notifDocId), notifPayload);

      if (typeof window !== 'undefined') {
        const notifKey = `campuscart_notifs_${msg.recipientId}`;
        const existing = JSON.parse(localStorage.getItem(notifKey) || '[]');
        existing.unshift({ id: notifDocId, ...notifPayload, isRead: false, createdAt: new Date().toISOString() });
        localStorage.setItem(notifKey, JSON.stringify(existing));
      }
    } catch {}
  }

  return newMsg;
}

// ---------- Notifications ----------

export async function getNotifications(userId: string): Promise<NotificationItem[]> {
  const notifMap = new Map<string, NotificationItem>();

  // 1. Local notifications
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`campuscart_notifs_${userId}`);
      if (raw) {
        const list: NotificationItem[] = JSON.parse(raw);
        list.forEach((n) => notifMap.set(n.id, n));
      }
    } catch {}
  }

  // 2. Fetch from Firestore
  try {
    const snap = await getDocs(collection(db, 'notifications'));
    if (!snap.empty) {
      snap.forEach((d) => {
        const data = d.data();
        if (data.userId === userId) {
          notifMap.set(d.id, {
            id: d.id,
            userId: data.userId,
            title: data.title || 'Campus Notification',
            message: data.message || '',
            type: data.type || 'announcement',
            link: data.link || '/notifications',
            isRead: Boolean(data.isRead),
            createdAt: data.created_at || data.createdAt || new Date().toISOString(),
          });
        }
      });
    }
  } catch (e) {
    console.warn('Firestore getNotifications notice:', e);
  }

  if (notifMap.size === 0) {
    notifMap.set('notif-welcome', {
      id: 'notif-welcome',
      userId,
      title: 'Welcome to CampusCart! 🎓',
      message: 'Explore student creations, post freelance gigs, and connect with campus peers.',
      type: 'announcement',
      link: '/marketplace',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  const result = Array.from(notifMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`campuscart_notifs_${userId}`, JSON.stringify(result));
    } catch {}
  }

  return result;
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

  try {
    await setDoc(doc(db, 'notifications', notificationId), { isRead: true }, { merge: true });
  } catch {}
}
