'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/utils/supabase';

interface WaitlistSheetProps {
  isOpen: boolean;
  onClose: () => void;
  airline: string;
}

const WaitlistSheet = ({ isOpen, onClose, airline }: WaitlistSheetProps) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    
    try {
      const { error } = await supabase
        .from('waitlist_entries')
        .insert([{ email, airline_name: airline }]);

      if (error) throw error;
      
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setEmail('');
      }, 3000);
    } catch (err: any) {
      console.error('Waitlist error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-[100]"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-surface border-l border-border z-[101] shadow-2xl p-8 flex flex-col"
          >
            <div className="flex justify-between items-center mb-12">
              <div className="flex flex-col gap-1">
                <div className="w-8 h-1 bg-accent/30" />
                <div className="w-8 h-2 bg-accent/60" />
                <div className="w-8 h-4 bg-accent" />
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-surface-2 rounded-full transition-colors text-text-muted hover:text-text"
              >
                <X size={24} />
              </button>
            </div>

            {status === 'success' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                 <div className="w-20 h-20 bg-success/10 rounded-[2rem] flex items-center justify-center mb-8 text-success">
                    <CheckCircle2 size={40} />
                 </div>
                 <h3 className="text-3xl font-bold text-text mb-4 tracking-tighter">You&apos;re on the list.</h3>
                 <p className="text-text-muted leading-relaxed">
                   We&apos;ll notify you the moment {airline} support is cleared for takeoff.
                 </p>
              </div>
            ) : (
              <>
                <h3 className="text-4xl font-bold text-text mb-4 tracking-tighter">
                  Bring Cemrosta to <span className="text-accent">{airline}.</span>
                </h3>
                <p className="text-text-muted mb-12 leading-relaxed">
                  We&apos;re expanding our flight deck. Join the waitlist and be the first to know when we support your airline&apos;s roster format.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-xs font-bold uppercase tracking-[0.2em] text-text-subtle mb-3 font-mono">
                      Corporate or Personal Email
                    </label>
                    <input 
                      id="email"
                      type="email"
                      required
                      placeholder="crew@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-bg border border-border px-6 py-4 rounded-2xl text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50 transition-all font-medium"
                    />
                  </div>

                  {status === 'error' && (
                    <p className="text-danger text-sm font-medium">{errorMessage}</p>
                  )}

                  <button 
                    disabled={status === 'loading'}
                    className="w-full bg-accent text-accent-fg py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-accent/20 hover:bg-accent-hover transition-all disabled:opacity-50"
                  >
                    {status === 'loading' ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        Request Priority Access
                        <Send size={20} strokeWidth={3} />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-auto pt-12">
                   <p className="text-[10px] text-text-subtle font-mono uppercase tracking-[0.2em] text-center">
                     // SECURE TRANSMISSION // NO SPAM
                   </p>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WaitlistSheet;
