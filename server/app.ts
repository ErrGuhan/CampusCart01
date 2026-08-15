import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { ENV } from './config/constants';
import { helmetSecurityMiddleware, preventPathTraversal } from './middleware/security';
import { globalRateLimiter } from './middleware/rateLimiter';
import apiRouter from './routes/api.routes';

const app: Express = express();

// 1. Edge & Security Headers (Helmet)
app.use(helmetSecurityMiddleware);

// 2. CORS configuration with strict credentials support for HttpOnly cookies
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server or whitelisted client origins / vercel deployment subdomains
      if (!origin || ENV.ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
    exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  })
);

// 3. Body Parsing with strict body size boundaries
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// 4. Global Layered Rate Limiter (100 req / 15 mins)
app.use(globalRateLimiter);

// 5. Path Traversal Shield
app.use(preventPathTraversal);

// 6. Static Uploads Serving
app.use(
  '/uploads',
  express.static(path.resolve(process.cwd(), 'public', ENV.UPLOAD_DIR), {
    dotfiles: 'ignore',
    etag: true,
    maxAge: '7d',
  })
);

// 7. API Routes
app.use('/api', apiRouter);

// 8. 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found on CampusCart API engine.`,
  });
});

// 9. Global Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[CampusCart Server Error]:', err);

  // Multer Error formatting
  if (err.name === 'MulterError') {
    res.status(413).json({
      success: false,
      error: `File upload error: ${err.message}`,
    });
    return;
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error.',
  });
});

export default app;
