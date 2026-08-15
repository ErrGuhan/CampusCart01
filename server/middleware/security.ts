import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import path from 'path';

/**
 * Configure Helmet with strict Content Security Policy and defensive headers
 */
export const helmetSecurityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://images.pexels.com', 'https://images.unsplash.com', 'https://*.googleusercontent.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'https://*.firebaseio.com', 'https://*.supabase.co', 'wss://*.firebaseio.com'],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

/**
 * Path Traversal Prevention Middleware
 * Inspects all request params, queries, and path parameters for directory traversal patterns ('..', '%2e%2e', null bytes).
 */
export function preventPathTraversal(req: Request, res: Response, next: NextFunction): void {
  const checkValue = (val: any): boolean => {
    if (typeof val === 'string') {
      const decoded = decodeURIComponent(val);
      // Detect null bytes, relative traversal, or absolute disk indicators
      if (
        decoded.includes('..') ||
        decoded.includes('\0') ||
        decoded.includes('\\..') ||
        decoded.includes('/..') ||
        decoded.startsWith('/') ||
        /^[a-zA-Z]:\\/.test(decoded)
      ) {
        return true;
      }
    } else if (typeof val === 'object' && val !== null) {
      return Object.values(val).some(checkValue);
    }
    return false;
  };

  // Inspect params and query
  if (checkValue(req.params) || checkValue(req.query)) {
    res.status(400).json({
      success: false,
      error: 'Security alert: Invalid characters or directory traversal sequence detected in request.',
    });
    return;
  }

  next();
}

/**
 * Safe path resolver ensuring requested files remain within intended directories
 */
export function resolveSafePath(baseDir: string, userPath: string): string {
  const safeBase = path.resolve(baseDir);
  const resolved = path.resolve(baseDir, userPath);

  if (!resolved.startsWith(safeBase)) {
    throw new Error('Access denied: Path traversal outside base boundary.');
  }

  return resolved;
}
