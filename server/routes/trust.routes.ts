import { Router } from 'express';
import { TrustController } from '../controllers/trust.controller';
import { authenticateJWT, validateCSRF } from '../middleware/auth';

const router = Router();

router.get('/:sellerId', TrustController.getSellerTrustScore);
router.post('/review', authenticateJWT, validateCSRF, TrustController.submitReview);

export default router;
