export type ProductStatus = 'active' | 'pending_approval' | 'draft' | 'paused' | 'out_of_stock' | 'rejected';

export type ProductCondition = 'new' | 'like_new' | 'excellent' | 'good' | 'fair';

export type ProductType = 'PHYSICAL' | 'DIGITAL' | 'SERVICE';

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  productType?: ProductType;
  tags: string[];
  externalLink?: string;
  images: string[];
  inventory: number;
  status: ProductStatus;
  rating: number;
  reviewCount: number;
  seller: Seller;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  pickupLocation?: string;
  isDigital?: boolean;
  digitalFileUrl?: string;
  isUsed?: boolean;
  condition?: ProductCondition;
  createdAt: string;
  isVerified: boolean;
  rejectionReason?: string;
};

export type Seller = {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  department: string;
  major?: string;
  year: string;
  graduationYear?: number;
  bio: string;
  skills: string[];
  studentsHelped?: number;
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
  isUsed?: boolean;
  condition?: ProductCondition;
  isVerified?: boolean;
};

export type Review = {
  id: string;
  author: string;
  authorAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerifiedPurchase?: boolean;
};

// ----------------- Campus Freelance & Gigs Types -----------------

export type GigStatus = 'active' | 'pending_approval' | 'paused' | 'draft' | 'rejected';

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
  rejectionReason?: string;
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

export type GigRequestStatus = 'open' | 'assigned' | 'completed' | 'expired';

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

// ----------------- Product Requests Board ("What I Need") -----------------

export type ProductRequestStatus = 'open' | 'offers_received' | 'accepted' | 'completed' | 'expired';

export type ProductRequest = {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterUsername: string;
  requesterAvatar?: string;
  requesterDepartment: string;
  requesterYear: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadlineDate: string;
  status: ProductRequestStatus;
  offersCount: number;
  createdAt: string;
  offers?: RequestOffer[];
};

export type RequestOffer = {
  id: string;
  requestId: string;
  sellerId: string;
  sellerName: string;
  sellerUsername: string;
  sellerAvatar?: string;
  sellerDepartment?: string;
  price: number;
  message: string;
  condition?: ProductCondition;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
};

// ----------------- Campus Community & Feed -----------------

export type CommunityCategory = 'academic' | 'clubs' | 'events' | 'marketplace' | 'opportunities' | 'general';

export type CommunityPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  authorDepartment: string;
  category: CommunityCategory;
  title: string;
  content: string;
  tags: string[];
  likes: number;
  likedBy?: string[];
  commentsCount: number;
  createdAt: string;
};

export type CommunityComment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
};

// ----------------- Campus Events -----------------

export type EventCategory = 'hackathon' | 'symposium' | 'workshop' | 'competition' | 'club' | 'cultural' | 'sports';

export type CampusEvent = {
  id: string;
  title: string;
  category: EventCategory;
  description: string;
  date: string;
  time: string;
  venue: string;
  organizer: string;
  organizerClub?: string;
  registrationUrl?: string;
  image: string;
  price?: number;
  registeredCount: number;
  createdAt: string;
};

// ----------------- Messaging & Notifications -----------------

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  text: string;
  imageUrl?: string;
  orderRefId?: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  participantIds: string[];
  participantNames: Record<string, string>;
  participantAvatars: Record<string, string>;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: Record<string, number>;
};

export type NotificationType = 'order' | 'message' | 'approval' | 'rejection' | 'proposal' | 'request_offer' | 'announcement';

export type NotificationItem = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  createdAt: string;
};

// ----------------- Campus Incubator & Collaboration Hub Types -----------------

export type CollaborationTag =
  | 'LOOKING_FOR_COFOUNDER'
  | 'NEED_FEEDBACK'
  | 'HARDWARE_HELP'
  | 'BETA_TESTERS'
  | 'GENERAL';

export type CollaborationRequest = {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  authorMajor: string;
  authorYear: string | number;
  title: string;
  description: string;
  tags: CollaborationTag;
  status: 'OPEN' | 'CLOSED';
  viewsCount: number;
  responsesCount: number;
  createdAt: string;
};

export type BountyStatus = 'OPEN' | 'CLAIMED' | 'COMPLETED';

export type CampusBounty = {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  solverId?: string | null;
  solverName?: string;
  solverAvatar?: string;
  title: string;
  description: string;
  rewardAmount: number;
  deadline: string;
  category?: string;
  status: BountyStatus;
  claimedAt?: string;
  completedAt?: string;
  createdAt: string;
};

export type UserPortfolio = {
  user: {
    id: string;
    displayName: string;
    username: string;
    avatar?: string;
    major?: string;
    graduationYear?: number;
    skills: string[];
    studentsHelped: number;
    totalRevenue: number;
  };
  physicalProducts: Product[];
  digitalProducts: Product[];
  services: ServiceGig[];
  openRequests: CollaborationRequest[];
  bountiesCreated: CampusBounty[];
  bountiesClaimed: CampusBounty[];
};
