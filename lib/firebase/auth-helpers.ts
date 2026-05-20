/**
 * Server-side Firebase auth helpers.
 *
 * Use these in Server Actions and Route Handlers instead of trusting
 * caller-supplied userId strings.
 *
 * NEVER import this file from client components — it uses the Admin SDK.
 */

import { adminAuth } from '@/lib/firebase/admin';

/**
 * Verify a Firebase ID token and return the caller's uid.
 * Throws 'Unauthenticated' on missing / expired / invalid token.
 */
export async function verifyIdToken(token: string): Promise<string> {
  if (!token) throw new Error('Unauthenticated');
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    throw new Error('Unauthenticated');
  }
}

/**
 * Verify a Firebase ID token AND assert the caller's email is in the admin list.
 *
 * Reads the ADMIN_EMAILS env var (server-only, comma-separated).
 * Falls back to NEXT_PUBLIC_ADMIN_EMAILS so existing Vercel deployments work
 * without adding a new env var.
 *
 * Throws 'Forbidden' if the verified email is not in the list.
 */
export async function assertAdmin(token: string): Promise<void> {
  if (!token) throw new Error('Unauthenticated');

  const raw =
    process.env.ADMIN_EMAILS ??
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ??
    '';
  const adminEmails = new Set(
    raw.split(',').map((e) => e.trim()).filter(Boolean),
  );

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded.email || !adminEmails.has(decoded.email)) {
      throw new Error('Forbidden');
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'Forbidden') throw err;
    throw new Error('Unauthenticated');
  }
}
