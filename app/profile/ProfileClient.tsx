'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import ProfileFilled from '@/components/product/profile/ProfileFilled';
import ProfileEmptyState from '@/components/product/profile/ProfileEmptyState';
import { useRoster } from '@/lib/contexts/RosterContext';
import { SAMPLE_PROFILE } from '@/lib/fixtures/sample-profile';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfileClient() {
  const { roster } = useRoster();
  
  // map real roster to profile structure (simplified for Phase 3)
  const realProfileData = roster ? {
    name: roster.crewName || 'Crew Member',
    role: 'First Officer', // placeholder for now
    homeBase: 'KUL',
    aircraftType: 'B737', // placeholder
    lifetimeStats: {
      sectors: roster.stats?.totalSectors || 0,
      blockMinutes: roster.events.reduce((acc, e) => {
        // block time logic would go here
        return acc + 0; 
      }, 0),
      kilometers: roster.stats?.totalMiles || 0,
      citiesCollected: roster.destinations?.length || 0,
      totalAvailableCities: 62
    },
    monthlyRecap: {
      month: roster.month,
      year: roster.year,
      sectors: roster.stats?.totalSectors || 0,
      blockMinutes: 0,
      newCity: roster.destinations?.[0]?.iata || null
    },
    destinations: roster.destinations?.map(d => ({
      iata: d.iata,
      name: d.city,
      country: d.country,
      region: 'Asia', // placeholder
      visits: 1,
      unlocked: true
    })) || []
  } : null;

  return (
    <main className="min-h-screen bg-bg flex flex-col relative">
      <Navbar />
      
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {!roster ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              {/* Blurred background view */}
              <div className="opacity-[0.15] pointer-events-none filter blur-sm">
                <ProfileFilled data={SAMPLE_PROFILE} />
              </div>
              <ProfileEmptyState />
            </motion.div>
          ) : (
            <motion.div
              key="filled"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ProfileFilled data={realProfileData} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </main>
  );
}
