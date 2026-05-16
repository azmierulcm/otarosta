import type { RosterSummary } from '@/lib/types/roster';
import { CATALOG_SIZE } from '@/lib/data/destination-catalog';

export interface LifetimeStats {
  sectors: number;
  km: number;
  citiesCollected: number;
  citiesAvailable: number;
}

export function computeLifetimeStats(
  rosters: RosterSummary[],
  earnedCount: number,
): LifetimeStats {
  return {
    sectors: rosters.reduce((s, r) => s + r.totalSectors, 0),
    km: rosters.reduce((s, r) => s + r.totalKm, 0),
    citiesCollected: earnedCount,
    citiesAvailable: CATALOG_SIZE,
  };
}
