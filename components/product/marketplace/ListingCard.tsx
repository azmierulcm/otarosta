import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BadgeCheck } from 'lucide-react';
import type { Listing } from '@/lib/types/marketplace';
import { CONDITION_LABELS, CATEGORY_LABELS } from '@/lib/types/marketplace';

interface ListingCardProps {
  listing: Listing;
}

const CONDITION_COLORS: Record<string, string> = {
  'new': 'bg-success/10 text-success border-success/20',
  'like-new': 'bg-accent-soft text-accent border-accent/20',
  'good': 'bg-surface-2 text-text-muted border-border',
  'fair': 'bg-surface-2 text-text-muted border-border',
  'for-parts': 'bg-[var(--warning-soft)] text-warning border-warning/20',
};

export function ListingCard({ listing }: ListingCardProps) {
  const conditionColor = CONDITION_COLORS[listing.condition] ?? 'bg-surface-2 text-text-muted border-border';
  const hasImage = listing.images.length > 0;

  return (
    <Link href={`/marketplace/${listing.id}`} className="group block">
      <div className="rounded-[var(--radius-lg)] border border-border bg-bg overflow-hidden hover:border-accent/30 hover:shadow-[var(--shadow-sm)] transition-all">
        {/* 4:3 image */}
        <div className="aspect-[4/3] relative overflow-hidden bg-surface-2">
          {hasImage ? (
            <Image
              src={listing.images[0]}
              alt={listing.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-subtle text-[12px] font-mono">
              {CATEGORY_LABELS[listing.category]}
            </div>
          )}
          {/* Condition pill overlay */}
          <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${conditionColor}`}>
            {CONDITION_LABELS[listing.condition]}
          </span>
        </div>

        {/* Info */}
        <div className="p-3 space-y-1.5">
          <p className="text-[14px] font-bold text-text line-clamp-2 leading-snug">{listing.title}</p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[16px] font-bold text-text">
              RM {listing.price.toLocaleString()}
            </span>
            {listing.sellerVerified && (
              <BadgeCheck size={15} className="text-accent shrink-0" />
            )}
          </div>
          <p className="text-[11px] text-text-subtle">{listing.sellerBase} · {listing.sellerName}</p>
        </div>
      </div>
    </Link>
  );
}
