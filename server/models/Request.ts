import mongoose, { Document, Schema } from 'mongoose';

export type RequestTag = 'LOOKING_FOR_COFOUNDER' | 'NEED_FEEDBACK' | 'HARDWARE_HELP' | 'BETA_TESTERS' | 'GENERAL';

export interface ICollaborationRequest extends Document {
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  authorMajor?: string;
  authorYear?: string | number;
  title: string;
  description: string;
  tags: RequestTag;
  status: 'OPEN' | 'CLOSED';
  viewsCount: number;
  responsesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const RequestSchema = new Schema<ICollaborationRequest>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
      index: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorUsername: {
      type: String,
      required: true,
      trim: true,
    },
    authorAvatar: {
      type: String,
    },
    authorMajor: {
      type: String,
      default: 'Computer Science & Engineering',
    },
    authorYear: {
      type: Schema.Types.Mixed,
      default: '4th Year',
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 3000,
    },
    tags: {
      type: String,
      enum: ['LOOKING_FOR_COFOUNDER', 'NEED_FEEDBACK', 'HARDWARE_HELP', 'BETA_TESTERS', 'GENERAL'],
      default: 'GENERAL',
      index: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    responsesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

RequestSchema.index({ status: 1, createdAt: -1 });
RequestSchema.index({ tags: 1, status: 1 });

export const CollaborationRequest =
  mongoose.models.CollaborationRequest ||
  mongoose.model<ICollaborationRequest>('CollaborationRequest', RequestSchema);
