'use client';

import React from 'react';
import { motion } from 'framer-motion';

const HowItWorks = () => {
  const steps = [
    {
      icon: "📄",
      title: "Drop the PDF.",
      desc: "No manual entry. Just drag and drop your airline-issued roster. We support all major Malaysia Airlines formats."
    },
    {
      icon: "📅",
      title: "Sync the Schedule.",
      desc: "Export perfectly formatted .ics files directly to Apple or Google Calendar with one tap."
    },
    {
      icon: "🌍",
      title: "Collect the Patches.",
      desc: "Watch your profile populate with destination stamps and flight stats as you build your lifetime digital passport."
    }
  ];

  return (
    <section className="py-24 px-4 bg-surface/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-text mb-4">
            How it works
          </h2>
          <p className="text-xl text-text-muted font-medium italic">
            Zero friction, 100% precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-bg rounded-3xl flex items-center justify-center text-4xl shadow-xl shadow-gray-200/50 mx-auto mb-8 border border-border">
                {step.icon}
              </div>
              <h3 className="text-2xl font-black text-text mb-4">{step.title}</h3>
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
