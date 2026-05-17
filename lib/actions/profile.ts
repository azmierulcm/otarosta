'use server';

import { adminDb } from '@/lib/firebase/admin';

export interface ProfileData {
  full_name?: string;
  rank?: string;
  airline?: string;
  fleet?: string;
  base?: string;
  bio?: string;
}

/**
 * Upsert a user's profile in Firestore.
 * Safe to call on every save — uses merge so it never clobbers
 * fields we don't explicitly set (e.g. verifiedAt).
 */
export async function saveProfile(userId: string, data: ProfileData): Promise<void> {
  await adminDb
    .collection('profiles')
    .doc(userId)
    .set(data, { merge: true });
}
