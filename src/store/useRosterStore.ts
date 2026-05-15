import { create } from 'zustand';
import { RosterData, DutyEvent } from '@/types';
import { extractDestinations } from '@/utils/destinations';
import { calculateKilometers, formatBlockHours } from '@/utils/geo/haversine';

interface RosterState {
  roster: RosterData | null;
  isLoading: boolean;
  error: string | null;
  setRoster: (roster: RosterData) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useRosterStore = create<RosterState>((set) => ({
  roster: null,
  isLoading: false,
  error: null,
  setRoster: (roster) => {
    const destinations = extractDestinations(roster.events);
    
    // Calculate Stats
    const totalSectors = roster.events.filter(e => e.type === 'FLIGHT').length;
    const totalDistance = roster.events.reduce((acc, e) => {
      if (e.type === 'FLIGHT' && e.depPort && e.arrPort) {
        return acc + calculateKilometers(e.depPort, e.arrPort);
      }
      return acc;
    }, 0);
    const totalBlockTime = formatBlockHours(roster.events);
    const uniqueDestinations = destinations.length;

    const stats = {
      totalSectors,
      totalMiles: totalDistance, // Key kept as totalMiles for compatibility or rename to totalDistance if needed
      totalBlockTime,
      uniqueDestinations
    };

    set({ 
      roster: { ...roster, destinations, stats }, 
      isLoading: false, 
      error: null 
    });
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  reset: () => set({ roster: null, isLoading: false, error: null }),
}));
