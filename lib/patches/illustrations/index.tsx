/**
 * Monoline city patch illustrations
 *
 * Rules:
 * - viewBox="0 0 80 80", no fills, stroke="currentColor"
 * - Default stroke-width 1.5px (48–120px render size)
 * - Accept `size` prop → adjusts stroke-width automatically
 * - Sub-elements (ground lines, snow caps, water) use strokeOpacity 0.3–0.5
 * - No hardcoded colours — callers set `color` via CSS to get the region tint
 */

import React from 'react';

export interface IllustrationProps {
  size?: number;
}

function sw(size = 80): number {
  if (size < 48) return 1.5;
  if (size > 120) return 3;
  return 2.25;
}

const base = (size?: number) => ({
  viewBox: '0 0 80 80',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: sw(size),
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

// ── Malaysia ──────────────────────────────────────────────────────────────────

/** KUL — Petronas Twin Towers with sky bridge */
export const KUL = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Left tower shaft */}
    <path d="M24 64V22H34V64" />
    {/* Left crown: horizontal bands narrowing to spire */}
    <path d="M24 22H34 M25.5 19H32.5 M27 16H31 M29 16V8" />
    {/* Right tower shaft */}
    <path d="M46 64V22H56V64" />
    {/* Right crown */}
    <path d="M46 22H56 M47.5 19H54.5 M49 16H53 M51 16V8" />
    {/* Sky bridge at ≈40% height */}
    <path d="M34 37H46" />
    {/* Ground */}
    <path d="M18 64H62" strokeOpacity={0.4} />
  </svg>
);

// ── Southeast Asia ────────────────────────────────────────────────────────────

/** SIN — Marina Bay Sands (3 towers + spanning curved canopy) */
export const SIN = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    <path d="M20 64V28H28V64" />
    <path d="M36 64V22H44V64" />
    <path d="M52 64V28H60V64" />
    {/* Canopy outer curve */}
    <path d="M16 30Q40 12 64 30" />
    {/* Canopy inner soffit */}
    <path d="M18 34Q40 18 62 34" strokeOpacity={0.35} />
    <path d="M14 64H66" strokeOpacity={0.4} />
  </svg>
);

/** BKK — Wat Arun stepped prang */
export const BKK = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Horizontal tier bands — the stacked crown */}
    <path d="M28 62H52 M30 56H50 M32 50H48 M34 44H46 M36 38H44 M38 32H42 M40 32V10" />
    {/* Left step connectors */}
    <path d="M28 62V56H30 M30 56V50H32 M32 50V44H34 M34 44V38H36 M36 38V32H38" strokeOpacity={0.45} />
    {/* Right step connectors */}
    <path d="M52 62V56H50 M50 56V50H48 M48 50V44H46 M46 44V38H44 M44 38V32H42" strokeOpacity={0.45} />
    {/* Finial crown */}
    <path d="M38 10H42 M39 8H41" strokeOpacity={0.4} />
    <path d="M16 64H64" strokeOpacity={0.4} />
  </svg>
);

/** CGK — Monas (National Monument, Jakarta) */
export const CGK = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Obelisk shaft — tapers slightly L→R as it rises */}
    <path d="M35 60V20L40 10L45 20V60" />
    {/* Stepped base */}
    <path d="M30 60H50" />
    <path d="M26 64H54" strokeOpacity={0.5} />
    {/* Stylised flame at apex */}
    <path d="M37.5 10Q36 5 40 3Q44 5 42.5 10" strokeOpacity={0.65} />
    <path d="M16 64H64" strokeOpacity={0.4} />
  </svg>
);

/** DPS — Balinese split gate (Candi Bentar) */
export const DPS = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Left gate tower shaft */}
    <path d="M14 64V44H26V64" />
    {/* Left stepped crown */}
    <path d="M14 44H26 M15.5 40H24.5 M17 36H23 M18.5 32H21.5 M20 32V22" />
    {/* Left step connectors */}
    <path d="M15.5 44V40H17 M24.5 44V40H23 M17 40V36H18.5 M23 40V36H21.5 M18.5 36V32" strokeOpacity={0.4} />
    {/* Right gate tower shaft */}
    <path d="M54 64V44H66V64" />
    {/* Right stepped crown */}
    <path d="M54 44H66 M55.5 40H64.5 M57 36H63 M58.5 32H61.5 M60 32V22" />
    {/* Right step connectors */}
    <path d="M55.5 44V40H57 M64.5 44V40H63 M57 40V36H58.5 M63 40V36H61.5 M61.5 36V32" strokeOpacity={0.4} />
    {/* Ceremonial ground platform */}
    <path d="M10 64H70" strokeOpacity={0.4} />
  </svg>
);

