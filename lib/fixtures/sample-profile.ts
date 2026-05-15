export const SAMPLE_PROFILE = {
  id: 'sample-azmierul',
  name: 'Muhammad Azmierul',
  role: 'Senior First Officer',
  homeBase: 'KUL',
  aircraftType: 'Airbus A350',
  lifetimeStats: {
    sectors: 847,
    blockMinutes: 128400, // 2140 hours
    kilometers: 1200000, // 1.2M
    citiesCollected: 12,
    totalAvailableCities: 62
  },
  monthlyRecap: {
    month: 'November',
    year: '2025',
    sectors: 18,
    blockMinutes: 5040, // 84 hours
    newCity: 'LHR'
  },
  destinations: [
    { iata: 'KUL', name: 'Kuala Lumpur', country: 'Malaysia', region: 'Asia', visits: 420, isHome: true, unlocked: true },
    { iata: 'LHR', name: 'London', country: 'United Kingdom', region: 'Europe', visits: 12, isNew: true, unlocked: true },
    { iata: 'SYD', name: 'Sydney', country: 'Australia', region: 'Oceania', visits: 24, unlocked: true },
    { iata: 'NRT', name: 'Tokyo', country: 'Japan', region: 'Asia', visits: 18, unlocked: true },
    { iata: 'CDG', name: 'Paris', country: 'France', region: 'Europe', visits: 8, unlocked: true },
    { iata: 'DXB', name: 'Dubai', country: 'United Arab Emirates', region: 'MENA', visits: 14, unlocked: true },
    { iata: 'SIN', name: 'Singapore', country: 'Singapore', region: 'Asia', visits: 64, unlocked: true },
    { iata: 'BKK', name: 'Bangkok', country: 'Thailand', region: 'Asia', visits: 32, unlocked: true },
    { iata: 'ICN', name: 'Seoul', country: 'South Korea', region: 'Asia', visits: 9, unlocked: true },
    { iata: 'MEL', name: 'Melbourne', country: 'Australia', region: 'Oceania', visits: 11, unlocked: true },
    { iata: 'AMS', name: 'Amsterdam', country: 'Netherlands', region: 'Europe', visits: 5, unlocked: true },
    { iata: 'HKG', name: 'Hong Kong', country: 'China', region: 'Asia', visits: 21, unlocked: true },
    { iata: 'JFK', name: 'New York', country: 'United States', region: 'Americas', visits: 0, unlocked: false },
    { iata: 'SFO', name: 'San Francisco', country: 'United States', region: 'Americas', visits: 0, unlocked: false },
    { iata: 'FRA', name: 'Frankfurt', country: 'Germany', region: 'Europe', visits: 0, unlocked: false },
    { iata: 'DOH', name: 'Doha', country: 'Qatar', region: 'MENA', visits: 0, unlocked: false },
  ]
};
