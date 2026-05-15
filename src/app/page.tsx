'use client';

import Navbar from '@/components/Navbar';
import LandingHero from '@/components/landing/LandingHero';
import ComparisonSection from '@/components/landing/ComparisonSection';
import HowItWorks from '@/components/landing/HowItWorks';
import AudienceSection from '@/components/landing/AudienceSection';
import PricingCTA from '@/components/landing/PricingCTA';
import FileUploader from '@/components/FileUploader';
import Dashboard from '@/components/Dashboard';
import { useRosterStore } from '@/store/useRosterStore';
import { AnimatePresence, motion } from 'framer-motion';

export default function Home() {
  const { roster } = useRosterStore();

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      <AnimatePresence mode="wait">
        {!roster ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <LandingHero />
            
            <div id="upload">
              <FileUploader />
            </div>

            <ComparisonSection />
            <HowItWorks />
            <AudienceSection />
            <PricingCTA />

            {/* Footer Placeholder */}
            <footer className="py-12 border-t border-gray-100 text-center">
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
                © 2026 Cemrosta • Built for the Crew
              </p>
            </footer>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-32"
          >
            <Dashboard />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