/** MNL — Rizal Monument (obelisk + standing figure) */
export const MNL = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Obelisk */}
    <path d="M37 52V16L40 8L43 16V52" />
    {/* Obelisk base block */}
    <path d="M33 52H47V56H33V52" />
    {/* Standing figure */}
    <circle cx="40" cy="58" r="2" />
    <path d="M40 60V66 M37.5 62H42.5" />
    {/* Pedestal steps */}
    <path d="M28 64H52" />
    <path d="M24 66H56" strokeOpacity={0.4} />
  </svg>
);

/** HAN — Turtle Tower (Tháp Rùa, Hanoi) */
export const HAN = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Three tower tiers */}
    <path d="M32 58V52H48V58" />
    <path d="M34 52V46H46V52" />
    <path d="M36 46V40H44V46" />
    {/* Pointed pagoda roof */}
    <path d="M36 40H44 M37 38H43 M38 36H42 M40 36V26" />
    {/* Roof finial */}
    <path d="M38 26H42" strokeOpacity={0.4} />
    {/* Tier eave overhangs */}
    <path d="M30 58H50 M32 52H48 M34 46H46" strokeOpacity={0.4} />
    {/* Island base */}
    <path d="M26 60H54" />
    {/* Lake ripples */}
    <path d="M16 62Q30 60 44 62Q52 64 64 62" strokeOpacity={0.4} />
    <path d="M12 66Q26 64 40 66Q54 64 68 66" strokeOpacity={0.25} />
  </svg>
);

/** SGN — Notre-Dame Cathedral Saigon (twin spired towers) */
export const SGN = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Left tower */}
    <path d="M18 64V30H32V64" />
    {/* Left spire */}
    <path d="M18 30H32 M19.5 26H30.5 M21 22H29 M23 18H27 M25 18V10" />
    {/* Right tower */}
    <path d="M48 64V30H62V64" />
    {/* Right spire */}
    <path d="M48 30H62 M49.5 26H60.5 M51 22H59 M53 18H57 M55 18V10" />
    {/* Central facade / nave */}
    <path d="M32 64V50H48V64" />
    {/* Rose window */}
    <circle cx="40" cy="42" r="5" strokeOpacity={0.5} />
    {/* Central pointed arch */}
    <path d="M32 50Q40 38 48 50" strokeOpacity={0.4} />
    <path d="M12 64H68" strokeOpacity={0.4} />
  </svg>
);

/** PNH — Royal Palace (simplified Khmer spire) — placeholder illustration */
export const PNH = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    <path d="M30 64V42H50V64" />
    <path d="M32 42H48 M34 36H46 M36 30H44 M38 24H42 M40 24V10" />
    <path d="M30 42V36H32 M50 42V36H48 M32 36V30H34 M48 36V30H46" strokeOpacity={0.4} />
    <path d="M38 10H42" strokeOpacity={0.4} />
    <path d="M16 64H64" strokeOpacity={0.4} />
  </svg>
);

/** RGN — Shwedagon Pagoda (Yangon) */
export const RGN = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Dome base */}
    <path d="M24 54Q24 42 40 42Q56 42 56 54" />
    {/* Spire */}
    <path d="M34 42V36H46V42 M36 36H44 M37 32H43 M38 28H42 M39 24H41 M40 24V10" />
    {/* Spire rings */}
    <path d="M38 20H42 M38.5 16H41.5" strokeOpacity={0.4} />
    {/* Base platform */}
    <path d="M18 56H62" />
    <path d="M16 60H64" strokeOpacity={0.5} />
    <path d="M14 64H66" strokeOpacity={0.4} />
  </svg>
);

// ── East Asia ─────────────────────────────────────────────────────────────────

/** HKG — Bank of China Tower (diagonal facet cuts) */
export const HKG = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Main tower shaft */}
    <path d="M30 64V14H50V64" />
    {/* Three diagonal facet cuts — the BoC signature */}
    <path d="M30 50L50 36" />
    <path d="M30 36L50 22" />
    <path d="M30 22L50 14" />
    {/* Antenna mast */}
    <path d="M39.5 14V8H40.5V14" />
    <path d="M14 64H66" strokeOpacity={0.4} />
  </svg>
);

