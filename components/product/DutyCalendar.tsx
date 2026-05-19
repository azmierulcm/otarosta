'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useRoster } from '@/lib/contexts/RosterContext';
import { DutyEvent } from '@/lib/types';

/* ── Duty type config — colours match RosterTile STATUS_META ─────────────── */
const DUTY_CONFIG = {
  FLIGHT: {
    label: 'Flight',
    bg: 'bg-sky-50',
    border: 'border-sky-200/60',
    text: 'text-sky-700',
    dot: 'bg-sky-400',
    pill: 'bg-sky-50 text-sky-700',
    pillDot: 'bg-sky-400',
  },
  LAYOVER: {
    label: 'Layover',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200/60',
    text: 'text-yellow-800',
    dot: 'bg-yellow-400',
    pill: 'bg-yellow-50 text-yellow-800',
    pillDot: 'bg-yellow-400',
  },
  STANDBY: {
    label: 'Standby',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200/60',
    text: 'text-yellow-800',
    dot: 'bg-yellow-400',
    pill: 'bg-yellow-50 text-yellow-800',
    pillDot: 'bg-yellow-400',
  },
  OFF: {
    label: 'Off',
    bg: 'bg-green-50',
    border: 'border-green-200/40',
    text: 'text-green-700',
    dot: 'bg-green-400',
    pill: 'bg-green-50 text-green-700',
    pillDot: 'bg-green-400',
  },
  TRAINING: {
    label: 'Training',
    bg: 'bg-teal-50',
    border: 'border-teal-200/60',
    text: 'text-teal-700',
    dot: 'bg-teal-400',
    pill: 'bg-teal-50 text-teal-700',
    pillDot: 'bg-teal-400',
  },
  GROUND: {
    label: 'Ground',
    bg: 'bg-teal-50',
    border: 'border-teal-200/60',
    text: 'text-teal-700',
    dot: 'bg-teal-400',
    pill: 'bg-teal-50 text-teal-700',
    pillDot: 'bg-teal-400',
  },
  OTHER: {
    label: 'Duty',
    bg: 'bg-surface-2',
    border: 'border-border',
    text: 'text-text-muted',
    dot: 'bg-text-muted',
    pill: 'bg-surface-2 text-text-muted',
    pillDot: 'bg-text-muted',
  },
} as const;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Pick the "primary" event to drive cell colour — first FLIGHT wins, else first non-OFF */
function primaryEvent(events: DutyEvent[]): DutyEvent | undefined {
  return (
    events.find(e => e.type === 'FLIGHT') ??
    events.find(e => e.type !== 'OFF') ??
    events[0]
  );
}

