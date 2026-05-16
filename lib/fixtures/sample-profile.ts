import type { EarnedDestination } from '@/lib/actions/destinations';
import type { LifetimeStats } from '@/lib/utils/stats';

export interface SampleProfileData {
  displayName: string;
  rank: string;
  base: string;
  aircraft: string;
  lifetimeStats: LifetimeStats;
  monthlyRecap: {
    month: string;
    year: string;
    sectors: number;
    blockMinutes: number;
    newCity: string | null;
  };
  earnedDestinations: EarnedDestination[];
}

export const SAMPLE_PROFILE: SampleProfileData = {
  displayName: 'Muhammad Azmierul',
  rank: 'Senior First Officer',
  base: 'KUL',
  aircraft: 'A350',

  lifetimeStats: {
    sectors: 847,
    km: 1_204_800,
    citiesCollected: 12,
    citiesAvailable: 72,
  },

  monthlyRecap: {
    month: 'November',
    year: '2025',
    sectors: 18,
    blockMinutes: 5040, // 84 h
    newCity: 'LHR',
  },

  earnedDestinations: [
    { iata: 'KUL', visits: 420, isHome: true,  isNew: false },
    { iata: 'LHR', visits: 12,  isHome: false, isNew: true  },
    { iata: 'SYD', visits: 24,  isHome: false, isNew: false },
    { iata: 'NRT', visits: 18,  isHome: false, isNew: false },
    { iata: 'CDG', visits: 8,   isHome: false, isNew: false },
    { iata: 'BOM', visits: 14,  isHome: false, isNew: false },
    { iata: 'SIN', visits: 64,  isHome: false, isNew: false },
    { iata: 'BKK', visits: 32,  isHome: false, isNew: false },
    { iata: 'ICN', visits: 9,   isHome: false, isNew: false },
    { iata: 'MEL', visits: 11,  isHome: false, isNew: false },
    { iata: 'DOH', visits: 5,   isHome: false, isNew: false },
    { iata: 'HKG', visits: 21,  isHome: false, isNew: false },
  ],
};