/** NRT — Mount Fuji with snow cap and sun */
export const NRT = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Mountain silhouette */}
    <path d="M10 62L40 12L70 62" />
    {/* Snow cap edge */}
    <path d="M32 34Q40 22 48 34" strokeOpacity={0.5} />
    {/* Sun peeking from right shoulder */}
    <circle cx="57" cy="28" r="5" strokeOpacity={0.35} />
    {/* Base / water */}
    <path d="M8 62H72" strokeOpacity={0.4} />
  </svg>
);

/** ICN — Namsan N Seoul Tower (slim mast + observation disk) */
export const ICN = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Slim mast */}
    <path d="M39 64V8H41V64" />
    {/* Observation deck disc */}
    <path d="M28 38H52" />
    <path d="M30 41H50" strokeOpacity={0.45} />
    {/* Tower base / pedestal on hill */}
    <path d="M34 56H46 M32 60H48" />
    {/* Hill curve */}
    <path d="M14 64Q26 58 34 56M46 56Q54 58 66 64" strokeOpacity={0.4} />
  </svg>
);

/** KIX — Osaka (Tsūtenkaku tower — grid cylinder on legs) */
export const KIX = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Observation cylinder */}
    <path d="M30 34H50V52H30V34" />
    {/* Top dome/finial */}
    <path d="M30 34Q40 22 50 34" />
    <path d="M40 22V16" strokeOpacity={0.6} />
    {/* Horizontal belt lines on cylinder */}
    <path d="M30 40H50 M30 46H50" strokeOpacity={0.4} />
    {/* Four legs to base */}
    <path d="M32 52L26 64 M48 52L54 64 M36 52V64 M44 52V64" />
    <path d="M20 64H60" strokeOpacity={0.4} />
  </svg>
);

/** FUK — Fukuoka (Fukuoka Tower — triangular lattice tower with silver tiles) */
export const FUK = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Tower silhouette */}
    <path d="M28 64V20H52V64" />
    {/* Tapering top */}
    <path d="M28 20Q40 8 52 20" />
    <path d="M40 8V4" strokeOpacity={0.6} />
    {/* Diagonal lattice lines (simplified) */}
    <path d="M28 44L52 32 M28 32L52 44 M28 56L52 50" strokeOpacity={0.35} />
    <path d="M16 64H64" strokeOpacity={0.4} />
  </svg>
);

/** TPE — Taipei 101 (stacked pagoda tiers narrowing upward) */
export const TPE = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Tier eave lines (each band is the roof of that storey) */}
    <path d="M24 64H56 M26 60H54 M28 56H52 M30 52H50 M32 48H48 M33 44H47 M34 40H46 M35 36H45 M36 32H44 M37 28H43 M38 24H42" />
    {/* Left vertical connectors */}
    <path d="M26 60V64 M28 56V60 M30 52V56 M32 48V52 M33 44V48 M34 40V44 M35 36V40 M36 32V36 M37 28V32 M38 24V28" strokeOpacity={0.4} />
    {/* Right vertical connectors */}
    <path d="M54 60V64 M52 56V60 M50 52V56 M48 48V52 M47 44V48 M46 40V44 M45 36V40 M44 32V36 M43 28V32 M42 24V28" strokeOpacity={0.4} />
    {/* Spire */}
    <path d="M40 24V8" />
    <path d="M14 64H66" strokeOpacity={0.4} />
  </svg>
);

/** PVG — Oriental Pearl Tower (two spheres on slim mast) */
export const PVG = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Three triangular support legs */}
    <path d="M40 56L24 64 M40 56L56 64" strokeOpacity={0.5} />
    {/* Main mast */}
    <path d="M39 64V8H41V64" />
    {/* Lower large sphere */}
    <circle cx="40" cy="46" r="12" />
    {/* Upper smaller sphere */}
    <circle cx="40" cy="24" r="7" />
    {/* Top spire */}
    <path d="M39.5 17V8H40.5V17" strokeOpacity={0.65} />
    <path d="M16 64H64" strokeOpacity={0.4} />
  </svg>
);

