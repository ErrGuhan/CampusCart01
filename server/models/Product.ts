import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[];
  sellerId: mongoose.Types.ObjectId;
  campusId: string;
  campusSector: string;
  pickupLocation: string;
  condition: 'Brand New' | 'Like New' | 'Good' | 'Fair';
  status: 'active' | 'pending_approval' | 'escrow_locked' | 'sold' | 'archived';
  lockedByOrderId?: string;
  lockedAt?: Date;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  viewsCount: number;
  favoritesCount: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: 2000,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      index: true,
    },
    images: {
      type: [String],
      required: [true, 'At least one product image is required'],
      validate: [(arr: string[]) => arr.length > 0, 'At least one image is required'],
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    campusId: {
      type: String,
      default: 'main_campus',
      index: true,
    },
    campusSector: {
      type: String,
      default: 'Central Campus',
    },
    pickupLocation: {
      type: String,
      required: true,
      default: 'Student Center / Library Lobby',
    },
    condition: {
      type: String,
      enum: ['Brand New', 'Like New', 'Good', 'Fair'],
      default: 'Like New',
    },
    status: {
      type: String,
      enum: ['active', 'pending_approval', 'escrow_locked', 'sold', 'archived'],
      default: 'active',
      index: true,
    },
    lockedByOrderId: {
      type: String,
    },
    lockedAt: {
      type: Date,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        default: [79.1559, 12.9692],
      },
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    favoritesCount: {
      type: Number,
      default: 0,
    },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// 1. Geospatial 2dsphere index for radius-based proximity filtering
ProductSchema.index({ location: '2dsphere' });

// 2. High-performance Compound Indexes for feed queries and category browsing
ProductSchema.index({ campusId: 1, category: 1, createdAt: -1 });
ProductSchema.index({ campusId: 1, status: 1, createdAt: -1 });
ProductSchema.index({ status: 1, price: 1 });
ProductSchema.index({ createdAt: -1, _id: -1 }); // Index for cursor-based pagination

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
