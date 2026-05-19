import { Destination, DutyEvent } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// IATA Airport Metadata
//
// Maps IATA code → display metadata for the Destinations Grid and profile page.
// Expanded from 6 → 55+ entries covering all current MH network ports.
//
// color  — Tailwind border + text classes used for destination badges
// shape  — badge shape variant: oval | hexagon | rectangle
// region — used for region patch colours defined in globals.css
// ─────────────────────────────────────────────────────────────────────────────

type Region = 'SEA' | 'NEA' | 'SAS' | 'MEA' | 'EUR' | 'OCE' | 'AFR' | 'AMS' | 'DOM';

interface AirportMeta {
  city: string;
  country: string;
  color: string;
  shape: 'oval' | 'hexagon' | 'rectangle';
  region: Region;
}

const IATA_MAP: Record<string, AirportMeta> = {
  // ── Home ──────────────────────────────────────────────────────────────────
  KUL: { city: 'Kuala Lumpur',  country: 'Malaysia',     color: 'border-rausch text-rausch',             shape: 'rectangle', region: 'DOM' },

  // ── Domestic Malaysia ─────────────────────────────────────────────────────
  PEN: { city: 'Penang',        country: 'Malaysia',     color: 'border-amber-500 text-amber-600',        shape: 'oval',      region: 'DOM' },
  JHB: { city: 'Johor Bahru',   country: 'Malaysia',     color: 'border-lime-500 text-lime-600',          shape: 'hexagon',   region: 'DOM' },
  LGK: { city: 'Langkawi',      country: 'Malaysia',     color: 'border-teal-500 text-teal-600',          shape: 'oval',      region: 'DOM' },
  BKI: { city: 'Kota Kinabalu', country: 'Malaysia',     color: 'border-cyan-500 text-cyan-600',          shape: 'rectangle', region: 'DOM' },
  KCH: { city: 'Kuching',       country: 'Malaysia',     color: 'border-sky-500 text-sky-600',            shape: 'hexagon',   region: 'DOM' },
  MYY: { city: 'Miri',          country: 'Malaysia',     color: 'border-violet-400 text-violet-500',      shape: 'oval',      region: 'DOM' },
  TWU: { city: 'Tawau',         country: 'Malaysia',     color: 'border-indigo-400 text-indigo-500',      shape: 'rectangle', region: 'DOM' },
  SDK: { city: 'Sandakan',      country: 'Malaysia',     color: 'border-blue-400 text-blue-500',          shape: 'oval',      region: 'DOM' },
  TGG: { city: 'Terengganu',    country: 'Malaysia',     color: 'border-green-400 text-green-500',        shape: 'hexagon',   region: 'DOM' },
  AOR: { city: 'Alor Setar',    country: 'Malaysia',     color: 'border-yellow-500 text-yellow-600',      shape: 'oval',      region: 'DOM' },
  IPH: { city: 'Ipoh',          country: 'Malaysia',     color: 'border-orange-400 text-orange-500',      shape: 'hexagon',   region: 'DOM' },
  SBW: { city: 'Sibu',          country: 'Malaysia',     color: 'border-rose-400 text-rose-500',          shape: 'rectangle', region: 'DOM' },
  KUA: { city: 'Kuantan',       country: 'Malaysia',     color: 'border-fuchsia-400 text-fuchsia-500',    shape: 'oval',      region: 'DOM' },
  LBU: { city: 'Labuan',        country: 'Malaysia',     color: 'border-purple-400 text-purple-500',      shape: 'hexagon',   region: 'DOM' },

  // ── Southeast Asia ────────────────────────────────────────────────────────
  SIN: { city: 'Singapore',     country: 'Singapore',    color: 'border-red-500 text-red-600',            shape: 'rectangle', region: 'SEA' },
  BKK: { city: 'Bangkok',       country: 'Thailand',     color: 'border-amber-400 text-amber-500',        shape: 'oval',      region: 'SEA' },
  DMK: { city: 'Bangkok',       country: 'Thailand',     color: 'border-amber-400 text-amber-500',        shape: 'oval',      region: 'SEA' },
  CNX: { city: 'Chiang Mai',    country: 'Thailand',     color: 'border-amber-300 text-amber-400',        shape: 'hexagon',   region: 'SEA' },
  HKT: { city: 'Phuket',        country: 'Thailand',     color: 'border-sky-400 text-sky-500',            shape: 'oval',      region: 'SEA' },
  SGN: { city: 'Ho Chi Minh',   country: 'Vietnam',      color: 'border-yellow-500 text-yellow-600',      shape: 'hexagon',   region: 'SEA' },
  HAN: { city: 'Hanoi',         country: 'Vietnam',      color: 'border-yellow-400 text-yellow-500',      shape: 'oval',      region: 'SEA' },
  DAD: { city: 'Da Nang',       country: 'Vietnam',      color: 'border-lime-400 text-lime-500',          shape: 'hexagon',   region: 'SEA' },
  RGN: { city: 'Yangon',        country: 'Myanmar',      color: 'border-green-500 text-green-600',        shape: 'oval',      region: 'SEA' },
  PNH: { city: 'Phnom Penh',    country: 'Cambodia',     color: 'border-teal-400 text-teal-500',          shape: 'rectangle', region: 'SEA' },
  VTE: { city: 'Vientiane',     country: 'Laos',         color: 'border-cyan-400 text-cyan-500',          shape: 'oval',      region: 'SEA' },
  MNL: { city: 'Manila',        country: 'Philippines',  color: 'border-sky-500 text-sky-600',            shape: 'hexagon',   region: 'SEA' },
  CGK: { city: 'Jakarta',       country: 'Indonesia',    color: 'border-red-400 text-red-500',            shape: 'rectangle', region: 'SEA' },
  SUB: { city: 'Surabaya',      country: 'Indonesia',    color: 'border-rose-500 text-rose-600',          shape: 'oval',      region: 'SEA' },
  DPS: { city: 'Bali',          country: 'Indonesia',    color: 'border-emerald-400 text-emerald-500',    shape: 'hexagon',   region: 'SEA' },
  UPG: { city: 'Makassar',      country: 'Indonesia',    color: 'border-orange-400 text-orange-500',      shape: 'rectangle', region: 'SEA' },
  BPN: { city: 'Balikpapan',    country: 'Indonesia',    color: 'border-amber-500 text-amber-600',        shape: 'oval',      region: 'SEA' },
  PKU: { city: 'Pekanbaru',     country: 'Indonesia',    color: 'border-lime-500 text-lime-600',          shape: 'hexagon',   region: 'SEA' },
  JOG: { city: 'Yogyakarta',    country: 'Indonesia',    color: 'border-green-400 text-green-500',        shape: 'rectangle', region: 'SEA' },
  KNO: { city: 'Medan',         country: 'Indonesia',    color: 'border-teal-500 text-teal-600',          shape: 'oval',      region: 'SEA' },

  // ── Northeast Asia ────────────────────────────────────────────────────────
  NRT: { city: 'Tokyo',         country: 'Japan',        color: 'border-pink-400 text-pink-500',          shape: 'oval',      region: 'NEA' },
  HND: { city: 'Tokyo',         country: 'Japan',        color: 'border-pink-400 text-pink-500',          shape: 'hexagon',   region: 'NEA' },
  KIX: { city: 'Osaka',         country: 'Japan',        color: 'border-fuchsia-400 text-fuchsia-500',    shape: 'rectangle', region: 'NEA' },
  FUK: { city: 'Fukuoka',       country: 'Japan',        color: 'border-violet-400 text-violet-500',      shape: 'hexagon',   region: 'NEA' },
  ICN: { city: 'Seoul',         country: 'South Korea',  color: 'border-blue-500 text-blue-600',          shape: 'rectangle', region: 'NEA' },
  PEK: { city: 'Beijing',       country: 'China',        color: 'border-red-600 text-red-700',            shape: 'oval',      region: 'NEA' },
  PKX: { city: 'Beijing',       country: 'China',        color: 'border-red-600 text-red-700',            shape: 'hexagon',   region: 'NEA' },
  PVG: { city: 'Shanghai',      country: 'China',        color: 'border-red-500 text-red-600',            shape: 'rectangle', region: 'NEA' },
  CAN: { city: 'Guangzhou',     country: 'China',        color: 'border-orange-500 text-orange-600',      shape: 'hexagon',   region: 'NEA' },
  CSX: { city: 'Changsha',      country: 'China',        color: 'border-orange-400 text-orange-500',      shape: 'oval',      region: 'NEA' },
  HKG: { city: 'Hong Kong',     country: 'Hong Kong',    color: 'border-indigo-500 text-indigo-600',      shape: 'oval',      region: 'NEA' },
  TPE: { city: 'Taipei',        country: 'Taiwan',       color: 'border-sky-400 text-sky-500',            shape: 'rectangle', region: 'NEA' },
  XMN: { city: 'Xiamen',        country: 'China',        color: 'border-amber-500 text-amber-600',        shape: 'oval',      region: 'NEA' },
  CTU: { city: 'Chengdu',       country: 'China',        color: 'border-lime-500 text-lime-600',          shape: 'hexagon',   region: 'NEA' },

  // ── South Asia ────────────────────────────────────────────────────────────
  BOM: { city: 'Mumbai',        country: 'India',        color: 'border-orange-500 text-orange-600',      shape: 'rectangle', region: 'SAS' },
  DEL: { city: 'New Delhi',     country: 'India',        color: 'border-amber-600 text-amber-700',        shape: 'oval',      region: 'SAS' },
  MAA: { city: 'Chennai',       country: 'India',        color: 'border-yellow-600 text-yellow-700',      shape: 'hexagon',   region: 'SAS' },
  BLR: { city: 'Bengaluru',     country: 'India',        color: 'border-lime-600 text-lime-700',          shape: 'rectangle', region: 'SAS' },
  HYD: { city: 'Hyderabad',     country: 'India',        color: 'border-green-600 text-green-700',        shape: 'oval',      region: 'SAS' },
  AMD: { city: 'Ahmedabad',     country: 'India',        color: 'border-orange-400 text-orange-500',      shape: 'hexagon',   region: 'SAS' },
  CCU: { city: 'Kolkata',       country: 'India',        color: 'border-amber-500 text-amber-600',        shape: 'rectangle', region: 'SAS' },
  CMB: { city: 'Colombo',       country: 'Sri Lanka',    color: 'border-yellow-500 text-yellow-600',      shape: 'hexagon',   region: 'SAS' },
  DAC: { city: 'Dhaka',         country: 'Bangladesh',   color: 'border-green-500 text-green-600',        shape: 'rectangle', region: 'SAS' },
  KTM: { city: 'Kathmandu',     country: 'Nepal',        color: 'border-sky-500 text-sky-600',            shape: 'oval',      region: 'SAS' },
  MLE: { city: 'Malé',          country: 'Maldives',     color: 'border-cyan-500 text-cyan-600',          shape: 'hexagon',   region: 'SAS' },

  // ── Middle East ───────────────────────────────────────────────────────────
  DOH: { city: 'Doha',          country: 'Qatar',        color: 'border-fuchsia-500 text-fuchsia-600',    shape: 'hexagon',   region: 'MEA' },
  JED: { city: 'Jeddah',        country: 'Saudi Arabia', color: 'border-emerald-500 text-emerald-600',    shape: 'hexagon',   region: 'MEA' },

  // ── Europe ────────────────────────────────────────────────────────────────
  LHR: { city: 'London',        country: 'United Kingdom', color: 'border-gray-500 text-gray-600',        shape: 'oval',      region: 'EUR' },
  CDG: { city: 'Paris',         country: 'France',       color: 'border-blue-500 text-blue-600',          shape: 'hexagon',   region: 'EUR' },
  FRA: { city: 'Frankfurt',     country: 'Germany',      color: 'border-gray-600 text-gray-700',          shape: 'rectangle', region: 'EUR' },
  AMS: { city: 'Amsterdam',     country: 'Netherlands',  color: 'border-orange-500 text-orange-600',      shape: 'oval',      region: 'EUR' },

  // ── Oceania ───────────────────────────────────────────────────────────────
  SYD: { city: 'Sydney',        country: 'Australia',    color: 'border-emerald-500 text-emerald-600',    shape: 'rectangle', region: 'OCE' },
  MEL: { city: 'Melbourne',     country: 'Australia',    color: 'border-teal-600 text-teal-700',          shape: 'oval',      region: 'OCE' },
  BNE: { city: 'Brisbane',      country: 'Australia',    color: 'border-cyan-500 text-cyan-600',          shape: 'hexagon',   region: 'OCE' },
  PER: { city: 'Perth',         country: 'Australia',    color: 'border-sky-500 text-sky-600',            shape: 'rectangle', region: 'OCE' },
  AKL: { city: 'Auckland',      country: 'New Zealand',  color: 'border-indigo-500 text-indigo-600',      shape: 'oval',      region: 'OCE' },
  ADL: { city: 'Adelaide',      country: 'Australia',    color: 'border-violet-500 text-violet-600',      shape: 'hexagon',   region: 'OCE' },
};

