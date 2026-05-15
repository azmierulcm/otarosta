'use client';

import React from 'react';
import { motion } from 'framer-motion';

const AudienceSection = () => {
  const audiences = [
    {
      icon: "✈️",
      title: "For Flight Deck",
      desc: "Track your sectors, block hours, and nautical miles with precision. Stop the manual logbook entries."
    },
    {
      icon: "🧳",
      title: "For Cabin Crew",
      desc: "Easily see your layovers, days off, and collect destination patches. Visualized for your lifestyle."
    },
    {
      icon: "🏡",
      title: "For Family",
      desc: "Share a clean, readable version of your schedule so they know exactly when you land and when you are home."
    }
  ];

  return (
    <section className="py-24 px-4 bg-bg border-y border-border">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {audiences.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="text-left"
            >
              <span className="text-4xl block mb-6">{item.icon}</span>
              <h3 className="text-xl font-black text-text mb-4 uppercase tracking-tighter italic">
                {item.title}
              </h3>
              <p className="text-text-muted font-medium leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudienceSection;
