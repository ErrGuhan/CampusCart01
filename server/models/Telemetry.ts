import mongoose, { Document, Schema } from 'mongoose';

export interface ITelemetry extends Document {
  userId: mongoose.Types.ObjectId;
  eventType: 'SESSION_START' | 'SESSION_END' | 'MESSAGE_SENT' | 'MESSAGE_REPLIED' | 'PRODUCT_VIEW' | 'CART_ABANDON' | 'TRANSACTION_COMPLETED';
  sessionDurationSeconds: number;
  messageLatencySeconds: number;
  listingFrequencyMonthly: number;
  transactionVolumeDollars: number;
  cartAbandonmentsCount: number;
  daysSinceLastActivity: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const TelemetrySchema = new Schema<ITelemetry>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        'SESSION_START',
        'SESSION_END',
        'MESSAGE_SENT',
        'MESSAGE_REPLIED',
        'PRODUCT_VIEW',
        'CART_ABANDON',
        'TRANSACTION_COMPLETED',
      ],
      required: true,
    },
    sessionDurationSeconds: { type: Number, default: 0 },
    messageLatencySeconds: { type: Number, default: 0 },
    listingFrequencyMonthly: { type: Number, default: 0 },
    transactionVolumeDollars: { type: Number, default: 0 },
    cartAbandonmentsCount: { type: Number, default: 0 },
    daysSinceLastActivity: { type: Number, default: 0 },
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

TelemetrySchema.index({ userId: 1, createdAt: -1 });

export const Telemetry = mongoose.models.Telemetry || mongoose.model<ITelemetry>('Telemetry', TelemetrySchema);
