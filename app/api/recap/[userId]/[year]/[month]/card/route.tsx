import { NextRequest, NextResponse } from 'next/server';
import { CardTemplate } from '@/lib/recap/templates';
import { computeRecap } from '@/lib/recap/compute';
import { parsePeriodKey } from '@/lib/recap/period';
import { getRecapFonts } from '@/lib/recap/og-fonts';
import { renderImage } from '@/lib/recap/render';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; year: string; month: string }> },
) {
  try {
    const { userId, year, month } = await params;
    const download = new URL(req.url).searchParams.get('download') === '1';

    const periodKey = `${year}-${month.padStart(2, '0')}`;
    const period = parsePeriodKey('month', periodKey);
    const [data, fonts] = await Promise.all([computeRecap(userId, period), getRecapFonts()]);

    return renderImage(<CardTemplate data={data} />, {
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
