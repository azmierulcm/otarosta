import { ParsedRoster, ParsedDuty, ParsedFlight } from '../types';
import type { ParseLogger } from '../logger';

// ─────────────────────────────────────────────────────────────────────────────
// Malaysia Airlines — AIMS Roster Parser
//
// Fault-tolerance model:
//   • Every individual duty is wrapped in its own try-catch.  A single
//     malformed duty is skipped and logged; the rest of the roster continues.
//   • Every warning carries: date, character offset, and the raw chunk —
//     enough context to reproduce the failure from logs alone.
//   • The logger parameter is optional (backwards-compatible with unit tests).
//
// Bug-fix history (v2):
//   • flightChunk is now BOUNDED to the next flight match, not the end of the
//     date block.  This prevents times from flight N+1 polluting flight N.
//   • Sign-on time is extracted from the pre-flight segment of the day chunk
//     (it appears BEFORE the first "MH XXXX" token in AIMS layout).
//   • Roster month/year is derived via MODE of all date matches, not the first
//     match (which may be a header/validity date from a different month).
//   • OFF / leave days, TRAINING / SIM duties, and extended standby patterns
//     (SB, SA, SH, ASB) are now detected and emitted as typed duties.
// ─────────────────────────────────────────────────────────────────────────────

// ── Exclusion list for port-code extraction ───────────────────────────────────
// Three-letter tokens that appear in AIMS text but are NOT IATA airport codes.
const AIMS_NON_PORT = new Set([
  // Column headers / abbreviations
  'ACT', 'STD', 'STA', 'SGN', 'SFI', 'OBS', 'POS', 'REL', 'DEB', 'ETA', 'ETD',
  'ARR', 'DEP', 'CAB', 'CCR', 'CRT', 'OPT', 'DAY', 'OFF', 'MNT', 'TRN',
  // Days of week
  'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT',
  // Months
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  // Training / ground codes
  'SIM', 'GND', 'CRM', 'LPC', 'OPC', 'CBT', 'TRG',
  // Standby codes
  'ASB', 'SBY',
]);

// ── Duty-type detection patterns ─────────────────────────────────────────────

/** Day-off / leave patterns */
const OFF_REGEX = /\b(OFF|REST|AL|SL|ML|HL|PH|EL|CMP|COMP)\b/i;

/** Training / simulator patterns */
const TRAINING_REGEX = /\b(SIM\/TRN|SIM|TRN|GND|LPC|OPC|CRM|TRAINING|CBT|RECURRENT|TRG)\b/i;

/** Standby patterns — extends the old S\d+-\d+ to cover SB / SA / SH / ASB */
const STANDBY_REGEX = /\b(SB|SA|SH|ASB|SBY|STBY|S\d+-\d+)\b/gi;

// ── Human-readable labels ─────────────────────────────────────────────────────

const OFF_LABEL: Record<string, string> = {
  OFF:  'Day Off',
  REST: 'Rest Day',
  AL:   'Annual Leave',
  SL:   'Sick Leave',
  ML:   'Maternity Leave',
  HL:   'Home Leave',
  PH:   'Public Holiday',
  EL:   'Emergency Leave',
  CMP:  'Compensatory Off',
  COMP: 'Compensatory Off',
};

const TRAINING_LABEL: Record<string, string> = {
  'SIM/TRN': 'Simulator Training',
  SIM:       'Simulator',
  TRN:       'Training',
  GND:       'Ground Training',
  LPC:       'Line Proficiency Check',
  OPC:       'Operator Proficiency Check',
  CRM:       'Crew Resource Management',
  TRAINING:  'Training',
  CBT:       'Computer-Based Training',
  RECURRENT: 'Recurrent Training',
  TRG:       'Training',
};

// ── Internal helpers ──────────────────────────────────────────────────────────

