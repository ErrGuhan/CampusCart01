import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.SERVER_PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/campuscart',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'campuscart_jwt_access_secret_production_key_9845729487529',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'campuscart_jwt_refresh_secret_production_key_1928374650123',
  JWT_ACCESS_EXPIRATION: '15m',
  JWT_REFRESH_EXPIRATION: '7d',
  CSRF_SECRET: process.env.CSRF_SECRET || 'campuscart_csrf_secret_key_8472910482910482',
  ALLOWED_ORIGINS: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://campus-cart01.vercel.app',
    process.env.CLIENT_URL || '',
  ].filter(Boolean),
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB strict limit
  UPLOAD_DIR: 'uploads',
  DEFAULT_CAMPUS_LOCATION: {
    type: 'Point' as const,
    coordinates: [79.1559, 12.9692], // Default [lng, lat] for campus center
  },
  ESCROW_OTP_VALIDITY_MINUTES: 60,
  CHURN_ALERT_WEBHOOK_URL: process.env.CHURN_ALERT_WEBHOOK_URL || 'https://api.campuscart.internal/webhooks/reengage',
};

export const COOKIE_CONFIG = {
  ACCESS_TOKEN_COOKIE: 'campuscart_access_token',
  REFRESH_TOKEN_COOKIE: 'campuscart_refresh_token',
  CSRF_TOKEN_COOKIE: 'campuscart_csrf_token',
  OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
    path: '/',
  },
  PUBLIC_CSRF_OPTIONS: {
    httpOnly: false, // CSRF token cookie readable by frontend JS for X-CSRF-Token header match
    secure: process.env.NODE_ENV === 'production',
    sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
    path: '/',
  },
};
