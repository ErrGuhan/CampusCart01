import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { uploadMiddleware, validateMagicBytes } from '../middleware/upload';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { authenticateJWT, validateCSRF } from '../middleware/auth';

const router = Router();

// Hardened upload route: Authentication -> Rate Limit -> Multer Memory Buffer -> Magic Byte Validation -> File Persistence
router.post(
  '/',
  authenticateJWT,
  validateCSRF,
  uploadRateLimiter,
  uploadMiddleware.single('file'),
  validateMagicBytes,
  UploadController.uploadFile
);

export default router;
