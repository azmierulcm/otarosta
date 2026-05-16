'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function MarketplaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-danger-soft border border-danger/20">
          <AlertTriangle size={24} className="text-danger" />
        </div>
        <div className="space-y-2">
          <h2 className="text-[18px] font-bold text-text">Marketplace unavailable</h2>
          <p className="text-[13px] text-text-muted leading-relaxed">
            Something went wrong loading the marketplace. Your listings are safe.
          </p>
          {error.digest && (
            <p className="text-[11px] font-mono text-text-subtle">ref: {error.digest}</p>
          )}
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-pill)] bg-accent text-accent-fg text-[13px] font-semibold hover:bg-accent-hover transition-colors"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      </div>
    </div>
  );
}
