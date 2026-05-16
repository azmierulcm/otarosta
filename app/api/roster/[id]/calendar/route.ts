import { adminDb } from '@/lib/firebase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const doc = await adminDb.collection('rosters').doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const icsContent = doc.data()?.icsContent as string | undefined;
    if (!icsContent) return NextResponse.json({ error: 'No calendar data' }, { status: 404 });
    const month = doc.data()?.month ?? 'roster';
    const year = doc.data()?.year ?? '';
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
