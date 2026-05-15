import React from 'react';
import { motion } from 'framer-motion';

const ProfileHeader = ({ name, rank, airline }: { name: string, rank: string, airline: string }) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-8 mb-16 pt-10">
      <div className="w-32 h-32 rounded-full bg-surface-2 border-4 border-white shadow-lg overflow-hidden shrink-0">
        <div className="w-full h-full bg-gradient-to-br from-accent to-rose-600 flex items-center justify-center text-white text-4xl font-bold">
          {name.charAt(0)}
        </div>
      </div>
      <div className="text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-text tracking-tight mb-2">{name}</h1>
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
          <span className="bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-bold border border-accent/20 uppercase tracking-wide">
            {rank}
          </span>
          <span className="text-text-subtle font-medium">•</span>
          <span className="text-text-muted font-bold">{airline}</span>
          <span className="text-text-subtle font-medium">•</span>
          <span className="text-text-muted font-medium italic">Member since May 2026</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
