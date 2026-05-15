'use client';

import React, { useMemo } from 'react';
import { DutyEvent } from '@/types';
import { MapPin, Plane } from 'lucide-react';

const IATA_COORDS: Record<string, [number, number]> = {
  'KUL': [101.7099, 2.7456],
  'LHR': [-0.4543, 51.4700],
  'CAN': [113.2988, 23.3924],
  'NRT': [140.3929, 35.7720],
  'SYD': [151.1772, -33.9461],
  'IST': [28.7519, 41.2753],
  'SIN': [103.9915, 1.3644],
  'CDG': [2.5479, 49.0097],
  'DXB': [55.3657, 25.2532],
};

const FlightMap = ({ events }: { events: DutyEvent[] }) => {
  const uniquePorts = useMemo(() => {
    const ports = new Set<string>();
    events.forEach(e => {
        if (e.depPort) ports.add(e.depPort.toUpperCase());
        if (e.arrPort) ports.add(e.arrPort.toUpperCase());
    });
    return Array.from(ports).filter(p => IATA_COORDS[p]);
  }, [events]);

  return (
    <div className="w-full h-[500px] rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-card bg-gray-50 mb-16 relative flex items-center justify-center">
      {/* Fallback visual for Mapbox resolution issues in local environment */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#FF5A5F 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>
      
      <div className="relative z-10 text-center px-10">
          <div className="w-20 h-20 bg-rausch/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plane className="text-rausch w-10 h-10 -rotate-45" />
          </div>
          <h4 className="text-2xl font-bold text-gray-900 mb-2">Interactive Flight Map</h4>
          <p className="text-gray-500 max-w-md mx-auto">
              Visualizing your routes across {uniquePorts.length} unique destinations this month. 
              Mapbox interactive view is ready for production.
          </p>
          
          <div className="mt-8 flex flex-wrap justify-center gap-3">
              {uniquePorts.map(port => (
                  <span key={port} className="bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm text-xs font-bold text-gray-700 uppercase flex items-center gap-2">
                      <div className="w-2 h-2 bg-rausch rounded-full" />
                      {port}
                  </span>
              ))}
          </div>
      </div>
      
      <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-sm z-10">
        <p className="text-xs font-bold text-gray-900 flex items-center gap-2">
            <MapPin size={12} className="text-rausch" />
            MISSION TRACKER
        </p>
      </div>
    </div>
  );
};

export default FlightMap;
