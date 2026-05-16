'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';
import { joinWaitlist } from '@/lib/actions/waitlist';
import { Modal } from '@/components/shared/Modal';

interface WaitlistSheetProps {
  isOpen: boolean;
  onClose: () => void;
  airline: string;
}

const TITLE_ID = 'waitlist-sheet-title';

export const WaitlistSheet = ({ isOpen, onClose, airline }: WaitlistSheetProps) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      await joinWaitlist(email, airline);
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setEmail('');
      }, 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setStatus('error');
      setErrorMessage(message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      titleId={TITLE_ID}
      variant="sheet"
      className="p-8 flex flex-col"
      hideCloseButton={false}
    >
      <div className="pt-10 flex flex-col flex-1">
        {status === 'success' ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
            <div className="w-16 h-16 bg-success-soft rounded-[var(--radius-xl)] flex items-center justify-center text-success">
              <CheckCircle2 size={32} aria-hidden="true" />
            </div>
            <div>
              <h3 id={TITLE_ID} className="text-[24px] font-semibold text-text mb-2">
                You&apos;re on the list.
              </h3>
              <p className="text-text-muted text-[15px] leading-relaxed">
                We&apos;ll notify you the moment {airline} support launches.
              </p>
            </div>
          </div>
        ) : (
          <>
            <h3 id={TITLE_ID} className="text-[28px] font-semibold text-text leading-tight tracking-tight mb-3">
              Bring Cemrosta to{' '}
              <span className="text-accent">{airline}.</span>
            </h3>
            <p className="text-text-muted text-[16px] leading-relaxed mb-10">
              Join the waitlist and be first to know when we support your airline&apos;s roster format.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="waitlist-email" className="block text-[12px] font-medium text-text-muted mb-2 uppercase tracking-wider">
                  Your email
                </label>
                <input
                  id="waitlist-email"
                  type="email"
                  required
                  placeholder="crew@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface border border-border rounded-[var(--radius-md)] px-4 py-3 text-[15px] text-text placeholder:text-text-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent transition-colors"
                />
              </div>

              {status === 'error' && (
                <p role="alert" className="text-danger text-[13px]">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-accent text-accent-fg rounded-[var(--radius-pill)] py-3 text-[15px] font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === 'loading'
                  ? <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  : <><Send size={15} aria-hidden="true" /> Request access</>}
              </button>
            </form>

            <p className="mt-auto pt-8 text-[12px] text-text-subtle text-center">
              No spam. Unsubscribe any time.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
};