/** CAN — Guangzhou (Canton Tower — lattice hyperboloid) */
export const CAN = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Hyperboloid outline — narrows at waist then flares again */}
    <path d="M30 64C26 52 28 36 34 28C36 24 40 22 40 22C40 22 44 24 46 28C52 36 54 52 50 64" />
    <path d="M30 64C26 52 28 36 34 28" strokeOpacity={0} />
    {/* Diagonal lattice strands (simplified) */}
    <path d="M30 58C36 48 42 36 44 26 M50 58C44 48 38 36 36 26" strokeOpacity={0.45} />
    <path d="M30 50C36 42 42 34 46 28 M50 50C44 42 38 34 34 28" strokeOpacity={0.3} />
    {/* Top platform */}
    <path d="M36 22H44" />
    {/* Spire */}
    <path d="M40 22V8" />
    <path d="M16 64H64" strokeOpacity={0.4} />
  </svg>
);

// ── Oceania ───────────────────────────────────────────────────────────────────

/** SYD — Sydney Opera House (overlapping shell arches) */
export const SYD = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Three overlapping concave shells, each larger, reading left → right */}
    <path d="M20 58Q24 28 36 24Q30 44 20 58" />
    <path d="M28 58Q32 22 46 18Q38 40 28 58" />
    <path d="M38 58Q44 16 62 14Q52 36 38 58" />
    {/* Stepped base platform */}
    <path d="M16 58H66" />
    <path d="M12 62H70" strokeOpacity={0.4} />
  </svg>
);

/** MEL — Flinders Street Station (horizontal facade, dome + clock tower) */
export const MEL = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Main horizontal building facade */}
    <path d="M14 60H66V46H14V60" />
    {/* Central clock tower */}
    <path d="M34 46V28H46V46" />
    {/* Dome atop clock tower */}
    <path d="M34 28Q40 18 46 28" />
    {/* Clock face */}
    <circle cx="40" cy="38" r="5" />
    {/* Row of arched windows */}
    <path d="M16 54Q19 50 22 54 M24 54Q27 50 30 54 M50 54Q53 50 56 54 M58 54Q61 50 64 54" strokeOpacity={0.4} />
    <path d="M12 62H68" strokeOpacity={0.4} />
  </svg>
);

/** BNE — Brisbane Story Bridge (cantilever truss bridge) */
export const BNE = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Bridge deck */}
    <path d="M8 48H72" />
    {/* Two main towers */}
    <path d="M28 48V22H36V48 M44 48V22H52V48" />
    {/* Diagonal truss cables from towers */}
    <path d="M32 22L14 48 M32 22L50 22 M48 22L66 48 M48 22L30 22" strokeOpacity={0.5} />
    {/* Top horizontal beam connecting towers */}
    <path d="M28 22H52" strokeOpacity={0.4} />
    {/* River */}
    <path d="M6 54Q20 52 40 54Q60 56 74 54" strokeOpacity={0.35} />
    <path d="M6 58Q20 56 40 58Q60 60 74 58" strokeOpacity={0.25} />
  </svg>
);

/** PER — Perth (Bell Tower on the foreshore) */
export const PER = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Sail-like glass spire */}
    <path d="M40 10Q48 14 50 36H40" />
    <path d="M40 10Q32 14 30 36H40" />
    {/* Bell chamber at mid-height */}
    <path d="M32 36H48V44H32V36" />
    {/* Small bells hinted (dots) */}
    <path d="M36 40H44" strokeOpacity={0.4} />
    {/* Base steps */}
    <path d="M28 44H52 M26 48H54" />
    {/* Jetty/foreshore */}
    <path d="M16 54H64" strokeOpacity={0.4} />
    {/* Water */}
    <path d="M10 58Q30 56 50 58Q62 60 70 58" strokeOpacity={0.35} />
  </svg>
);

/** AKL — Auckland Sky Tower (slim tower with observation disc) */
export const AKL = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Slim mast */}
    <path d="M39 64V8H41V64" />
    {/* Main observation pod (lens shape) */}
    <path d="M28 36H52" />
    <path d="M30 40H50" strokeOpacity={0.4} />
    {/* Secondary observation level */}
    <path d="M32 30H48" strokeOpacity={0.6} />
    {/* Tripod base */}
    <path d="M40 58L24 64 M40 58L56 64" strokeOpacity={0.5} />
    {/* Ground */}
    <path d="M16 64H64" strokeOpacity={0.4} />
  </svg>
);

/** ADL — Adelaide (Festival Centre sails) */
export const ADL = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Three overlapping tent/sail roof forms */}
    <path d="M16 52L28 24L40 52" />
    <path d="M28 52L44 20L60 52" />
    <path d="M40 52L52 28L64 52" strokeOpacity={0.6} />
    {/* Horizontal eave / base of sails */}
    <path d="M14 52H66" />
    <path d="M12 58H68" strokeOpacity={0.4} />
  </svg>
);

