import React from 'react';
import { motion } from 'framer-motion';
import { RosterStats } from '@/lib/types';

const StatsGrid = ({ stats }: { stats: RosterStats }) => {
  const items = [
    { label: 'Sectors Flown', value: stats.totalSectors, unit: 'Flights' },
    { label: 'Air Distance', value: stats.totalMiles.toLocaleString(), unit: 'KM' },
    { label: 'Time in the Air', value: stats.totalBlockTime, unit: 'Block' },
    { label: 'New Stamps', value: stats.uniqueDestinations, unit: 'Unlocked' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-bg p-8 rounded-[2rem] border border-border shadow-sm hover:shadow-md transition-shadow"
        >
          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest mb-3">
            {item.label}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-text tracking-tighter">
              {item.value}
            </span>
            <span className="text-xs font-bold text-accent uppercase">{item.unit}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsGrid;
