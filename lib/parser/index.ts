import { ParsedRoster, UnsupportedAirlineError } from './types';
import { parseMasAims } from './airlines/mas-aims';

export function parseRosterText(text: string): ParsedRoster {
  const upper = text.toUpperCase();
  // Detect MAS AIMS: look for airline name, MH flight numbers, or DD-MMM-YYYY date pattern
  const isMasAims =
    upper.includes('MALAYSIA AIRLINES') ||
    upper.includes('MALAYSIAN AIRLINES') ||
    upper.includes('AIMS') ||
    /\bMH\s*\d{1,4}\b/.test(upper) ||
    /\d{2}-[A-Z]{3}-\d{4}/.test(upper);

  if (isMasAims) {
    return parseMasAims(text);
  }

  throw new UnsupportedAirlineError(
    'This roster format is not yet supported. Currently only AIMS rosters are accepted.'
  );
}

export * from './types';
