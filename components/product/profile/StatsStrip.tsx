'use client';

import React from 'react';
import { formatBlockHours, formatKilometers } from '@/lib/utils/format';
import { Plane, Clock, Globe, MapPinned } from 'lucide-react';

interface StatsStripProps {
  stats: {
    sectors: number;
    blockMinutes: number;
    kilometers: number;
    citiesCollected: number;
    totalAvailableCities: number;
  };
}

const StatCard = ({ label, value, sub, icon: Icon }: any) => (
  <div className="bg-surface p-8 rounded-[2rem] border border-border flex flex-col gap-4 group">
    <div className="flex justify-between items-start">
      <div className="w-10 h-10 rounded-xl bg-bg border border-border flex items-center justify-center group-hover:border-accent/30 transition-colors">
        <Icon size={20} className="text-text-muted group-hover:text-accent transition-colors" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-subtle font-mono">{label}</span>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-4xl font-bold tracking-tighter font-mono text-text">{value}</span>
      {sub && <span className="text-[10px] font-black uppercase tracking-widest text-accent font-mono">{sub}</span>}
    </div>
  </div>
);

const StatsStrip = ({ stats }: StatsStripProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <StatCard 
        label="Sectors" 
        value={stats.sectors.toLocaleString()} 
        icon={Plane} 
      />
      <StatCard 
        label="Block Hours" 
        value={formatBlockHours(stats.blockMinutes)} 
        sub="HRS" 
        icon={Clock} 
      />
      <StatCard 
        label="Distance" 
        value={formatKilometers(stats.kilometers)} 
        sub="KM" 
        icon={Globe} 
      />
      <StatCard 
        label="Cities" 
        value={`${stats.citiesCollected}/${stats.totalAvailableCities}`} 
        icon={MapPinned} 
      />
    </div>
  );
};

export default StatsStrip;
