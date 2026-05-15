'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileUp, CalendarSync, MapPinned } from 'lucide-react';

const STEPS = [
  {
    icon: FileUp,
    title: "Drop Roster",
    desc: "Drag your Malaysia Airlines AIMS PDF into the dash. We extract every flight and duty instantly.",
  },
  {
    icon: CalendarSync,
    title: "Sync Calendar",
    desc: "Download the .ics file and sync to iPhone or Google Calendar. All times converted to local automatically.",
  },
  {
    icon: MapPinned,
    title: "Collect Cities",
    desc: "Every destination flown earns a digital patch. Watch your lifetime passport grow with every mission.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-32 px-4 bg-bg">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-text">
            Three steps. <br />
            <span className="text-text-subtle">Ready in seconds.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative group"
            >
              <div className="w-16 h-16 rounded-[1.5rem] bg-surface border border-border flex items-center justify-center mb-8 group-hover:border-accent/50 transition-colors shadow-xl">
                 <step.icon size={28} className="text-accent" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                 <span className="text-xs font-bold font-mono text-text-subtle">0{i + 1} //</span>
                 <h3 className="text-2xl font-bold text-text tracking-tight">{step.title}</h3>
              </div>
              <p className="text-text-muted font-medium leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
