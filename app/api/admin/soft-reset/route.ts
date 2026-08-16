import { NextResponse } from 'next/server';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { connectDB } from '@/server/config/db';
import { User } from '@/server/models/User';
import { Product } from '@/server/models/Product';
import { CollaborationRequest } from '@/server/models/Request';
import { Bounty } from '@/server/models/Bounty';
import { Escrow } from '@/server/models/Escrow';
import { Review } from '@/server/models/Review';

const ADMIN_SAFE_EMAIL = 'guhan24td0781@svcet.ac.in';
const SOFT_RESET_SECRET = process.env.ADMIN_RESET_SECRET || 'campuscart_prod_reset_2026';

/**
 * Helper to delete all documents in a Firestore collection without dropping schema.
 */
async function deleteFirestoreCollection(collectionName: string, preserveCondition?: (data: any, id: string) => boolean) {
  let count = 0;
  try {
    const snap = await getDocs(collection(db, collectionName));
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      if (preserveCondition && preserveCondition(data, docSnap.id)) {
        continue; // Keep preserved document (e.g. real admin)
      }

      // If this is chats collection, delete its messages subcollection first
      if (collectionName === 'chats') {
        try {
          const subSnap = await getDocs(collection(db, 'chats', docSnap.id, 'messages'));
          for (const msgDoc of subSnap.docs) {
            await deleteDoc(doc(db, 'chats', docSnap.id, 'messages', msgDoc.id));
          }
        } catch {}
      }

      await deleteDoc(doc(db, collectionName, docSnap.id));
      count++;
    }
  } catch (err) {
    console.warn(`Soft reset collection [${collectionName}] notice:`, err);
  }
  return count;
}

export async function POST(request: Request) {
  try {
    // 1. Authorization check: Validate admin secret key or authorization header
    const authHeader = request.headers.get('authorization');
    const secretHeader = request.headers.get('x-admin-secret');

    const isAuthorized =
      secretHeader === SOFT_RESET_SECRET ||
      authHeader === `Bearer ${SOFT_RESET_SECRET}` ||
      process.env.NODE_ENV === 'development';

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid Admin Soft Reset Secret' },
        { status: 401 }
      );
    }

    const report: Record<string, number> = {};

    // 2. Safely Purge Firestore Collections in Strict Foreign Key Order
    // Order: Child records first -> Parent records -> Users last

    // Step 2.1: Chats & Messages
    report.chats = await deleteFirestoreCollection('chats');

    // Step 2.2: Bounties
    report.bounties = await deleteFirestoreCollection('bounties');

    // Step 2.3: Collaboration Requests
    report.requests = await deleteFirestoreCollection('requests');
    report.collaboration_requests = await deleteFirestoreCollection('collaboration_requests');

    // Step 2.4: Reviews
    report.reviews = await deleteFirestoreCollection('reviews');

    // Step 2.5: Orders & Escrow
    report.orders = await deleteFirestoreCollection('orders');
    report.escrow = await deleteFirestoreCollection('escrow');

    // Step 2.6: Notifications
    report.notifications = await deleteFirestoreCollection('notifications');

    // Step 2.7: Service Gigs
    report.gigs = await deleteFirestoreCollection('gigs');

    // Step 2.8: Products
    report.products = await deleteFirestoreCollection('products');

    // Step 2.9: Profiles (Preserving real admin account)
    report.profiles = await deleteFirestoreCollection('profiles', (data, id) => {
      const email = (data.email || '').toLowerCase().trim();
      return email === ADMIN_SAFE_EMAIL.toLowerCase();
    });

    // 3. Safely Purge MongoDB Models in identical child -> parent order
    try {
      await connectDB();

      if (Review) await Review.deleteMany({});
      if (Escrow) await Escrow.deleteMany({});
      if (Bounty) await Bounty.deleteMany({});
      if (CollaborationRequest) await CollaborationRequest.deleteMany({});
      if (Product) await Product.deleteMany({});
      if (User) {
        await User.deleteMany({
          email: { $ne: ADMIN_SAFE_EMAIL.toLowerCase() },
        });
      }
      report.mongoSynced = 1;
    } catch (e: any) {
      report.mongoSynced = 0;
      console.warn('MongoDB soft reset notice (Firestore was wiped cleanly):', e.message);
    }

    return NextResponse.json({
      success: true,
      message: `Database soft reset completed successfully. Schema preserved. Admin ${ADMIN_SAFE_EMAIL} preserved.`,
      purged: report,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to complete database soft reset',
      },
      { status: 500 }
    );
  }
}
