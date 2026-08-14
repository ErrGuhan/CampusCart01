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
  createdAt: string;
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
