import { NextRequest, NextResponse } from 'next/server';
import { CardTemplate } from '@/lib/recap/templates';
import { computeRecap } from '@/lib/recap/compute';
import { parsePeriodKey } from '@/lib/recap/period';
import { getRecapFonts } from '@/lib/recap/og-fonts';
import { renderImage } from '@/lib/recap/render';
import { verifyIdToken } from '@/lib/firebase/auth-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; year: string; month: string }> },
) {
  try {
    const { userId, year, month } = await params;

    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    let uid: string;
    try { uid = await verifyIdToken(token); } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (uid !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const download = new URL(req.url).searchParams.get('download') === '1';

    const periodKey = `${year}-${month.padStart(2, '0')}`;
    const period = parsePeriodKey('month', periodKey);
    const [data, fonts] = await Promise.all([computeRecap(userId, period), getRecapFonts()]);

    const baseUrl = new URL(req.url).origin;
    return await renderImage(<CardTemplate data={data} baseUrl={baseUrl} />, {
      width: 1200,
      height: 630,
      fonts,
      filename: download ? `Recap-${periodKey}-Card.png` : undefined,
    });
  } catch (err) {
    console.error('[recap/month/card] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate card' },
      { status: 500 },
    );
  }
}
