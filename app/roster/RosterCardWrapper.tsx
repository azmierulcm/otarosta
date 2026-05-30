'use client';

import React from 'react';
import Link from 'next/link';
import { Loader2, UploadCloud } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRoster } from '@/lib/contexts/RosterContext';
import { DESTINATION_CATALOG } from '@/lib/data/destination-catalog';
import { getCoordinates } from '@/lib/utils/geo/haversine';
import type { Profile, PeriodData } from './RosterCard';
import RosterCard from './RosterCard';
import type { DutyEvent } from '@/lib/types';

/* ── Country name → ISO 2-letter code ─────────────────────────────────────── */
const COUNTRY_ISO: Record<string, string> = {
  Malaysia: 'MY', Singapore: 'SG', Thailand: 'TH', Indonesia: 'ID',
  Philippines: 'PH', Vietnam: 'VN', Myanmar: 'MM', Cambodia: 'KH',
  Japan: 'JP', 'South Korea': 'KR', China: 'CN', 'Hong Kong': 'HK',
  Taiwan: 'TW', Macau: 'MO', India: 'IN', 'Sri Lanka': 'LK',
  Bangladesh: 'BD', 'United Kingdom': 'GB', France: 'FR', Germany: 'DE',
  Netherlands: 'NL', Spain: 'ES', Italy: 'IT', Australia: 'AU',
  'New Zealand': 'NZ', 'United Arab Emirates': 'AE', Qatar: 'QA',
  'Saudi Arabia': 'SA', Turkey: 'TR', 'South Africa': 'ZA',
  USA: 'US', Canada: 'CA', Brazil: 'BR', Pakistan: 'PK', Nepal: 'NP',
  Egypt: 'EG',
};

function isoToFlag(code: string): string {
  return code.toUpperCase().split('').map(
    (c) => String.fromCodePoint(0x1F1E0 - 65 + c.charCodeAt(0)),
  ).join('');
}

function countryFlag(iata: string): string {
  const entry = DESTINATION_CATALOG.find((d) => d.iata === iata);
  if (!entry) return '🌏';
  const iso = COUNTRY_ISO[entry.country];
  return iso ? isoToFlag(iso) : '🌏';
}

function iataToCity(iata: string): string {
  return DESTINATION_CATALOG.find((d) => d.iata === iata)?.city ?? iata;
}

/** Convert lat/lng to pixel coordinates on the 1000×500 SVG world map used by RosterCard */
function iataToPin(iata: string): { x: number; y: number; code: string } | null {
  const coords = getCoordinates(iata);
  if (!coords) return null;
  const [lat, lng] = coords;
  return {
    x: Math.round((lng + 180) / 360 * 1000),
    y: Math.round((90 - lat) / 180 * 500),
    code: iata,
  };
}

