import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import uploadRoutes from './upload.routes';
import escrowRoutes from './escrow.routes';
import trustRoutes from './trust.routes';
import mlRoutes from './ml.routes';
import userRoutes from './users.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/upload', uploadRoutes);
router.use('/escrow', escrowRoutes);
router.use('/trust', trustRoutes);
router.use('/analytics', mlRoutes);
router.use('/users', userRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'CampusCart Core API Engine',
    timestamp: new Date().toISOString(),
    security: {
      statelessJWT: 'HttpOnly; SameSite=Strict; Secure',
      csrfProtection: 'Enabled (Double Submit Cookie)',
      rateLimiting: 'Enabled',
      magicByteValidation: 'Active',
      spatialIndex: '2dsphere',
      zeroTrustEscrow: 'Active',
    },
  });
});

export default router;
