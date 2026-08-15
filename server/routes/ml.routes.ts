import { Router } from 'express';
import { MLController } from '../controllers/ml.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth';

const router = Router();

// Telemetry ingestion endpoint
router.post('/telemetry/event', MLController.logTelemetryEvent);

// Churn prediction endpoint (Admin/Internal analytics)
router.get('/churn/:userId', authenticateJWT, MLController.evaluateChurnRisk);

export default router;
