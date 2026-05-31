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

    const str = (v: unknown, max: number) => {
      const s = String(v ?? '').trim();
      if (s.length > max) throw Object.assign(new Error(`Field exceeds ${max} characters`), { status: 400 });
      return s;
    };

    // Only persist known profile fields with enforced length limits
    const data: Record<string, string> = {};
    if (full_name  !== undefined) data.full_name  = str(full_name,  120);
    if (rank       !== undefined) data.rank       = str(rank,        60);
    if (airline    !== undefined) data.airline    = str(airline,     60);
    if (fleet      !== undefined) data.fleet      = str(fleet,      120);
    if (base       !== undefined) data.base       = str(base,        10);
    if (bio        !== undefined) data.bio        = str(bio,        500);
    if (avatar_url !== undefined) data.avatar_url = str(avatar_url, 500);

    await adminDb.collection('profiles').doc(uid).set(data, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    if (status === 400) return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    console.error('[POST /api/profile]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
