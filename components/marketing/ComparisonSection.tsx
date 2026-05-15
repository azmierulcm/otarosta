'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Download, Share2, ChevronDown, Check } from 'lucide-react';

const COMPARISONS = [
  {
    icon: Clock,
    old: "Manual UTC math at 3 AM",
    new: "One-click local time sync",
  },
  {
    icon: Download,
    old: "Dead PDFs in your downloads folder",
    new: "Living passport of every city flown",
  },
  {
    icon: Share2,
    old: "Blurry screenshot to your spouse",
    new: "Polished recap card, ready for WhatsApp",
  },
];

const ComparisonRow = ({ item, index }: any) => {
  const [isOldVisible, setIsOldVisible] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_2px_1fr] items-center gap-6 md:gap-12 py-8 border-b border-border last:border-0 group">
      {/* Old Way (Left/Top) */}
      <div className="flex flex-col md:text-right order-2 md:order-1">
        <div className="md:hidden mb-4">
           <button 
             onClick={() => setIsOldVisible(!isOldVisible)}
             className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-text-subtle bg-surface px-4 py-2 rounded-full"
           >
             The Old Way <ChevronDown size={14} className={`transition-transform ${isOldVisible ? 'rotate-180' : ''}`} />
           </button>
        </div>
        <div className={`${!isOldVisible ? 'hidden md:block' : 'block'} transition-all`}>
           <p className="text-lg md:text-xl text-text-subtle font-medium italic opacity-60">
             {item.old}
           </p>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden md:block h-12 w-full bg-border order-2" />

      {/* Cemrosta Way (Right/Bottom) */}
      <div className="flex items-center gap-6 order-1 md:order-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
          <item.icon size={20} className="text-accent" />
        </div>
        <div className="flex-1">
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent font-mono">CEMROSTA WAY</span>
              <Check size={12} className="text-accent" strokeWidth={3} />
           </div>
           <p className="text-lg md:text-xl text-text font-bold leading-tight">
             {item.new}
           </p>
        </div>
      </div>
    </div>
  );
};

const ComparisonSection = () => {
  return (
    <section className="py-24 px-4 bg-bg">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-text mb-6">
            Stop fighting your <br /> roster PDF.
          </h2>
        </div>

        <div className="bg-surface/30 rounded-[3rem] border border-border p-8 md:p-16">
          {COMPARISONS.map((item, i) => (
            <ComparisonRow key={i} item={item} index={i} />
          ))}
        </div>
        
        <div className="mt-12 text-center">
           <p className="text-xs font-bold text-text-subtle uppercase tracking-[0.4em] font-mono">
             // UPGRADE YOUR WORKFLOW
           </p>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
