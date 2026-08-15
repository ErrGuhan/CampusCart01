import { Response } from 'express';
import { EscrowService } from '../services/escrow.service';
import { Escrow } from '../models/Escrow';
import { AuthenticatedRequest } from '../middleware/auth';

export class EscrowController {
  /**
   * Initiate Escrow Deposit & Lock Inventory
   * POST /api/escrow/initiate
   */
  public static async initiateEscrow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const { productId, sellerId, amount, handoverLocation } = req.body;

      if (!productId || !sellerId || !amount) {
        res.status(400).json({
          success: false,
          error: 'productId, sellerId, and amount are required to open an escrow.',
        });
        return;
      }

      const orderId = 'escrow_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);

      const { escrow, plainOtp } = await EscrowService.initiateEscrowHold({
        orderId,
        productId,
        buyerId: req.user.userId,
        sellerId,
        amount: Number(amount),
        handoverLocation,
      });

      res.status(201).json({
        success: true,
        message: 'Funds held securely in zero-trust escrow. In-person handover OTP generated.',
        data: {
          orderId: escrow.orderId,
          status: escrow.status,
          amount: escrow.amount,
          netSellerPayout: escrow.netSellerPayout,
          buyerOtp: plainOtp, // Presented exclusively to the buyer to share at handover
          otpExpiresAt: escrow.otpExpiresAt,
          handoverLocation: escrow.handoverLocation,
        },
      });
    } catch (err: any) {
      console.error('[Escrow Controller] Initiate Error:', err);
      res.status(400).json({ success: false, error: err.message || 'Failed to initiate escrow.' });
    }
  }

  /**
   * Verify Physical Handover OTP & Release Funds
   * POST /api/escrow/verify-release
   */
  public static async verifyAndRelease(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const { orderId, otp } = req.body;

      if (!orderId || !otp) {
        res.status(400).json({
          success: false,
          error: 'orderId and 6-digit OTP are required for escrow release.',
        });
        return;
      }

      const result = await EscrowService.verifyHandoverAndReleaseFunds({
        orderId,
        sellerId: req.user.userId,
        submittedOtp: otp.toString(),
      });

      res.status(200).json(result);
    } catch (err: any) {
      console.error('[Escrow Controller] Verify Release Error:', err);
      res.status(400).json({ success: false, error: err.message || 'Escrow verification failed.' });
    }
  }

  /**
   * Get Escrow Status by Order ID
   */
  public static async getEscrowDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const escrow = await Escrow.findOne({ orderId })
        .populate('productId', 'title price images condition')
        .populate('sellerId', 'displayName username trustScore')
        .populate('buyerId', 'displayName username');

      if (!escrow) {
        res.status(404).json({ success: false, error: 'Escrow order not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        data: escrow,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to retrieve escrow status.' });
    }
  }
}
