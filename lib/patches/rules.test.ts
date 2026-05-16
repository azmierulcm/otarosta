import { describe, it, expect } from 'vitest';
import { calculateVisits, getRarityTier, RARITY_CSS, REGION_PATCH_VAR } from './rules';

// ── Shared fixture ─────────────────────────────────────────────────────────────
// A representative month with a variety of leg types:
//   Nov 01: KUL → LHR  (long-haul, RON stay in London)
//   Nov 03: LHR → KUL  (return)
//   Nov 05: KUL → SIN  (turnaround leg 1)
//   Nov 05: SIN → KUL  (turnaround leg 2 — same calendar day)
//   Nov 07: KUL → SYD  (multi-leg outstation, leg 1)
//   Nov 10: SYD → MEL  (multi-leg, leg 2 — SYD leaves as origin)
//   Nov 12: MEL → KUL  (return home)

const mockEvents = [
  { date: '2025-11-01', type: 'FLIGHT', depPort: 'KUL', arrPort: 'LHR' },
  { date: '2025-11-03', type: 'FLIGHT', depPort: 'LHR', arrPort: 'KUL' },
  { date: '2025-11-05', type: 'FLIGHT', depPort: 'KUL', arrPort: 'SIN' },
  { date: '2025-11-05', type: 'FLIGHT', depPort: 'SIN', arrPort: 'KUL' },
  { date: '2025-11-07', type: 'FLIGHT', depPort: 'KUL', arrPort: 'SYD' },
  { date: '2025-11-10', type: 'FLIGHT', depPort: 'SYD', arrPort: 'MEL' },
  { date: '2025-11-12', type: 'FLIGHT', depPort: 'MEL', arrPort: 'KUL' },
];

// ── calculateVisits ────────────────────────────────────────────────────────────

describe('calculateVisits', () => {
  it('counts one landing per leg, regardless of overnight stay', () => {
    // LHR: one landing (Nov 01) — RON doesn't add extra visits
    expect(calculateVisits('LHR', mockEvents)).toBe(1);
  });

  it('counts a turnaround as 1 visit (one landing on the outbound leg)', () => {
    // SIN: landed Nov 05 on the outbound, then departed Nov 05 back to KUL
    // The landing on the SIN→KUL leg is KUL, not SIN — so SIN gets exactly 1
    expect(calculateVisits('SIN', mockEvents)).toBe(1);
  });

  it('counts every return landing for home base', () => {
    // KUL: lands on Nov 03 (from LHR), Nov 05 (from SIN), Nov 12 (from MEL) = 3
    expect(calculateVisits('KUL', mockEvents)).toBe(3);
  });

  it('counts multi-leg overnights at intermediate port correctly', () => {
    // SYD: landed Nov 07 — the Nov 10 leg departs SYD, no second landing there
    expect(calculateVisits('SYD', mockEvents)).toBe(1);
    // MEL: landed Nov 10
    expect(calculateVisits('MEL', mockEvents)).toBe(1);
  });

  it('returns 0 for an airport that never appears as arrPort', () => {
    expect(calculateVisits('NRT', mockEvents)).toBe(0);
  });

  it('is case-insensitive', () => {
    const lower = [{ date: '2025-01-01', type: 'FLIGHT', depPort: 'kul', arrPort: 'sin' }];
    expect(calculateVisits('SIN', lower)).toBe(1);
    expect(calculateVisits('sin', lower)).toBe(1);
  });

  it('ignores non-FLIGHT events', () => {
    const mixed = [
      { date: '2025-01-01', type: 'GROUND', depPort: 'KUL', arrPort: 'SIN' },
      { date: '2025-01-02', type: 'FLIGHT', depPort: 'KUL', arrPort: 'SIN' },
    ];
    expect(calculateVisits('SIN', mixed)).toBe(1);
  });

  it('handles multiple landings at the same port (frequent route)', () => {
    const frequent = [
      { date: '2025-01-01', type: 'FLIGHT', depPort: 'KUL', arrPort: 'BKK' },
      { date: '2025-01-02', type: 'FLIGHT', depPort: 'BKK', arrPort: 'KUL' },
      { date: '2025-01-05', type: 'FLIGHT', depPort: 'KUL', arrPort: 'BKK' },
      { date: '2025-01-06', type: 'FLIGHT', depPort: 'BKK', arrPort: 'KUL' },
    ];
    expect(calculateVisits('BKK', frequent)).toBe(2);
  });

  it('handles an empty events array', () => {
    expect(calculateVisits('KUL', [])).toBe(0);
  });
});

// ── getRarityTier ──────────────────────────────────────────────────────────────

describe('getRarityTier', () => {
  it('Bronze at exactly 1 visit', () => {
    expect(getRarityTier(1)).toBe('Bronze');
  });

  it('Bronze below Silver threshold', () => {
    expect(getRarityTier(4)).toBe('Bronze');
  });

  it('Silver at exactly 5 visits', () => {
    expect(getRarityTier(5)).toBe('Silver');
  });

  it('Silver up to Gold threshold', () => {
    expect(getRarityTier(24)).toBe('Silver');
  });

  it('Gold at exactly 25 visits', () => {
    expect(getRarityTier(25)).toBe('Gold');
  });

  it('Gold up to Platinum threshold', () => {
    expect(getRarityTier(99)).toBe('Gold');
  });

  it('Platinum at exactly 100 visits', () => {
    expect(getRarityTier(100)).toBe('Platinum');
  });

  it('Platinum above 100', () => {
    expect(getRarityTier(420)).toBe('Platinum');
  });
});

// ── RARITY_CSS constants ───────────────────────────────────────────────────────

describe('RARITY_CSS', () => {
  it('uses CSS variables, not hardcoded hex', () => {
    for (const val of Object.values(RARITY_CSS)) {
      expect(val).toMatch(/^var\(--/);
    }
  });

  it('covers all four tiers', () => {
    const tiers: string[] = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    for (const tier of tiers) {
      expect(RARITY_CSS[tier as keyof typeof RARITY_CSS]).toBeTruthy();
    }
  });
});

// ── REGION_PATCH_VAR constants ─────────────────────────────────────────────────

describe('REGION_PATCH_VAR', () => {
  it('uses CSS variables, not hardcoded hex', () => {
    for (const val of Object.values(REGION_PATCH_VAR)) {
      expect(val).toMatch(/^var\(--patch-/);
    }
  });

  it('covers all six destination regions', () => {
    const regions: string[] = ['sea', 'east', 'oce', 'mena', 'eur', 'saf'];
    for (const region of regions) {
      expect(REGION_PATCH_VAR[region as keyof typeof REGION_PATCH_VAR]).toBeTruthy();
    }
  });
});
