'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Award, Lock, ChevronRight } from 'lucide-react';
import { Navbar } from '@/components/shared/Navbar';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRoster } from '@/lib/contexts/RosterContext';
import { getLifetimeDestinations, type EarnedDestination } from '@/lib/actions/destinations';
import { computeLifetimeStats } from '@/lib/utils/stats';
import { formatKilometers, formatBlockHours } from '@/lib/utils/format';
import { ACHIEVEMENT_CATALOG } from '@/lib/achievements/definitions';
import type { CrewStats } from '@/lib/types/passport';
import AchievementBadge from '@/components/product/passport/AchievementBadge';
import { DestinationsGrid } from '@/components/product/profile/DestinationsGrid';

// ── Design types ───────────────────────────────────────────────────────────────
type IconName = 'globe' | 'plane' | 'clock' | 'award';

interface StatDef {
  label: string; value: string; unit: string;
  eyebrow: string; description: string; icon: IconName;
  accent: string; softAccent: string;
  progress?: { current: number; total: number; label: string };
}

// ── Animation variants ─────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

// ── Inline icons ───────────────────────────────────────────────────────────────
function PassportIcon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  const p = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.25, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  if (name === 'plane') return <svg {...p}><path d="M10.8 13.2 3.5 20.5l-1-3.8 5.1-5.1-4.9-2 .9-1.8 6.4.8 5.7-5.7c1-1 2.7-1.2 3.6-.3.9.9.7 2.6-.3 3.6l-5.7 5.7.8 6.4-1.8.9-2-4.9Z" /></svg>;
  if (name === 'clock') return <svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5l3.5 2" /></svg>;
  if (name === 'award') return <svg {...p}><path d="M8.5 13.5 7.6 21l4.4-2.6 4.4 2.6-.9-7.5" /><circle cx="12" cy="8" r="5" /></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M3.8 12h16.4" /><path d="M12 3.5c2.2 2.4 3.4 5.2 3.4 8.5S14.2 18.1 12 20.5" /><path d="M12 3.5C9.8 5.9 8.6 8.7 8.6 12s1.2 6.1 3.4 8.5" /></svg>;
}

function PlayIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.8c0-1.2 1.3-1.9 2.3-1.2l8.7 5.7c.9.6.9 2 0 2.6l-8.7 5.7C9.3 19.3 8 18.6 8 17.4V5.8Z" /></svg>;
}

function CardIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" />
      <path d="m8.2 10.8 7.6-4.4" /><path d="m8.2 13.2 7.6 4.4" />
    </svg>
  );
}

