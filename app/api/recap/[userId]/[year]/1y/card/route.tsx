import { ImageResponse } from 'next/og';
import { NextRequest, NextResponse } from 'next/server';
import { CardTemplate } from '@/lib/recap/templates';
import { computeRecap } from '@/lib/recap/compute';
import { parsePeriodKey } from '@/lib/recap/period';
import { getRecapFonts } from '@/lib/recap/og-fonts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; year: string }> },
) {
  try {
    const { userId, year } = await params;
    const download = new URL(req.url).searchParams.get('download') === '1';

    const period = parsePeriodKey('1y', year);
    const [data, fonts] = await Promise.all([computeRecap(userId, period), getRecapFonts()]);

    return new ImageResponse(
      <CardTemplate data={data} />,
      {
        width: 1200,
        height: 630,
        fonts,
        headers: download
          ? { 'Content-Disposition': `attachment; filename="Recap-${year}-Card.png"` }
          : {},
      },
    );
  } catch (err) {
    console.error('[recap/1y/card] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate card' },
      { status: 500 },
    );
  }
}
