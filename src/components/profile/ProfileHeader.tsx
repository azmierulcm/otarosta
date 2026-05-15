import React from 'react';
import { motion } from 'framer-motion';

const ProfileHeader = ({ name, rank, airline }: { name: string, rank: string, airline: string }) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-8 mb-16 pt-10">
      <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden shrink-0">
        <div className="w-full h-full bg-gradient-to-br from-rausch to-rose-600 flex items-center justify-center text-white text-4xl font-bold">
          {name.charAt(0)}
        </div>
      </div>
      <div className="text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">{name}</h1>
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
          <span className="bg-rausch/10 text-rausch px-4 py-1.5 rounded-full text-sm font-bold border border-rausch/20 uppercase tracking-wide">
            {rank}
          </span>
          <span className="text-gray-400 font-medium">•</span>
          <span className="text-gray-600 font-bold">{airline}</span>
          <span className="text-gray-400 font-medium">•</span>
          <span className="text-gray-500 font-medium italic">Member since May 2026</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
