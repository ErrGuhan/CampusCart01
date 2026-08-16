import mongoose, { Document, Schema } from 'mongoose';

export type BountyStatus = 'OPEN' | 'CLAIMED' | 'COMPLETED';

export interface IBounty extends Document {
  creatorId: mongoose.Types.ObjectId;
  creatorName: string;
  creatorAvatar?: string;
  solverId?: mongoose.Types.ObjectId | null;
  solverName?: string;
  solverAvatar?: string;
  title: string;
  description: string;
  rewardAmount: number;
  deadline: string;
  category?: string;
  status: BountyStatus;
  claimedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BountySchema = new Schema<IBounty>(
  {
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
      index: true,
    },
    creatorName: {
      type: String,
      required: true,
      trim: true,
    },
    creatorAvatar: {
      type: String,
    },
    solverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    solverName: {
      type: String,
    },
    solverAvatar: {
      type: String,
    },
    title: {
      type: String,
      required: [true, 'Bounty title is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: [true, 'Bounty description is required'],
      maxlength: 2500,
    },
    rewardAmount: {
      type: Number,
      required: [true, 'Reward amount is required'],
      min: [0, 'Reward cannot be negative'],
    },
    deadline: {
      type: String,
      required: [true, 'Deadline is required'],
    },
    category: {
      type: String,
      default: 'General Tech',
    },
    status: {
      type: String,
      enum: ['OPEN', 'CLAIMED', 'COMPLETED'],
      default: 'OPEN',
      index: true,
    },
    claimedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

BountySchema.index({ status: 1, createdAt: -1 });
BountySchema.index({ creatorId: 1, status: 1 });
BountySchema.index({ solverId: 1, status: 1 });

export const Bounty =
  mongoose.models.Bounty || mongoose.model<IBounty>('Bounty', BountySchema);
