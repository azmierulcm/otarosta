'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker
} from 'react-simple-maps';
import { DutyEvent } from '@/types';
import { MapPin, AlertCircle } from 'lucide-react';

const geoUrl = "https://raw.githubusercontent.com/lotusms/world-map-data/main/world-110m.json";

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
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const routes = useMemo(() => {
    const r: any[] = [];
    events.forEach((event) => {
      if (event.type === 'FLIGHT' && event.depPort && event.arrPort) {
        const from = IATA_COORDS[event.depPort.toUpperCase()];
        const to = IATA_COORDS[event.arrPort.toUpperCase()];
        if (from && to) {
          r.push({ from, to });
        }
      }
    });
    return r;
  }, [events]);

  const uniquePorts = useMemo(() => {
    const ports = new Set<string>();
    events.forEach(e => {
        if (e.depPort) ports.add(e.depPort.toUpperCase());
        if (e.arrPort) ports.add(e.arrPort.toUpperCase());
    });
    return Array.from(ports).filter(p => IATA_COORDS[p]);
  }, [events]);

  useEffect(() => {
    // Check if data is loading correctly
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (uniquePorts.length === 0) {
    return (
      <div className="w-full h-[400px] rounded-[2.5rem] bg-gray-50 flex items-center justify-center border border-gray-100 mb-16">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No Route Data Available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-card bg-[#f8fafc] mb-16 relative">
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-white/50 backdrop-blur-sm flex items-center justify-center">
           <div className="w-12 h-12 border-4 border-rausch/20 border-t-rausch rounded-full animate-spin" />
        </div>
      )}

      <ComposableMap
        projectionConfig={{
          rotate: [-110, 0, 0],
          scale: 160
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies 
          geography={geoUrl}
          onError={() => setHasError(true)}
        >
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#cbd5e1"
                stroke="#f8fafc"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { fill: "#94a3b8", outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>
        
        {routes.map((route, i) => (
          <Line
            key={i}
            from={route.from}
            to={route.to}
            stroke="#FF5A5F"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray="4 4"
          />
        ))}

        {uniquePorts.map(port => {
            const coords = IATA_COORDS[port];
            return (
                <Marker key={port} coordinates={coords as [number, number]}>
                    <circle r={5} fill="#FF5A5F" stroke="#FFF" strokeWidth={2} />
                    <text
                        textAnchor="middle"
                        y={-14}
                        style={{ 
                          fontFamily: "Inter", 
                          fontSize: "12px", 
                          fontWeight: "900", 
                          fill: "#1e293b",
                          textShadow: "0 0 4px white"
                        }}
                        className="uppercase"
                    >
                        {port}
                    </text>
                </Marker>
            );
        })}
      </ComposableMap>
      
      {hasError && (
        <div className="absolute bottom-6 left-6 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-bold border border-red-100">
           ERROR LOADING WORLD MAP DATA
        </div>
      )}

      <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-sm z-10">
        <p className="text-[10px] font-black text-gray-900 flex items-center gap-2 tracking-widest uppercase">
            <MapPin size={12} className="text-rausch" />
            Mission Tracker
        </p>
      </div>
    </div>
  );
};

export default FlightMap;
