'use server';

import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Mark a user as verified crew on their first successful roster parse.
 * Idempotent — only writes if verifiedAt is not already set.
 */
export async function setVerifiedAt(userId: string): Promise<void> {
  const ref = adminDb.collection('profiles').doc(userId);
  const snap = await ref.get();

  // Already verified — skip the write
  if (snap.exists && snap.data()?.verifiedAt) return;

  await ref.set({ verifiedAt: Timestamp.now() }, { merge: true });
}

/**
 * Returns true if the user has verifiedAt set in their profile.
 * Used server-side when creating listings.
 */
export async function isVerifiedCrew(userId: string): Promise<boolean> {
  const snap = await adminDb.collection('profiles').doc(userId).get();
  return !!(snap.exists && snap.data()?.verifiedAt);
}
