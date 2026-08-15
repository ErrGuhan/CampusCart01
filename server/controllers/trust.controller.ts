import { Request, Response } from 'express';
import { calculateTrustScore } from '../services/trust-engine.service';
import { Review } from '../models/Review';
import { AuthenticatedRequest } from '../middleware/auth';

export class TrustController {
  /**
   * Calculate and retrieve algorithmic Trust Score for a seller
   * GET /api/trust/:sellerId
   */
  public static async getSellerTrustScore(req: Request, res: Response): Promise<void> {
    try {
      const sellerId = req.params.sellerId as string;
      const breakdown = await calculateTrustScore(sellerId);

      res.status(200).json({
        success: true,
        sellerId,
        data: breakdown,
      });
    } catch (err: any) {
      console.error('[Trust Controller] Error:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to compute trust score.' });
    }
  }

  /**
   * Submit transaction review with Sybil detection IP recording
   * POST /api/trust/review
   */
  public static async submitReview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const { transactionId, sellerId, rating, comment, transactionAmount } = req.body;

      if (!transactionId || !sellerId || !rating) {
        res.status(400).json({ success: false, error: 'Missing required review fields.' });
        return;
      }

      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

      const review = new Review({
        transactionId,
        sellerId,
        buyerId: req.user.userId,
        rating: Math.max(1, Math.min(5, Number(rating))),
        comment: comment || '',
        transactionAmount: Number(transactionAmount) || 0,
        buyerIp: clientIp,
        isVerifiedPurchase: true,
      });

      await review.save();

      // Recalculate TRS score dynamically
      const updatedTrust = await calculateTrustScore(sellerId);

      res.status(201).json({
        success: true,
        message: 'Review submitted. Seller Trust Reputation score updated.',
        updatedTrust,
      });
    } catch (err: any) {
      console.error('[Trust Controller] Submit Review Error:', err);
      res.status(400).json({ success: false, error: err.message || 'Review submission failed.' });
    }
  }
}
