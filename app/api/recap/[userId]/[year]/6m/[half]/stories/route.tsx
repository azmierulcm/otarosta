import { NextRequest, NextResponse } from 'next/server';
import { StoriesTemplate } from '@/lib/recap/templates';
import { computeRecap } from '@/lib/recap/compute';
import { parsePeriodKey } from '@/lib/recap/period';
import { getRecapFonts } from '@/lib/recap/og-fonts';
import { renderImage } from '@/lib/recap/render';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; year: string; half: string }> },
) {
  try {
    const { userId, year, half } = await params;
    const download = new URL(req.url).searchParams.get('download') === '1';

    const periodKey = `${year}-H${half}`;
    const period = parsePeriodKey('6m', periodKey);
    const [data, fonts] = await Promise.all([computeRecap(userId, period), getRecapFonts()]);

    const baseUrl = new URL(req.url).origin;
    return await renderImage(<StoriesTemplate data={data} baseUrl={baseUrl} />, {
      width: 1080,
      height: 1920,
      fonts,
      filename: download ? `Recap-${periodKey}-Stories.png` : undefined,
    });
  } catch (err) {
    console.error('[recap/6m/stories] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate stories card' },
      { status: 500 },
    );
  }
}