// ── Middle East ───────────────────────────────────────────────────────────────

/** DOH — Museum of Islamic Art (stepped geometric mass, central lantern) */
export const DOH = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Base level */}
    <path d="M18 64H62V58H18V64" />
    {/* Step 2 */}
    <path d="M22 58H58V52H22V58" />
    {/* Step 3 */}
    <path d="M26 52H54V46H26V52" />
    {/* Step 4 */}
    <path d="M30 46H50V40H30V46" />
    {/* Upper pyramidal mass */}
    <path d="M30 40H50 M32 36H48 M34 32H46 M36 28H44 M38 24H42 M40 24V18" />
    {/* Central lantern dome */}
    <path d="M37.5 18Q40 12 42.5 18" />
    <path d="M14 64H66" strokeOpacity={0.4} />
  </svg>
);

/** JED — Jeddah (King Fahd Fountain — world's tallest fountain) */
export const JED = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Main central jet */}
    <path d="M39 56V10H41V56" />
    {/* Side jets fanning outward */}
    <path d="M40 56Q30 40 20 50 M40 56Q50 40 60 50" strokeOpacity={0.6} />
    <path d="M40 56Q34 44 24 54 M40 56Q46 44 56 54" strokeOpacity={0.4} />
    {/* Spray at top of main jet */}
    <path d="M38 10Q40 6 42 10" strokeOpacity={0.5} />
    <path d="M37 12Q40 8 43 12" strokeOpacity={0.35} />
    {/* Pool base */}
    <path d="M18 58H62" />
    {/* Sea/water */}
    <path d="M10 62Q30 60 50 62Q60 64 70 62" strokeOpacity={0.4} />
  </svg>
);

/** MED — Medina (Prophet's Mosque — domed structure with minarets) */
export const MED = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Central dome */}
    <path d="M28 48Q28 28 40 26Q52 28 52 48" />
    {/* Drum beneath dome */}
    <path d="M28 48H52" />
    {/* Two minarets */}
    <path d="M14 64V30H22V64" />
    <path d="M14 30H22 M15 26H21 M16 22H20 M18 22V14" />
    <path d="M58 64V30H66V64" />
    <path d="M58 30H66 M59 26H65 M60 22H64 M62 22V14" />
    {/* Building base */}
    <path d="M22 64H58V48H22V64" />
    <path d="M10 64H70" strokeOpacity={0.4} />
  </svg>
);

// ── Europe ────────────────────────────────────────────────────────────────────

/** LHR — Big Ben / Elizabeth Tower (clock face + Gothic crown) */
export const LHR = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Tower body */}
    <path d="M30 64V20H50V64" />
    {/* Gothic crown bands */}
    <path d="M30 20H50 M31 17H49 M32 14H48 M34 11H46 M36 8H44 M38 6H42 M40 6V4" />
    {/* Corner pinnacles (subtle) */}
    <path d="M30 16V12 M50 16V12" strokeOpacity={0.45} />
    {/* Clock face */}
    <circle cx="40" cy="30" r="8" />
    {/* Clock hands */}
    <path d="M40 26V30H46" strokeOpacity={0.55} />
    {/* Arched windows */}
    <path d="M32 50Q36 45 40 50Q44 45 48 50" strokeOpacity={0.3} />
    <path d="M14 64H66" strokeOpacity={0.4} />
  </svg>
);

/** CDG — Eiffel Tower (four-leg triangle, three girder levels, antenna) */
export const CDG = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Outer legs */}
    <path d="M14 64L40 8L66 64" />
    {/* Inner leg lines */}
    <path d="M24 64L40 20" strokeOpacity={0.5} />
    <path d="M56 64L40 20" strokeOpacity={0.5} />
    {/* Three horizontal girder levels */}
    <path d="M20 52H60 M26 38H54 M32 24H48" />
    {/* Top antenna */}
    <path d="M40 8V4" strokeOpacity={0.6} />
    <path d="M10 64H70" strokeOpacity={0.4} />
  </svg>
);

// ── South Asia ────────────────────────────────────────────────────────────────

