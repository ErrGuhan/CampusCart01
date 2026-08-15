import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ENV, COOKIE_CONFIG } from '../config/constants';

export interface AuthenticatedUserPayload {
  userId: string;
  email: string;
  role: 'student' | 'seller' | 'admin';
  campusId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUserPayload;
}

/**
 * Generates signed access & refresh JWTs and a cryptographically secure CSRF token.
 */
export function generateTokenPair(payload: AuthenticatedUserPayload) {
  const accessToken = jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  } as jwt.SignOptions);

  const csrfToken = crypto.randomBytes(32).toString('hex');

  return { accessToken, refreshToken, csrfToken };
}

/**
 * Attaches stateless HttpOnly, Secure, and SameSite=Strict cookies to the HTTP response.
 */
export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  csrfToken: string
) {
  // 1. Access Token: 15-minute HttpOnly cookie
  res.cookie(COOKIE_CONFIG.ACCESS_TOKEN_COOKIE, accessToken, {
    ...COOKIE_CONFIG.OPTIONS,
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  // 2. Refresh Token: 7-day HttpOnly cookie
  res.cookie(COOKIE_CONFIG.REFRESH_TOKEN_COOKIE, refreshToken, {
    ...COOKIE_CONFIG.OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // 3. Double-Submit CSRF Token: Non-HttpOnly cookie readable by frontend JS for X-CSRF-Token header
  res.cookie(COOKIE_CONFIG.CSRF_TOKEN_COOKIE, csrfToken, {
    ...COOKIE_CONFIG.PUBLIC_CSRF_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

/**
 * Clears all authentication and CSRF cookies on logout.
 */
export function clearAuthCookies(res: Response) {
  res.clearCookie(COOKIE_CONFIG.ACCESS_TOKEN_COOKIE, COOKIE_CONFIG.OPTIONS);
  res.clearCookie(COOKIE_CONFIG.REFRESH_TOKEN_COOKIE, COOKIE_CONFIG.OPTIONS);
  res.clearCookie(COOKIE_CONFIG.CSRF_TOKEN_COOKIE, COOKIE_CONFIG.PUBLIC_CSRF_OPTIONS);
}

/**
 * JWT Authentication Middleware
 * Extracts token from HttpOnly cookie, verifies signature and validity.
 */
export function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token =
    req.cookies?.[COOKIE_CONFIG.ACCESS_TOKEN_COOKIE] ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. No session token found in secure cookies.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET) as AuthenticatedUserPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Session expired. Please refresh token.',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }
    res.status(403).json({
      success: false,
      error: 'Invalid or forged authentication token.',
    });
    return;
  }
}

/**
 * CSRF Protection Middleware for State-Changing Requests (POST, PUT, PATCH, DELETE)
 * Validates that the X-CSRF-Token request header matches the signed csrf cookie.
 */
export function validateCSRF(req: Request, res: Response, next: NextFunction): void {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  const headerCsrfToken = req.headers['x-csrf-token'] as string;
  const cookieCsrfToken = req.cookies?.[COOKIE_CONFIG.CSRF_TOKEN_COOKIE];

  if (!cookieCsrfToken || !headerCsrfToken || headerCsrfToken !== cookieCsrfToken) {
    res.status(403).json({
      success: false,
      error: 'CSRF token validation failed. Possible Cross-Site Request Forgery.',
    });
    return;
  }

  next();
}

/**
 * Role-Based Access Control Middleware
 */
export function requireRole(allowedRoles: Array<'student' | 'seller' | 'admin'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Forbidden: This action requires one of the following roles: [${allowedRoles.join(', ')}]`,
      });
      return;
    }

    next();
  };
}

export const requireAdmin = requireRole(['admin']);
export const requireSeller = requireRole(['seller', 'admin']);
