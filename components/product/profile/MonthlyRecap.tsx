'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { formatBlockHours } from '@/lib/utils/format';

interface MonthlyRecapProps {
  recap: {
    month: string;
    year: string;
    sectors: number;
    blockMinutes: number;
    newCity: string | null;
  };
  onGenerate?: () => void;
}

export function MonthlyRecap({ recap, onGenerate }: MonthlyRecapProps) {
  return (
    <div className="bg-bg border border-border rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] p-8">
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-[12px] font-[500] text-text-muted uppercase tracking-[0.05em]">
          Monthly mission recap
        </p>
        <button
          onClick={onGenerate}
          className="text-[13px] text-text flex items-center gap-1.5 hover:text-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Generate card
          <ArrowRight size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Month title */}
      <p className="text-[24px] font-[600] text-text mb-5">
        {recap.month} {recap.year}
      </p>

      {/* Divider */}
      <div className="h-px bg-border mb-5" />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-[12px] text-text-muted mb-1">Sectors</p>
          <p className="text-[20px] font-[500] font-mono text-text">{recap.sectors}</p>
          <p className="text-[11px] text-text-subtle font-mono mt-0.5">flown</p>
        </div>

        <div>
          <p className="text-[12px] text-text-muted mb-1">Block time</p>
          <p className="text-[20px] font-[500] font-mono text-text">
            {formatBlockHours(recap.blockMinutes)}h
          </p>
          <p className="text-[11px] text-text-subtle font-mono mt-0.5">total</p>
        </div>

        {recap.newCity ? (
          <div>
            <p className="text-[12px] text-text-muted mb-1">City unlocked</p>
            <div className="flex items-center gap-2">
              <p className="text-[20px] font-[500] font-mono text-text">{recap.newCity}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-[600] bg-accent-soft text-accent">
                new
              </span>
            </div>
            <p className="text-[11px] text-text-subtle font-mono mt-0.5">stamp earned</p>
          </div>
        ) : (
          <div>
            <p className="text-[12px] text-text-muted mb-1">City unlocked</p>
            <p className="text-[20px] font-[500] font-mono text-text-subtle">—</p>
          </div>
        )}
      </div>
    </div>
  );
}
