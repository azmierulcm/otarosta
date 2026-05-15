'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRoster } from '@/lib/contexts/RosterContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ChevronRight, Play } from 'lucide-react';

const LandingHero = () => {
  const { loadSampleRoster } = useRoster();
  const { openAuthModal } = useAuth();

  return (
    <section className="pt-40 pb-24 px-4 overflow-hidden bg-bg">
      <div className="max-w-5xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-accent font-bold uppercase tracking-[0.4em] text-xs mb-8"
        >
          Flight Deck Ready // Digital Roster Transformation
        </motion.p>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-6xl md:text-8xl font-bold tracking-tighter text-text mb-8 leading-[0.9] font-sans"
        >
          Your PDF roster, <br />
          <span className="text-text-subtle italic font-serif font-light">transformed.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-xl md:text-2xl text-text-muted mb-12 max-w-3xl mx-auto font-medium leading-relaxed"
        >
          Drop your monthly roster PDF. We automatically extract your flights, 
          sync them to your calendar, and build your digital destination passport. 
          <span className="text-accent font-mono block mt-4 uppercase tracking-widest text-sm">Processed in under 10 seconds.</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col md:flex-row items-center justify-center gap-6"
        >
          <button 
            onClick={() => openAuthModal('signup')}
            className="bg-accent text-accent-fg px-12 py-5 rounded-2xl text-lg font-bold shadow-2xl shadow-accent/20 hover:bg-accent-hover active:scale-95 transition-all w-full md:w-auto text-center flex items-center justify-center gap-3"
          >
            Get Started
            <ChevronRight size={20} strokeWidth={3} />
          </button>
          <button 
            onClick={loadSampleRoster}
            className="bg-surface text-text border border-border px-12 py-5 rounded-2xl text-lg font-bold hover:bg-surface-2 active:scale-95 transition-all w-full md:w-auto flex items-center justify-center gap-3"
          >
            View Demo
            <Play size={18} fill="currentColor" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default LandingHero;
