'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, Clock, Plane, ShieldCheck, Globe } from 'lucide-react';
import { ILLUSTRATIONS } from '@/lib/patches/illustrations';
import { REGION_TAXONOMY, RARITY_COLORS, getRarityTier } from '@/lib/patches/rules';
import { formatVisitCount } from '@/lib/utils/format';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

const geoUrl = "https://raw.githubusercontent.com/lotusms/world-map-data/main/world-110m.json";

interface PatchDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: any; 
}

const PatchDetailModal = ({ isOpen, onClose, destination }: PatchDetailModalProps) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!destination) return null;

  const Illustration = ILLUSTRATIONS[destination.iata] || MapPin;
  const regionData = REGION_TAXONOMY[destination.region as keyof typeof REGION_TAXONOMY] || REGION_TAXONOMY['Southeast Asia'];
  const rarity = getRarityTier(destination.visits);
  const rarityColor = RARITY_COLORS[rarity];

  // Placeholder coordinates (in a real app, these would come from an airport DB)
  const coordinates: Record<string, [number, number]> = {
    'KUL': [101.7, 2.7],
    'LHR': [-0.4, 51.5],
    'SYD': [151.2, -33.9],
    'NRT': [140.4, 35.8],
    'SIN': [103.9, 1.3],
  };
  const markerPos = coordinates[destination.iata] || [101.7, 2.7];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-bg/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="w-full max-w-4xl bg-surface border border-border rounded-[3rem] overflow-hidden shadow-2xl relative z-10"
          >
            <button 
              onClick={onClose}
              className="absolute top-8 right-8 p-3 hover:bg-bg/50 rounded-full transition-colors text-text-muted hover:text-text z-20"
            >
              <X size={24} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-5 h-full max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-hidden">
              {/* Left: Illustration & Map (2/5) */}
              <div className="md:col-span-2 flex flex-col border-b md:border-b-0 md:border-r border-border">
                <div className={`p-12 flex flex-col items-center justify-center relative`} style={{ backgroundColor: regionData.bg }}>
                   <div 
                     className="w-40 h-40 rounded-[2.5rem] bg-white/50 backdrop-blur-sm border-4 flex items-center justify-center mb-6 shadow-xl"
                     style={{ borderColor: rarityColor }}
                   >
                      <div style={{ color: regionData.accent }}>
                        <Illustration />
                      </div>
                   </div>
                   <div className="text-center">
                      <div className="text-3xl font-black font-mono tracking-tighter mb-1" style={{ color: regionData.accent }}>{destination.iata}</div>
                      <div className="bg-white/80 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm" style={{ color: regionData.text }}>
                         {rarity} Tier
                      </div>
                   </div>
                </div>
                
                {/* Minimal Map */}
                <div className="flex-1 bg-bg/50 p-8 flex flex-col items-center">
                   <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-text-subtle mb-4 font-mono">
                      <Globe size={12} className="text-accent" />
                      Global Operations
                   </div>
                   <div className="w-full h-40 bg-surface rounded-2xl border border-border overflow-hidden relative">
                      <ComposableMap projectionConfig={{ scale: 120 }}>
                        <Geographies geography={geoUrl}>
                          {({ geographies }) =>
                            geographies.map((geo) => (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill="#1C1F27"
                                stroke="#262A35"
                                strokeWidth={0.5}
                              />
                            ))
                          }
                        </Geographies>
                        <Marker coordinates={markerPos}>
                          <circle r={4} fill="var(--accent)" />
                          <circle r={8} fill="var(--accent)" opacity={0.3} className="animate-ping" />
                        </Marker>
                      </ComposableMap>
                   </div>
                </div>
              </div>

              {/* Right: Stats & Info (3/5) */}
              <div className="md:col-span-3 p-12 overflow-y-auto">
                 <div className="mb-10">
                    <h2 id="modal-title" className="text-4xl font-bold tracking-tighter text-text mb-1">{destination.name}</h2>
                    <p className="text-text-muted font-medium flex items-center gap-2">
                       {destination.country} <span className="w-1 h-1 rounded-full bg-border" /> {destination.region}
                    </p>
                 </div>

                 <div className="grid grid-cols-2 gap-6 mb-10">
                    <div className="bg-bg p-6 rounded-2xl border border-border group hover:border-accent/30 transition-colors">
                       <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest mb-2 font-mono">Visits</p>
                       <p className="text-2xl font-bold text-text">{destination.visits}</p>
                    </div>
                    <div className="bg-bg p-6 rounded-2xl border border-border">
                       <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest mb-2 font-mono">First Mission</p>
                       <p className="text-2xl font-bold text-text">12 May 24</p>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-2 transition-colors">
                       <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0">
                          <Clock size={20} className="text-accent" />
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest font-mono">Cumulative Stay</p>
                          <p className="text-sm font-bold text-text">142 Hours on ground</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-2 transition-colors">
                       <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0">
                          <Plane size={20} className="text-accent" />
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest font-mono">Last Flight</p>
                          <p className="text-sm font-bold text-text">MH 123 · 04 Nov 25</p>
                       </div>
                    </div>
                 </div>

                 <div className="mt-12 pt-8 border-t border-border">
                    <button className="w-full bg-accent text-accent-fg py-5 rounded-2xl font-bold text-lg hover:bg-accent-hover transition-all flex items-center justify-center gap-3 shadow-xl shadow-accent/20">
                       <ShieldCheck size={20} strokeWidth={3} />
                       Verified Flight Record
                    </button>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PatchDetailModal;
