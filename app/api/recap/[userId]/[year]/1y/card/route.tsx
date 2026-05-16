import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
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
}