/** DEL — India Gate (memorial triumphal arch) */
export const DEL = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Outer arch legs */}
    <path d="M22 64V36Q22 20 40 18Q58 20 58 36V64" />
    {/* Inner arch opening */}
    <path d="M28 64V42Q28 28 40 26Q52 28 52 42V64" strokeOpacity={0.5} />
    {/* Horizontal entablature above arch */}
    <path d="M20 36H60" />
    <path d="M22 32H58" strokeOpacity={0.45} />
    {/* Base steps */}
    <path d="M16 64H64" />
    <path d="M12 66H68" strokeOpacity={0.4} />
  </svg>
);

/** BOM — Gateway of India (arch + four corner turrets) */
export const BOM = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Corner turrets */}
    <path d="M14 64V38H24V64" />
    <path d="M56 64V38H66V64" />
    {/* Turret stepped crowns */}
    <path d="M14 38H24 M15 34H23 M16 30H22 M19 30V24" />
    <path d="M56 38H66 M57 34H65 M58 30H64 M61 30V24" />
    {/* Central arch */}
    <path d="M24 64V46Q24 26 40 22Q56 26 56 46V64" />
    {/* Inner arch */}
    <path d="M28 64V50Q28 34 40 30Q52 34 52 50V64" strokeOpacity={0.5} />
    {/* Horizontal band connecting turrets */}
    <path d="M14 38H66" strokeOpacity={0.4} />
    <path d="M10 64H70" strokeOpacity={0.4} />
  </svg>
);

/** BLR — Bengaluru (Vidhana Soudha — neo-Dravidian government building) */
export const BLR = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Central dome */}
    <path d="M32 40Q32 26 40 24Q48 26 48 40" />
    <path d="M32 40H48" />
    {/* Drum / base of dome */}
    <path d="M30 40H50V44H30V40" />
    {/* Side towers */}
    <path d="M14 64V36H28V64" />
    <path d="M52 64V36H66V64" />
    {/* Tower tops (curved) */}
    <path d="M14 36Q21 26 28 36 M52 36Q59 26 66 36" />
    {/* Building base */}
    <path d="M28 64V44H52V64" />
    {/* Colonnade hint */}
    <path d="M30 56H50" strokeOpacity={0.4} />
    <path d="M10 64H70" strokeOpacity={0.4} />
  </svg>
);

/** CMB — Colombo (Lotus Tower) */
export const CMB = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Lotus petal collar around mid-section */}
    <path d="M26 44Q32 36 40 38Q48 36 54 44" />
    <path d="M28 48Q34 38 40 40Q46 38 52 48" strokeOpacity={0.5} />
    {/* Tower shaft */}
    <path d="M37 64V8H43V64" />
    {/* Observation pod */}
    <path d="M32 38H48V44H32V38" />
    {/* Top spire / antenna */}
    <path d="M39.5 8V4H40.5V8" strokeOpacity={0.6} />
    {/* Base legs */}
    <path d="M32 60L22 64 M48 60L58 64" strokeOpacity={0.5} />
    <path d="M14 64H66" strokeOpacity={0.4} />
  </svg>
);

/** MLE — Malé (stylised palm & turquoise sea) */
export const MLE = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Palm trunk */}
    <path d="M40 60C39 48 38 36 40 20" />
    {/* Palm fronds */}
    <path d="M40 20Q28 16 22 24 M40 20Q52 16 58 24 M40 20Q30 12 34 6 M40 20Q50 12 46 6" />
    <path d="M40 20Q24 22 22 32 M40 20Q56 22 58 32" strokeOpacity={0.5} />
    {/* Sandy ground */}
    <path d="M24 60H56" />
    {/* Ocean waves */}
    <path d="M14 64Q24 62 34 64Q44 66 54 64Q62 62 66 64" strokeOpacity={0.4} />
  </svg>
);

/** DAC — Dhaka (National Martyr's Memorial — stepped triangular form) */
export const DAC = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Seven triangular forms — simplified as a pointed cluster */}
    <path d="M40 8L28 56H52L40 8" />
    <path d="M40 8L22 60H58L40 8" strokeOpacity={0.5} />
    <path d="M40 8L16 64H64L40 8" strokeOpacity={0.3} />
    {/* Reflection pool */}
    <path d="M20 66H60" strokeOpacity={0.4} />
    <path d="M16 68H64" strokeOpacity={0.25} />
  </svg>
);

