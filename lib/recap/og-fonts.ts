type FontResult = { name: string; data: ArrayBuffer; weight: 400 | 700 | 800 | 900; style: 'normal' };

/**
 * Fetch a single Google Font as an ArrayBuffer for Satori / ImageResponse.
 * Returns null on any failure so the caller can fall back gracefully.
 */
async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(8_000),
      },
    ).then((r) => r.text());

    const url = css.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/)?.[1];
    if (!url) {
      console.warn(`[og-fonts] No font URL in CSS for ${family} ${weight}`);
      return null;
    }
    return fetch(url, { signal: AbortSignal.timeout(8_000) }).then((r) => r.arrayBuffer());
  } catch (err) {
    console.warn(`[og-fonts] Failed to load ${family} ${weight}:`, err);
    return null;
  }
}

/**
 * Returns the font options array for ImageResponse.
 * Loads Inter + IBM Plex Mono from Google Fonts.
 * Falls back to an empty array (Satori uses system fonts) if loading fails.
 */
export async function getRecapFonts(): Promise<FontResult[]> {
  const [interReg, interBold, interBlack, monoMed] = await Promise.all([
    loadGoogleFont('Inter', 400),
    loadGoogleFont('Inter', 700),
    loadGoogleFont('Inter', 900),
    loadGoogleFont('IBM Plex Mono', 500),
  ]);

  const fonts: FontResult[] = [];
  if (interReg)   fonts.push({ name: 'Inter', data: interReg,   weight: 400, style: 'normal' });
  if (interBold)  fonts.push({ name: 'Inter', data: interBold,  weight: 700, style: 'normal' });
  if (interBlack) fonts.push({ name: 'Inter', data: interBlack, weight: 900, style: 'normal' });
  if (monoMed)    fonts.push({ name: 'IBM Plex Mono', data: monoMed, weight: 400, style: 'normal' });
  return fonts;
}
