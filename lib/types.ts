export type ProductStatus = 'active' | 'draft' | 'paused' | 'out_of_stock';

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  tags: string[];
  images: string[];
  inventory: number;
  status: ProductStatus;
  rating: number;
  reviewCount: number;
  seller: Seller;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  isDigital?: boolean;
  digitalFileUrl?: string;
  createdAt: string;
  isVerified: boolean;
};

export type Seller = {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  department: string;
  year: string;
  bio: string;
  skills: string[];
  rating: number;
  productCount: number;
  joinedAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  productCount: number;
};

export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  price: number;
  discountPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviewCount: number;
  sellerName: string;
  sellerUsername: string;
  status: ProductStatus;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
};

// ----------------- Campus Freelance & Gigs Types -----------------

export type GigStatus = 'active' | 'paused' | 'draft';

export type ServiceGig = {
  id: string;
  sellerId: string;
  seller: Seller;
  title: string;
  slug: string;
  description: string;
  category: string;
  startingPrice: number;
  deliveryTimeDays: number;
  revisions: number;
  tags: string[];
  coverImage: string;
  portfolioImages?: string[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  status: GigStatus;
  createdAt: string;
};

export type GigOrderStatus = 'pending' | 'in_progress' | 'delivered' | 'completed' | 'cancelled';

export type GigOrder = {
  id: string;
  gigId: string;
  gigTitle: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  price: number;
  requirements: string;
  status: GigOrderStatus;
  deliveryNotes?: string;
  deliveryFileUrl?: string;
  createdAt: string;
  completedAt?: string;
};

export type GigRequestStatus = 'open' | 'assigned' | 'completed';

export type GigRequest = {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadlineDays: number;
  status: GigRequestStatus;
  proposalsCount: number;
  createdAt: string;
};
