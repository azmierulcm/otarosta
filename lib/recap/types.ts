export type RecapPeriod = 'month' | '6m' | '1y';

export interface PeriodConfig {
  type: RecapPeriod;
  /** Human-readable label, e.g. "January 2025", "Jan–Jun 2025", "2025" */
  label: string;
  /** Inclusive start (midnight UTC) */
  startDate: Date;
  /** Inclusive end (23:59:59 UTC) */
  endDate: Date;
  /** Roster months covered: array of "MM" strings to match against RosterSummary.month */
  months: string[];
  /** Year as string to match against RosterSummary.year */
  year: string;
}

export interface TopDestination {
  iata: string;
  visits: number;
}

export interface RecapData {
  userId: string;
  period: PeriodConfig;
  /** Crew display handle, e.g. "Ahmad Zulkifli" */
  crewHandle: string;
  totalSectors: number;
  totalKm: number;
  topDestinations: TopDestination[];
  /** IATA codes of patches earned (first visit) during the period */
  newPatches: string[];
  superlative: Superlative;
}

export interface Superlative {
  key: 'marathon' | 'frontier' | 'endurance' | 'commuter' | 'workhorse' | 'globe';
  label: string;
  value: string;
  subValue: string;
}
