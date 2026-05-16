/**
 * PATCH EARNING RULES — authoritative source of truth
 *
 * 1. UNLOCKING
 *    A patch unlocks on the FIRST landing at an airport, determined by the
 *    arrPort field of any FLIGHT event. Both operated and deadhead flights
 *    count — the crew was physically transported there.
 *
 * 2. DIVERSIONS
 *    We treat the roster entry as authoritative. If the PDF says KUL→SIN,
 *    SIN is awarded. Diversions that were corrected in the roster are handled
 *    automatically; real-time diversion detection is out of scope.
 *
 * 3. TECHNICAL STOPS
 *    If MAS records a technical stop as a separate leg (KUL→DOH, DOH→LHR),
 *    DOH earns a patch. The crew physically landed there, and we cannot
 *    reliably distinguish a fuel stop from a crew-change layover from PDF data.
 *    Simpler rules → fewer surprises.
 *
 * 4. VISIT COUNTING
 *    visits = number of times the airport appears as arrPort across ALL
 *    flight events. Every landing = +1 visit, whether it was a turnaround
 *    (SIN in a KUL→SIN→KUL sequence) or a 3-night RON. This matches the
 *    server-side logic in lib/actions/destinations.ts.
 *
 * 5. RARITY TIERS
 *    Bronze  : 1+ visits   (The Explorer)
 *    Silver  : 5+ visits   (The Regular)
 *    Gold    : 25+ visits  (The Veteran)
 *    Platinum: 100+ visits (The Legend — typically home base only)
 */

import type { DestinationRegion } from '@/lib/data/destination-catalog';

// ── Rarity ────────────────────────────────────────────────────────────────────

export type RarityTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export function getRarityTier(visits: number): RarityTier {
  if (visits >= 100) return 'Platinum';
  if (visits >= 25) return 'Gold';
  if (visits >= 5) return 'Silver';
  return 'Bronze';
}

/**
 * CSS custom property for each rarity tier's border accent.
 * Applied as box-shadow: inset 0 0 0 1px <value>
 */
export const RARITY_CSS: Record<RarityTier, string> = {
  Bronze:   'var(--patch-saf)',    // warm teak tan
  Silver:   'var(--text-subtle)', // cool gray
  Gold:     'var(--warning)',     // warm amber
  Platinum: 'var(--info)',        // cool blue-white
};

// ── Region color ──────────────────────────────────────────────────────────────

/**
 * Maps a DestinationRegion key to its CSS patch color variable.
 * Use this as `color` / `stroke` / `currentColor` driver on illustrations.
 */
export const REGION_PATCH_VAR: Record<DestinationRegion, string> = {
  sea:  'var(--patch-sea)',
  east: 'var(--patch-east)',
  oce:  'var(--patch-oce)',
  mena: 'var(--patch-mena)',
  eur:  'var(--patch-eur)',
  saf:  'var(--patch-saf)',
};

// ── Visit calculation (client-side helper, mirrors server action logic) ────────

interface FlightEvent {
  type: string;
  depPort: string;
  arrPort: string;
  date: string;
}

/**
 * Count how many times `iata` appears as arrPort across the provided events.
 * Matches the server-side counting logic in lib/actions/destinations.ts.
 *
 * Edge cases:
 * - Turnaround (KUL→SIN→KUL same day): SIN gets 1 visit (one landing)
 * - RON layover (KUL→LHR → KUL the next day): LHR gets 1 visit
 * - Home base (KUL): counts every return landing
 */
export function calculateVisits(iata: string, events: FlightEvent[]): number {
  return events.filter(
    (e) => e.type === 'FLIGHT' && e.arrPort?.toUpperCase() === iata.toUpperCase(),
  ).length;
}
