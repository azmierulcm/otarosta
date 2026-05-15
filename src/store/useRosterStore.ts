import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
  loadSampleRoster: () => void;
}

export const useRosterStore = create<RosterState>()(
  persist(
    (set) => ({
      roster: null,
      isLoading: false,
      error: null,
      setRoster: (roster) => {
        const destinations = extractDestinations(roster.events);
        const totalSectors = roster.events.filter((e) => e.type === 'FLIGHT').length;
        const totalDistance = roster.events.reduce((acc, e) => {
          if (e.type === 'FLIGHT' && e.depPort && e.arrPort) {
            return acc + calculateKilometers(e.depPort, e.arrPort);
          }
          return acc;
        }, 0);
        const totalBlockTime = formatBlockHours(roster.events);
        const uniqueDestinations = destinations.length;

        set({
          roster: {
            ...roster,
            destinations,
            stats: {
              totalSectors,
              totalMiles: totalDistance,
              totalBlockTime,
              uniqueDestinations,
            },
          },
          isLoading: false,
          error: null,
        });
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),
      reset: () => set({ roster: null, isLoading: false, error: null }),
      loadSampleRoster: () => {
        const sampleData: RosterData = {
          month: 'May',
          year: '2026',
          crewName: 'Muhammad Azmierul',
          events: [
            {
              id: 'S4-353-02',
              type: 'STANDBY',
              date: '2026-05-02',
              signOn: '16:00',
              signOff: '23:59',
              description: 'A353 STANDBY DUTY 4',
            },
            {
              id: 'MH4-06',
              type: 'FLIGHT',
              date: '2026-05-06',
              flightNumber: 'MH 4',
              depPort: 'KUL',
              arrPort: 'LHR',
              signOn: '08:35',
              std: '09:53',
              sta: '16:33',
              signOff: '17:18',
              hotel: 'London Heathrow Hilton',
            },
            {
              id: 'MH1-07',
              type: 'FLIGHT',
              date: '2026-05-07',
              flightNumber: 'MH 1',
              depPort: 'LHR',
              arrPort: 'KUL',
              signOn: '20:35',
              std: '21:31',
              sta: '16:52',
              signOff: '17:37',
            },
            {
              id: 'MH376-18',
              type: 'FLIGHT',
              date: '2026-05-18',
              flightNumber: 'MH 376',
              depPort: 'KUL',
              arrPort: 'CAN',
              signOn: '07:45',
              std: '09:00',
              sta: '13:10',
              signOff: '14:00',
            },
            {
              id: 'MH377-18',
              type: 'FLIGHT',
              date: '2026-05-18',
              flightNumber: 'MH 377',
              depPort: 'CAN',
              arrPort: 'KUL',
              signOn: '14:25',
              sta: '18:30',
              signOff: '19:15',

            },
            {
              id: 'S2-353-28',
              type: 'STANDBY',
              date: '2026-05-28',
              signOn: '06:00',
              signOff: '16:00',
              description: 'A353 STANDBY DUTY 2',
            },
          ],
        };

        const destinations = extractDestinations(sampleData.events);
        const totalSectors = sampleData.events.filter((e) => e.type === 'FLIGHT').length;
        const totalDistance = sampleData.events.reduce((acc, e) => {
          if (e.type === 'FLIGHT' && e.depPort && e.arrPort) {
            return acc + calculateKilometers(e.depPort, e.arrPort);
          }
          return acc;
        }, 0);
        const totalBlockTime = formatBlockHours(sampleData.events);

        set({
          roster: {
            ...sampleData,
            destinations,
            stats: {
              totalSectors,
              totalMiles: totalDistance,
              totalBlockTime,
              uniqueDestinations: destinations.length,
            },
          },
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'cemrosta-roster-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
