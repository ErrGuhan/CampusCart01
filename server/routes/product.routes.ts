import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { searchRateLimiter } from '../middleware/rateLimiter';
import { authenticateJWT, validateCSRF } from '../middleware/auth';

const router = Router();

// Public product routes with spatial rate limiting & cursor pagination
router.get('/', searchRateLimiter, ProductController.getProducts);
router.get('/nearby', searchRateLimiter, ProductController.getNearbyProducts);
router.get('/:id', ProductController.getProductById);

// Protected routes (requires login + CSRF token)
router.post('/', authenticateJWT, validateCSRF, ProductController.createProduct);

export default router;
