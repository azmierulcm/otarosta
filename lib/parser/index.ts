import { ParsedRoster, UnsupportedAirlineError } from './types';
import { parseMasAims } from './airlines/mas-aims';

export function parseRosterText(text: string): ParsedRoster {
  // Simple detection: MAS AIMS rosters usually contain "MALAYSIA AIRLINES" and "CREW ROSTER"
  if (text.includes('MALAYSIA AIRLINES') || text.includes('MH') || text.match(/\d{2}-[A-Z]{3}-\d{4}/)) {
    return parseMasAims(text);
  }

  throw new UnsupportedAirlineError('This airline roster format is not yet supported. Please join the waitlist!');
}

export * from './types';
