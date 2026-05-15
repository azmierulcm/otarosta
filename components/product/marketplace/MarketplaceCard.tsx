'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Listing {
  id: string;
  title: string;
  price: number;
  condition: string;
  category: string;
  image: string;
  seller: string;
  avatar: string;
}

const MarketplaceCard = ({ listing }: { listing: Listing }) => {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="group cursor-pointer"
    >
      <div className="aspect-square rounded-[2rem] overflow-hidden mb-4 relative shadow-sm border border-border">
        <img 
          src={listing.image} 
          alt={listing.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4 bg-bg/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-text shadow-sm border border-white">
          {listing.condition}
        </div>
      </div>
      <div className="px-2">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-bold text-text truncate flex-1 pr-4">{listing.title}</h4>
          <span className="font-black text-text text-lg">RM{listing.price}</span>
        </div>
        <p className="text-text-subtle text-xs font-bold uppercase tracking-tighter mb-4">{listing.category}</p>
        <div className="flex items-center gap-2 border-t border-gray-50 pt-4">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-surface-2">
            <img src={listing.avatar} alt={listing.seller} className="w-full h-full object-cover" />
          </div>
          <span className="text-xs font-bold text-text-muted">Sold by {listing.seller}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketplaceCard;
