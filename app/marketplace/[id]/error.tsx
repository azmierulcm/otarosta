'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronLeft, RefreshCw } from 'lucide-react';

export default function ListingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1 text-[13px] text-text-muted hover:text-text transition-colors mb-8"
      >
        <ChevronLeft size={16} />
        Marketplace
      </Link>
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-danger-soft border border-danger/20">
            <AlertTriangle size={24} className="text-danger" />
          </div>
          <div className="space-y-2">
            <h2 className="text-[18px] font-bold text-text">Listing unavailable</h2>
            <p className="text-[13px] text-text-muted leading-relaxed">
              We couldn&apos;t load this listing. It may have been removed or there was a temporary error.
            </p>
            {error.digest && (
              <p className="text-[11px] font-mono text-text-subtle">ref: {error.digest}</p>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <Link
              href="/marketplace"
              className="px-4 py-2 rounded-[var(--radius-pill)] border border-border text-[13px] font-semibold text-text-muted hover:bg-surface transition-colors"
            >
              Browse listings
            </Link>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-pill)] bg-accent text-accent-fg text-[13px] font-semibold hover:bg-accent-hover transition-colors"
            >
              <RefreshCw size={13} />
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
