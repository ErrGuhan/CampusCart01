import { Router } from 'express';
import { EscrowController } from '../controllers/escrow.controller';
import { otpVerificationLimiter } from '../middleware/rateLimiter';
import { authenticateJWT, validateCSRF } from '../middleware/auth';

const router = Router();

// Protected Escrow Endpoints
router.post('/initiate', authenticateJWT, validateCSRF, EscrowController.initiateEscrow);
router.post('/verify-release', authenticateJWT, validateCSRF, otpVerificationLimiter, EscrowController.verifyAndRelease);
router.get('/:orderId', authenticateJWT, EscrowController.getEscrowDetails);

export default router;
