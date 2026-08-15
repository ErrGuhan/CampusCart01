import mongoose from 'mongoose';
import { Review } from '../models/Review';
import { User } from '../models/User';
import { Escrow } from '../models/Escrow';

export interface TrustScoreBreakdown {
  compositeScore: number;
  baseScore: number;
  timeDecayedReviewComponent: number;
  financialVolumeFactor: number;
  sybilDampingFactor: number;
  campusVerificationMultiplier: number;
  totalVerifiedOrders: number;
  disputePenalty: number;
}

/**
 * Algorithmic Trust Reputation System (TRS)
 * Computes a weighted, time-decayed, sybil-resistant reputation score (0 - 100).
 */
export async function calculateTrustScore(
  sellerId: string | mongoose.Types.ObjectId
): Promise<TrustScoreBreakdown> {
  const seller = await User.findById(sellerId);
  if (!seller) {
    throw new Error('Seller user not found for trust computation.');
  }

  // 1. Fetch all reviews for this seller
  const reviews = await Review.find({ sellerId }).sort({ createdAt: -1 });

  // 2. Fetch all completed escrow orders and disputes
  const escrows = await Escrow.find({ sellerId });
  const completedOrders = escrows.filter((e) => e.status === 'RELEASED').length;
  const disputedOrders = escrows.filter((e) => e.status === 'DISPUTED').length;

  const BASE_TRUST_SCORE = 50.0;
  const DECAY_LAMBDA = 0.015; // Review weight halves every ~46 days
  const now = Date.now();

  let weightedReviewSum = 0;
  let totalReviewWeights = 0;

  // Track IP and Buyer frequencies to counteract Sybil attacks
  const ipOccurrences: Record<string, number> = {};
  const buyerOccurrences: Record<string, number> = {};

  for (const r of reviews) {
    ipOccurrences[r.buyerIp] = (ipOccurrences[r.buyerIp] || 0) + 1;
    const buyerKey = r.buyerId.toString();
    buyerOccurrences[buyerKey] = (buyerOccurrences[buyerKey] || 0) + 1;
  }

  for (const review of reviews) {
    const ageInDays = Math.max(0, (now - new Date(review.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    // A. Exponential Time Decay: w_time = e^(-lambda * days)
    const timeDecayWeight = Math.exp(-DECAY_LAMBDA * ageInDays);

    // B. Financial Magnitude Scaling: w_vol = log10(amount + 10) (e.g. $10 -> 1.3, $100 -> 2.04, $1000 -> 3.0)
    const volumeMagnitude = Math.log10(Math.max(1, review.transactionAmount) + 10);

    // C. Sybil Attack Resistance Factor:
    // Damping penalty for multiple reviews from same IP or same buyer
    const ipClusterCount = ipOccurrences[review.buyerIp] || 1;
    const buyerPairCount = buyerOccurrences[review.buyerId.toString()] || 1;
    const sybilDamping = (1 / Math.sqrt(ipClusterCount)) * (1 / Math.sqrt(buyerPairCount));

    // Net weight for this individual review
    const netWeight = timeDecayWeight * volumeMagnitude * sybilDamping;

    // Rating normalized [-1 to +1] where 3 is neutral (0), 5 is +1, 1 is -1
    const normalizedRating = (review.rating - 3) / 2;

    weightedReviewSum += normalizedRating * netWeight;
    totalReviewWeights += netWeight;
  }

  // Calculate review impact (scaled up to +/- 30 points)
  const reviewImpact =
    totalReviewWeights > 0 ? (weightedReviewSum / totalReviewWeights) * 30 : 0;

  // Volume factor bonus: rewards proven volume up to +15 points
  const volumeFactor = Math.min(15, Math.log2(completedOrders + 1) * 3.5);

  // Dispute penalty: -15 points per active disputed order
  const disputePenalty = Math.min(40, disputedOrders * 15);

  // Campus Institutional Verification Multiplier (1.25x for verified .edu/.ac.in accounts)
  const campusMultiplier = seller.isVerified ? 1.25 : 1.0;

  // Raw score summation
  let rawScore = (BASE_TRUST_SCORE + reviewImpact + volumeFactor - disputePenalty) * campusMultiplier;

  // Clamp within bounded [0, 100] interval
  const finalTrustScore = Math.max(0, Math.min(100, Math.round(rawScore * 10) / 10));

  // Update seller profile in DB
  seller.trustScore = finalTrustScore;
  await seller.save();

  return {
    compositeScore: finalTrustScore,
    baseScore: BASE_TRUST_SCORE,
    timeDecayedReviewComponent: Math.round(reviewImpact * 10) / 10,
    financialVolumeFactor: Math.round(volumeFactor * 10) / 10,
    sybilDampingFactor: reviews.length > 0 ? Math.round((totalReviewWeights / reviews.length) * 100) / 100 : 1.0,
    campusVerificationMultiplier: campusMultiplier,
    totalVerifiedOrders: completedOrders,
    disputePenalty,
  };
}