/** KTM — Kathmandu (Boudhanath Stupa — dome with eyes) */
export const KTM = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Base rings */}
    <path d="M18 58H62V54H18V58" />
    <path d="M22 54H58V50H22V54" />
    {/* Main dome */}
    <path d="M26 50Q26 32 40 30Q54 32 54 50" />
    {/* Harmika (square tower on dome) */}
    <path d="M34 30H46V24H34V30" />
    {/* Spire tiers */}
    <path d="M35 24H45 M36 20H44 M37 16H43 M38 12H42 M39 8H41 M40 8V6" />
    {/* Eyes (dots) on harmika */}
    <circle cx="38" cy="27" r="1.5" />
    <circle cx="42" cy="27" r="1.5" />
    <path d="M14 58H66" strokeOpacity={0.4} />
  </svg>
);

/** MAA — Chennai (Marina Beach lighthouse) */
export const MAA = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Lighthouse tower */}
    <path d="M34 60V20Q34 16 40 16Q46 16 46 20V60" />
    {/* Light chamber */}
    <path d="M32 20H48V16H32V20" />
    {/* Dome of light chamber */}
    <path d="M32 16Q40 8 48 16" />
    {/* Light beam (subtle) */}
    <path d="M40 12L56 4 M40 12L24 4" strokeOpacity={0.3} />
    {/* Horizontal bands on tower */}
    <path d="M34 36H46 M34 48H46" strokeOpacity={0.4} />
    {/* Base */}
    <path d="M28 60H52" />
    {/* Ocean */}
    <path d="M10 64Q26 62 40 64Q54 62 70 64" strokeOpacity={0.4} />
  </svg>
);

/** HYD — Hyderabad (Charminar — four-minaret arch) */
export const HYD = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Four corner minarets */}
    <path d="M18 64V36H26V64 M54 64V36H62V64" />
    <path d="M18 36H26 M19 32H25 M20 28H24 M22 28V22 M54 36H62 M55 32H61 M56 28H60 M58 28V22" />
    {/* Central arch opening */}
    <path d="M26 64V50Q26 34 40 30Q54 34 54 50V64" />
    {/* Inner arch */}
    <path d="M30 64V52Q30 40 40 36Q50 40 50 52V64" strokeOpacity={0.5} />
    {/* Top entablature */}
    <path d="M18 36H62" strokeOpacity={0.4} />
    <path d="M14 64H66" strokeOpacity={0.4} />
  </svg>
);

/** CCU — Kolkata (Howrah Bridge — cantilever truss) */
export const CCU = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Bridge deck */}
    <path d="M6 46H74" />
    {/* Two towers */}
    <path d="M24 46V18H36V46 M44 46V18H56V46" />
    {/* Top beam */}
    <path d="M24 18H56" />
    {/* Diagonal truss work */}
    <path d="M30 18L12 46 M30 18L50 18 M50 18L68 46 M50 18L30 18" strokeOpacity={0.5} />
    <path d="M30 32L18 46 M50 32L62 46" strokeOpacity={0.35} />
    {/* River */}
    <path d="M6 54Q20 52 40 54Q60 56 74 54" strokeOpacity={0.35} />
    <path d="M6 58Q20 56 40 58Q60 60 74 58" strokeOpacity={0.25} />
  </svg>
);

/** AMD — Ahmedabad (Sabarmati Ashram — simple Gandhi-era textile mill silhouette) */
export const AMD = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Chimney stacks (textile mill) */}
    <path d="M24 64V20H30V64 M50 64V20H56V64" />
    <path d="M22 20H32 M48 20H58" strokeOpacity={0.5} />
    {/* Main mill building */}
    <path d="M14 64H66V48H14V64" />
    {/* Arched windows in building */}
    <path d="M18 58Q22 52 26 58 M32 58Q36 52 40 58 M46 58Q50 52 54 58 M60 58Q64 52 68 58" strokeOpacity={0.4} />
    {/* Spinning wheel circle — Gandhi symbol */}
    <circle cx="40" cy="36" r="8" />
    <path d="M40 28V44 M32 36H48 M34 30L46 42 M34 42L46 30" strokeOpacity={0.4} />
  </svg>
);

/** ATQ — Amritsar (Golden Temple — dome with corner towers) */
export const ATQ = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Corner small towers (4 corners — show 2 visible) */}
    <path d="M18 58V42H26V58 M54 58V42H62V58" />
    <path d="M18 42H26 M19 38H25 M21 38V32 M54 42H62 M55 38H61 M57 38V32" />
    {/* Causeway / sarovar (sacred pool) */}
    <path d="M26 58H54" />
    {/* Central shrine building */}
    <path d="M32 58V46H48V58" />
    {/* Golden dome */}
    <path d="M32 46Q32 30 40 28Q48 30 48 46" />
    {/* Finial / kalash on dome */}
    <path d="M38 28H42 M39 24H41 M40 24V18" />
    {/* Pool water reflection ripple */}
    <path d="M14 60H66" strokeOpacity={0.35} />
    <path d="M10 64H70" strokeOpacity={0.4} />
  </svg>
);

