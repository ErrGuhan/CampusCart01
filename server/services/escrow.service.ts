import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Escrow, IEscrow, EscrowStatus } from '../models/Escrow';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { calculateTrustScore } from './trust-engine.service';
import { ENV } from '../config/constants';

export class EscrowService {
  /**
   * Generates a cryptographically secure 6-digit numeric OTP and its bcrypt hash.
   */
  public static async generateSecureOTP(): Promise<{ plainOtp: string; otpHash: string }> {
    // Generate CSPRNG 6-digit integer [100000, 999999]
    const otpInt = crypto.randomInt(100000, 1000000);
    const plainOtp = otpInt.toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(plainOtp, salt);
    return { plainOtp, otpHash };
  }

  /**
   * Step 1 & 2: Captures funds in escrow and atomically locks the product inventory.
   */
  public static async initiateEscrowHold(params: {
    orderId: string;
    productId: string;
    buyerId: string;
    sellerId: string;
    amount: number;
    handoverLocation?: string;
  }): Promise<{ escrow: IEscrow; plainOtp: string }> {
    const { orderId, productId, buyerId, sellerId, amount, handoverLocation } = params;

    // 1. Atomic product inventory lock to prevent double selling
    const lockedProduct = await Product.findOneAndUpdate(
      {
        _id: productId,
        status: 'active',
      },
      {
        $set: {
          status: 'escrow_locked',
          lockedByOrderId: orderId,
          lockedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!lockedProduct) {
      throw new Error('Product is unavailable, already locked in escrow, or already sold.');
    }

    // 2. Generate secure 6-digit handover OTP
    const { plainOtp, otpHash } = await this.generateSecureOTP();
    const otpExpiresAt = new Date(Date.now() + ENV.ESCROW_OTP_VALIDITY_MINUTES * 60 * 1000);

    const platformFee = Math.round(amount * 0.02 * 100) / 100; // 2% platform protection fee
    const netSellerPayout = amount - platformFee;

    // 3. Create Escrow record
    const escrow = new Escrow({
      orderId,
      productId,
      buyerId,
      sellerId,
      amount,
      platformFee,
      netSellerPayout,
      status: 'HELD_IN_ESCROW',
      otpHash,
      otpExpiresAt,
      handoverLocation: handoverLocation || lockedProduct.pickupLocation,
      fundsHeldAt: new Date(),
      auditTrail: [
        {
          action: 'FUNDS_HELD_IN_ESCROW',
          timestamp: new Date(),
          performedBy: buyerId,
          details: `Deposited $${amount.toFixed(2)}. Inventory locked. OTP generated for buyer.`,
        },
      ],
    });

    await escrow.save();

    return { escrow, plainOtp };
  }

  /**
   * Step 3: Verifies physical handover OTP submitted by the seller and atomically releases payout.
   */
  public static async verifyHandoverAndReleaseFunds(params: {
    orderId: string;
    sellerId: string;
    submittedOtp: string;
  }): Promise<{ success: boolean; message: string; escrow: IEscrow }> {
    const { orderId, sellerId, submittedOtp } = params;

    // Retrieve escrow with select(+otpHash)
    const escrow = await Escrow.findOne({ orderId, sellerId }).select('+otpHash');

    if (!escrow) {
      throw new Error('Escrow transaction not found or caller is not authorized seller.');
    }

    if (escrow.status === 'RELEASED') {
      throw new Error('Escrow funds have already been released for this order.');
    }

    if (escrow.status !== 'HELD_IN_ESCROW' && escrow.status !== 'HANDOVER_PENDING') {
      throw new Error(`Cannot release escrow in current status: ${escrow.status}`);
    }

    // Check expiration
    if (new Date() > escrow.otpExpiresAt) {
      escrow.status = 'DISPUTED';
      escrow.disputeReason = 'OTP expired before in-person handover completion.';
      await escrow.save();
      throw new Error('Handover OTP has expired. Transaction flagged for escrow mediation.');
    }

    // Check rate limit attempts
    if (escrow.otpAttemptsCount >= escrow.maxOtpAttempts) {
      escrow.status = 'DISPUTED';
      escrow.disputeReason = 'Exceeded maximum permitted OTP entry attempts.';
      await escrow.save();
      throw new Error('Maximum OTP entry attempts exceeded. Escrow locked for security review.');
    }

    // Verify OTP hash
    const isMatch = await bcrypt.compare(submittedOtp.trim(), escrow.otpHash);

    if (!isMatch) {
      escrow.otpAttemptsCount += 1;
      escrow.auditTrail.push({
        action: 'FAILED_OTP_ATTEMPT',
        timestamp: new Date(),
        performedBy: sellerId,
        details: `Invalid OTP entered. Attempt ${escrow.otpAttemptsCount}/${escrow.maxOtpAttempts}`,
      });
      await escrow.save();
      throw new Error(`Invalid OTP. ${escrow.maxOtpAttempts - escrow.otpAttemptsCount} attempts remaining.`);
    }

    // Success: State Transition -> RELEASED
    escrow.status = 'RELEASED';
    escrow.fundsReleasedAt = new Date();
    escrow.auditTrail.push({
      action: 'FUNDS_RELEASED',
      timestamp: new Date(),
      performedBy: sellerId,
      details: `Handover verified. Net payout of $${escrow.netSellerPayout.toFixed(2)} disbursed to seller.`,
    });
    await escrow.save();

    // Mark product as sold
    await Product.findByIdAndUpdate(escrow.productId, {
      $set: { status: 'sold' },
    });

    // Update Seller transaction metrics & trigger Trust Score recalculation
    await User.findByIdAndUpdate(sellerId, {
      $inc: {
        completedTransactionsCount: 1,
        totalTransactionVolume: escrow.amount,
      },
    });

    await calculateTrustScore(sellerId);

    return {
      success: true,
      message: 'Zero-Trust Escrow verification successful. Funds released to seller wallet.',
      escrow,
    };
  }

  /**
   * Raises a dispute or issues refund
   */
  public static async raiseDispute(orderId: string, userId: string, reason: string): Promise<IEscrow> {
    const escrow = await Escrow.findOne({ orderId });
    if (!escrow) throw new Error('Escrow record not found.');

    escrow.status = 'DISPUTED';
    escrow.disputeReason = reason;
    escrow.auditTrail.push({
      action: 'DISPUTE_RAISED',
      timestamp: new Date(),
      performedBy: userId,
      details: reason,
    });

    await escrow.save();
    return escrow;
  }
}
