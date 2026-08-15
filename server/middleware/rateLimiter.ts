import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// 1. Global API Rate Limiter (100 req / 15 minutes per IP)
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many requests from this IP address. Please try again after 15 minutes.',
  },
});

// 2. Strict Auth Rate Limiter for Login/Register (5 attempts / 15 minutes per IP)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Strict 5 attempts limit
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Your IP has been temporarily throttled for 15 minutes to prevent brute-force attacks.',
  },
});

// 3. File Upload Rate Limiter (10 uploads / 15 minutes per IP)
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Upload rate limit reached (maximum 10 uploads per 15 minutes).',
  },
});

// 4. Spatial / Product Search Rate Limiter (60 requests / minute)
export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Search rate limit exceeded. Please throttle query frequency.',
  },
});

// 5. Escrow OTP Verification Limiter (3 failed attempts / 10 minutes)
export const otpVerificationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many OTP verification attempts. Escrow release temporarily locked.',
  },
});
