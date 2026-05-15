'use client';

import React from 'react';
import { Plane, User } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/utils/supabase';

const Navbar = () => {
  const { user, setUser, openAuthModal } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <nav className="fixed top-0 w-full bg-bg/80 backdrop-blur-md border-b border-border z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-accent p-2 rounded-lg">
              <Plane className="w-6 h-6 text-accent-fg" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-accent">Cemrosta</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-text-muted">
            <Link href="/" className="hover:text-text transition-colors">Home</Link>
            <Link href="/marketplace" className="hover:text-text transition-colors">Marketplace</Link>
            {user && (
              <Link href="/profile" className="flex items-center gap-2 hover:text-text transition-colors group">
                <div className="p-1.5 rounded-full bg-surface group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                  <User size={16} />
                </div>
                My Profile
              </Link>
            )}
            
            {user ? (
              <button 
                onClick={handleSignOut}
                className="bg-text text-bg px-6 py-2.5 rounded-full hover:bg-text/90 transition-all active:scale-95 shadow-sm font-bold"
              >
                Sign Out
              </button>
            ) : (
              <button 
                onClick={() => openAuthModal('login')}
                className="bg-accent text-accent-fg px-6 py-2.5 rounded-full hover:bg-accent-hover transition-all active:scale-95 shadow-sm font-bold"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
