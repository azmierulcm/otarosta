'use server';

import { adminDb } from '@/lib/firebase/admin';
import { verifyIdToken } from '@/lib/firebase/auth-helpers';

export interface ProfileData {
  full_name?: string;
  rank?: string;
  airline?: string;
  fleet?: string;
  base?: string;
  bio?: string;
}

/**
 * Upsert the caller's own profile.
 *
 * `token` is a Firebase ID token obtained via `user.getIdToken()` on the client.
 * The uid is always derived server-side from the verified token — callers cannot
 * write to an arbitrary profile document.
 */
export async function saveProfile(
  token: string,
  data: ProfileData,
): Promise<{ ok: boolean; error?: string }> {
  let uid: string;
  try {
    uid = await verifyIdToken(token);
  } catch {
    return { ok: false, error: 'Unauthenticated' };
  }

  try {
    await adminDb
      .collection('profiles')
      .doc(uid)
      .set(data, { merge: true });
    return { ok: true };
  } catch (err) {
    console.error('[saveProfile] Firestore write failed:', err);
    return { ok: false, error: String(err) };
  }
}
