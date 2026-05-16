'use client';

import React from 'react';
import { ProfileFilled } from './ProfileFilled';
import { SAMPLE_PROFILE } from '@/lib/fixtures/sample-profile';
import { useAuth } from '@/lib/contexts/AuthContext';

export function ProfileEmptyState() {
  const { openAuthModal } = useAuth();

  return (
    <div className="relative">
      {/* Full-opacity sample passport — this is exactly what you earn */}
      <ProfileFilled {...SAMPLE_PROFILE} />

      {/* Sticky bottom bar — convert without blocking the preview */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-5 py-4"
        style={{
          background: 'var(--bg)',
          borderTop: '0.5px solid var(--border)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
        }}
      >
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>This is your preview.</span>
          {' '}Upload your roster to see your real passport.
        </p>
        <button
          onClick={() => openAuthModal('signup')}
          className="shrink-0 font-[600] rounded-[var(--radius-pill)] px-4 py-2 transition-colors"
          style={{
            fontSize: '13px',
            background: 'var(--accent)',
            color: 'var(--accent-fg)',
          }}
        >
          Get started
        </button>
      </div>

      {/* Spacer so the sticky bar doesn't cover the last patch cards */}
      <div style={{ height: '72px' }} />
    </div>
  );
}
