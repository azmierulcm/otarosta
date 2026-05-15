'use client';

import React from 'react';
import { MapPin, Lock } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

interface Destination {
  iata: string;
  name: string;
  country: string;
  region: string;
  visits: number;
  isHome?: boolean;
  isNew?: boolean;
  unlocked: boolean;
}

interface DestinationsGridProps {
  destinations: Destination[];
  collectedCount: number;
  totalCount: number;
}

const REGION_COLORS: Record<string, string> = {
  'Asia': 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  'Europe': 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  'Oceania': 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  'MENA': 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  'Americas': 'bg-rose-500/10 border-rose-500/20 text-rose-400',
};

const Patch = ({ destination }: { destination: Destination }) => {
  const shouldReduceMotion = useReducedMotion();
  const regionStyle = REGION_COLORS[destination.region] || 'bg-surface border-border text-text-muted';

  if (!destination.unlocked) {
    return (
      <div className="bg-surface border border-border rounded-3xl aspect-[1/1.2] flex flex-col overflow-hidden opacity-100 group grayscale">
        <div className="h-[60%] bg-bg flex items-center justify-center border-b border-border/50">
          <Lock size={32} className="text-text-subtle" />
        </div>
        <div className="p-4 flex-1 flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-subtle font-mono mb-1">Locked</p>
          <p className="text-xs font-bold text-text-muted">{destination.name}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      whileHover={shouldReduceMotion ? {} : { y: -4 }}
      className="bg-surface border border-border rounded-3xl aspect-[1/1.2] flex flex-col overflow-hidden group shadow-xl transition-colors hover:border-accent/30"
    >
      <div className={`h-[60%] ${regionStyle} flex flex-col items-center justify-center border-b border-white/5 relative`}>
        {destination.isNew && (
           <div className="absolute top-3 left-3 bg-accent text-accent-fg text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">New</div>
        )}
        {destination.isHome && (
           <div className="absolute top-3 left-3 bg-white text-bg text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Home</div>
        )}
        <MapPin size={24} className="mb-2 opacity-50" />
        <span className="text-2xl font-black font-mono tracking-tighter">{destination.iata}</span>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-center">
        <p className="text-sm font-bold text-text leading-tight mb-1 truncate">{destination.name}</p>
        <p className="text-[10px] font-medium text-text-muted flex items-center gap-1 truncate">
          {destination.country} <span className="w-0.5 h-0.5 rounded-full bg-border" /> {destination.visits} visits
        </p>
      </div>
    </motion.div>
  );
};

const DestinationsGrid = ({ destinations, collectedCount, totalCount }: DestinationsGridProps) => {
  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-8">
        <div>
          <h3 className="text-2xl font-bold text-text tracking-tight mb-2">Destinations</h3>
          <p className="text-text-muted font-medium text-sm">
            You&apos;ve collected <span className="text-accent font-bold">{collectedCount} cities</span> across the globe.
          </p>
        </div>
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle font-mono">
          {totalCount - collectedCount} Cities to unlock
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {destinations.map((dest) => (
          <Patch key={dest.iata} destination={dest} />
        ))}
      </div>
    </div>
  );
};

export default DestinationsGrid;
