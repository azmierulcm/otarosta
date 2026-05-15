'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import ProfileHeader from '@/components/profile/ProfileHeader';
import StatsGrid from '@/components/profile/StatsGrid';
import ShareableRecapCard from '@/components/profile/ShareableRecapCard';
import ExportButton from '@/components/profile/ExportButton';
import DestinationPatch from '@/components/DestinationPatch';
import { useRosterStore } from '@/store/useRosterStore';
import ProfileGallery from '@/components/profile/ProfileGallery';
import FlightMap from '@/components/profile/FlightMap';

export default function ProfilePage() {
  const { roster } = useRosterStore();

  if (!roster) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-40 text-center">
          <h2 className="text-2xl font-bold text-gray-900">No Roster Found</h2>
          <p className="text-gray-500 mt-2">Please upload your roster to Cemrosta first.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white pb-32">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-32">
        <ProfileGallery />

        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Monthly Performance</h3>
          <StatsGrid stats={roster.stats!} />
        </div>

        {/* Flight Map Section */}
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Flight Map</h3>
          <FlightMap events={roster.events} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left: Patch Collection */}
          <div className="lg:col-span-7">
             <h3 className="text-2xl font-bold text-gray-900 mb-8">Lifetime Collection</h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                {roster.destinations?.map(dest => (
                  <DestinationPatch key={dest.iata} destination={dest} />
                ))}
             </div>
          </div>

          {/* Right: Social Recap & Export */}
          <div className="lg:col-span-5">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Monthly Recap</h3>
            <div className="flex flex-col items-center gap-10">
               <div className="scale-75 md:scale-100 origin-top">
                  <ShareableRecapCard roster={roster} />
               </div>
               <ExportButton targetId="shareable-recap" filename={`Recap-${roster.month}-${roster.year}`} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