function extractPorts(flightChunk: string): [string, string] {
  // Primary: the two airports immediately after the flight number
  const direct = flightChunk.match(/MH\s*\d+\s+([A-Z]{3})\s+([A-Z]{3})/);
  if (direct) return [direct[1], direct[2]];

  // Fallback: any 3-letter token not in the exclusion list
  const filtered = (flightChunk.match(/\b[A-Z]{3}\b/g) ?? []).filter(
    (p) => !AIMS_NON_PORT.has(p),
  );
  return [filtered[0] ?? '', filtered[1] ?? ''];
}

const MONTH_MAP: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
};

/**
 * Return the roster's canonical month + year by taking the MODE of all parsed
 * date matches.  A monthly roster will have ~20-31 entries for the same month;
 * any stray header/validity date from a different month will be a minority.
 */
function inferRosterPeriod(
  dateMatches: RegExpMatchArray[],
): { month: string; year: string } {
  const counts = new Map<string, number>();
  for (const m of dateMatches) {
    const key = `${m[2].toUpperCase()}-${m[3]}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let best = `${dateMatches[0][2].toUpperCase()}-${dateMatches[0][3]}`;
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      best = key;
    }
  }

  const [month, year] = best.split('-') as [string, string];
  return { month, year };
}

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseMasAims(text: string, logger?: ParseLogger): ParsedRoster {
  const duties: ParsedDuty[] = [];
  let skippedDuties = 0;

  // ── Date blocks ────────────────────────────────────────────────────────────
  const dateRegex = /(\d{2})-([A-Z]{3})-(\d{4})/gi;
  const dateMatches = Array.from(text.matchAll(dateRegex));

  if (dateMatches.length === 0) {
    logger?.error('mas-aims:dates', 'No DD-MMM-YYYY date patterns found in text', {
      textLength: text.length,
      preview: text.slice(0, 200),
    });
    throw new Error(
      'No dates found in the roster. Please ensure this is a text-based AIMS roster PDF.',
    );
  }

  logger?.info('mas-aims:dates', `Found ${dateMatches.length} date block(s)`, {
    firstDate: dateMatches[0][0],
    lastDate: dateMatches[dateMatches.length - 1][0],
  });

  // ── Crew name ──────────────────────────────────────────────────────────────
  const crewNameMatch = text.match(/Name:\s*([A-Z][A-Z\s]+)/i);
  const crewName = crewNameMatch ? crewNameMatch[1].trim() : 'Crew Member';

  if (!crewNameMatch) {
    logger?.warn('mas-aims:crew', 'Could not find "Name:" field — defaulting to "Crew Member"', {
      textPreview: text.slice(0, 300),
    });
  } else {
    logger?.info('mas-aims:crew', `Crew name extracted: ${crewName}`);
  }

  // ── Roster period — MODE of all date matches (bug fix: was first match) ────
  const { month: rosterMonth, year: rosterYear } = inferRosterPeriod(dateMatches);

  logger?.info('mas-aims:period', `Roster period: ${rosterMonth} ${rosterYear}`, {
    totalDateMatches: dateMatches.length,
    inferredViaMode: true,
  });

  // ── Per-date-block parsing ─────────────────────────────────────────────────
  for (let i = 0; i < dateMatches.length; i++) {
    const match      = dateMatches[i];
    const day        = match[1];
    const monthStr   = match[2].toUpperCase();
    const year       = match[3];
    const dateISO    = `${year}-${MONTH_MAP[monthStr] ?? '01'}-${day}`;
    const charOffset = match.index!;

    const chunkStart = charOffset + match[0].length;
    const chunkEnd   = dateMatches[i + 1] ? dateMatches[i + 1].index! : text.length;
    const chunk      = text.substring(chunkStart, chunkEnd);

    // All times in the chunk — fallback for duties without bounded sub-chunks
    const chunkTimes = chunk.match(/\d{2}:\d{2}/g) ?? [];

    // ── Flight extraction ──────────────────────────────────────────────────
    const flightRegex = /MH\s*(\d+)/gi;
    const flightMatches = Array.from(chunk.matchAll(flightRegex));

    // ── Day-level sign-on: last HH:MM BEFORE the first "MH XXXX" token ───
    // In AIMS layout the sign-on time (SGN) appears before the first flight
    // number on the same duty line.  We must NOT search inside the flight
    // chunk itself — that chunk begins at the "MH" token and only contains
    // STD, STA, and (for the last leg) sign-off times.
    const firstFlightOffset = flightMatches[0]?.index ?? chunk.length;
    const preFlightTimes    = chunk.substring(0, firstFlightOffset).match(/\d{2}:\d{2}/g) ?? [];
    const daySignOn         = preFlightTimes.at(-1); // last time before first MH = SGN

    flightMatches.forEach((fMatch, fIdx) => {
      try {
        // ── Bounded flight chunk (bug fix: was open-ended to end of date block)
        // By bounding to the NEXT flight match we prevent time tokens from
        // subsequent flights polluting STD/STA extraction for this flight.
        const flightEnd   = fIdx + 1 < flightMatches.length
          ? flightMatches[fIdx + 1].index!
          : chunk.length;
        const flightChunk = chunk.substring(fMatch.index!, flightEnd);

        const flightNo           = fMatch[1];
        const times              = flightChunk.match(/\d{2}:\d{2}/g) ?? [];
        const [depPort, arrPort] = extractPorts(flightChunk);

        const isFirst = fIdx === 0;
        const isLast  = fIdx === flightMatches.length - 1;

        // times[0] = STD, times[1] = STA
        // For the LAST leg, times[2] may be sign-off (SFI) if present in chunk
        const flight: ParsedFlight = {
          flightNumber: `MH${flightNo}`,
          depPort,
          arrPort,
          std:    times[0] ?? '00:00',
          sta:    times[1] ?? '00:00',
          ...(isFirst && daySignOn ? { signOn:  daySignOn } : {}),
          ...(isLast  && times[2]  ? { signOff: times[2]  } : {}),
        };

        if (!depPort || !arrPort) {
          logger?.warn('mas-aims:flight', `Missing port code(s) on MH${flightNo}`, {
            date:      dateISO,
            charOffset: charOffset + fMatch.index!,
            depPort:   depPort || null,
            arrPort:   arrPort || null,
            rawChunk:  flightChunk.slice(0, 120),
          });
        }

        if (times.length < 2) {
          logger?.warn('mas-aims:flight', `Insufficient time fields on MH${flightNo}`, {
            date:       dateISO,
            charOffset: charOffset + fMatch.index!,
            timesFound: times.length,
            rawChunk:   flightChunk.slice(0, 120),
          });
        }

        duties.push({
          id:    `MH${flightNo}-${dateISO}-${fIdx}`,
          type:  'FLIGHT',
          date:  dateISO,
          flight,
          ...(isFirst && daySignOn ? { signOn:  daySignOn } : {}),
          ...(isLast  && times[2]  ? { signOff: times[2]  } : {}),
        });

      } catch (err: unknown) {
        skippedDuties++;
        logger?.error('mas-aims:flight', `Unexpected error parsing flight in date block ${dateISO}`, {
          date:        dateISO,
          charOffset,
          flightIndex: fIdx,
          error:       err instanceof Error ? err.message : String(err),
          rawChunk:    chunk.slice(0, 200),
        });
        // Continue to next flight — never rethrow inside a per-duty block
      }
    });

    // ── Non-flight duties — only checked when no flights found for this day ──
    if (flightMatches.length === 0) {

      // ── OFF / leave day ──────────────────────────────────────────────────
      const offMatch = chunk.match(OFF_REGEX);
      if (offMatch) {
        try {
          const code = offMatch[1].toUpperCase();
          duties.push({
            id:          `${code}-${dateISO}`,
            type:        'OFF',
            date:        dateISO,
            description: OFF_LABEL[code] ?? `Off — ${code}`,
          });
        } catch (err: unknown) {
          skippedDuties++;
          logger?.error('mas-aims:off', `Error parsing OFF duty at ${dateISO}`, {
            date: dateISO,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      // ── Training / simulator ─────────────────────────────────────────────
      const trainingMatch = !offMatch ? chunk.match(TRAINING_REGEX) : null;
      if (trainingMatch) {
        try {
          const code = trainingMatch[1].toUpperCase();
          duties.push({
            id:          `${code}-${dateISO}`,
            type:        'TRAINING',
            date:        dateISO,
            signOn:      chunkTimes[0] ?? undefined,
            signOff:     chunkTimes[chunkTimes.length - 1] ?? undefined,
            description: TRAINING_LABEL[code] ?? `Training — ${code}`,
          });
        } catch (err: unknown) {
          skippedDuties++;
          logger?.error('mas-aims:training', `Error parsing TRAINING duty at ${dateISO}`, {
            date: dateISO,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      // ── Standby (no flights) — extended pattern: S\d+, SB, SA, SH, ASB ──
      if (!offMatch && !trainingMatch) {
        const standbyMatches = Array.from(chunk.matchAll(STANDBY_REGEX));
        standbyMatches.forEach((sMatch) => {
          try {
            const code   = sMatch[1].toUpperCase();
            const sChunk = chunk.substring(sMatch.index!);
            const sTimes = sChunk.match(/\d{2}:\d{2}/g) ?? chunkTimes;

            if (sTimes.length === 0) {
              logger?.warn('mas-aims:standby', `No times found for standby ${code}`, {
                date: dateISO, charOffset: charOffset + sMatch.index!,
                rawChunk: sChunk.slice(0, 120),
              });
            }

            duties.push({
              id:          `${code}-${dateISO}`,
              type:        'STANDBY',
              date:        dateISO,
              signOn:      sTimes[0] ?? undefined,
              signOff:     sTimes.at(-1) ?? undefined,
              description: `Standby — ${code}`,
            });
          } catch (err: unknown) {
            skippedDuties++;
            logger?.error('mas-aims:standby', `Error parsing standby at ${dateISO}`, {
              date: dateISO, charOffset,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        });
      }
    } else {
      // Flights were found — also check for any mixed-day standby codes that
      // appear alongside flights (e.g. ground standby after a short turn)
      const standbyMatches = Array.from(chunk.matchAll(STANDBY_REGEX));
      standbyMatches.forEach((sMatch) => {
        try {
          const code   = sMatch[1].toUpperCase();
          const sChunk = chunk.substring(sMatch.index!);
          const sTimes = sChunk.match(/\d{2}:\d{2}/g) ?? chunkTimes;

          duties.push({
            id:          `${code}-${dateISO}-SBY`,
            type:        'STANDBY',
            date:        dateISO,
            signOn:      sTimes[0] ?? undefined,
            signOff:     sTimes.at(-1) ?? undefined,
            description: `Standby — ${code}`,
          });
        } catch (err: unknown) {
          skippedDuties++;
          logger?.error('mas-aims:standby', `Error parsing mixed-day standby at ${dateISO}`, {
            date: dateISO, charOffset,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      });
    }
  }

  if (skippedDuties > 0) {
    logger?.warn('mas-aims', `${skippedDuties} duty/duties skipped due to parse errors`, {
      skippedDuties,
      totalExtracted: duties.length,
    });
  }

  logger?.info('mas-aims', 'Parse complete', {
    dutiesExtracted: duties.length,
    flights:         duties.filter((d) => d.type === 'FLIGHT').length,
    standbys:        duties.filter((d) => d.type === 'STANDBY').length,
    offDays:         duties.filter((d) => d.type === 'OFF').length,
    training:        duties.filter((d) => d.type === 'TRAINING').length,
    skippedDuties,
  });

  return {
    crewName,
    month:   rosterMonth,
    year:    rosterYear,
    airline: 'Malaysia Airlines',
    duties,
  };
}
