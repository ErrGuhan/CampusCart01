import { Request, Response } from 'express';
import { Telemetry } from '../models/Telemetry';
import { MLChurnPredictionPipeline } from '../services/ml-churn.service';
import { AuthenticatedRequest } from '../middleware/auth';

export class MLController {
  /**
   * Logs a behavioral telemetry event (session duration, message reply latency, etc.)
   * POST /api/telemetry/event
   */
  public static async logTelemetryEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        eventType,
        sessionDurationSeconds,
        messageLatencySeconds,
        listingFrequencyMonthly,
        transactionVolumeDollars,
        cartAbandonmentsCount,
        metadata,
      } = req.body;

      const userId = req.user?.userId || req.body.userId;
      if (!userId || !eventType) {
        res.status(400).json({ success: false, error: 'userId and eventType are required.' });
        return;
      }

      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'];

      const event = new Telemetry({
        userId,
        eventType,
        sessionDurationSeconds: Number(sessionDurationSeconds) || 0,
        messageLatencySeconds: Number(messageLatencySeconds) || 0,
        listingFrequencyMonthly: Number(listingFrequencyMonthly) || 0,
        transactionVolumeDollars: Number(transactionVolumeDollars) || 0,
        cartAbandonmentsCount: Number(cartAbandonmentsCount) || 0,
        ipAddress: clientIp,
        userAgent,
        metadata,
      });

      await event.save();

      res.status(201).json({ success: true, message: 'Telemetry recorded.' });
    } catch (err: any) {
      console.error('[ML Controller] Telemetry Logging Error:', err);
      res.status(500).json({ success: false, error: 'Failed to record telemetry.' });
    }
  }

  /**
   * Run ML Churn prediction for a user
   * GET /api/ml/churn/:userId
   */
  public static async evaluateChurnRisk(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId as string;
      const prediction = await MLChurnPredictionPipeline.predictChurn(userId);

      res.status(200).json({
        success: true,
        data: prediction,
      });
    } catch (err: any) {
      console.error('[ML Controller] Churn Evaluation Error:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to evaluate churn risk.' });
    }
  }
}
