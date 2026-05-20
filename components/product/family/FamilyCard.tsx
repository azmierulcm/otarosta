'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Download, Share2, Plane, Car, Home, Clock, AlertCircle, Check } from 'lucide-react';
import { useRoster } from '@/lib/contexts/RosterContext';
import type { DutyEvent } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// FamilyCard — shareable crew schedule view for family members
//
// Surfaces three views from the active roster:
//   • Send-offs  (crew departs from base)
//   • Pick-ups   (crew returns to base)
//   • Free days  (OFF duty — plan together)
//   • Standby    (on-call — stay flexible)
//
// The "Download Card" button captures the printable card as a high-res PNG
// using html-to-image (same library as RecapModal).
// ─────────────────────────────────────────────────────────────────────────────

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_NAMES: Record<string, string> = {
  JAN:'January', FEB:'February', MAR:'March',    APR:'April',
  MAY:'May',     JUN:'June',     JUL:'July',     AUG:'August',
  SEP:'September',OCT:'October', NOV:'November', DEC:'December',
};

const DAY_LABELS: Record<string, string> = {
  MON:'Mon', TUE:'Tue', WED:'Wed', THU:'Thu', FRI:'Fri', SAT:'Sat', SUN:'Sun',
};

/** Parse ISO date → day of month */
function dom(iso: string): number {
  return parseInt(iso.split('-')[2], 10);
}

/** Format date to "6 May, Wed" */
function formatDate(iso: string, day?: string): string {
  const [, , d] = iso.split('-');
  const monthAbbr = iso.split('-')[1];
  const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dayLabel = day ? DAY_LABELS[day] ?? day : '';
  return `${parseInt(d, 10)} ${months[parseInt(monthAbbr, 10)]}${dayLabel ? ` · ${dayLabel}` : ''}`;
}