// ── Pilot name lockup ──────────────────────────────────────────────────────────
function PilotNameLockup({ firstName, lastName, rank, airline, base }: {
  firstName: string; lastName: string; rank: string; airline: string; base: string;
}) {
  return (
    <div className="relative mt-6 max-w-4xl">
      <div className="pointer-events-none absolute -left-4 top-2 hidden h-[86%] w-1 rounded-full bg-red-500/80 sm:block" />
      <div className="pointer-events-none absolute -inset-x-4 bottom-1 h-16 rounded-full bg-white/50 blur-2xl sm:h-24" />
      <div className="relative flex flex-col gap-3">
        <h1 className="max-w-[11ch] text-[clamp(4rem,12vw,9rem)] font-black leading-[0.82] tracking-[-0.075em] text-zinc-950 sm:max-w-none lg:text-[clamp(5.5rem,8vw,9.3rem)]">
          <span className="block">{firstName}</span>
          <span className="relative mt-1 inline-flex w-fit items-center pr-3 text-zinc-500 sm:mt-0 sm:pl-1">
            <span className="absolute bottom-[0.08em] left-0 right-0 h-[0.22em] rounded-full bg-red-500/12" />
            <span className="relative font-semibold italic tracking-[-0.085em] text-zinc-400">{lastName}</span>
          </span>
        </h1>
        {(rank || airline || base) && (
          <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-zinc-500 sm:text-base">
            {rank && <span>{rank}</span>}
            {rank && (airline || base) && <span className="h-1 w-1 rounded-full bg-zinc-300" />}
            {airline && <span>{airline}</span>}
            {airline && base && <span className="h-1 w-1 rounded-full bg-zinc-300" />}
            {base && <span>{base}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── New stat card ──────────────────────────────────────────────────────────────
function StatCard({ stat, index }: { stat: StatDef; index: number }) {
  const pct = stat.progress
    ? Math.min(100, Math.max(0, Math.round((stat.progress.current / stat.progress.total) * 100)))
    : undefined;

  return (
    <motion.article
      variants={itemVariants}
      whileHover={{ y: -5, scale: 1.01, transition: { type: 'spring', stiffness: 260, damping: 24 } }}
      aria-label={`${stat.label}: ${stat.value} ${stat.unit}`}
      className="group relative min-h-[188px] overflow-hidden rounded-[1.45rem] border border-zinc-200/80 bg-white p-3.5 shadow-[0_14px_38px_rgba(24,24,27,0.07)] outline-none transition-shadow duration-300 hover:shadow-[0_24px_70px_rgba(24,24,27,0.11)] focus-within:ring-4 focus-within:ring-red-500/10 sm:min-h-[240px] sm:rounded-[2rem] sm:p-5"
    >
      <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${stat.softAccent}`} />
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-zinc-100/80 transition-transform duration-500 group-hover:scale-125" />
      <div className="absolute inset-x-5 bottom-0 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />

      <div className="relative flex items-start justify-between gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-[1.1rem] ring-1 sm:h-12 sm:w-12 sm:rounded-2xl ${stat.accent}`}>
          <PassportIcon name={stat.icon} />
        </div>
        <span className="rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400 ring-1 ring-zinc-100 backdrop-blur sm:px-3 sm:text-[10px] sm:tracking-[0.22em]">
          0{index + 1}
        </span>
      </div>

      <div className="relative mt-5 sm:mt-7">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 sm:text-[11px] sm:tracking-[0.28em]">
            {stat.label}
          </p>
          <p className="hidden text-xs font-semibold text-zinc-400 sm:block">{stat.eyebrow}</p>
        </div>

        <div className="mt-3 flex items-end gap-2">
          <span className="text-[2.85rem] font-black leading-[0.82] tracking-[-0.09em] text-zinc-950 min-[390px]:text-[3.25rem] sm:text-7xl">
            {stat.value}
          </span>
          <span className="pb-1 text-[10px] font-black uppercase tracking-[0.12em] text-red-500 sm:pb-2 sm:text-sm sm:tracking-[0.16em]">
            {stat.unit}
          </span>
        </div>

        <p className="mt-3 max-w-[16rem] text-[11px] leading-5 text-zinc-500 sm:mt-4 sm:text-sm sm:leading-6">
          {stat.description}
        </p>

        {stat.progress && pct !== undefined && (
          <div className="mt-5" aria-label={`${stat.progress.label}: ${pct}%`}>
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-zinc-500">
              <span>{stat.progress.label}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-zinc-950 transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </div>
    </motion.article>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────────
function LoadingShell() {
  return (
    <div className="px-4 py-5 sm:px-8 sm:py-8 lg:px-12 animate-pulse">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] bg-zinc-200/60 sm:rounded-[2.5rem] p-8 sm:p-12 space-y-8">
          <div className="h-5 w-40 bg-zinc-300/70 rounded-full" />
          <div className="space-y-3">
            <div className="h-20 w-56 bg-zinc-300/70 rounded-2xl" />
            <div className="h-16 w-40 bg-zinc-300/70 rounded-2xl" />
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {[0,1,2,3].map(i => <div key={i} className="h-48 sm:h-60 bg-zinc-300/70 rounded-[1.45rem] sm:rounded-[2rem]" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] px-4 text-center gap-6 py-16">
      <div className="w-16 h-16 rounded-[1.5rem] bg-white border border-zinc-200 shadow-sm flex items-center justify-center">
        <Award size={28} className="text-red-500" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500 font-mono mb-3">
          {'// YOUR PASSPORT'}
        </p>
        <h2 className="text-3xl font-black tracking-tighter text-zinc-950 leading-none mb-3">
          No missions yet.
        </h2>
        <p className="text-[14px] text-zinc-500 font-bold max-w-xs mx-auto leading-snug">
          Upload your first roster and your passport fills with every sector you fly.
        </p>
      </div>
      <Link
        href="/"
        className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-500 text-white text-[14px] font-black hover:bg-red-600 transition-colors shadow-lg shadow-red-500/25"
      >
        Upload roster <ChevronRight size={16} strokeWidth={3} />
      </Link>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function PassportClient() {
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const { rosters, isLoadingList } = useRoster();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const [earnedDestinations, setEarnedDestinations] = useState<EarnedDestination[]>([]);
  const [isLoadingDests, setIsLoadingDests] = useState(false);

  useEffect(() => {
    if (!user) { setEarnedDestinations([]); return; }
    if (isLoadingList) return;
    setIsLoadingDests(true);
    getLifetimeDestinations(user.uid)
      .then(setEarnedDestinations)
      .catch(() => setEarnedDestinations([]))
      .finally(() => setIsLoadingDests(false));
  }, [user, isLoadingList]);

  useEffect(() => {
    if (!isAuthLoading && !user) router.replace('/');
  }, [isAuthLoading, user, router]);

  const isLoading = isAuthLoading || (!!user && (isLoadingList || isLoadingDests));
  const hasRosters = rosters.length > 0;

  const lifetimeStats = computeLifetimeStats(rosters, earnedDestinations.length);
  const totalBlockMinutes = rosters.reduce((s, r) => s + (r.totalBlockMinutes ?? 0), 0);

  const crewStats: CrewStats = {
    crew_id: user?.uid ?? '',
    total_km: lifetimeStats.km,
    total_sectors: lifetimeStats.sectors,
    total_block_minutes: totalBlockMinutes,
    total_flight_minutes: 0,
    unique_destinations: lifetimeStats.citiesCollected,
    unique_countries: 0, unique_continents: 0, unique_aircraft_types: 0,
    unique_crew_flown_with: 0, sunrises_witnessed: 0, sunsets_witnessed: 0,
    polar_crossings: 0, equator_crossings: 0, idl_crossings: 0,
    ytd_km: 0, ytd_sectors: 0, ytd_block_minutes: 0,
    ytd_unique_destinations: 0, ytd_unique_new_destinations: 0, ytd_sunrises: 0,
    top_route_pair: null, top_route_count: 0, longest_sector_id: null,
    updated_at: new Date().toISOString(),
  };

  const earnedAchievements = new Set(
    ACHIEVEMENT_CATALOG
      .filter(def => {
        const r = def.unlock(crewStats, undefined, undefined);
        return r === true || (typeof r === 'object' && r.earned === true);
      })
      .map(def => def.key),
  );

  const displayName = profile?.full_name || user?.displayName || user?.email?.split('@')[0] || 'Crew Member';
  const nameParts   = displayName.trim().split(' ');
  const firstName   = nameParts[0] ?? 'Crew';
  const lastName    = nameParts.slice(1).join(' ') || 'Passport';

  // Build stats from real data
  const statsData = useMemo<StatDef[]>(() => [
    {
      label: 'Distance', value: formatKilometers(lifetimeStats.km), unit: 'KM',
      eyebrow: 'Route coverage', description: 'Total distance flown across this digital passport.',
      icon: 'globe', accent: 'text-rose-600 ring-rose-100 bg-rose-50', softAccent: 'from-rose-500/14 to-red-500/0',
    },
    {
      label: 'Sectors', value: String(lifetimeStats.sectors), unit: 'Flights',
      eyebrow: 'Completed trips', description: 'Flight sectors completed in this roster cycle.',
      icon: 'plane', accent: 'text-sky-600 ring-sky-100 bg-sky-50', softAccent: 'from-sky-500/14 to-blue-500/0',
    },
    {
      label: 'In the Air', value: formatBlockHours(totalBlockMinutes), unit: 'Hrs',
      eyebrow: 'Airborne time', description: 'Logged flying hours from takeoff to touchdown.',
      icon: 'clock', accent: 'text-amber-600 ring-amber-100 bg-amber-50', softAccent: 'from-amber-500/16 to-orange-500/0',
    },
    {
      label: 'Cities', value: String(lifetimeStats.citiesCollected), unit: `/ ${lifetimeStats.citiesAvailable}`,
      eyebrow: 'Network unlocked', description: 'Destinations visited within the airline network.',
      icon: 'award', accent: 'text-emerald-600 ring-emerald-100 bg-emerald-50', softAccent: 'from-emerald-500/14 to-teal-500/0',
      progress: { current: lifetimeStats.citiesCollected, total: lifetimeStats.citiesAvailable, label: 'Cities unlocked' },
    },
  ], [lifetimeStats, totalBlockMinutes]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f7f7f5]" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
        <Navbar />
        <LoadingShell />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5]" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
      <Navbar />

      {/* ── New hero section ── */}
      <div className="px-4 py-5 sm:px-8 sm:py-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[2rem] border border-white bg-[#eeeeec] px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_20px_80px_rgba(24,24,27,0.06)] sm:rounded-[2.5rem] sm:px-8 sm:py-9 lg:px-12 lg:py-12">
            {/* background blurs */}
            <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-white/70 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 bottom-10 h-52 w-52 rounded-full bg-red-200/25 blur-3xl" />

            {/* Name + action buttons */}
            <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.32em] text-red-500 shadow-sm ring-1 ring-zinc-200/70 backdrop-blur sm:text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Official Digital Passport
                </div>
                <PilotNameLockup
                  firstName={firstName}
                  lastName={lastName}
                  rank={profile?.rank ?? ''}
                  airline={profile?.airline ?? ''}
                  base={profile?.base ?? ''}
                />
              </div>

              <div className="grid gap-3 sm:flex sm:items-end sm:justify-start lg:justify-end">
                <Link
                  href="/passport/story/year-in-air"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-white px-7 text-base font-extrabold text-zinc-950 shadow-[0_12px_35px_rgba(24,24,27,0.10)] ring-1 ring-zinc-200/70 transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(24,24,27,0.13)] active:translate-y-0 sm:self-end"
                >
                  <PlayIcon className="h-5 w-5" />
                  Watch story
                </Link>
                <Link
                  href="/roster"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-red-500 px-7 text-base font-extrabold text-white shadow-[0_18px_45px_rgba(239,68,68,0.28)] ring-1 ring-red-400/20 transition hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-[0_22px_55px_rgba(239,68,68,0.32)] active:translate-y-0 sm:self-end"
                >
                  <CardIcon className="h-5 w-5" />
                  Card
                </Link>
              </div>
            </div>

            {/* Stats grid */}
            {hasRosters ? (
              <motion.div
                variants={containerVariants}
                initial={prefersReducedMotion ? 'visible' : 'hidden'}
                animate="visible"
                className="relative mt-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
              >
                {statsData.map((stat, i) => (
                  <StatCard key={stat.label} stat={stat} index={i} />
                ))}
              </motion.div>
            ) : (
              <div className="relative mt-8">
                <EmptyState />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── City stamps + achievements ── */}
      {hasRosters && (
        <div className="max-w-5xl mx-auto px-4 pb-32 space-y-6">

          {/* City stamps */}
          <div className="bg-white border border-zinc-200/80 rounded-[2rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-zinc-100">
              <div className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400 font-mono">
                City Stamps
              </div>
              <div className="text-[10px] font-black text-red-500 font-mono">
                {lifetimeStats.citiesCollected} collected
              </div>
            </div>
            <DestinationsGrid earnedDestinations={earnedDestinations} />
          </div>

          {/* Achievements */}
          <div className="bg-white border border-zinc-200/80 rounded-[2rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-zinc-100">
              <div className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400 font-mono">
                Achievement Collection
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-red-500 font-mono">
                {earnedAchievements.size} / {ACHIEVEMENT_CATALOG.length} unlocked
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {ACHIEVEMENT_CATALOG.map(def => (
                <AchievementBadge key={def.key} definition={def} earned={earnedAchievements.has(def.key)} />
              ))}
            </div>
            {earnedAchievements.size === 0 && (
              <div className="mt-6 pt-6 border-t border-zinc-100 flex items-center gap-3 text-[13px] text-zinc-500 font-bold">
                <Lock size={14} className="text-zinc-400 shrink-0" />
                Fly more sectors to unlock achievements. Every flight counts.
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