/* ── Compact tooltip — max 2 sectors + "..." cue ─────────────────────────── */
function EventTooltip({ events }: { events: DutyEvent[] }) {
  const flights   = events.filter(e => e.type === 'FLIGHT');
  const nonFlight = events.find(e => e.type !== 'FLIGHT' && e.type !== 'OFF');
  const primary   = primaryEvent(events)!;
  const cfg       = DUTY_CONFIG[primary.type] ?? DUTY_CONFIG.OTHER;

  const visibleFlights = flights.slice(0, 2);
  const hiddenCount    = flights.length - visibleFlights.length;

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
      <div
        className="bg-[#1C1C1E] text-white rounded-xl px-3 py-2 text-left shadow-xl"
        style={{ minWidth: 160, maxWidth: 220 }}
      >
        {/* Header badge */}
        <div className="flex items-center gap-1.5 mb-2">
          <span
            className="text-[9px] font-[800] uppercase tracking-widest px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            {cfg.label}
          </span>
          {flights.length > 1 && (
            <span className="text-[9px] font-[700] text-white/50 font-mono">
              {flights.length} sectors
            </span>
          )}
        </div>

        {/* Flight sectors — max 2 visible */}
        {visibleFlights.length > 0 ? (
          <div className="space-y-2">
            {visibleFlights.map((e, i) => (
              <div key={e.id}>
                {i > 0 && <div className="border-t border-white/10 mb-2" />}
                {e.depPort && e.arrPort && (
                  <div className="flex items-center gap-1 text-[13px] font-[700] font-mono tracking-wider">
                    <span>{e.depPort}</span>
                    <span className="text-white/40 mx-0.5">→</span>
                    <span>{e.arrPort}</span>
                    {e.flightNumber && (
                      <span className="ml-auto text-[10px] font-mono font-[500] text-white/50">{e.flightNumber}</span>
                    )}
                  </div>
                )}
                {e.std && (
                  <div className="text-[10px] text-white/50 mt-0.5 font-mono">
                    {e.std}{e.sta ? ` – ${e.sta}` : ''}
                  </div>
                )}
              </div>
            ))}

            {/* "..." overflow cue */}
            {hiddenCount > 0 && (
              <>
                <div className="border-t border-white/10" />
                <div className="flex items-center gap-1 text-[10px] text-white/40 font-mono pt-0.5">
                  <span>+{hiddenCount} more</span>
                  <span className="ml-auto text-white/25">tap to expand</span>
                </div>
              </>
            )}
          </div>
        ) : nonFlight ? (
          <>
            {nonFlight.description && (
              <div className="text-[11px] text-white/70 truncate">{nonFlight.description}</div>
            )}
            {(nonFlight.signOn || nonFlight.std) && (
              <div className="text-[10px] text-white/50 mt-0.5 font-mono">
                {nonFlight.signOn ?? nonFlight.std}
                {(nonFlight.signOff ?? nonFlight.sta) ? ` – ${nonFlight.signOff ?? nonFlight.sta}` : ''}
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Arrow */}
      <div className="flex justify-center -mt-px">
        <div className="w-2 h-2 bg-[#1C1C1E] rotate-45 translate-y-[-4px]" />
      </div>
    </div>
  );
}

/* ── Day detail modal — shows ALL sectors ─────────────────────────────────── */
function DayModal({
  dateStr,
  dayNum,
  month,
  year,
  events,
  onClose,
}: {
  dateStr: string;
  dayNum: number;
  month: number;
  year: number;
  events: DutyEvent[];
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const flights    = events.filter(e => e.type === 'FLIGHT');
  const others     = events.filter(e => e.type !== 'FLIGHT' && e.type !== 'OFF');
  const primary    = primaryEvent(events)!;
  const cfg        = DUTY_CONFIG[primary.type] ?? DUTY_CONFIG.OTHER;

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const dateLabel = `${MONTHS[month]} ${dayNum}, ${year}`;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-[#1C1C1E] text-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden z-10">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10">
          <div>
            <p className="text-[10px] font-[800] uppercase tracking-widest text-white/40 font-mono mb-0.5">
              {dateLabel}
            </p>
            <div className="flex items-center gap-2">
              <span
                className="text-[9px] font-[800] uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.12)' }}
              >
                {cfg.label}
              </span>
              {flights.length > 1 && (
                <span className="text-[11px] font-[700] text-white/50 font-mono">
                  {flights.length} sectors
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Flights */}
        {flights.length > 0 && (
          <div className="px-5 py-4 space-y-3">
            {flights.map((e, i) => (
              <div key={e.id} className="relative pl-4">
                {/* Timeline dot */}
                <div className="absolute left-0 top-[5px] w-2 h-2 rounded-full bg-sky-400 ring-2 ring-sky-400/20" />
                {/* Connector line */}
                {i < flights.length - 1 && (
                  <div className="absolute left-[3px] top-[13px] w-px h-full bg-white/10" />
                )}

                {/* Route row */}
                {e.depPort && e.arrPort && (
                  <div className="flex items-center gap-1.5 text-[14px] font-[700] font-mono tracking-wider">
                    <span>{e.depPort}</span>
                    <span className="text-white/30">→</span>
                    <span>{e.arrPort}</span>
                    {e.flightNumber && (
                      <span className="ml-auto text-[10px] font-mono font-[500] text-white/40">{e.flightNumber}</span>
                    )}
                  </div>
                )}

                {/* Times */}
                {e.std && (
                  <div className="text-[11px] text-white/45 mt-0.5 font-mono">
                    {e.std}{e.sta ? ` – ${e.sta}` : ''}
                  </div>
                )}

                {/* Hotel (last leg only) */}
                {e.hotel && i === flights.length - 1 && (
                  <div className="text-[10px] text-white/30 mt-0.5 truncate">🏨 {e.hotel}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Other duties */}
        {others.length > 0 && (
          <div className="px-5 pb-4 space-y-2">
            {others.map(e => {
              const c = DUTY_CONFIG[e.type] ?? DUTY_CONFIG.OTHER;
              return (
                <div key={e.id} className="flex flex-col gap-0.5">
                  <span
                    className="self-start text-[9px] font-[800] uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.10)' }}
                  >
                    {c.label}
                  </span>
                  {e.description && (
                    <p className="text-[12px] text-white/65">{e.description}</p>
                  )}
                  {(e.signOn || e.std) && (
                    <p className="text-[11px] text-white/40 font-mono">
                      {e.signOn ?? e.std}{(e.signOff ?? e.sta) ? ` – ${e.signOff ?? e.sta}` : ''}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 flex justify-center">
          <p className="text-[9px] font-mono font-[700] uppercase tracking-widest text-white/20">
            {dateStr}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Day cell ─────────────────────────────────────────────────────────────── */
function DayCell({
  dayNum,
  dateStr,
  month,
  year,
  events,
  isToday,
}: {
  dayNum: number;
  dateStr: string;
  month: number;
  year: number;
  events: DutyEvent[];
  isToday: boolean;
}) {
  const [hovered,      setHovered]      = useState(false);
  const [modalOpen,    setModalOpen]    = useState(false);

  const primary  = primaryEvent(events);
  const cfg      = primary ? (DUTY_CONFIG[primary.type] ?? DUTY_CONFIG.OTHER) : null;
  const isOff    = primary?.type === 'OFF';
  const sectors  = events.filter(e => e.type === 'FLIGHT').length;

  const hasDetail = events.some(e =>
    e.depPort || e.arrPort || e.flightNumber || e.description || e.hotel || e.signOn
  );

  return (
    <>
      <div
        className="relative flex flex-col"
        onMouseEnter={() => hasDetail && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => hasDetail && events.length > 0 && setModalOpen(true)}
      >
        <div
          className={`
            relative flex flex-col items-center justify-center
            rounded-xl aspect-square transition-all duration-150 select-none
            ${hasDetail ? 'cursor-pointer' : 'cursor-default'}
            ${cfg && !isOff
              ? `${cfg.bg} border ${cfg.border}`
              : 'border border-transparent'
            }
            ${hovered && hasDetail ? 'scale-105' : ''}
          `}
        >
          <span
            className={`
              text-[13px] font-[600] leading-none font-mono tracking-tight
              ${cfg && !isOff
                ? cfg.text
                : isToday
                  ? 'text-accent font-[800]'
                  : 'text-text-muted'
              }
            `}
          >
            {dayNum}
          </span>

          {/* Dot(s) — show sector count badge when multi-leg */}
          {cfg && !isOff && (
            sectors > 1 ? (
              <div className={`absolute bottom-1 text-[8px] font-[800] font-mono leading-none px-1 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                {sectors}
              </div>
            ) : (
              <div className={`absolute bottom-1.5 w-1 h-1 rounded-full ${cfg.dot} opacity-70`} />
            )
          )}

          {/* Today ring */}
          {isToday && events.length === 0 && (
            <div className="absolute inset-0 rounded-xl ring-1 ring-accent/40" />
          )}
        </div>

        {/* Tooltip — only on hover, not when modal is open */}
        {hovered && hasDetail && events.length > 0 && !modalOpen && (
          <EventTooltip events={events} />
        )}
      </div>

      {/* Day detail modal */}
      {modalOpen && (
        <DayModal
          dateStr={dateStr}
          dayNum={dayNum}
          month={month}
          year={year}
          events={events}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

/* ── Main calendar ────────────────────────────────────────────────────────── */
export const DutyCalendar = () => {
  const { activeRoster: roster } = useRoster();
  if (!roster) return null;

  // Group ALL events by date
  const eventsByDate = roster.events.reduce((acc: Record<string, DutyEvent[]>, event: DutyEvent) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {});

  const [firstEvent] = roster.events;
  const dateObj = new Date(firstEvent?.date || `${roster.year}-${roster.month}-01`);
  const year  = dateObj.getFullYear();
  const month = dateObj.getMonth();

  const today    = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const daysInMonth     = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d       = String(i + 1).padStart(2, '0');
    const m       = String(month + 1).padStart(2, '0');
    const dateStr = `${year}-${m}-${d}`;
    return { date: dateStr, dayNum: i + 1, events: eventsByDate[dateStr] ?? [] };
  });

  // Stats — flights counted individually (each sector = 1)
  const flights  = roster.events.filter(e => e.type === 'FLIGHT').length;
  const standby  = roster.events.filter(e => e.type === 'STANDBY').length;
  const training = roster.events.filter(e => e.type === 'TRAINING' || e.type === 'GROUND').length;

  return (
    <div className="bg-white rounded-[2rem] border border-border overflow-hidden">

      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-[800] uppercase tracking-[0.35em] text-text-subtle font-mono mb-1">
              Duty Map
            </p>
            <h3 className="text-[22px] font-[700] text-text tracking-tight leading-none">
              {MONTHS[month]} {year}
            </h3>
          </div>
          {/* Stat pills */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {flights > 0 && (
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-[700] font-mono ${DUTY_CONFIG.FLIGHT.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${DUTY_CONFIG.FLIGHT.pillDot}`} />
                {flights} sector{flights !== 1 ? 's' : ''}
              </span>
            )}
            {standby > 0 && (
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-[700] font-mono ${DUTY_CONFIG.STANDBY.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${DUTY_CONFIG.STANDBY.pillDot}`} />
                {standby} standby
              </span>
            )}
            {training > 0 && (
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-[700] font-mono ${DUTY_CONFIG.TRAINING.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${DUTY_CONFIG.TRAINING.pillDot}`} />
                {training} training
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="px-6 py-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div
              key={d}
              className="text-center text-[10px] font-[700] text-text-subtle/60 uppercase tracking-[0.12em] py-2 font-mono"
            >
              {d.charAt(0)}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map(day => (
            <DayCell
              key={day.date}
              dayNum={day.dayNum}
              dateStr={day.date}
              month={month}
              year={year}
              events={day.events}
              isToday={day.date === todayStr}
            />
          ))}
        </div>
      </div>

      {/* Legend footer */}
      <div className="px-6 pb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-[10px] font-[600] text-text-subtle font-mono">
          <div className={`w-3 h-3 rounded-sm ${DUTY_CONFIG.FLIGHT.bg} border ${DUTY_CONFIG.FLIGHT.border}`} />
          Flight
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-[600] text-text-subtle font-mono">
          <div className={`w-3 h-3 rounded-sm ${DUTY_CONFIG.STANDBY.bg} border ${DUTY_CONFIG.STANDBY.border}`} />
          Standby
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-[600] text-text-subtle font-mono">
          <div className={`w-3 h-3 rounded-sm ${DUTY_CONFIG.TRAINING.bg} border ${DUTY_CONFIG.TRAINING.border}`} />
          Training
        </div>
        <div className="ml-auto text-[10px] text-text-subtle/50 font-mono">
          Tap for details
        </div>
      </div>
    </div>
  );
};
