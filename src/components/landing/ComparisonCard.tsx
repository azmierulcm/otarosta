'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

interface ComparisonCardProps {
  type: 'old' | 'new';
  title: string;
  content: string;
}

const ComparisonCard = ({ type, title, content }: ComparisonCardProps) => {
  const isOld = type === 'old';
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`p-8 rounded-[2rem] border h-full ${
        isOld 
          ? 'bg-gray-50 border-gray-100 text-gray-500' 
          : 'bg-white border-rausch/20 shadow-xl shadow-rausch/5 text-gray-900'
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-6 ${
        isOld ? 'bg-gray-200 text-gray-400' : 'bg-rausch text-white'
      }`}>
        {isOld ? <X size={20} /> : <Check size={20} />}
      </div>
      <h4 className={`text-lg font-bold mb-4 uppercase tracking-tight ${isOld ? 'text-gray-400' : 'text-rausch'}`}>
        {isOld ? 'The Old Way' : 'The Cemrosta Way'}
      </h4>
      <p className={`text-xl font-bold leading-snug ${isOld ? 'text-gray-400' : 'text-gray-900'}`}>
        {content}
      </p>
    </motion.div>
  );
};

export default ComparisonCard;
