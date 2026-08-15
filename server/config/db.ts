import mongoose from 'mongoose';
import { ENV } from './constants';

export async function connectDB(): Promise<typeof mongoose> {
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('[Database] MongoDB Connection Error:', error);
    // In dev / build environment where MongoDB might be local or optional, handle gracefully
    if (ENV.NODE_ENV === 'production') {
      process.exit(1);
    }
    return mongoose;
  }
}
