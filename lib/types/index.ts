export type DutyType = 'FLIGHT' | 'STANDBY' | 'LAYOVER' | 'OFF' | 'TRAINING' | 'GROUND' | 'OTHER';

export interface DutyEvent {
  id: string;
  type: DutyType;
  date: string; // ISO format YYYY-MM-DD
  flightNumber?: string;
  depPort?: string;
  arrPort?: string;
  std?: string; // ISO format or time string
  sta?: string; // ISO format or time string
  signOn?: string;
  signOff?: string;
  duration?: string;
  hotel?: string;
  description?: string;
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
  /** Structured parse report — present only when returned from parseRosterPreview */
  parseReport?: import('@/lib/parser/report').ParseReport;
}
