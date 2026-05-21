import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { adminAuth, adminBucket } from '@/lib/firebase/admin';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED  = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export async function POST(req: NextRequest) {
  try {
    // ── Auth ───────────────────────────────────────────────────────────────
    const idToken = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    if (!idToken) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }

    // ── File ───────────────────────────────────────────────────────────────
    const formData = await req.formData();
    const file     = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const mimeType = file.type || 'image/jpeg';
    if (!ALLOWED.includes(mimeType))
      return NextResponse.json({ error: 'Only JPG, PNG, WebP or HEIC images are allowed' }, { status: 400 });
    if (file.size > MAX_SIZE)
      return NextResponse.json({ error: 'Image too large (max 10 MB)' }, { status: 400 });

    // ── Upload to Firebase Storage ─────────────────────────────────────────
    const buffer    = Buffer.from(await file.arrayBuffer());
    const ext       = mimeType === 'image/png' ? 'png'
                    : mimeType === 'image/webp' ? 'webp'
                    : mimeType === 'image/heic' || mimeType === 'image/heif' ? 'heic'
                    : 'jpg';
    const fileId    = randomUUID();
    const filePath  = `listing-images/${uid}/${fileId}.${ext}`;
    const fileRef   = adminBucket.file(filePath);
    const dlToken   = randomUUID();

    await fileRef.save(buffer, {
      metadata: {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000',
        metadata: { firebaseStorageDownloadTokens: dlToken },
      },
    });

    const servingBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? adminBucket.name;
    const encodedPath   = encodeURIComponent(filePath);
    const downloadUrl   = `https://firebasestorage.googleapis.com/v0/b/${servingBucket}/o/${encodedPath}?alt=media&token=${dlToken}`;

    return NextResponse.json({ url: downloadUrl });
  } catch (err) {
    console.error('[POST /api/listings/images]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
