import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  displayName: string;
  username: string;
  role: 'student' | 'seller' | 'admin';
  department?: string;
  major?: string;
  year?: string;
  graduationYear?: number;
  skills: string[];
  studentsHelped: number;
  bio?: string;
  avatarUrl?: string;
  isVerified: boolean;
  trustScore: number;
  completedTransactionsCount: number;
  totalTransactionVolume: number;
  campusSector?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid university or institutional email address',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      maxlength: 80,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 30,
    },
    role: {
      type: String,
      enum: ['student', 'seller', 'admin'],
      default: 'student',
    },
    department: { type: String, default: 'Computer Science' },
    major: { type: String, default: 'Computer Science & Engineering' },
    year: { type: String, default: '3rd Year' },
    graduationYear: { type: Number, default: 2026 },
    skills: [{ type: String, trim: true }],
    studentsHelped: { type: Number, default: 0, min: 0 },
    bio: { type: String, maxlength: 500 },
    avatarUrl: { type: String },
    isVerified: { type: Boolean, default: false },
    trustScore: { type: Number, default: 50.0, min: 0, max: 100 },
    completedTransactionsCount: { type: Number, default: 0 },
    totalTransactionVolume: { type: Number, default: 0 },
    campusSector: { type: String, default: 'North Campus' },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [79.1559, 12.9692],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for campus user proximity
UserSchema.index({ location: '2dsphere' });
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
