'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PlaneTakeoff, Briefcase, Home } from 'lucide-react';

const AUDIENCES = [
  {
    icon: PlaneTakeoff,
    title: "Flight Deck",
    desc: "Sync your block hours to local time. Build a verifiable map of your career missions.",
  },
  {
    icon: Briefcase,
    title: "Cabin Crew",
    desc: "Ditch the paper rosters. Track your city patches and share your monthly recap with the crew.",
  },
  {
    icon: Home,
    title: "Family",
    desc: "Know exactly where they are. View shared profiles to track flight status and return times.",
  },
];

const AudienceSection = () => {
  return (
    <section className="py-32 px-4 bg-surface/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-text">
            Built for the <span className="text-accent">whole crew.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {AUDIENCES.map((audience, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface border border-border p-10 rounded-[2.5rem] hover:border-accent/30 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-bg border border-border flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                 <audience.icon size={24} className="text-text-muted group-hover:text-accent transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-text mb-4 tracking-tight">{audience.title}</h3>
              <p className="text-text-muted font-medium leading-relaxed">
                {audience.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudienceSection;