/** Most frequent (dep → arr) route pair from a list of duty events */
function topRoute(events: DutyEvent[]): { from: string; to: string; count: number } {
  const counts: Record<string, number> = {};
  for (const e of events) {
    if (e.type === 'FLIGHT' && e.depPort && e.arrPort) {
      const key = `${e.depPort}>${e.arrPort}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!top) return { from: 'KUL', to: 'KUL', count: 0 };
  const [pair, count] = top;
  const [from, to] = pair.split('>');
  return { from, to, count };
}

/** Build top-3 destination rows from FLIGHT events */
function topDestinations(events: DutyEvent[]) {
  const counts: Record<string, number> = {};
  for (const e of events) {
    if (e.type === 'FLIGHT' && e.arrPort && e.arrPort !== 'KUL') {
      counts[e.arrPort] = (counts[e.arrPort] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([iata, visits]) => ({
      city: iataToCity(iata),
      code: iata,
      flag: countryFlag(iata),
      visits,
      hours: 0,
    }));
}

/** Rank abbreviation badge */
function rankBadge(rank?: string): string {
  if (!rank) return 'CC';
  if (rank.startsWith('Captain')) return 'CPT';
  if (rank.startsWith('Senior First')) return 'SFO';
  if (rank.startsWith('First')) return 'FO';
  if (rank.startsWith('Second')) return 'SO';
  if (rank.startsWith('Purser')) return 'PUR';
  if (rank.startsWith('Senior Cabin')) return 'SCC';
  if (rank.includes('Cabin')) return 'CC';
  if (rank.startsWith('Cadet')) return 'CDT';
  return 'CC';
}

/** Build a PeriodData from a subset of RosterSummary + events */
function buildPeriodData(
  label: string,
  range: string,
  blockMinutes: number,
  prevBlockMinutes: number,
  events: DutyEvent[],
): PeriodData {
  const hours = Math.round(blockMinutes / 60);
  const prevHours = Math.round(prevBlockMinutes / 60) || hours;
  const flights = events.filter((e) => e.type === 'FLIGHT').length;
  const layoverNights = events.filter((e) => e.type === 'FLIGHT' && e.hotel).length;

  const unique = new Set(events
    .filter((e) => e.type === 'FLIGHT' && e.arrPort)
    .map((e) => {
      const entry = DESTINATION_CATALOG.find((d) => d.iata === e.arrPort);
      return entry?.country ?? '';
    })
    .filter(Boolean));
  const countries = unique.size || 1;

  const route = topRoute(events);
  const dests = topDestinations(events);

  const pins = Array.from(new Set(
    events
      .filter((e) => e.type === 'FLIGHT')
      .flatMap((e) => [e.depPort, e.arrPort])
      .filter(Boolean),
  ))
    .map((iata) => iataToPin(iata!))
    .filter(Boolean) as { x: number; y: number; code: string }[];

  const longestDest = dests[0] ?? { city: 'Home base', code: 'KUL' };

  return {
    label,
    range,
    hours,
    prevHours,
    flights,
    countries,
    layoverNights,
    nightStops: layoverNights,
    topRoute: route,
    longest: { city: longestDest.city, code: longestDest.code, hours: undefined },
    favorite: { city: longestDest.city, code: longestDest.code, rating: undefined },
    destinations: dests,
    pins,
  };
}

/* ── Main wrapper ─────────────────────────────────────────────────────────── */
export default function RosterCardWrapper() {
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const { rosters, activeRoster, isLoading, isLoadingList } = useRoster();

  const isSpinning = isAuthLoading || (!!user && (isLoadingList || isLoading));

  if (isSpinning) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-text-muted" />
      </div>
    );
  }

  if (!user || !activeRoster) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center px-4">
        <div className="w-14 h-14 rounded-[1.25rem] bg-surface border border-border flex items-center justify-center">
          <UploadCloud size={24} className="text-accent" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-text mb-2">
            No roster yet.
          </h2>
          <p className="text-[14px] text-text-muted font-bold max-w-xs mx-auto leading-snug">
            Upload your roster PDF to generate your personal share card.
          </p>
        </div>
        <Link
          href="/"
          className="px-6 py-3 rounded-full bg-accent text-accent-fg text-[14px] font-black hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20"
        >
          Upload roster
        </Link>
      </div>
    );
  }

  /* ── Build real profile ── */
  const displayName = profile?.full_name ?? activeRoster.crewName ?? user.email?.split('@')[0] ?? 'Crew Member';
  const rank = profile?.rank ?? 'Cabin Crew';
  const fleet = profile?.fleet ?? profile?.airline ?? '';
  const badge = rankBadge(rank);
  const initials = displayName.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
  const handle = `@${displayName.toLowerCase().replace(/\s+/g, '.')}`;

  /* Month = active roster */
  const currentEvents = activeRoster.events;
  const currentMinutes = activeRoster.totalBlockMinutes ?? 0;
  const prevMinutes = rosters[1]?.totalBlockMinutes ?? currentMinutes;
  const monthLabel = `${activeRoster.month} ${activeRoster.year}`;
  const monthRange = `1 — ${new Date(`${activeRoster.year}-${(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(activeRoster.month) + 1).toString().padStart(2,'0')}-01`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} ${activeRoster.year}`;

  /* 6m = aggregate last 6 rosters */
  const last6 = rosters.slice(0, 6);
  const last6Minutes = last6.reduce((s, r) => s + (r.totalBlockMinutes ?? 0), 0);
  const prev6Minutes = rosters.slice(6, 12).reduce((s, r) => s + (r.totalBlockMinutes ?? 0), 0) || last6Minutes;
  const last6Events = currentEvents; // only active roster's events available client-side
  const halfLabel = last6.length >= 2
    ? `${last6[last6.length - 1].month} ${last6[last6.length - 1].year} — ${last6[0].month} ${last6[0].year}`
    : `Last 6 months`;

  /* Year = aggregate last 12 rosters */
  const last12 = rosters.slice(0, 12);
  const last12Minutes = last12.reduce((s, r) => s + (r.totalBlockMinutes ?? 0), 0);
  const prev12Minutes = rosters.slice(12, 24).reduce((s, r) => s + (r.totalBlockMinutes ?? 0), 0) || last12Minutes;
  const yearLabel = last12.length >= 2
    ? `${last12[last12.length - 1].month} ${last12[last12.length - 1].year} — ${last12[0].month} ${last12[0].year}`
    : 'Last 12 months';

  const realProfile: Profile = {
    name: displayName,
    handle,
    role: `${rank}${fleet ? ' · ' + fleet : ''}`,
    badge,
    avatarInitials: initials,
    avatarFrom: '#e5484d',
    avatarTo: '#c73d40',
    periods: {
      month: buildPeriodData(monthLabel, monthRange, currentMinutes, prevMinutes, currentEvents),
      half:  buildPeriodData('Last 6 months', halfLabel, last6Minutes, prev6Minutes, last6Events),
      year:  buildPeriodData('Last 12 months', yearLabel, last12Minutes, prev12Minutes, last6Events),
    },
  };

  return <RosterCard profileOverride={realProfile} defaultPeriod="month" />;
}
