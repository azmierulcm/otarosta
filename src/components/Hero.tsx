import React from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section className="pt-40 pb-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6"
        >
          Your roster, <span className="text-rausch italic">reimagined.</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Upload your monthly PDF roster and get a beautifully organized, 
          synced timeline. Designed for crew, by crew.
        </motion.p>
      </div>
    </section>
  );
};

export default Hero;
