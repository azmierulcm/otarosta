import React from 'react';
import { motion } from 'framer-motion';
import { Grid, Share, Heart } from 'lucide-react';

const ProfileGallery = ({ name = 'Crew Member' }: { name?: string }) => {
  // Placeholder images - in a real app, these would be uploaded by the crew
  const photos = [
    "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&q=80&w=1200", // Cockpit view
    "https://images.unsplash.com/photo-1540339832862-474599807836?auto=format&fit=crop&q=80&w=600",  // Uniform detail
    "https://images.unsplash.com/photo-1520437358207-323b43b50729?auto=format&fit=crop&q=80&w=600",  // Layover city
    "https://images.unsplash.com/photo-1436491865332-7a61a109c0f2?auto=format&fit=crop&q=80&w=600",  // Aircraft wing
    "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=600",  // Travel gear
  ];

  return (
    <div className="relative mb-12">
      {/* Title & Actions Row */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{name}&apos;s Profile</h1>
          <p className="text-gray-500 font-medium">First Officer • A350 Fleet</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 text-sm font-semibold hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors underline">
            <Share size={16} /> Share
          </button>
          <button className="flex items-center gap-2 text-sm font-semibold hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors underline">
            <Heart size={16} /> Save
          </button>
        </div>
      </div>

      {/* 5-Photo Bento Grid (Airbnb Style) */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] md:h-[500px] rounded-2xl overflow-hidden relative group">
        {/* Main large photo */}
        <div className="col-span-2 row-span-2 relative overflow-hidden">
          <img 
            src={photos[0]} 
            alt="Profile main" 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer"
          />
        </div>

        {/* Small photos */}
        {photos.slice(1).map((src, i) => (
          <div key={i} className="relative overflow-hidden">
            <img 
              src={src} 
              alt={`Gallery ${i + 1}`} 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer"
            />
          </div>
        ))}

        {/* Show all photos button */}
        <button className="absolute bottom-6 right-6 bg-white border border-gray-900 px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
          <Grid size={16} /> Show all photos
        </button>
      </div>
    </div>
  );
};

export default ProfileGallery;
