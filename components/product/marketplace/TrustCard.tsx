import React from 'react';
import { ShieldAlert } from 'lucide-react';

export function TrustCard() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-warning/30 bg-[var(--warning-soft)] p-4 flex gap-3">
      <ShieldAlert size={18} className="text-warning mt-0.5 shrink-0" />
      <div className="space-y-1">
        <p className="text-[13px] font-semibold text-warning">Stay safe when trading</p>
        <p className="text-[12px] text-text-muted leading-relaxed">
          Meet in person at a crew base or familiar location. Never send money before inspecting the item. Report suspicious listings.
        </p>
      </div>
    </div>
  );
}
