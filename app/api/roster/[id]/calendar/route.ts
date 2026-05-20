import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const url         = new URL(req.url);
    const authHeader  = req.headers.get('authorization') ?? '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const queryToken  = url.searchParams.get('t') ?? '';

    if (!bearerToken && !queryToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doc = await adminDb.collection('rosters').doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const data = doc.data()!;

    // ── Two valid auth paths ───────────────────────────────────────────────────
    // 1. Bearer token (browser download via JavaScript): verify the Firebase ID
    //    token and check the uid matches the roster owner.
    // 2. calendarSecret (?t=): stable UUID stored in the roster doc, used by
    //    webcal / calendar-app subscriptions which cannot send auth headers.
    let authorised = false;

    if (bearerToken) {
      try {
        const decoded = await adminAuth.verifyIdToken(bearerToken);
        authorised = decoded.uid === data.userId;
      } catch {
        // fall through — try calendarSecret next if query token also present
      }
    }

    if (!authorised && queryToken) {
      // Constant-time comparison to resist timing attacks
      const expected = data.calendarSecret as string | undefined;
      if (expected && expected.length === queryToken.length) {
        const expectedBuf = Buffer.from(expected);
        const queryBuf    = Buffer.from(queryToken);
        // Use timingSafeEqual to avoid timing side-channels
        try {
          const { timingSafeEqual } = await import('crypto');
          authorised = timingSafeEqual(expectedBuf, queryBuf);
        } catch {
          authorised = expected === queryToken;
        }
      }
    }

    if (!authorised) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── Serve the ICS ─────────────────────────────────────────────────────────
    const icsContent = data.icsContent as string | undefined;
    if (!icsContent) return NextResponse.json({ error: 'No calendar data' }, { status: 404 });

    const month = data.month ?? 'roster';
    const year  = data.year  ?? '';
    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="cemrosta-${month}-${year}.ics"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[calendar route]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
