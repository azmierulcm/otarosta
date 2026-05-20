export type DutyType = 'FLIGHT' | 'STANDBY' | 'LAYOVER' | 'OFF' | 'TRAINING' | 'GROUND' | 'OTHER';

export interface DutyEvent {
  id: string;
  type: DutyType;
  date: string;          // ISO format YYYY-MM-DD
  day?: string;          // "MON" | "TUE" … day of week
  item?: string;         // flight number ("MH4") or duty code ("D", "DO", "S4-353")
  flightNumber?: string;
  depPort?: string;
  arrPort?: string;
  std?: string;          // scheduled departure time HH:MM (local)
  sta?: string;          // scheduled arrival time HH:MM (local)
  signOn?: string;       // duty start time HH:MM
  signOff?: string;      // duty end time HH:MM
  blockHrs?: string;     // "HH:MM" from PDF Actual Block Hours column
  dutyHrs?: string;      // "HH:MM" from PDF Duty Hours column
  dutyCode?: string;     // AIMS pairing code e.g. "BA", "BB"
  acType?: string;       // aircraft type e.g. "359" (A350-900)
  duration?: string;
  hotel?: string;
  description?: string;
  notes?: string;
}

export interface MonthlyStats {
  actualBlockHours?: string;     // "HH:MM" — read directly from PDF summary
  dutyHours?: string;            // "HH:MM" — read directly from PDF summary
  offDaysAtBase?: number;
  offDaysAwayFromBase?: number;
}

export interface Destination {
  city: string;
  country: string;
  iata: string;
  count: number;
  lastVisited: string;
  colorTheme: string;
  shape: 'oval' | 'hexagon' | 'rectangle';
}

export interface RosterStats {
  totalSectors: number;
  totalMiles: number;
  totalBlockTime: string;
  uniqueDestinations: number;
}

export interface RosterData {
  events: DutyEvent[];
  month: string;
  year: string;
  crewName?: string;
  /** IATA airline code, e.g. "MH". Parsed from the roster; stored in Firestore. */
  airline?: string;
  destinations?: Destination[];
  stats?: RosterStats;
  /** Aggregate block time in minutes — computed by enrichment module. */
  totalBlockMinutes?: number;
  /** Monthly stats read directly from the PDF summary section. */
  monthlyStats?: MonthlyStats;
  /** Structured parse report — present only when returned from parseRosterPreview */
  parseReport?: import('@/lib/parser/report').ParseReport;
}
