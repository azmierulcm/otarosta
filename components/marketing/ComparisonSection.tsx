'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ComparisonCard from './ComparisonCard';

const ComparisonSection = () => {
  const comparisons = [
    {
      old: "Manually typing block times into your phone. Messing up UTC vs. Local time. Waking up at 3 AM because your layover alarm was set to Kuala Lumpur time.",
      new: "One click. Every duty, standby, and layover instantly mapped to your native calendar with flawless timezone conversions."
    },
    {
      old: "A folder full of dead PDF files you never look at again.",
      new: "A living digital passport. Unlock custom Airbnb-style destination patches for every new city you fly to. Track your lifetime kilometers."
    },
    {
      old: "Sending blurry, cropped screenshots of your roster to your spouse or friends so they know when you are home.",
      new: "Generate a sleek 'Monthly Mission Recap' card showing your sectors, distance, and new cities to share instantly on WhatsApp or Instagram Stories."
    }
  ];

  return (
    <section className="py-24 px-4 bg-bg">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-text mb-4">
            The Difference
          </h2>
          <p className="text-xl text-text-muted font-medium italic">
            Why Cemrosta is built differently.
          </p>
        </div>

        <div className="space-y-12">
          {comparisons.map((item, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <ComparisonCard type="old" title="The Old Way" content={item.old} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 + 0.1 }}
              >
                <ComparisonCard type="new" title="The Cemrosta Way" content={item.new} />
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