/** COK — Kochi (Chinese fishing nets — iconic cantilevered nets) */
export const COK = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Three net structures in a row */}
    {/* Left net */}
    <path d="M14 52L26 28 M14 52L32 44" strokeOpacity={0.6} />
    <path d="M20 28Q28 34 32 44Q24 38 20 28" strokeOpacity={0.5} />
    {/* Centre net (main) */}
    <path d="M28 56L40 20 M28 56L52 44" />
    <path d="M34 20Q44 32 52 44Q40 38 34 20" strokeOpacity={0.55} />
    {/* Right net */}
    <path d="M44 52L56 28 M44 52L66 44" strokeOpacity={0.6} />
    <path d="M50 28Q58 36 66 44Q58 40 50 28" strokeOpacity={0.5} />
    {/* Waterfront & sea */}
    <path d="M8 56H72" strokeOpacity={0.4} />
    <path d="M8 60Q24 58 40 60Q56 62 72 60" strokeOpacity={0.35} />
  </svg>
);

/** TRV — Thiruvananthapuram (Padmanabhaswamy Temple — Kerala gopuram) */
export const TRV = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    {/* Main gopuram (gate tower) — stepped pyramid with many tiers */}
    <path d="M26 64H54 M28 58H52 M30 52H50 M32 46H48 M34 40H46 M36 34H44 M37 28H43 M38 22H42 M39 16H41 M40 16V8" />
    {/* Left connectors */}
    <path d="M28 64V58H30 M30 58V52H32 M32 52V46H34 M34 46V40H36 M36 40V34H37 M37 34V28H38 M38 28V22H39" strokeOpacity={0.4} />
    {/* Right connectors */}
    <path d="M52 64V58H50 M50 58V52H48 M48 52V46H46 M46 46V40H44 M44 40V34H43 M43 34V28H42 M42 28V22H41" strokeOpacity={0.4} />
    {/* Kalash finial */}
    <path d="M39 8H41 M40 8V4" strokeOpacity={0.5} />
    <path d="M14 64H66" strokeOpacity={0.4} />
  </svg>
);

// ── Fallback ──────────────────────────────────────────────────────────────────

/** Generic landmark placeholder used for cities without a custom illustration */
export const Generic = ({ size }: IllustrationProps) => (
  <svg {...base(size)}>
    <path d="M40 14V58" />
    <path d="M30 24Q40 14 50 24" />
    <path d="M26 36Q40 18 54 36" strokeOpacity={0.5} />
    <path d="M22 48Q40 22 58 48" strokeOpacity={0.3} />
    <path d="M16 58H64" strokeOpacity={0.4} />
  </svg>
);

// ── Registry ──────────────────────────────────────────────────────────────────

export const ILLUSTRATIONS: Record<string, React.FC<IllustrationProps>> = {
  // Malaysia domestic
  KUL, AOR: Generic, BTU: Generic, JHB: Generic, KBR: Generic, BKI: Generic,
  TGG: Generic, KUA: Generic, KCH: Generic, LBU: Generic, LGK: Generic,
  MYY: Generic, PEN: Generic, SDK: Generic, SBW: Generic, TWU: Generic,
  // Southeast Asia
  SIN, BKK, CGK, DPS, MNL, HAN, SGN, PNH, RGN,
  HKT: Generic, CNX: Generic, SUB: Generic, KNO: Generic, BPN: Generic,
  UPG: Generic, PKU: Generic, YIA: Generic, DAD: Generic,
  // East Asia
  HKG, NRT, ICN, KIX, FUK, TPE, PVG, CAN,
  PKX: Generic, SZX: Generic, XMN: Generic, CSX: Generic, TFU: Generic,
  // Oceania
  SYD, MEL, BNE, PER, AKL, ADL,
  // Middle East
  DOH, JED, MED,
  // Europe
  LHR, CDG,
  // South Asia
  DEL, BOM, BLR, CMB, DAC, KTM, MAA, HYD, CCU, AMD, ATQ, COK, TRV, MLE,
};
