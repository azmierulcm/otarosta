'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Globe, Plane, Clock, Award, Play, Share2, Lock, ChevronRight } from 'lucide-react';
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
import ShareModal from '@/components/product/passport/ShareModal';

/* ── Loading skeleton ─────────────────────────────────────────────────────── */
function LoadingShell() {
  return (
    <div className="max-w-5xl mx-auto px-4 pt-28 pb-32 animate-pulse space-y-6">
      <div className="h-10 w-48 bg-surface rounded-2xl" />
      <div className="h-20 w-2/3 bg-surface rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 bg-surface rounded-[2rem]" />)}
      </div>
      <div className="h-40 bg-surface rounded-[2rem]" />
    </div>
  );
}

/* ── Empty state ──────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center gap-6">
      <div className="w-16 h-16 rounded-[1.5rem] bg-surface border border-border flex items-center justify-center">
        <Award size={28} className="text-accent" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent font-mono mb-3">
          {'// YOUR PASSPORT'}
        </p>
        <h2 className="text-3xl font-black tracking-tighter text-text leading-none mb-3">
          No missions yet.
        </h2>
        <p className="text-[14px] text-text-muted font-bold max-w-xs mx-auto leading-snug">
          Upload your first roster and your passport fills with every sector you fly.
        </p>
      </div>
      <Link
        href="/"
        className="flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-accent-fg text-[14px] font-black hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20"
      >
        Upload roster <ChevronRight size={16} strokeWidth={3} />
      </Link>
    </div>
  );
}

/* ── Stat card ────────────────────────────────────────────────────────────── */
function StatCard({
  label, value, sub, icon: Icon,
}: {
  label: string; value: string | number; sub?: string; icon: React.ElementType;
}) {
  return (
    <div className="bg-white border border-border rounded-[2rem] p-6 shadow-sm hover:shadow-md hover:border-accent/20 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center border border-border group-hover:border-accent/20 transition-colors">
          <Icon size={18} className="text-text-muted group-hover:text-accent transition-colors" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-text-subtle font-mono text-right leading-tight max-w-[80px]">
          {label}
        </p>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[32px] font-black text-text tracking-tighter leading-none font-mono">
          {value}
        </span>
        {sub && (
          <span className="text-[10px] font-black text-accent uppercase tracking-wider font-mono">
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function PassportClient() {
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const { rosters, isLoadingList } = useRoster();
  const router = useRouter();

  const [earnedDestinations, setEarnedDestinations] = useState<EarnedDestination[]>([]);
  const [isLoadingDests, setIsLoadingDests] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

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

  /* Build a CrewStats snapshot for achievement evaluation */
  const crewStats: CrewStats = {
    crew_id: user?.uid ?? '',
    total_km: lifetimeStats.km,
    total_sectors: lifetimeStats.sectors,
    total_block_minutes: totalBlockMinutes,
    total_flight_minutes: 0,
    unique_destinations: lifetimeStats.citiesCollected,
    unique_countries: 0,
    unique_continents: 0,
    unique_aircraft_types: 0,
    unique_crew_flown_with: 0,
    sunrises_witnessed: 0,
    sunsets_witnessed: 0,
    polar_crossings: 0,
    equator_crossings: 0,
    idl_crossings: 0,
    ytd_km: 0,
    ytd_sectors: 0,
    ytd_block_minutes: 0,
    ytd_unique_destinations: 0,
    ytd_unique_new_destinations: 0,
    ytd_sunrises: 0,
    top_route_pair: null,
    top_route_count: 0,
    longest_sector_id: null,
    updated_at: new Date().toISOString(),
  };

  const earnedAchievements = new Set(
    ACHIEVEMENT_CATALOG
      .filter((def) => {
        const result = def.unlock(crewStats, undefined, undefined);
        return result === true || (typeof result === 'object' && result.earned === true);
      })
      .map((def) => def.key),
  );

  const displayName =
    profile?.full_name || user?.displayName || user?.email?.split('@')[0] || 'Crew Member';

  if (isLoading) {
    return (
      <main className="min-h-screen bg-surface-2">
        <Navbar />
        <LoadingShell />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-2">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-32">

        {/* ── Passport header ── */}
        <div className="mb-10">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent font-mono mb-4">
            {'// OFFICIAL DIGITAL PASSPORT'}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-text leading-none mb-3">
                {displayName.split(' ')[0]}<br />
                <span className="text-text-subtle font-light italic">
                  {displayName.split(' ').slice(1).join(' ') || 'Passport.'}
                </span>
              </h1>
              <p className="text-[14px] text-text-muted font-bold">
                {[profile?.rank, profile?.airline, profile?.base]
                  .filter(Boolean)
                  .join(' · ') || 'Crew Member'}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/passport/story/year-in-air"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-white text-[13px] font-black text-text hover:bg-surface transition-colors shadow-sm"
              >
                <Play size={13} fill="currentColor" />
                Watch story
              </Link>
              <button
                onClick={() => setIsShareOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-fg text-[13px] font-black hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20"
              >
                <Share2 size={13} />
                Share
              </button>
            </div>
          </div>
        </div>

        {!hasRosters ? (
          <EmptyState />
        ) : (
          <>
            {/* ── Stats grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Distance"
                value={formatKilometers(lifetimeStats.km)}
                sub="km"
                icon={Globe}
              />
              <StatCard
                label="Sectors"
                value={lifetimeStats.sectors.toLocaleString()}
                sub="flights"
                icon={Plane}
              />
              <StatCard
                label="In the air"
                value={formatBlockHours(totalBlockMinutes)}
                sub="hrs"
                icon={Clock}
              />
              <StatCard
                label="Cities"
                value={lifetimeStats.citiesCollected}
                sub={`/ ${lifetimeStats.citiesAvailable}`}
                icon={Award}
              />
            </div>

            {/* ── Achievements ── */}
            <div className="bg-white border border-border rounded-[2rem] p-8 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-6 pb-5 border-b border-border">
                <div className="text-[10px] font-black uppercase tracking-[0.35em] text-text-subtle font-mono">
                  Achievement Collection
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-accent font-mono">
                  {earnedAchievements.size} / {ACHIEVEMENT_CATALOG.length} unlocked
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {ACHIEVEMENT_CATALOG.map((def) => (
                  <AchievementBadge
                    key={def.key}
                    definition={def}
                    earned={earnedAchievements.has(def.key)}
                  />
                ))}
              </div>
              {earnedAchievements.size === 0 && (
                <div className="mt-6 pt-6 border-t border-border flex items-center gap-3 text-[13px] text-text-muted font-bold">
                  <Lock size={14} className="text-text-subtle shrink-0" />
                  Fly more sectors to unlock achievements. Every flight counts.
                </div>
              )}
            </div>

            {/* ── City stamps ── */}
            <div className="bg-white border border-border rounded-[2rem] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-5 border-b border-border">
                <div className="text-[10px] font-black uppercase tracking-[0.35em] text-text-subtle font-mono">
                  City Stamps
                </div>
                <div className="text-[10px] font-black text-accent font-mono">
                  {lifetimeStats.citiesCollected} collected
                </div>
              </div>
              <DestinationsGrid earnedDestinations={earnedDestinations} />
            </div>
          </>
        )}
      </div>

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        crewId={user?.uid ?? ''}
      />

      {/* motion hint for framer-motion usage */}
      <motion.div aria-hidden className="sr-only" />
    </main>
  );
}
