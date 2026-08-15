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
  { id: 'cat-handmade', name: 'Handmade', slug: 'handmade', icon: 'Hammer', productCount: 4 },
  { id: 'cat-art-design', name: 'Art & Design', slug: 'art-design', icon: 'Palette', productCount: 3 },
  { id: 'cat-electronics', name: 'Electronics', slug: 'electronics', icon: 'Cpu', productCount: 5 },
  { id: 'cat-digital', name: 'Digital Products', slug: 'digital', icon: 'Monitor', productCount: 6 },
  { id: 'cat-books', name: 'Books', slug: 'books', icon: 'BookOpen', productCount: 4 },
  { id: 'cat-fashion', name: 'Fashion', slug: 'fashion', icon: 'Shirt', productCount: 2 },
  { id: 'cat-accessories', name: 'Accessories', slug: 'accessories', icon: 'Watch', productCount: 3 },
  { id: 'cat-stationery', name: 'Stationery', slug: 'stationery', icon: 'PenTool', productCount: 3 },
  { id: 'cat-food', name: 'Food', slug: 'food', icon: 'Cookie', productCount: 2 },
  { id: 'cat-college-supplies', name: 'College Supplies', slug: 'college-supplies', icon: 'Backpack', productCount: 4 },
  { id: 'cat-services', name: 'Services', slug: 'services', icon: 'Wrench', productCount: 8 },
  { id: 'cat-other', name: 'Other', slug: 'other', icon: 'Package', productCount: 2 },
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
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300',
    department: 'Computer Science & Engineering (CSE)',
    year: '4th Year (Final Year)',
    bio: 'Full-stack developer, IoT builder, and founder of CampusCart SVCET.',
    skills: ['Next.js', 'React', 'Python', 'IoT', 'UI/UX Design'],
    rating: 4.9,
    productCount: 4,
    joinedAt: '2024-01-10T00:00:00Z',
  },
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    slug: 'handmade-engineering-drawing-board-cover',
    name: 'Handmade Engineering Drawing Board Cover & Strap',
    description: 'Durable waterproof canvas bag tailored for A2/A1 engineering drawing boards with pencil pouch and shoulder strap.',
    price: 350,
    discountPrice: 280,
    category: 'Handmade',
    tags: ['drawing-board', 'engineering', 'canvas', 'handmade'],
    images: [
      'https://images.pexels.com/photos/1765033/pexels-photo-1765033.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/6263162/pexels-photo-6263162.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    inventory: 8,
    status: 'active',
    rating: 4.8,
    reviewCount: 14,
    seller: DEFAULT_SELLERS[0],
    pickupAvailable: true,
    deliveryAvailable: true,
    isDigital: false,
    createdAt: '2024-05-10T00:00:00Z',
    isVerified: true,
  },
  {
    id: 'prod-2',
    slug: 'data-structures-algorithms-handwritten-topper-notes',
    name: 'Data Structures & Algorithms Complete Handwritten Topper Notes',
    description: 'Comprehensive handwritten color-coded notes covering Trees, Graphs, Dynamic Programming, Sorting, and Time Complexity with solved semester exam questions.',
    price: 199,
    discountPrice: 129,
    category: 'Digital Products',
    tags: ['dsa', 'notes', 'cse', 'it', 'digital-download'],
    images: [
      'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/267586/pexels-photo-267586.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    inventory: 999,
    status: 'active',
    rating: 5.0,
    reviewCount: 32,
    seller: DEFAULT_SELLERS[0],
    pickupAvailable: false,
    deliveryAvailable: false,
    isDigital: true,
    digitalFileUrl: 'https://drive.google.com/drive/folders/campuscart-svcet-dsa-notes',
    createdAt: '2024-05-12T00:00:00Z',
    isVerified: true,
  },
  {
    id: 'prod-3',
    slug: 'custom-3d-printed-phone-stand-with-cable-organizer',
    name: 'Custom 3D Printed Phone Stand with Cable Organizer',
    description: 'Sturdy PLA+ 3D printed phone and tablet holder with integrated USB cable channel. Available in black, white, and neon blue.',
    price: 220,
    discountPrice: 160,
    category: 'Electronics',
    tags: ['3d-printed', 'phone-stand', 'accessories', 'desk-setup'],
    images: [
      'https://images.pexels.com/photos/3825586/pexels-photo-3825586.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    inventory: 15,
    status: 'active',
    rating: 4.7,
    reviewCount: 9,
    seller: DEFAULT_SELLERS[0],
    pickupAvailable: true,
    deliveryAvailable: true,
    isDigital: false,
    createdAt: '2024-05-14T00:00:00Z',
    isVerified: true,
  },
  {
    id: 'prod-4',
    slug: 'arduino-iot-smart-home-starter-kit-with-sensors',
    name: 'Arduino IoT Smart Home Starter Kit with 12 Sensors',
    description: 'Complete student IoT lab kit including Arduino Uno R3, ESP8266 Wi-Fi module, DHT11 temp/humidity, Relay, OLED Display, and jumper wires.',
    price: 850,
    discountPrice: 699,
    category: 'Electronics',
    tags: ['arduino', 'iot', 'hardware', 'sensors', 'project'],
    images: [
      'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    inventory: 6,
    status: 'active',
    rating: 4.9,
    reviewCount: 21,
    seller: DEFAULT_SELLERS[0],
    pickupAvailable: true,
    deliveryAvailable: false,
    isDigital: false,
    createdAt: '2024-05-15T00:00:00Z',
    isVerified: true,
  },
  {
    id: 'prod-5',
    slug: 'full-stack-mern-ecommerce-final-year-project-code',
    name: 'Full-Stack MERN E-Commerce Final Year Project Source Code & Documentation',
    description: 'Complete production-ready React + Node.js + MongoDB repository with JWT authentication, Stripe integration, admin dashboard, and 60-page IEEE project report.',
    price: 499,
    discountPrice: 349,
    category: 'Digital Products',
    tags: ['react', 'mern', 'final-year-project', 'source-code', 'fullstack'],
    images: [
      'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    inventory: 999,
    status: 'active',
    rating: 4.9,
    reviewCount: 18,
    seller: DEFAULT_SELLERS[0],
    pickupAvailable: false,
    deliveryAvailable: false,
    isDigital: true,
    digitalFileUrl: 'https://github.com/campuscart-project-source-code',
    createdAt: '2024-05-18T00:00:00Z',
    isVerified: true,
  },
  {
    id: 'prod-6',
    slug: 'handcrafted-resin-keychains-with-custom-initials',
    name: 'Handcrafted Resin Keychains with Gold Foil & Custom Initials',
    description: 'Aesthetic crystal clear epoxy resin letter keychains customized with dried flowers, gold flake leaf, and stainless steel rings.',
    price: 150,
    discountPrice: 110,
    category: 'Handmade',
    tags: ['resin', 'keychains', 'custom', 'gifts', 'accessories'],
    images: [
      'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    inventory: 20,
    status: 'active',
    rating: 4.8,
    reviewCount: 12,
    seller: DEFAULT_SELLERS[0],
    pickupAvailable: true,
    deliveryAvailable: true,
    isDigital: false,
    createdAt: '2024-05-20T00:00:00Z',
    isVerified: true,
  },
];

export const DEFAULT_GIGS: ServiceGig[] = [
  {
    id: 'gig-1',
    sellerId: DEFAULT_SELLERS[0].id,
    seller: DEFAULT_SELLERS[0],
    title: 'I will design high-impact symposium posters, flyers, and club banners',
    slug: 'design-symposium-posters-flyers',
    description: 'Professional poster design for technical symposiums, sports fests, cultural nights, and club inaugurations with 24-hour turnaround in high-res PDF/PNG format.',
    category: 'Design & Posters',
    startingPrice: 150,
    deliveryTimeDays: 1,
    revisions: 3,
    tags: ['poster', 'canva', 'photoshop', 'symposium', 'banners'],
    coverImage: 'https://images.pexels.com/photos/3182773/pexels-photo-3182773.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    portfolioImages: [
      'https://images.pexels.com/photos/3182773/pexels-photo-3182773.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    rating: 4.9,
    reviewCount: 19,
    isVerified: true,
    status: 'active',
    createdAt: '2024-05-01T00:00:00Z',
  },
  {
    id: 'gig-2',
    sellerId: DEFAULT_SELLERS[0].id,
    seller: DEFAULT_SELLERS[0],
    title: 'I will build custom React portfolio websites and mini project web apps',
    slug: 'build-react-portfolio-mini-project',
    description: 'Get a clean, fast Next.js or React web app for your personal developer portfolio or semester mini-project with responsive mobile design and deployment to Vercel.',
    category: 'Coding & Tech Projects',
    startingPrice: 400,
    deliveryTimeDays: 2,
    revisions: 2,
    tags: ['react', 'nextjs', 'portfolio', 'web-development', 'project'],
    coverImage: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    portfolioImages: [
      'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    rating: 5.0,
    reviewCount: 14,
    isVerified: true,
    status: 'active',
    createdAt: '2024-05-03T00:00:00Z',
  },
  {
    id: 'gig-3',
    sellerId: DEFAULT_SELLERS[0].id,
    seller: DEFAULT_SELLERS[0],
    title: 'I will model 3D CAD parts in SolidWorks and print prototype casings',
    slug: '3d-cad-solidworks-printing-prototypes',
    description: 'Precision 3D modeling for robotics chassis, sensor housings, drone arms, and mechanical fixtures. Includes slicing and direct campus delivery.',
    category: '3D Printing & CAD',
    startingPrice: 200,
    deliveryTimeDays: 2,
    revisions: 2,
    tags: ['solidworks', '3d-cad', '3d-printing', 'robotics', 'prototyping'],
    coverImage: 'https://images.pexels.com/photos/3862132/pexels-photo-3862132.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    portfolioImages: [
      'https://images.pexels.com/photos/3862132/pexels-photo-3862132.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    rating: 4.8,
    reviewCount: 8,
    isVerified: true,
    status: 'active',
    createdAt: '2024-05-04T00:00:00Z',
  },
  {
    id: 'gig-4',
    sellerId: DEFAULT_SELLERS[0].id,
    seller: DEFAULT_SELLERS[0],
    title: 'I will edit cinematic Instagram reels and event aftermovies in Premiere Pro',
    slug: 'edit-instagram-reels-aftermovies',
    description: 'Fast-paced video editing with beat-matching, transitions, subtitles, sound design, and color grading for campus clubs, dances, and college sports.',
    category: 'Video & Photography',
    startingPrice: 300,
    deliveryTimeDays: 1,
    revisions: 3,
    tags: ['video-editing', 'reels', 'aftermovie', 'premiere-pro', 'cinematic'],
    coverImage: 'https://images.pexels.com/photos/2510428/pexels-photo-2510428.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    portfolioImages: [
      'https://images.pexels.com/photos/2510428/pexels-photo-2510428.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    ],
    rating: 4.9,
    reviewCount: 11,
    isVerified: true,
    status: 'active',
    createdAt: '2024-05-06T00:00:00Z',
  },
];

export const DEFAULT_GIG_REQUESTS: GigRequest[] = [
  {
    id: 'req-1',
    requesterId: 'student-req-1',
    requesterName: 'Praveen Kumar',
    requesterEmail: 'praveen24@svcet.ac.in',
    title: 'Need a PPT presentation formatted for tomorrow morning seminar',
    description: 'I have the raw text for a 15-slide Cloud Computing seminar. Need someone to format it cleanly in Canva or PowerPoint with diagrams and animations.',
    category: 'Design & Posters',
    budget: 150,
    deadlineDays: 1,
    status: 'open',
    proposalsCount: 3,
    createdAt: '2024-05-20T10:00:00Z',
  },
  {
    id: 'req-2',
    requesterId: 'student-req-2',
    requesterName: 'Sneha R',
    requesterEmail: 'sneha24@svcet.ac.in',
    title: 'Need help debugging Python OpenCV code for face detection project',
    description: 'Getting an error with Haar Cascade bounding box coordinates on video stream. Need a 30-minute tutoring session or code fix.',
    category: 'Coding & Tech Projects',
    budget: 250,
    deadlineDays: 2,
    status: 'open',
    proposalsCount: 2,
    createdAt: '2024-05-21T14:30:00Z',
  },
];

// ---------- Reviews ----------

export async function getProductReviews(productId: string): Promise<Review[]> {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('product_id', '==', productId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
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
    }
  } catch (err) {
    console.warn('Notice in getProductReviews:', err);
  }

  return [
    {
      id: 'rev-1',
      author: 'Kavitha R',
      rating: 5,
      comment: 'Super fast delivery at Central Library! The quality is great and matches the description perfectly.',
      createdAt: '2024-05-16T12:00:00Z',
    },
    {
      id: 'rev-2',
      author: 'Vignesh M',
      rating: 5,
      comment: 'Very helpful student creator. Verified original item and great communication on chat!',
      createdAt: '2024-05-18T15:30:00Z',
    },
  ];
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

export async function getAllGigs(): Promise<ServiceGig[]> {
  try {
    const q = query(collection(db, 'gigs'), where('status', '==', 'active'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const gigs: ServiceGig[] = [];
      snap.forEach((docSnap) => {
        gigs.push(mapDocToGig(docSnap.data(), docSnap.id));
      });
      return gigs;
    }
  } catch (err) {
    console.warn('Notice in getAllGigs from Firestore:', err);
  }
  return DEFAULT_GIGS;
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
    if (!snap.empty) {
      const gigs: ServiceGig[] = [];
      snap.forEach((docSnap) => {
        gigs.push(mapDocToGig(docSnap.data(), docSnap.id));
      });
      return gigs;
    }
  } catch (err) {
    console.warn('Notice in getMyGigs:', err);
  }
  return DEFAULT_GIGS.filter(
    (g) => g.sellerId === sellerId || g.seller.id === sellerId || g.seller.username === 'guhan' || g.seller.id === 'seller-guhan'
  );
}

// ---------- Campus Bounties / Service Requests ----------

export async function getAllGigRequests(): Promise<GigRequest[]> {
  try {
    const q = query(collection(db, 'gig_requests'), where('status', '==', 'open'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const requests: GigRequest[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        requests.push({
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
        });
      });
      return requests;
    }
  } catch (err) {
    console.warn('Notice in getAllGigRequests:', err);
  }
  return DEFAULT_GIG_REQUESTS;
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

  return DEFAULT_CATEGORIES;
}

// ---------- Products ----------

export async function getAllProducts(): Promise<Product[]> {
  try {
    const q = query(collection(db, 'products'), where('status', 'in', ['active', 'out_of_stock']));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const products: Product[] = [];
      snap.forEach((docSnap) => {
        products.push(mapDocToProduct(docSnap.data(), docSnap.id));
      });
      return products;
    }
  } catch (err) {
    console.warn('Notice in getAllProducts:', err);
  }
  return DEFAULT_PRODUCTS;
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

export async function getAllSellers(): Promise<Seller[]> {
  const sellersMap = new Map<string, Seller>();

  // 1. Founding verified creator (Guhan M)
  sellersMap.set(DEFAULT_SELLERS[0].username.toLowerCase(), DEFAULT_SELLERS[0]);

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
            rating: 5.0,
            productCount: 1,
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
                rating: 5.0,
                productCount: 1,
                joinedAt: p.created_at || new Date().toISOString(),
              });
            }
          });
        }
      }
    } catch {}
  }

  return Array.from(sellersMap.values());
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
  return DEFAULT_PRODUCTS.filter(
    (p) => p.seller.id === sellerId || p.seller.username === 'guhan' || p.seller.id === 'seller-guhan'
  );
}
