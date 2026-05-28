import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const newToken = randomUUID();

    await adminDb.collection('profiles').doc(uid).set(
      { spouse_share_token: newToken },
      { merge: true }
    );

    return NextResponse.json({ token: newToken });
  } catch (error) {
    console.error('Error resetting share token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
