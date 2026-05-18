'use client';

import React from 'react';
import { ProfileHeader } from './ProfileHeader';
import { StatsStrip } from './StatsStrip';
import { RosterSummaryCard } from './RosterSummaryCard';
import { DestinationsGrid } from './DestinationsGrid';
import type { SampleProfileData } from '@/lib/fixtures/sample-profile';

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
