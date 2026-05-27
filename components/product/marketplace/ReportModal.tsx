'use client';

import React, { useState } from 'react';
import { Flag, Loader2 } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { useAuth } from '@/lib/contexts/AuthContext';
import { reportListing } from '@/lib/actions/listings';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
}

const TITLE_ID = 'report-modal-title';

export function ReportModal({ isOpen, onClose, listingId }: ReportModalProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleReport() {
    if (!user) return;
    setStatus('loading');
    try {
      const token = await user.getIdToken();
      await reportListing(listingId, token);
      setStatus('done');
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Something went wrong');
      setStatus('error');
    }
  }

  function handleClose() {
    setStatus('idle');
    setErrorMsg('');
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      titleId={TITLE_ID}
      className="rounded-[var(--radius-xl)] max-w-sm mx-4"
    >
      <div className="p-6 pt-10">
        <div className="flex items-center gap-2 mb-4">
          <Flag size={18} className="text-danger" aria-hidden="true" />
          <h3 id={TITLE_ID} className="text-[16px] font-bold text-text">Report Listing</h3>
        </div>

        {status === 'done' ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-[14px] font-semibold text-text">Report submitted</p>
            <p className="text-[12px] text-text-muted">
              Thank you. Our team will review this listing.
            </p>
            <button
              onClick={handleClose}
              className="mt-4 px-5 py-2 rounded-[var(--radius-pill)] bg-surface-2 border border-border text-[13px] font-semibold text-text hover:bg-surface transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <p className="text-[13px] text-text-muted mb-5 leading-relaxed">
              Report this listing if it violates community guidelines — spam, counterfeit goods, or inappropriate content.
            </p>
            {status === 'error' && (
              <p role="alert" className="text-[12px] text-danger mb-3">{errorMsg}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-[var(--radius-pill)] border border-border text-[13px] font-semibold text-text-muted hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={status === 'loading'}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-pill)] bg-danger text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {status === 'loading'
                  ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  : <Flag size={14} aria-hidden="true" />}
                Report
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
