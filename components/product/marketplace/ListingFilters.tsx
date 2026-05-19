'use client';

import React from 'react';
import { BadgeCheck } from 'lucide-react';
import type { ListingCategory } from '@/lib/types/marketplace';
import { CATEGORY_LABELS } from '@/lib/types/marketplace';

export type SortOption = 'newest' | 'price-asc' | 'price-desc';

interface ListingFiltersProps {
  category: ListingCategory | '';
  sort: SortOption;
  verifiedOnly: boolean;
  onCategory: (v: ListingCategory | '') => void;
  onSort: (v: SortOption) => void;
  onVerifiedOnly: (v: boolean) => void;
}

const CATEGORIES: Array<{ value: ListingCategory | ''; label: string }> = [
  { value: '', label: 'All' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value: value as ListingCategory,
    label,
  })),
];

const SORTS: Array<{ value: SortOption; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price ↑' },
  { value: 'price-desc', label: 'Price ↓' },
];

export function ListingFilters({
  category,
  sort,
  verifiedOnly,
  onCategory,
  onSort,
  onVerifiedOnly,
}: ListingFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => onCategory(c.value as ListingCategory | '')}
            className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-[12px] font-bold border transition-colors ${
              category === c.value
                ? 'bg-accent text-accent-fg border-accent'
                : 'bg-bg text-text-muted border-border hover:border-accent/40 hover:text-text'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Sort + verified toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-[var(--radius-md)] border border-border overflow-hidden">
          {SORTS.map((s) => (
            <button
              key={s.value}
              onClick={() => onSort(s.value)}
              className={`px-3 py-1.5 text-[12px] font-bold transition-colors ${
                sort === s.value
                  ? 'bg-accent text-accent-fg'
                  : 'bg-bg text-text-muted hover:text-text'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => onVerifiedOnly(!verifiedOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-pill)] text-[12px] font-bold border transition-colors ${
            verifiedOnly
              ? 'bg-accent-soft text-accent border-accent/30'
              : 'bg-bg text-text-muted border-border hover:border-accent/40 hover:text-text'
          }`}
        >
          <BadgeCheck size={13} />
          Verified only
        </button>
      </div>
    </div>
  );
}
