import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authRateLimiter } from '../middleware/rateLimiter';
import { authenticateJWT, validateCSRF } from '../middleware/auth';

const router = Router();

// Public auth endpoints with strict IP rate limiting
router.post('/register', authRateLimiter, AuthController.register);
router.post('/login', authRateLimiter, AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// Protected auth endpoints
router.get('/me', authenticateJWT, AuthController.getMe);

export default router;
