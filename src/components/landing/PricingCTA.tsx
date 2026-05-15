'use client';

import React from 'react';
import { motion } from 'framer-motion';

const PricingCTA = () => {
  return (
    <section className="py-32 px-4 bg-white text-center">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gray-900 rounded-[3rem] p-16 text-white relative overflow-hidden"
        >
          {/* Subtle light effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-rausch/20 blur-[100px] -mr-32 -mt-32 rounded-full" />
          
          <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tighter">
            Ready for takeoff.
          </h2>
          <p className="text-xl text-gray-400 font-medium mb-12 max-w-md mx-auto">
            Join the crew who have ditched the manual data entry.
          </p>
          <button className="bg-rausch text-white px-12 py-5 rounded-2xl text-xl font-black shadow-2xl shadow-rausch/20 hover:scale-105 active:scale-95 transition-all">
            Create Your Free Profile →
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingCTA;
