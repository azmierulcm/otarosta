import { ParsedRoster, ParsedDuty, ParsedFlight } from '../types';

// AIMS column headers and abbreviations that are NOT airport IATA codes.
// These appear as 3-letter uppercase words in the extracted PDF text and would
// pollute the port regex if not filtered out.
const AIMS_NON_PORT = new Set([
  'ACT', 'STD', 'STA', 'SGN', 'OBS', 'POS', 'REL', 'DEB', 'ETA', 'ETD',
  'ARR', 'DEP', 'CAB', 'CCR', 'CRT', 'OPT', 'DAY', 'OFF', 'MNT', 'TRN',
  'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT',
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
]);

function extractPorts(flightChunk: string): [string, string] {
  // Primary: capture the two airports sitting directly adjacent to the flight number.
  // This is robust against stray 3-letter codes elsewhere in the chunk.
  const direct = flightChunk.match(/MH\s*\d+\s+([A-Z]{3})\s+([A-Z]{3})/);
  if (direct) return [direct[1], direct[2]];

  // Fallback: scan for any 3-letter uppercase word, filtering known non-airport codes.
  const filtered = (flightChunk.match(/\b[A-Z]{3}\b/g) || []).filter(
    (p) => !AIMS_NON_PORT.has(p)
  );
  return [filtered[0] || '', filtered[1] || ''];
}

export function parseMasAims(text: string): ParsedRoster {
  const duties: ParsedDuty[] = [];

  const dateRegex = /(\d{2})-([A-Z]{3})-(\d{4})/gi;
  const matches = Array.from(text.matchAll(dateRegex));

  if (matches.length === 0) {
    throw new Error('No dates found in the roster. Please ensure this is a text-based Malaysia Airlines PDF.');
  }

  const months: Record<string, string> = {
    JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
    JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
  };

  const crewNameMatch = text.match(/Name:\s*([A-Z\s]+)/i);
  const crewName = crewNameMatch ? crewNameMatch[1].trim() : 'Crew Member';

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const day = match[1];
    const monthStr = match[2].toUpperCase();
    const year = match[3];
    const currentDate = `${year}-${months[monthStr] || '01'}-${day}`;

    const startIdx = match.index! + match[0].length;
    const endIdx = matches[i + 1] ? matches[i + 1].index! : text.length;
    const chunk = text.substring(startIdx, endIdx);

    // All times in this date chunk — used as a fallback for standbys whose
    // times appear before the standby code in the extracted text stream.
    const chunkTimes = chunk.match(/\d{2}:\d{2}/g) || [];

    // ── Flights ──────────────────────────────────────────────────────────────
    const flightRegex = /MH\s*(\d+)/gi;
    const flightMatches = Array.from(chunk.matchAll(flightRegex));

    flightMatches.forEach((fMatch, fIdx) => {
      const flightNo = fMatch[1];
      const flightChunk = chunk.substring(fMatch.index!);

      const times = flightChunk.match(/\d{2}:\d{2}/g) || [];
      const [depPort, arrPort] = extractPorts(flightChunk);

      const flight: ParsedFlight = {
        flightNumber: `MH${flightNo}`,
        depPort,
        arrPort,
        std: times[0] || '00:00',
        sta: times[1] || '00:00',
      };

      // Assign sign-on/off based on how many times are present.
      // Port extraction success is intentionally NOT a gate here — even if only
      // one port was found we should still capture the time data.
      if (fIdx === 0 && times.length >= 4) {
        flight.signOn = times[0];
        flight.std    = times[1] || '00:00';
        flight.sta    = times[2] || '00:00';
        flight.signOff = times[3];
      } else if (times.length >= 3) {
        flight.std    = times[0] || '00:00';
        flight.sta    = times[1] || '00:00';
        flight.signOff = times[2];
      }

      duties.push({
        id: `MH${flightNo}-${currentDate}-${fIdx}`,
        type: 'FLIGHT',
        date: currentDate,
        flight,
      });
    });

    // ── Standbys ─────────────────────────────────────────────────────────────
    const standbyRegex = /(S\d+-\d+)/gi;
    const standbyMatches = Array.from(chunk.matchAll(standbyRegex));

    standbyMatches.forEach((sMatch) => {
      const code = sMatch[1];

      // Prefer times that appear after the standby code; fall back to all times
      // in the chunk in case the PDF stream has them before the code.
      const sChunk = chunk.substring(sMatch.index!);
      const times = sChunk.match(/\d{2}:\d{2}/g)?.length
        ? sChunk.match(/\d{2}:\d{2}/g)!
        : chunkTimes;

      duties.push({
        id: `${code}-${currentDate}`,
        type: 'STANDBY',
        date: currentDate,
        signOn:  times[0] ?? undefined,
        signOff: times[times.length - 1] ?? undefined,
        description: `Standby ${code.toUpperCase()}`,
      });
    });
  }

  return {
    crewName,
    month: matches[0][2],
    year: matches[0][3],
    airline: 'Malaysia Airlines',
    duties,
  };
}
