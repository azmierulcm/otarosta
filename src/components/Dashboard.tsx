'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Clock, MapPin, Hotel, Download } from 'lucide-react';
import { useRosterStore } from '@/store/useRosterStore';
import { DutyEvent } from '@/types';
import { generateICS, downloadICS } from '@/utils/calendar';
import DutyCalendar from './DutyCalendar';
import DestinationPatch from './DestinationPatch';

const EventCard = ({ event, index }: { event: DutyEvent; index: number }) => {
  const isFlight = event.type === 'FLIGHT';
  const isStandby = event.type === 'STANDBY';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-3xl p-6 shadow-card border border-gray-100 mb-6 group hover:border-rausch/20 transition-all"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className={`
            w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
            ${isFlight ? 'bg-rausch text-white shadow-lg shadow-rausch/20' : 'bg-orange-50 text-orange-600'}
          `}>
            {isFlight ? <Plane className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                {event.date}
              </span>
              {isStandby && (
                <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Standby
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {isFlight ? `Flight ${event.flightNumber}` : `Standby (${event.id})`}
            </h3>
            {isFlight && (
              <div className="flex items-center gap-2 mt-1 text-gray-500 font-medium">
                <MapPin className="w-4 h-4" />
                <span>{event.depPort}</span>
                <span className="text-gray-300">→</span>
                <span>{event.arrPort}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 md:text-right">
          <div className="bg-gray-50 px-4 py-2 rounded-2xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Sign On</p>
            <p className="text-sm font-bold text-gray-900">{event.signOn || event.std || '--:--'}</p>
          </div>
          <div className="bg-gray-50 px-4 py-2 rounded-2xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Sign Off</p>
            <p className="text-sm font-bold text-gray-900">{event.signOff || event.sta || '--:--'}</p>
          </div>
        </div>
      </div>
      
      {isFlight && event.std && (
        <div className="mt-4 flex items-center gap-6 text-xs text-gray-400 font-medium">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>STD: {event.std}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>STA: {event.sta || '--:--'}</span>
          </div>
        </div>
      )}
      
      {event.hotel && (
        <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-3 text-sm text-gray-600">
          <Hotel className="w-4 h-4 text-rausch" />
          <span className="font-medium">Layover:</span>
          <span className="bg-gray-50 px-3 py-1 rounded-full text-gray-900 font-semibold">{event.hotel}</span>
        </div>
      )}
    </motion.div>
  );
};

const Dashboard = () => {
  const { roster, reset } = useRosterStore();

  if (!roster) return null;

  const handleExport = () => {
    if (!roster) return;
    const icsContent = generateICS(roster);
    if (icsContent) {
      downloadICS(icsContent, `roster-${roster.month}-${roster.year}.ics`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20 pt-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">Your Schedule</h2>
          <p className="text-gray-500 font-medium mt-1">{roster.month} {roster.year} • {roster.events.length} Events</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={reset}
            className="px-6 py-3 rounded-2xl font-bold text-gray-600 hover:bg-gray-100 transition-all active:scale-95"
          >
            Clear
          </button>
          <button 
            onClick={handleExport}
            className="bg-rausch text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-rausch/20 hover:scale-[1.02] transition-all active:scale-95"
          >
            <Download className="w-5 h-5" />
            Add to Calendar
          </button>
        </div>
      </div>

      {/* Destinations Section */}
      {roster.destinations && roster.destinations.length > 0 && (
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Where I&apos;ve been</h3>
          </div>
          <div className="flex gap-8 overflow-x-auto pb-8 -mx-4 px-4 scrollbar-hide">
            {roster.destinations.map((dest) => (
              <DestinationPatch key={dest.iata} destination={dest} />
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 relative">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">Timeline</h3>
          <div className="absolute left-6 top-24 bottom-0 w-px bg-gray-100 -z-10" />
          {roster.events.map((event, index) => (
            <EventCard key={event.id + index} event={event} index={index} />
          ))}
        </div>
        
        <div className="lg:col-span-4">
          <div className="sticky top-32">
            <DutyCalendar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
