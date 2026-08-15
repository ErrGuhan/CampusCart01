import mongoose, { Document, Schema } from 'mongoose';

export type EscrowStatus =
  | 'PENDING_DEPOSIT'
  | 'HELD_IN_ESCROW'
  | 'HANDOVER_PENDING'
  | 'RELEASED'
  | 'DISPUTED'
  | 'REFUNDED';

export interface IEscrow extends Document {
  orderId: string;
  productId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  amount: number;
  platformFee: number;
  netSellerPayout: number;
  status: EscrowStatus;
  otpHash: string; // Cryptographic hash of the 6-digit release OTP
  otpExpiresAt: Date;
  otpAttemptsCount: number;
  maxOtpAttempts: number;
  fundsHeldAt?: Date;
  fundsReleasedAt?: Date;
  refundedAt?: Date;
  disputeReason?: string;
  handoverLocation: string;
  auditTrail: Array<{
    action: string;
    timestamp: Date;
    performedBy: string;
    details?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const EscrowSchema = new Schema<IEscrow>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    netSellerPayout: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'PENDING_DEPOSIT',
        'HELD_IN_ESCROW',
        'HANDOVER_PENDING',
        'RELEASED',
        'DISPUTED',
        'REFUNDED',
      ],
      default: 'PENDING_DEPOSIT',
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
      select: false, // Hidden by default from queries
    },
    otpExpiresAt: {
      type: Date,
      required: true,
    },
    otpAttemptsCount: {
      type: Number,
      default: 0,
    },
    maxOtpAttempts: {
      type: Number,
      default: 5,
    },
    fundsHeldAt: { type: Date },
    fundsReleasedAt: { type: Date },
    refundedAt: { type: Date },
    disputeReason: { type: String },
    handoverLocation: {
      type: String,
      default: 'Designated Campus Safe-Exchange Spot',
    },
    auditTrail: [
      {
        action: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        performedBy: { type: String, required: true },
        details: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

EscrowSchema.index({ sellerId: 1, status: 1 });
EscrowSchema.index({ buyerId: 1, status: 1 });

export const Escrow = mongoose.models.Escrow || mongoose.model<IEscrow>('Escrow', EscrowSchema);
