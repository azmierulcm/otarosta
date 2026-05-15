'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import PassportDashboard from '@/components/passport/PassportDashboard';
import { supabase } from '@/utils/supabase';
import { CrewStats } from '@/types/passport';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function PassportPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<CrewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('crew_stats')
        .select('*')
        .eq('crew_id', user.id) // Simplified: assuming crew_id maps directly for this phase
        .single();

      if (data && !error) {
        setStats(data as CrewStats);
      }
      setIsLoading(false);
    };

    fetchStats();
  }, [user]);

  // Mock data for Phase 1 demonstration if no real stats exist
  const mockStats: CrewStats = {
    crew_id: 'demo',
    total_km: 124500,
    total_sectors: 89,
    total_block_minutes: 15420,
    total_flight_minutes: 14200,
    unique_destinations: 24,
    unique_countries: 12,
    unique_continents: 3,
    unique_aircraft_types: 2,
    unique_crew_flown_with: 142,
    sunrises_witnessed: 45,
    sunsets_witnessed: 32,
    polar_crossings: 4,
    equator_crossings: 12,
    idl_crossings: 2,
    ytd_km: 45200,
    ytd_sectors: 32,
    ytd_block_minutes: 5400,
    ytd_unique_destinations: 12,
    ytd_unique_new_destinations: 4,
    ytd_sunrises: 12,
    top_route_pair: 'KUL-LHR',
    top_route_count: 14,
    longest_sector_id: null,
    updated_at: new Date().toISOString(),
  };

  if (isLoading) {
    return (
      <div className="bg-passport-bg min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-passport-gold" />
      </div>
    );
  }

  return (
    <main>
      <Navbar />
      <PassportDashboard stats={stats || mockStats} />
    </main>
  );
}
