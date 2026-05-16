/**
 * Fetch a Google Font as an ArrayBuffer for use with Satori / ImageResponse.
 * Works in both edge and nodejs runtimes.
 */
async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    },
  ).then((r) => r.text());

  const url = css.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/)?.[1];
  if (!url) throw new Error(`No font URL found for ${family} ${weight}`);

  return fetch(url).then((r) => r.arrayBuffer());
}

/**
 * Returns the font options array for ImageResponse.
 * Loads Inter (sans) + IBM Plex Mono (numbers/stats).
 */
export async function getRecapFonts(): Promise<
  { name: string; data: ArrayBuffer; weight: 400 | 700 | 800 | 900; style: 'normal' }[]
> {
  const [interReg, interBold, interBlack, monoMed] = await Promise.all([
    loadGoogleFont('Inter', 400),
    loadGoogleFont('Inter', 700),
    loadGoogleFont('Inter', 900),
    loadGoogleFont('IBM Plex Mono', 500),
  ]);

  return [
    { name: 'Inter', data: interReg, weight: 400, style: 'normal' },
    { name: 'Inter', data: interBold, weight: 700, style: 'normal' },
    { name: 'Inter', data: interBlack, weight: 900, style: 'normal' },
    { name: 'IBM Plex Mono', data: monoMed, weight: 400, style: 'normal' },
  ];
}
