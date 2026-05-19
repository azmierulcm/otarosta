import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const idToken = authHeader.replace('Bearer ', '');
    if (!idToken) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(idToken);
    const snap = await adminDb.collection('profiles').doc(decoded.uid).get();
    return NextResponse.json({ exists: snap.exists, data: snap.data() ?? null });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization') ?? '';
    const idToken = authHeader.replace('Bearer ', '');
    if (!idToken) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }

    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }

    const body = await req.json();
    const { full_name, rank, airline, fleet, base, bio, avatar_url } = body;

    // Only persist the known profile fields — nothing else from the request body
    const data: Record<string, string> = {};
    if (full_name  !== undefined) data.full_name  = String(full_name);
    if (rank       !== undefined) data.rank       = String(rank);
    if (airline    !== undefined) data.airline    = String(airline);
    if (fleet      !== undefined) data.fleet      = String(fleet);
    if (base       !== undefined) data.base       = String(base);
    if (bio        !== undefined) data.bio        = String(bio);
    if (avatar_url !== undefined) data.avatar_url = String(avatar_url);

    await adminDb.collection('profiles').doc(uid).set(data, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/profile]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
