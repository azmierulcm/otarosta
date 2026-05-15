'use client';

import React from 'react';
import { Share2, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileHeaderProps {
  name: string;
  role: string;
  homeBase: string;
  aircraftType: string;
}

const ProfileHeader = ({ name, role, homeBase, aircraftType }: ProfileHeaderProps) => {
  // Initials for avatar fallback
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="bg-surface border border-border rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[80px] -mr-32 -mt-32 rounded-full" />
      
      <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-bg border border-border flex items-center justify-center text-3xl md:text-4xl font-black text-accent shadow-inner">
          {initials}
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-text mb-2">
            {name}
          </h1>
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-text-muted font-medium">
            <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">{role}</span>
            <div className="w-1 h-1 rounded-full bg-border" />
            <div className="flex items-center gap-1">
              <MapPin size={14} className="text-text-subtle" />
              <span>{homeBase}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-border" />
            <span>{aircraftType}</span>
          </div>
        </div>
      </div>

      <button className="bg-bg border border-border text-text px-8 py-4 rounded-2xl font-bold hover:bg-surface-2 transition-all active:scale-95 flex items-center gap-2 relative z-10 self-stretch md:self-auto justify-center">
        <Share2 size={18} />
        Share
      </button>
    </div>
  );
};

export default ProfileHeader;
