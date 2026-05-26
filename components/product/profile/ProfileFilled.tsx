'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ProfileHeader } from './ProfileHeader';
import { StatsStrip } from './StatsStrip';
import { DestinationsGrid } from './DestinationsGrid';
import type { SampleProfileData } from '@/lib/fixtures/sample-profile';

// Lazy-load the heavy summary card (Leaflet + stats) so it doesn't block
// the above-the-fold profile header from painting.
const RosterSummaryCard = dynamic(
  () => import('./RosterSummaryCard').then((m) => ({ default: m.RosterSummaryCard })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-48 rounded-2xl bg-surface animate-pulse" />
    ),
  },
);

export type ProfileFilledProps = Omit<SampleProfileData, 'monthlyRecap'> & {
  monthlyRecap?: SampleProfileData['monthlyRecap'] | null;
  avatarUrl?: string | null;
  onShare?: () => void;
};

export function ProfileFilled({
  displayName,
  rank,
  base,
  aircraft,
  avatarUrl,
  lifetimeStats,
  earnedDestinations,
  onShare,
}: ProfileFilledProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-28 pb-24 space-y-4">
      <ProfileHeader
        displayName={displayName}
        rank={rank}
        base={base}
        aircraft={aircraft}
        avatarUrl={avatarUrl}
        onShare={onShare}
      />

      <StatsStrip stats={lifetimeStats} />

      <RosterSummaryCard earnedDestinations={earnedDestinations} onGenerateCard={onShare} />

      <div className="pt-4">
        <DestinationsGrid earnedDestinations={earnedDestinations} />
      </div>
    </div>
  );
}