// ── Shape determinism for unknown ports ───────────────────────────────────────
const SHAPES = ['oval', 'hexagon', 'rectangle'] as const;

// ── Region → CSS patch colour class mapping ───────────────────────────────────
const REGION_COLOR: Record<Region, string> = {
  DOM: 'border-rausch text-rausch',
  SEA: 'border-patch-sea text-patch-sea',
  NEA: 'border-patch-east text-patch-east',
  SAS: 'border-patch-mena text-patch-mena',
  MEA: 'border-patch-mena text-patch-mena',
  EUR: 'border-patch-eur text-patch-eur',
  OCE: 'border-patch-oce text-patch-oce',
  AFR: 'border-patch-saf text-patch-saf',
  AMS: 'border-patch-ams text-patch-ams',
};

// ── Public helpers ────────────────────────────────────────────────────────────

/** Look up rich metadata for a given IATA code. Returns a sensible default for unknowns. */
export function getAirportMeta(iata: string): AirportMeta {
  const upper = iata.toUpperCase();
  return IATA_MAP[upper] ?? {
    city:    upper,
    country: 'Global',
    color:   'border-gray-400 text-gray-500',
    shape:   SHAPES[upper.charCodeAt(0) % SHAPES.length],
    region:  'SEA' as Region,
  };
}

/** Build the destinations array from a set of DutyEvents. */
export function extractDestinations(events: DutyEvent[]): Destination[] {
  const destMap = new Map<string, Destination>();

  for (const event of events) {
    if (event.type !== 'FLIGHT' || !event.arrPort) continue;

    const iata = event.arrPort.toUpperCase();
    const meta = getAirportMeta(iata);

    const existing = destMap.get(iata);
    if (existing) {
      existing.count += 1;
      if (new Date(event.date) > new Date(existing.lastVisited)) {
        existing.lastVisited = event.date;
      }
    } else {
      destMap.set(iata, {
        iata,
        city:        meta.city,
        country:     meta.country,
        count:       1,
        lastVisited: event.date,
        colorTheme:  meta.color,
        shape:       meta.shape,
      });
    }
  }

  return Array.from(destMap.values());
}

/** Region colour helper — used by components that want to tint by region. */
export function getRegionColor(iata: string): string {
  const meta = IATA_MAP[iata.toUpperCase()];
  if (!meta) return REGION_COLOR.SEA;
  return REGION_COLOR[meta.region];
}
