'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Globe, Award, Calendar, ChevronRight } from 'lucide-react';
import { CrewStats } from '@/types/passport';

interface DashboardProps {
  stats: CrewStats;
}

const StatCard = ({ label, value, sub, icon: Icon }: any) => (
  <div className="bg-passport-surface p-8 rounded-[2rem] border border-passport-border hover:border-passport-gold/30 transition-all group">
    <div className="flex justify-between items-start mb-6">
      <div className="w-10 h-10 rounded-xl bg-passport-bg flex items-center justify-center border border-passport-border group-hover:border-passport-gold/20 transition-colors">
        <Icon size={20} className="text-passport-secondary group-hover:text-passport-gold transition-colors" />
      </div>
      <p className="text-[10px] font-bold text-passport-secondary uppercase tracking-[0.3em]">{label}</p>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-4xl font-black text-passport-text tracking-tighter">{value}</span>
      {sub && <span className="text-[10px] font-bold text-passport-gold-soft uppercase tracking-wider">{sub}</span>}
    </div>
  </div>
);

import ShareModal from './ShareModal';
import { useAuthStore } from '@/store/useAuthStore';

const PassportDashboard = ({ stats }: DashboardProps) => {
  const { user } = useAuthStore();
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);

  return (
    <div className="bg-passport-bg min-h-screen text-passport-text p-10 font-sans selection:bg-passport-gold/30">
      <div className="max-w-7xl mx-auto pt-20">
        {/* Header Hero */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <p className="text-passport-gold font-bold uppercase tracking-[0.4em] text-[10px] mb-4">Official Digital Passport</p>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-4">
              Mission <br />
              <span className="text-passport-secondary italic font-serif font-light">Summary.</span>
            </h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsShareModalOpen(true)}
            className="bg-passport-gold text-passport-bg px-10 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-passport-gold/20 flex items-center gap-3 transition-all"
          >
            Generate this year&apos;s card
            <ChevronRight size={20} strokeWidth={3} />
          </motion.button>
        </div>

        <ShareModal 
          isOpen={isShareModalOpen} 
          onClose={() => setIsShareModalOpen(false)} 
          crewId={user?.id || 'demo'} 
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <StatCard label="Distance" value={stats.total_km.toLocaleString()} sub="KM" icon={Globe} />
          <StatCard label="Sectors" value={stats.total_sectors} sub="Flights" icon={Plane} />
          <StatCard label="In Air" value={Math.floor(stats.total_block_minutes / 60)} sub="Hours" icon={Award} />
          <StatCard label="Stamps" value={stats.unique_destinations} sub="Cities" icon={Calendar} />
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Recent Missions */}
          <div className="lg:col-span-2">
            <h3 className="text-[10px] font-bold text-passport-secondary uppercase tracking-[0.4em] mb-8 border-b border-passport-border pb-4">
              Recent Missions
            </h3>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-passport-surface/30 rounded-2xl border border-passport-border/50 hover:border-passport-gold/20 transition-all cursor-pointer group">
                  <div className="flex items-center gap-6">
                    <div className="font-mono text-sm text-passport-secondary">MH 004</div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-lg tracking-tight">KUL</span>
                      <ChevronRight size={14} className="text-passport-border" />
                      <span className="font-black text-lg tracking-tight">LHR</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-passport-secondary uppercase">12 May 2026</p>
                    <p className="text-xs font-black text-passport-gold-soft uppercase tracking-tighter">Completed</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievement Teaser */}
          <div className="lg:col-span-1">
             <h3 className="text-[10px] font-bold text-passport-secondary uppercase tracking-[0.4em] mb-8 border-b border-passport-border pb-4">
              Rare Moments
            </h3>
            <div className="bg-gradient-to-br from-passport-surface to-passport-bg-secondary p-8 rounded-[2.5rem] border border-passport-border relative overflow-hidden">
                <Award className="absolute -top-10 -right-10 w-40 h-40 text-passport-gold/5" />
                <div className="relative z-10">
                   <div className="w-12 h-12 rounded-full bg-passport-gold/10 border border-passport-gold/20 flex items-center justify-center mb-6">
                      <Award className="text-passport-gold" size={24} />
                   </div>
                   <h4 className="text-xl font-bold mb-2">Equator Bound</h4>
                   <p className="text-passport-secondary text-sm font-medium leading-relaxed mb-8">
                      Earned for your first crossing of the earth&apos;s center line.
                   </p>
                   <div className="bg-passport-bg/50 px-4 py-2 rounded-full border border-passport-border inline-block text-[10px] font-bold text-passport-gold-soft uppercase tracking-widest">
                      Legendary Rank
                   </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassportDashboard;
