/**
 * CampusCart Production Database Soft-Reset CLI Utility
 * 
 * Safely purges dummy data from database tables/collections
 * without destroying schemas, indexes, or the real admin user.
 * 
 * Run with: npx tsx scripts/soft-reset.ts
 */

import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { connectDB } from '../server/config/db';
import { User } from '../server/models/User';
import { Product } from '../server/models/Product';
import { CollaborationRequest } from '../server/models/Request';
import { Bounty } from '../server/models/Bounty';
import { Escrow } from '../server/models/Escrow';
import { Review } from '../server/models/Review';

const ADMIN_SAFE_EMAIL = 'guhan24td0781@svcet.ac.in';

async function purgeFirestore() {
  console.log('🔄 [1/2] Beginning Firestore collections soft reset...');
  const collections = [
    'chats',
    'bounties',
    'requests',
    'collaboration_requests',
    'reviews',
    'orders',
    'escrow',
    'notifications',
    'gigs',
    'products',
  ];

  for (const colName of collections) {
    try {
      const snap = await getDocs(collection(db, colName));
      for (const d of snap.docs) {
        if (colName === 'chats') {
          const sub = await getDocs(collection(db, 'chats', d.id, 'messages'));
          for (const msg of sub.docs) {
            await deleteDoc(doc(db, 'chats', d.id, 'messages', msg.id));
          }
        }
        await deleteDoc(doc(db, colName, d.id));
      }
      console.log(`  ✓ Cleared ${snap.size} records from [${colName}]`);
    } catch (e) {
      console.warn(`  ⚠ Notice in collection [${colName}]:`, e);
    }
  }

  // Purge profiles preserving real admin
  try {
    const profSnap = await getDocs(collection(db, 'profiles'));
    let preserved = 0;
    let deleted = 0;
    for (const d of profSnap.docs) {
      const data = d.data();
      if ((data.email || '').toLowerCase().trim() === ADMIN_SAFE_EMAIL.toLowerCase()) {
        preserved++;
        continue;
      }
      await deleteDoc(doc(db, 'profiles', d.id));
      deleted++;
    }
    console.log(`  ✓ Cleared ${deleted} profiles (Preserved ${preserved} admin profile)`);
  } catch (e) {
    console.warn(`  ⚠ Notice in [profiles]:`, e);
  }
}

async function purgeMongoDB() {
  console.log('\n🔄 [2/2] Beginning MongoDB models soft reset...');
  try {
    await connectDB();

    if (Review) await Review.deleteMany({});
    if (Escrow) await Escrow.deleteMany({});
    const resBounties = await Bounty.deleteMany({});
    console.log(`  ✓ Cleared ${resBounties.deletedCount} CampusBounties`);

    const resRequests = await CollaborationRequest.deleteMany({});
    console.log(`  ✓ Cleared ${resRequests.deletedCount} CollaborationRequests`);

    const resProducts = await Product.deleteMany({});
    console.log(`  ✓ Cleared ${resProducts.deletedCount} Products`);

    const resUsers = await User.deleteMany({
      email: { $ne: ADMIN_SAFE_EMAIL.toLowerCase() },
    });
    console.log(`  ✓ Cleared ${resUsers.deletedCount} Users (Preserved admin: ${ADMIN_SAFE_EMAIL})`);
  } catch (e: any) {
    console.log(`  ℹ MongoDB notice: ${e.message}`);
  }
}

async function main() {
  console.log('====================================================');
  console.log('🚀 CampusCart Production Soft-Reset Script');
  console.log(`🔒 Preserved Admin: ${ADMIN_SAFE_EMAIL}`);
  console.log('====================================================\n');

  await purgeFirestore();
  await purgeMongoDB();

  console.log('\n✨ Database soft reset completed. Ready for fresh production launch!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error during soft reset:', err);
  process.exit(1);
});