/** Add minutes to HH:MM time string */
function addMinutes(time: string, mins: number): string {
  if (!time || !time.includes(':')) return time;
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

/** Subtract minutes from HH:MM time string */
function subMinutes(time: string, mins: number): string {
  return addMinutes(time, -mins);
}

// ── Data derivation ───────────────────────────────────────────────────────────

interface FamilyEvent {
  kind: 'sendoff' | 'pickup' | 'standby' | 'off';
  date: string;
  day?: string;
  flightNo?: string;
  route?: string;
  time?: string;         // dep time for sendoff, arr time for pickup
  dutyStart?: string;    // standby start
  dutyEnd?: string;      // standby end
  description?: string;
}

function deriveEvents(events: DutyEvent[], base = 'KUL'): FamilyEvent[] {
  const result: FamilyEvent[] = [];

  for (const e of events) {
    if (e.type === 'FLIGHT') {
      // Send-off: flight departs from base
      if (e.depPort === base && e.std) {
        result.push({
          kind:     'sendoff',
          date:     e.date,
          day:      e.day,
          flightNo: e.flightNumber ?? e.item,
          route:    e.depPort && e.arrPort ? `${e.depPort} → ${e.arrPort}` : undefined,
          time:     e.std,
        });
      }
      // Pick-up: flight arrives at base
      if (e.arrPort === base && e.sta) {
        result.push({
          kind:     'pickup',
          date:     e.date,
          day:      e.day,
          flightNo: e.flightNumber ?? e.item,
          route:    e.depPort && e.arrPort ? `${e.depPort} → ${e.arrPort}` : undefined,
          time:     e.sta,
        });
      }
    } else if (e.type === 'STANDBY') {
      result.push({
        kind:        'standby',
        date:        e.date,
        day:         e.day,
        description: e.item ?? 'Standby',
        dutyStart:   e.signOn,
        dutyEnd:     e.signOff,
      });
    } else if (e.type === 'OFF') {
      result.push({
        kind:        'off',
        date:        e.date,
        day:         e.day,
        description: e.description ?? e.item,
      });
    }
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SendOffCard({ ev }: { ev: FamilyEvent }) {
  const suggestedArrival = ev.time ? subMinutes(ev.time, 150) : undefined; // 2.5h before dep
  return (
    <div className="rounded-2xl overflow-hidden border border-border">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 border-b border-sky-100">
        <Plane size={13} className="text-sky-600 shrink-0" style={{ transform: 'rotate(45deg)' }} />
        <span className="text-[11px] font-black uppercase tracking-widest text-sky-700 font-mono">Send-off</span>
        <span className="ml-auto text-[11px] font-bold text-sky-600">{formatDate(ev.date, ev.day)}</span>
      </div>
      <div className="px-4 py-3 bg-white space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[17px] font-black text-text tracking-tight">{ev.flightNo}</span>
          <span className="text-[13px] font-black text-text-muted font-mono">{ev.route}</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-text-muted font-bold">
          <Clock size={11} className="shrink-0" />
          <span>Departs <strong className="text-text">{ev.time}</strong></span>
        </div>
        {suggestedArrival && (
          <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-sky-50">
            <Car size={12} className="text-sky-600 shrink-0" />
            <span className="text-[11px] font-bold text-sky-700">
              Drop at KLIA by <strong>{suggestedArrival}</strong> · Allow 30 min traffic buffer
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function PickUpCard({ ev }: { ev: FamilyEvent }) {
  const suggestedPickup = ev.time ? addMinutes(ev.time, 40) : undefined; // 40 min after landing
  return (
    <div className="rounded-2xl overflow-hidden border border-border">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border-b border-green-100">
        <Plane size={13} className="text-green-600 shrink-0" style={{ transform: 'rotate(-45deg) scaleX(-1)' }} />
        <span className="text-[11px] font-black uppercase tracking-widest text-green-700 font-mono">Pick-up</span>
        <span className="ml-auto text-[11px] font-bold text-green-600">{formatDate(ev.date, ev.day)}</span>
      </div>
      <div className="px-4 py-3 bg-white space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[17px] font-black text-text tracking-tight">{ev.flightNo}</span>
          <span className="text-[13px] font-black text-text-muted font-mono">{ev.route}</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-text-muted font-bold">
          <Clock size={11} className="shrink-0" />
          <span>Lands <strong className="text-text">{ev.time}</strong></span>
        </div>
        {suggestedPickup && (
          <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-green-50">
            <Car size={12} className="text-green-600 shrink-0" />
            <span className="text-[11px] font-bold text-green-700">
              Be at KLIA arrival hall by <strong>{suggestedPickup}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function StandbyCard({ ev }: { ev: FamilyEvent }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-amber-100">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-100">
        <AlertCircle size={13} className="text-amber-600 shrink-0" />
        <span className="text-[11px] font-black uppercase tracking-widest text-amber-700 font-mono">On Standby</span>
        <span className="ml-auto text-[11px] font-bold text-amber-600">{formatDate(ev.date, ev.day)}</span>
      </div>
      <div className="px-4 py-3 bg-white">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[13px] font-black text-text">{ev.description}</span>
          {ev.dutyStart && (
            <span className="text-[12px] font-bold text-text-muted font-mono">
              {ev.dutyStart}
              {ev.dutyEnd ? ` – ${ev.dutyEnd}` : ''}
            </span>
          )}
        </div>
        <p className="text-[11px] text-text-subtle font-medium">
          May get called to fly anytime during this window. Keep plans flexible.
        </p>
      </div>
    </div>
  );
}

// ── Printable card (captured by html-to-image) ────────────────────────────────

interface PrintCardProps {
  crewName: string;
  rank?: string;
  month: string;
  year: string;
  sendoffs: FamilyEvent[];
  pickups: FamilyEvent[];
  freeDays: FamilyEvent[];
  standbyDays: FamilyEvent[];
}

const PrintCard = React.forwardRef<HTMLDivElement, PrintCardProps>(
  ({ crewName, rank, month, year, sendoffs, pickups, freeDays, standbyDays }, ref) => {
    const monthLabel = MONTH_NAMES[month] ?? month;
    return (
      <div
        ref={ref}
        style={{
          width: 390,
          background: '#FFFCF8',
          fontFamily: 'Inter, -apple-system, sans-serif',
          borderRadius: 24,
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#FF385C,#E61E4D)', padding: '24px 24px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 6 }}>
                Crew Family Hub
              </div>
              <div style={{ color: '#fff', fontSize: 22, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                {crewName.split(' ').slice(0, 2).join(' ')}
              </div>
              {rank && (
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700, marginTop: 3 }}>
                  {rank} · Malaysia Airlines
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Schedule
              </div>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 900, letterSpacing: '-0.5px' }}>
                {monthLabel}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700 }}>{year}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Send-offs */}
          {sendoffs.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 12 }}>🛫</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#3B82F6' }}>
                  Send-offs ({sendoffs.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sendoffs.map((ev, i) => (
                  <div key={i} style={{ border: '1px solid #BFDBFE', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ background: '#EFF6FF', padding: '8px 14px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#1D4ED8' }}>{formatDate(ev.date, ev.day)}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6', fontFamily: 'monospace' }}>{ev.route}</span>
                    </div>
                    <div style={{ background: '#fff', padding: '10px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 900, color: '#111' }}>{ev.flightNo}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#111', fontFamily: 'monospace' }}>Dep {ev.time}</span>
                      </div>
                      {ev.time && (
                        <div style={{ background: '#EFF6FF', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 700, color: '#1D4ED8' }}>
                          🚗 Drop at KLIA by {subMinutes(ev.time, 150)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pick-ups */}
          {pickups.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: 8, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 12 }}>🛬</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#059669' }}>
                  Pick-ups ({pickups.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pickups.map((ev, i) => (
                  <div key={i} style={{ border: '1px solid #A7F3D0', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ background: '#ECFDF5', padding: '8px 14px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#065F46' }}>{formatDate(ev.date, ev.day)}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>{ev.route}</span>
                    </div>
                    <div style={{ background: '#fff', padding: '10px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 900, color: '#111' }}>{ev.flightNo}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#111', fontFamily: 'monospace' }}>Lands {ev.time}</span>
                      </div>
                      {ev.time && (
                        <div style={{ background: '#ECFDF5', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 700, color: '#065F46' }}>
                          🚗 Be at KLIA arrival hall by {addMinutes(ev.time, 40)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Standby */}
          {standbyDays.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: 8, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 12 }}>⏳</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#D97706' }}>
                  Standby ({standbyDays.length} days)
                </span>
              </div>
              <div style={{ background: '#FFFBEB', borderRadius: 12, padding: '10px 14px', border: '1px solid #FDE68A' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#92400E', marginBottom: 8 }}>
                  ⚠️ May get called to fly anytime. Keep big plans flexible on these days.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {standbyDays.map((ev, i) => (
                    <span key={i} style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: '3px 8px', fontSize: 11, fontWeight: 800, color: '#92400E', fontFamily: 'monospace' }}>
                      {formatDate(ev.date)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Free days */}
          {freeDays.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: 8, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 12 }}>🏡</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#16A34A' }}>
                  Free Days ({freeDays.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {freeDays.map((ev, i) => (
                  <div key={i} style={{
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: 10,
                    padding: '6px 10px',
                    textAlign: 'center',
                    minWidth: 48,
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#15803D', lineHeight: 1 }}>{dom(ev.date)}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#16A34A', letterSpacing: '0.1em' }}>{ev.day?.slice(0, 3) ?? ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F7F5F0' }}>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#B0ABA5', fontFamily: 'monospace' }}>
            cemrosta.io
          </span>
          <span style={{ fontSize: 9, color: '#B0ABA5', fontWeight: 600 }}>
            Generated from official iFlight roster
          </span>
        </div>
      </div>
    );
  }
);
PrintCard.displayName = 'PrintCard';

// ── Main component ────────────────────────────────────────────────────────────

type TabId = 'sendoffs' | 'pickups' | 'standby' | 'off';

export function FamilyCard() {
  const { activeRoster } = useRoster();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('sendoffs');

  if (!activeRoster) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
          <Plane size={20} className="text-text-subtle" />
        </div>
        <p className="text-text-muted font-bold text-sm">Upload a roster to generate your Family Card</p>
      </div>
    );
  }

  const events = activeRoster.events ?? [];
  const allEvents = deriveEvents(events);
  const sendoffs    = allEvents.filter(e => e.kind === 'sendoff');
  const pickups     = allEvents.filter(e => e.kind === 'pickup');
  const standbyDays = allEvents.filter(e => e.kind === 'standby');
  const freeDays    = allEvents.filter(e => e.kind === 'off');

  const crewName   = activeRoster.crewName ?? 'Crew Member';
  const month      = activeRoster.month ?? '';
  const year       = activeRoster.year ?? '';
  const monthLabel = MONTH_NAMES[month] ?? month;

  const tabs: { id: TabId; label: string; icon: string; count: number }[] = [
    { id: 'sendoffs', label: 'Send-offs',  icon: '🛫', count: sendoffs.length },
    { id: 'pickups',  label: 'Pick-ups',   icon: '🛬', count: pickups.length },
    { id: 'standby',  label: 'Standby',    icon: '⏳', count: standbyDays.length },
    { id: 'off',      label: 'Free Days',  icon: '🏡', count: freeDays.length },
  ];

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `cemrosta-family-${month.toLowerCase()}-${year}.png`;
      a.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading, month, year]);

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      if (navigator.share) {
        const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `cemrosta-family-${month.toLowerCase()}.png`, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: `${crewName} · ${monthLabel} Schedule` });
          return;
        }
      }
      // Fallback: copy image URL to clipboard
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Share failed:', err);
    }
  }, [crewName, month, monthLabel]);

  const tabContent = {
    sendoffs: sendoffs.length > 0
      ? <div className="space-y-3">{sendoffs.map((ev, i) => <SendOffCard key={i} ev={ev} />)}</div>
      : <Empty label="No send-offs this month" />,
    pickups: pickups.length > 0
      ? <div className="space-y-3">{pickups.map((ev, i) => <PickUpCard key={i} ev={ev} />)}</div>
      : <Empty label="No pick-ups this month" />,
    standby: standbyDays.length > 0
      ? (
        <div className="space-y-2">
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-100 mb-3">
            <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[12px] font-bold text-amber-800 leading-snug">
              May get called to fly anytime during standby windows. Avoid committing to big plans on these days.
            </p>
          </div>
          {standbyDays.map((ev, i) => <StandbyCard key={i} ev={ev} />)}
        </div>
      )
      : <Empty label="No standby days this month" />,
    off: freeDays.length > 0
      ? (
        <div>
          <p className="text-[12px] font-bold text-text-muted mb-3">
            {freeDays.length} free days — plan something together ✨
          </p>
          <div className="grid grid-cols-4 gap-2">
            {freeDays.map((ev, i) => (
              <div key={i} className="rounded-2xl bg-green-50 border border-green-100 p-3 text-center">
                <div className="text-[20px] font-black text-green-800 leading-none">{dom(ev.date)}</div>
                <div className="text-[10px] font-bold text-green-600 mt-0.5">
                  {ev.day?.slice(0, 3) ?? ''}
                </div>
                {ev.description && ev.description !== 'Day Off' && ev.description !== 'Earned Day Off' && (
                  <div className="text-[9px] font-black text-green-500 mt-0.5 uppercase tracking-wider">
                    {ev.description.split(' ')[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )
      : <Empty label="No free days found" />,
  };

  return (
    <div className="space-y-6">

      {/* Hidden printable card — captured by html-to-image */}
      <div className="absolute -left-[9999px] top-0 pointer-events-none" aria-hidden>
        <PrintCard
          ref={cardRef}
          crewName={crewName}
          month={month}
          year={year}
          sendoffs={sendoffs}
          pickups={pickups}
          freeDays={freeDays}
          standbyDays={standbyDays}
        />
      </div>

      {/* Card header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle font-mono mb-1">
            Family Hub
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-text leading-none">
            {monthLabel} {year}
          </h2>
          <p className="text-[13px] text-text-muted font-bold mt-1">{crewName}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-border text-[12px] font-black text-text-muted hover:text-text hover:border-text-subtle transition-all"
          >
            {copied ? <Check size={13} className="text-green-500" /> : <Share2 size={13} />}
            {copied ? 'Copied!' : 'Share'}
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent text-accent-fg text-[12px] font-black shadow-lg shadow-accent/20 hover:bg-accent-hover transition-all disabled:opacity-60"
          >
            <Download size={13} />
            {isDownloading ? 'Saving…' : 'Download Card'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-black border transition-all ${
              activeTab === tab.id
                ? 'bg-accent text-accent-fg border-accent shadow-md shadow-accent/20'
                : 'bg-white border-border text-text-muted hover:border-text-subtle'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
              activeTab === tab.id ? 'bg-white/20' : 'bg-surface-2'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tabContent[activeTab]}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-10 h-10 rounded-2xl bg-surface-2 flex items-center justify-center mb-3">
        <Check size={16} className="text-text-subtle" />
      </div>
      <p className="text-[13px] text-text-muted font-bold">{label}</p>
    </div>
  );
}
