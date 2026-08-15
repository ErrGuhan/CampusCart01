import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  transactionId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  rating: number; // 1 to 5
  comment: string;
  transactionAmount: number;
  buyerIp: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Escrow',
      required: true,
      unique: true,
      index: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 1000,
      default: '',
    },
    transactionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    buyerIp: {
      type: String,
      required: true,
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

ReviewSchema.index({ sellerId: 1, createdAt: -1 });
ReviewSchema.index({ buyerId: 1, sellerId: 1 });
ReviewSchema.index({ buyerIp: 1, sellerId: 1 }); // IP clustering index for Sybil attack detection

export const Review = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
