'use client';

import React from 'react';
import { formatKilometers } from '@/lib/utils/format';
import type { LifetimeStats } from '@/lib/utils/stats';

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
}

const StatCard = ({ label, value, sublabel }: StatCardProps) => (
  <div className="bg-surface rounded-[var(--radius-md)] p-5 flex flex-col gap-2">
    <p className="text-[12px] font-[500] text-text-muted">{label}</p>
    <p className="text-[24px] font-[500] text-text font-mono leading-none">{value}</p>
    {sublabel && (
      <p className="text-[12px] text-text-subtle font-mono">{sublabel}</p>
    )}
  </div>
);

interface StatsStripProps {
  stats: LifetimeStats;
}

export function StatsStrip({ stats }: StatsStripProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      <StatCard
        label="Sectors"
        value={stats.sectors.toLocaleString()}
        sublabel="total flights"
      />
      <StatCard
        label="Kilometers"
        value={formatKilometers(stats.km)}
        sublabel="distance flown"
      />
      <StatCard
        label="Cities"
        value={`${stats.citiesCollected}`}
        sublabel={`/ ${stats.citiesAvailable} to unlock`}
      />
    </div>
  );
}
