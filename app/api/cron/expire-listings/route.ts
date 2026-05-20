import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Vercel Cron Job — runs daily at 02:00 UTC.
 * Deletes all listings whose expiresAt timestamp has passed.
 * Secured by CRON_SECRET header (set in Vercel env + vercel.json).
 */
export async function GET(req: NextRequest) {
  // Verify the request comes from Vercel Cron (or an authorised caller).
  // Guard: if CRON_SECRET is not set the route must refuse all requests —
  // otherwise `'Bearer undefined'` would be a valid secret.
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now  = Timestamp.now();
  const snap = await adminDb
    .collection('listings')
    .where('expiresAt', '<=', now)
    .get();

  if (snap.empty) {
    return NextResponse.json({ deleted: 0 });
  }

  // Batch-delete in chunks of 500 (Firestore limit)
  let deleted = 0;
  const chunks: FirebaseFirestore.DocumentReference[][] = [];
  const refs = snap.docs.map((d) => d.ref);
  for (let i = 0; i < refs.length; i += 500) {
    chunks.push(refs.slice(i, i + 500));
  }

  for (const chunk of chunks) {
    const batch = adminDb.batch();
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
    deleted += chunk.length;
  }

  console.log(`[expire-listings] deleted ${deleted} expired listings`);
  return NextResponse.json({ deleted });
}
