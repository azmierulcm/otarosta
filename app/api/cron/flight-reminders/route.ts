import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { webpush } from '@/lib/push/vapid';

/**
 * GET /api/cron/flight-reminders
 * Vercel Cron — runs every 30 minutes.
 *
 * Queries `flight_reminders` for documents whose `sendAt` falls within the
 * next WINDOW_MS window (overlap is intentional — prevents gaps between runs).
 * For each match, sends a Web Push notification to every subscription the user
 * has registered, then marks the reminder as sent.
 *
 * Expired subscriptions (410/404 responses) are deleted automatically.
 */

const WINDOW_MS = 35 * 60 * 1000; // 35-minute look-ahead (runs every 30 min)
const MAX_LATE_MS = 60 * 60 * 1000; // skip reminders > 60 min overdue

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now      = Date.now();
  const cutoff   = Timestamp.fromMillis(now + WINDOW_MS);

  // ── Query: unsent reminders due within the next 35 minutes ───────────────
  const snap = await adminDb
    .collection('flight_reminders')
    .where('sent',   '==', false)
    .where('sendAt', '<=', cutoff)
    .get();

  if (snap.empty) return NextResponse.json({ sent: 0, skipped: 0, failed: 0 });

  let sent = 0, skipped = 0, failed = 0;

  for (const doc of snap.docs) {
    const r        = doc.data();
    const sendAtMs = (r.sendAt as Timestamp).toMillis();

    // ── Skip if reminder is more than 60 min overdue ─────────────────────
    if (sendAtMs < now - MAX_LATE_MS) {
      await doc.ref.update({ sent: true, sentAt: Timestamp.now(), stale: true });
      skipped++;
      continue;
    }

    // ── Fetch user's push subscriptions ──────────────────────────────────
    const subsSnap = await adminDb
      .collection('push_subscriptions')
      .doc(r.userId as string)
      .collection('subscriptions')
      .get();

    if (subsSnap.empty) {
      await doc.ref.update({ sent: true, sentAt: Timestamp.now(), noSub: true });
      skipped++;
      continue;
    }

    // ── Build notification payload ────────────────────────────────────────
    const flightLabel = r.flightNo ? `✈️ ${r.flightNo}` : '✈️ Flight';
    const payload = JSON.stringify({
      title: `${flightLabel} — 6 hours to go`,
      body:  `${r.from} → ${r.to}  ·  Departs ${r.std}  ·  Tap to open roster`,
      tag:   `flight-${r.flightNo}-${r.date}`,
      url:   '/',
    });

    // ── Send to every registered subscription ────────────────────────────
    const results = await Promise.allSettled(
      subsSnap.docs.map(async (subDoc) => {
        const sub = subDoc.data();
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint as string,
              keys: {
                p256dh: sub.keys.p256dh as string,
                auth:   sub.keys.auth   as string,
              },
            },
            payload,
          );
        } catch (err: unknown) {
          const status = (err as { statusCode?: number }).statusCode;
          // 410 Gone / 404 = subscription expired; remove it
          if (status === 410 || status === 404) await subDoc.ref.delete();
          throw err;
        }
      }),
    );

    const allFailed = results.every((r) => r.status === 'rejected');

    if (allFailed) {
      failed++;
    } else {
      await doc.ref.update({ sent: true, sentAt: Timestamp.now() });
      sent++;
    }
  }

  console.log(JSON.stringify({ event: 'FLIGHT_REMINDERS_CRON', sent, skipped, failed }));
  return NextResponse.json({ sent, skipped, failed });
}
