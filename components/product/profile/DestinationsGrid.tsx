'use client';

import React, { useState } from 'react';
import { MapPin, Lock } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { REGION_TAXONOMY, RARITY_COLORS, getRarityTier } from '@/lib/patches/rules';
import { ILLUSTRATIONS } from '@/lib/patches/illustrations';
import PatchDetailModal from './PatchDetailModal';

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

const Patch = ({ destination, onClick }: { destination: Destination, onClick: () => void }) => {
  const shouldReduceMotion = useReducedMotion();
  const regionData = REGION_TAXONOMY[destination.region as keyof typeof REGION_TAXONOMY] || REGION_TAXONOMY['Southeast Asia'];
  const rarity = getRarityTier(destination.visits);
  const rarityColor = RARITY_COLORS[rarity];
  const Illustration = ILLUSTRATIONS[destination.iata] || MapPin;

  if (!destination.unlocked) {
    return (
      <div className="bg-surface border border-border rounded-3xl aspect-[1/1.2] flex flex-col overflow-hidden opacity-100 grayscale cursor-not-allowed">
        <div className="h-[60%] bg-bg/50 flex items-center justify-center border-b border-border/50">
          <Lock size={24} className="text-text-subtle" strokeWidth={1.5} />
        </div>
        <div className="p-4 flex-1 flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-subtle font-mono mb-1">Locked</p>
          <p className="text-xs font-bold text-text-subtle/50">{destination.iata}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.button 
      onClick={onClick}
      whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.02 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
      className="bg-surface border border-border rounded-[2rem] aspect-[1/1.2] flex flex-col overflow-hidden group shadow-xl transition-all hover:border-accent/30 text-left outline-none focus:ring-2 focus:ring-accent/50"
    >
      <div 
        className="h-[60%] flex flex-col items-center justify-center border-b border-white/5 relative"
        style={{ backgroundColor: regionData.bg }}
      >
        {/* Rarity Border */}
        <div className="absolute inset-0 border-2 rounded-[2rem] pointer-events-none opacity-40" style={{ borderColor: rarityColor }} />
        
        {destination.isNew && (
           <div className="absolute top-3 left-3 bg-accent text-accent-fg text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm z-10">New</div>
        )}
        {destination.isHome && (
           <div className="absolute top-3 left-3 bg-white text-bg text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm z-10">Home</div>
        )}
        
        <div className="mb-2 transition-transform group-hover:scale-110 duration-500" style={{ color: regionData.accent }}>
           <Illustration />
        </div>
        <span className="text-xl font-black font-mono tracking-tighter" style={{ color: regionData.accent }}>{destination.iata}</span>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-center">
        <p className="text-[13px] font-bold text-text leading-tight mb-1 truncate">{destination.name}</p>
        <p className="text-[11px] font-medium text-text-muted flex items-center gap-1 truncate">
          {destination.country} <span className="w-0.5 h-0.5 rounded-full bg-border" /> {destination.visits} visits
        </p>
      </div>
    </motion.button>
  );
};

const DestinationsGrid = ({ destinations, collectedCount, totalCount }: DestinationsGridProps) => {
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);

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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {destinations.map((dest) => (
          <Patch 
            key={dest.iata} 
            destination={dest} 
            onClick={() => setSelectedDest(dest)}
          />
        ))}
      </div>

      <PatchDetailModal 
        isOpen={!!selectedDest} 
        onClose={() => setSelectedDest(null)} 
        destination={selectedDest} 
      />
    </div>
  );
};

export default DestinationsGrid;
