import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { verifyIdToken } from '@/lib/firebase/auth-helpers';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * POST /api/push/subscribe
 * Stores a browser PushSubscription for the authenticated user.
 * Body: { endpoint, keys: { p256dh, auth } }
 */
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? '';
  const userId = await verifyIdToken(token).catch(() => null);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: 'Missing subscription fields' }, { status: 400 });
  }

  // Hash endpoint → stable doc ID (avoids storing PII in Firestore doc IDs)
  const id = createHash('sha256').update(body.endpoint).digest('hex').slice(0, 20);

  await adminDb
    .collection('push_subscriptions')
    .doc(userId)
    .collection('subscriptions')
    .doc(id)
    .set({
      endpoint:  body.endpoint,
      keys:      { p256dh: body.keys.p256dh, auth: body.keys.auth },
      createdAt: Timestamp.now(),
    });

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/push/subscribe
 * Removes a push subscription by endpoint hash.
 * Body: { endpoint }
 */
export async function DELETE(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? '';
  const userId = await verifyIdToken(token).catch(() => null);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { endpoint } = await req.json().catch(() => ({}));
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });

  const id = createHash('sha256').update(endpoint).digest('hex').slice(0, 20);
  await adminDb
    .collection('push_subscriptions')
    .doc(userId)
    .collection('subscriptions')
    .doc(id)
    .delete();

  return NextResponse.json({ ok: true });
}
