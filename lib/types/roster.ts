import type { DutyEvent } from './index';

export interface RosterSummary {
  id: string;
  month: string;
  year: string;
  crewName: string | null;
  airline: string;
  uploadedAt: string; // ISO string
  eventCount: number;
  totalSectors: number;
  totalKm: number;
  uniqueDestinations: number;
}

export interface FirestoreRoster extends RosterSummary {
  userId: string;
  events: DutyEvent[];
}
