import React from 'react';
import { BadgeCheck } from 'lucide-react';

interface VerifiedPillProps {
  size?: 'sm' | 'md';
}

export function VerifiedPill({ size = 'sm' }: VerifiedPillProps) {
  const iconSize = size === 'sm' ? 11 : 13;
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-[11px]';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 ${padding} ${textSize} font-semibold rounded-full bg-accent-soft text-accent border border-accent/20`}
    >
      <BadgeCheck size={iconSize} />
      Verified Crew
    </span>
  );
}
