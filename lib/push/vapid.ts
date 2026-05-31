/**
 * Web Push / VAPID configuration.
 * Import `webpush` from here (not from the package directly) so VAPID details
 * are always set before any sendNotification call.
 */
import webpush from 'web-push';

const subject    = process.env.VAPID_SUBJECT    ?? '';
const publicKey  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
const privateKey = process.env.VAPID_PRIVATE_KEY ?? '';

if (subject && publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export { webpush };

/** Returns the VAPID public key (safe to expose to the browser). */
export function getVapidPublicKey(): string {
  return publicKey;
}
