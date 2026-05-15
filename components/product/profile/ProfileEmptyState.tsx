'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileUp, Info } from 'lucide-react';
import FileUploader from '@/components/product/FileUploader';

const ProfileEmptyState = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-surface border border-accent/30 rounded-[3rem] p-8 md:p-12 shadow-[0_0_100px_rgba(0,212,255,0.15)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-accent" />
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
            <FileUp size={28} className="text-accent" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-text mb-4">
            Reveal your passport.
          </h2>
          <p className="text-text-muted text-lg font-medium leading-relaxed max-w-md mx-auto">
            Drop your roster PDF to unlock every city you&apos;ve earned and sync your calendar instantly.
          </p>
        </div>

        <FileUploader />

        <div className="mt-10 flex items-center justify-center gap-3 text-text-subtle text-xs font-bold uppercase tracking-widest font-mono">
           <Info size={14} className="text-accent" />
           MAS AIMS Rosters · PDF Only
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileEmptyState;
