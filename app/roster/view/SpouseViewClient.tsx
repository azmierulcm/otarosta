'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { DateTime } from 'luxon';
import {
  Plane, Clock, Home, AlertCircle, Loader2, MapPin,
  ChevronLeft, ChevronRight, ArrowRight, X,
} from 'lucide-react';
import { getAirportMeta } from '@/lib/utils/destinations';
import type { DutyEvent } from '@/lib/types';

// ─── API shape ────────────────────────────────────────────────────────────────

interface SharedRoster {
  month: string;
  year: string;
  events: DutyEvent[];
  airline?: string;
  uploadedAt: string;
}

interface PilotInfo {
  full_name: string;
  rank: string | null;
  airline: string | null;
  avatar_url: string | null;
  base: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type DayStatus = 'FLIGHT' | 'STANDBY' | 'LAYOVER' | 'DUTY' | 'OFF_DO' | 'OFF_D' | 'EMPTY';

function cityName(iata?: string | null): string {
  if (!iata) return '';
  return getAirportMeta(iata).city || iata;
}

function getDayStatus(evts: DutyEvent[]): DayStatus {
  if (!evts.length) return 'EMPTY';
  if (evts.some(e => e.type === 'FLIGHT'))   return 'FLIGHT';
  if (evts.some(e => e.type === 'LAYOVER'))  return 'LAYOVER';
  if (evts.some(e => e.type === 'STANDBY'))  return 'STANDBY';
  if (evts.some(e => e.type === 'TRAINING' || e.type === 'GROUND')) return 'DUTY';
  // OFF subtypes — check the duty code
  const off = evts.find(e => e.type === 'OFF');
  if (off?.item === 'DO') return 'OFF_DO';
  return 'OFF_D';
}

// Header bar colours — match reference image colour scheme
const HEADER_BG: Record<DayStatus, string> = {
  FLIGHT:  'bg-sky-500',
  LAYOVER: 'bg-sky-500',         // overnight away still shows blue
  STANDBY: 'bg-amber-500',
  DUTY:    'bg-purple-600',
  OFF_DO:  'bg-emerald-600',
  OFF_D:   'bg-green-700',
  EMPTY:   'bg-gray-200',
};

// Cell body background (lighter shade beneath the header)
const CELL_BG: Record<DayStatus, string> = {
  FLIGHT:  'bg-sky-50',
  LAYOVER: 'bg-indigo-50',
  STANDBY: 'bg-amber-50',
  DUTY:    'bg-purple-50',
  OFF_DO:  'bg-emerald-50',
  OFF_D:   'bg-green-50',
  EMPTY:   'bg-gray-50',
};

// ─── "Continues next day" detection ───────────────────────────────────────────
// A flight arrives next day when its STA is earlier than STD (crossed midnight)

function isOvernight(f: DutyEvent): boolean {
  if (!f.std || !f.sta) return false;
  return f.sta < f.std;
}

function hasLayoverTonight(evts: DutyEvent[]): boolean {
  return evts.some(e => e.type === 'LAYOVER');
}

function continuesNextDay(evts: DutyEvent[]): boolean {
  const flights = evts.filter(e => e.type === 'FLIGHT');
  return flights.some(isOvernight) || hasLayoverTonight(evts);
}

// ─── Calendar week grouping ───────────────────────────────────────────────────

interface CalDay {
  date: string;
  dayNum: number;
  status: DayStatus;
  events: DutyEvent[];
  isToday: boolean;
  isPast: boolean;
}

type CalCell = CalDay | null;

function buildCalendar(
  roster: SharedRoster,
  now: DateTime,
): { weeks: CalCell[][]; eventMap: Map<string, DutyEvent[]> } {
  const start = DateTime.fromFormat(`${roster.month} ${roster.year}`, 'MMMM yyyy');
  if (!start.isValid) return { weeks: [], eventMap: new Map() };

  // Build event map
  const eventMap = new Map<string, DutyEvent[]>();
  for (const e of roster.events ?? []) {
    const list = eventMap.get(e.date) ?? [];
    list.push(e);
    eventMap.set(e.date, list);
  }

  const daysInMonth = start.daysInMonth ?? 30;
  // Monday-first: Luxon weekday Mon=1…Sun=7 → offset = weekday-1
  const firstOffset = start.weekday === 7 ? 6 : start.weekday - 1;

  const cells: CalCell[] = [];
  for (let i = 0; i < firstOffset; i++) cells.push(null);

  for (let d = 1; d <= daysInMonth; d++) {
    const dt      = start.set({ day: d });
    const dateStr = dt.toFormat('yyyy-MM-dd');
    const evts    = eventMap.get(dateStr) ?? [];
    cells.push({
      date:    dateStr,
      dayNum:  d,
      status:  getDayStatus(evts),
      events:  evts,
      isToday: dt.hasSame(now, 'day'),
      isPast:  dt < now.startOf('day'),
    });
  }

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  // Slice into weeks
  const weeks: CalCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return { weeks, eventMap };
}

// ─── Hero status ──────────────────────────────────────────────────────────────

interface HeroStatus {
  label: string;
  subtitle: string;
  tag: string;
  gradient: string;
  Icon: React.ElementType;
}

function buildHero(
  rosters: SharedRoster[],
  now: DateTime,
  base: string,
): HeroStatus {
  const todayStr = now.toFormat('yyyy-MM-dd');
  const nowTime  = now.toFormat('HH:mm');
  const allEvts  = rosters.flatMap(r => r.events ?? []);
  const today    = allEvts.filter(e => e.date === todayStr);

  const flying = today.find(
    e => e.type === 'FLIGHT' && e.std && e.sta && nowTime >= e.std && nowTime <= e.sta,
  );
  if (flying) {
    return {
      label:    'In the Air',
      subtitle: `${cityName(flying.depPort)} → ${cityName(flying.arrPort)}`,
      tag:      flying.sta ? `Lands at ${flying.sta} local` : 'Currently flying',
      gradient: 'from-sky-500 to-sky-600',
      Icon:     Plane,
    };
  }

  const layover = today.find(e => e.type === 'LAYOVER');
  if (layover) {
    const c = cityName(layover.arrPort) || 'Away';
    // Find next home day
    const homeDate = allEvts
      .map(e => e.date).filter(d => d > todayStr)
      .sort()
      .find(d => getDayStatus(allEvts.filter(e => e.date === d)) === 'EMPTY' ||
                 getDayStatus(allEvts.filter(e => e.date === d)) === 'OFF_DO' ||
                 getDayStatus(allEvts.filter(e => e.date === d)) === 'OFF_D');
    const homeIn = homeDate
      ? Math.ceil(DateTime.fromISO(homeDate).diff(now, 'days').days)
      : null;
    return {
      label:    'On Layover',
      subtitle: c,
      tag:      homeIn != null ? (homeIn <= 1 ? 'Back tomorrow' : `Back in ${homeIn} days`) : '',
      gradient: 'from-indigo-500 to-indigo-600',
      Icon:     MapPin,
    };
  }

  const standby = today.find(
    e => e.type === 'STANDBY' && e.signOn && e.signOff && nowTime >= e.signOn && nowTime <= e.signOff,
  );
  if (standby) {
    return {
      label:    'On Standby',
      subtitle: `Available until ${standby.signOff}`,
      tag:      'May be called for a flight',
      gradient: 'from-amber-500 to-amber-600',
      Icon:     Clock,
    };
  }

  // Find next trip
  const sorted = Array.from(new Set(allEvts.map(e => e.date))).sort();
  const nextTrip = sorted.find(d => {
    if (d <= todayStr) return false;
    const s = getDayStatus(allEvts.filter(e => e.date === d));
    return s === 'FLIGHT' || s === 'STANDBY' || s === 'LAYOVER';
  });
  const daysAway = nextTrip
    ? Math.ceil(DateTime.fromISO(nextTrip).diff(now, 'days').days)
    : null;

  return {
    label:    'At Home',
    subtitle: cityName(base) || base,
    tag:      daysAway != null
      ? (daysAway <= 1 ? 'Next trip tomorrow' : `Next trip in ${daysAway} days`)
      : 'No upcoming trips',
    gradient: 'from-emerald-500 to-emerald-600',
    Icon:     Home,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function PlaneIcons({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-[2px]">
      {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
        <Plane key={i} size={8} className="text-white/80" />
      ))}
    </span>
  );
}

function DayCellComp({
  cell,
  isSelected,
  onTap,
}: {
  cell: CalCell;
  isSelected: boolean;
  onTap: () => void;
}) {
  if (!cell) {
    return <div className="rounded-lg bg-transparent" />;
  }

  const { dayNum, status, events, isToday, isPast } = cell;
  const flights  = events.filter(e => e.type === 'FLIGHT');
  const standby  = events.find(e => e.type === 'STANDBY');
  const off      = events.find(e => e.type === 'OFF');
  const carries  = continuesNextDay(events);

  const headerBg = HEADER_BG[status];
  const cellBg   = CELL_BG[status];

  // Brief cell body text
  let bodyLine1 = '';
  let bodyLine2 = '';

  if (status === 'FLIGHT') {
    const f = flights[0];
    bodyLine1 = f?.item || '';
    bodyLine2 = flights.length > 1
      ? `+${flights.length - 1} leg${flights.length > 2 ? 's' : ''}`
      : (f?.depPort && f?.arrPort ? `${f.depPort}→${f.arrPort}` : '');
  } else if (status === 'LAYOVER') {
    const f = flights[0];
    bodyLine1 = f?.item || '';
    bodyLine2 = 'Layover';
  } else if (status === 'STANDBY') {
    bodyLine1 = standby?.item || 'SBY';
    bodyLine2 = standby?.signOn ? `${standby.signOn}` : '';
  } else if (status === 'DUTY') {
    const d = events.find(e => e.type === 'TRAINING' || e.type === 'GROUND');
    bodyLine1 = d?.item || 'DTY';
  } else if (status === 'OFF_DO') {
    bodyLine1 = 'DO';
  } else if (status === 'OFF_D') {
    bodyLine1 = off?.item || 'D';
  }

  return (
    <button
      onClick={onTap}
      className={`
        rounded-lg overflow-hidden flex flex-col transition-all duration-100
        ${isSelected ? 'ring-2 ring-offset-1 ring-text scale-[1.04] shadow-lg z-10 relative' : ''}
        ${isPast && !isToday ? 'opacity-60' : ''}
      `}
    >
      {/* Coloured header strip */}
      <div className={`${headerBg} px-1 py-[3px] flex items-center justify-between gap-0.5`}>
        <span className={`text-white font-black leading-none ${isToday ? 'text-[13px]' : 'text-[12px]'}`}>
          {dayNum}
        </span>
        <div className="flex items-center gap-[2px]">
          {status === 'FLIGHT' && <PlaneIcons count={flights.length} />}
          {carries && <ArrowRight size={7} className="text-white/90" />}
        </div>
      </div>

      {/* Body */}
      <div className={`${cellBg} flex-1 flex flex-col items-center justify-center px-0.5 py-[3px] min-h-[38px]`}>
        {bodyLine1 ? (
          <span className="text-[9px] font-black text-center leading-tight truncate w-full text-center">
            {bodyLine1}
          </span>
        ) : null}
        {bodyLine2 ? (
          <span className="text-[8px] font-bold text-center leading-tight truncate w-full text-center text-text-muted">
            {bodyLine2}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function DayDetailCard({
  cell,
  onClose,
}: {
  cell: CalDay;
  onClose: () => void;
}) {
  const { date, dayNum, status, events } = cell;
  const dt       = DateTime.fromISO(date);
  const flights  = events.filter(e => e.type === 'FLIGHT');
  const standby  = events.find(e => e.type === 'STANDBY');
  const layover  = events.find(e => e.type === 'LAYOVER');
  const offEvt   = events.find(e => e.type === 'OFF');
  const dutyEvt  = events.find(e => e.type === 'TRAINING' || e.type === 'GROUND');
  const carries  = continuesNextDay(events);
  const headerBg = HEADER_BG[status];

  return (
    <div className="col-span-7 mt-1 mb-2 animate-in slide-in-from-top-2 duration-150">
      <div className="bg-white rounded-2xl border border-border shadow-lg overflow-hidden">

        {/* ── Card header (matches reference image top bar) ── */}
        <div className={`${headerBg} px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {/* Date badge */}
            <div className="bg-white/20 rounded-lg w-9 h-9 flex items-center justify-center">
              <span className="text-white font-black text-[18px] leading-none">{dayNum}</span>
            </div>
            <div>
              <p className="text-white/70 text-[10px] font-black uppercase tracking-widest leading-none mb-0.5">
                {dt.toFormat('EEEE')}
              </p>
              <p className="text-white font-black text-[13px] leading-none">
                {dt.toFormat('d MMMM yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Plane icons per leg */}
            {flights.length > 0 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(flights.length, 4) }).map((_, i) => (
                  <Plane key={i} size={14} className="text-white/80" />
                ))}
              </div>
            )}
            {/* Continues-next-day arrow */}
            {carries && (
              <div className="bg-white/25 rounded-md px-1.5 py-0.5 flex items-center gap-0.5">
                <ArrowRight size={12} className="text-white" />
              </div>
            )}
            {/* Close */}
            <button onClick={onClose} className="ml-1 text-white/70 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Flight sectors ── */}
        {flights.length > 0 && (
          <div className="divide-y divide-border/60">
            {flights.map((f, idx) => {
              const overnight = isOvernight(f);
              const hasMore   = idx < flights.length - 1; // more legs follow

              return (
                <div key={f.id || idx} className="px-4 py-3">
                  {/* Route row */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[18px] font-black text-text tracking-tight">
                      {f.depPort || '—'}
                    </span>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[13px] font-black text-accent tracking-wide">
                        {f.item || f.flightNumber || '—'}
                      </span>
                      {f.acType && (
                        <span className="text-[8px] font-bold text-text-subtle uppercase tracking-widest">
                          {f.acType}
                        </span>
                      )}
                    </div>
                    <span className="text-[18px] font-black text-text tracking-tight">
                      {f.arrPort || '—'}
                    </span>
                  </div>

                  {/* City names */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-text-muted">{cityName(f.depPort)}</span>
                    <span className="text-[10px] font-bold text-text-muted">{cityName(f.arrPort)}</span>
                  </div>

                  {/* Times row — matches reference: STD  ...  STA+ */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[16px] font-black text-text">{f.std || f.signOn || '—'}</span>
                      {f.dutyCode && (
                        <span className="ml-1.5 text-[11px] font-black text-text-muted">{f.dutyCode}</span>
                      )}
                    </div>

                    {/* Middle dots (indicates more sectors or long haul) */}
                    <span className="text-[14px] font-black text-text-subtle tracking-[4px]">···</span>

                    <div className="text-right">
                      <span className="text-[16px] font-black text-text">
                        {f.sta || f.signOff || '—'}
                        {overnight && <span className="text-accent text-[12px] ml-0.5">+</span>}
                      </span>
                    </div>
                  </div>

                  {/* "More sectors below" indicator */}
                  {hasMore && (
                    <div className="mt-2 flex items-center gap-2 text-text-subtle">
                      <div className="flex-1 border-t border-dashed border-border" />
                      <span className="text-[9px] font-black uppercase tracking-widest">next sector</span>
                      <div className="flex-1 border-t border-dashed border-border" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Standby ── */}
        {standby && (
          <div className="px-4 py-3 border-t border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-black text-danger uppercase tracking-wide">Stand By</span>
              <span className="text-[15px] font-black text-text">{standby.item || ''}</span>
            </div>
            {(standby.signOn || standby.signOff) && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-[14px] font-black text-text">{standby.signOn || ''}</span>
                <span className="text-[12px] text-text-subtle font-bold tracking-[4px]">···</span>
                <span className="text-[14px] font-black text-text">{standby.signOff || ''}</span>
              </div>
            )}
            {standby.depPort && (
              <p className="text-[11px] font-bold text-text-muted mt-1">{standby.depPort}</p>
            )}
          </div>
        )}

        {/* ── Layover ── */}
        {layover && (
          <div className="px-4 py-3 border-t border-border/60 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-text-subtle mb-0.5">Layover</p>
              <p className="text-[15px] font-black text-text">
                {cityName(layover.arrPort) || layover.arrPort || 'Away'}
              </p>
            </div>
            {layover.hotel && (
              <p className="text-[11px] font-bold text-text-muted text-right max-w-[120px] leading-snug">
                {layover.hotel}
              </p>
            )}
          </div>
        )}

        {/* ── Off / Duty day ── */}
        {!flights.length && !standby && (status === 'OFF_DO' || status === 'OFF_D' || status === 'DUTY') && (
          <div className="px-4 py-4 flex items-center justify-between">
            <div>
              <p className="text-[22px] font-black text-text">
                {dutyEvt?.item || offEvt?.item || (status === 'OFF_DO' ? 'DO' : 'D')}
              </p>
              <p className="text-[12px] font-bold text-text-muted">
                {status === 'OFF_DO'
                  ? 'Day Off'
                  : status === 'OFF_D'
                  ? 'Off Duty at Base'
                  : (dutyEvt?.description || 'Ground Duty')}
              </p>
            </div>
            {(offEvt?.depPort || dutyEvt?.depPort) && (
              <span className="text-[18px] font-black text-text-muted">
                {offEvt?.depPort || dutyEvt?.depPort}
              </span>
            )}
          </div>
        )}

        {/* ── Empty day ── */}
        {status === 'EMPTY' && (
          <div className="px-4 py-4">
            <p className="text-[13px] font-bold text-text-muted">No duty scheduled.</p>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Hero Banner ──────────────────────────────────────────────────────────────

function HeroBanner({ status, pilot }: { status: HeroStatus; pilot: PilotInfo }) {
  return (
    <div className={`bg-gradient-to-br ${status.gradient} px-5 pt-12 pb-8 rounded-b-[2.5rem] shadow-xl relative overflow-hidden`}>
      <status.Icon size={130} strokeWidth={1} className="absolute -right-6 -bottom-4 opacity-[0.07] pointer-events-none" />
      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mb-2">
          {pilot.full_name}{pilot.rank ? ` · ${pilot.rank}` : ''}
        </p>
        <h1 className="text-[2.4rem] font-black tracking-tighter text-white leading-none mb-1">
          {status.label}
        </h1>
        <p className="text-[17px] font-black text-white/85 mb-4">{status.subtitle}</p>
        {status.tag && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
            <span className="text-[11px] font-black text-white">{status.tag}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SpouseViewClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [apiData, setApiData]           = useState<{ pilot: PilotInfo; rosters: SharedRoster[] } | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [now, setNow]                   = useState(() => DateTime.now());
  const [selectedIdx, setSelectedIdx]   = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(DateTime.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!token) { setLoading(false); setError('no-token'); return; }
    fetch(`/api/roster/share?token=${encodeURIComponent(token)}`)
      .then(async res => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Failed to load');
        setApiData(json);
      })
      .catch(err => setError(String(err?.message ?? err)))
      .finally(() => setLoading(false));
  }, [token]);

  const handleMonthChange = (idx: number) => {
    setSelectedIdx(idx);
    setSelectedDate(null);
  };

  const roster = apiData?.rosters[selectedIdx];

  const { weeks, eventMap } = useMemo(
    () => roster ? buildCalendar(roster, now) : { weeks: [], eventMap: new Map() },
    [roster, now],
  );

  const heroStatus = useMemo(
    () => apiData ? buildHero(apiData.rosters, now, apiData.pilot.base) : null,
    [apiData, now],
  );

  const selectedCell = useMemo((): CalDay | null => {
    if (!selectedDate) return null;
    for (const week of weeks) {
      for (const cell of week) {
        if (cell?.date === selectedDate) return cell;
      }
    }
    return null;
  }, [selectedDate, weeks]);

  // Which week index contains the selected date
  const selectedWeekIdx = useMemo(() => {
    if (!selectedDate) return -1;
    return weeks.findIndex(week => week.some(c => c?.date === selectedDate));
  }, [selectedDate, weeks]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-1 gap-3">
        <Loader2 size={28} className="animate-spin text-accent" />
        <p className="text-[12px] font-black uppercase tracking-[0.3em] text-text-muted">Loading roster…</p>
      </div>
    );
  }

  // ── Error ──
  if (error || !apiData || !heroStatus || !roster) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-1 p-8 text-center gap-4">
        <div className="w-20 h-20 rounded-[2rem] bg-danger/10 flex items-center justify-center">
          <AlertCircle size={36} className="text-danger" />
        </div>
        <div>
          <h1 className="text-xl font-black text-text mb-2">
            {error === 'no-token' ? 'Missing link' : 'Link not found'}
          </h1>
          <p className="text-[13px] text-text-muted font-bold leading-relaxed max-w-xs mx-auto">
            {error === 'no-token'
              ? 'This page needs a share link from the pilot.'
              : 'This link may have expired or been reset. Ask the pilot to share a new one.'}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-full border border-border text-[13px] font-black text-text-muted hover:text-text"
        >
          Try again
        </button>
      </div>
    );
  }

  const { pilot, rosters } = apiData;

  return (
    <div className="min-h-screen bg-surface-1 pb-16">

      {/* ── Hero ── */}
      <HeroBanner status={heroStatus} pilot={pilot} />

      <div className="px-3 mt-5 space-y-4">

        {/* ── Month picker ── */}
        {rosters.length > 1 && (
          <div className="flex items-center gap-2 px-1">
            <button
              disabled={selectedIdx >= rosters.length - 1}
              onClick={() => handleMonthChange(selectedIdx + 1)}
              className="w-8 h-8 rounded-full border border-border bg-white flex items-center justify-center disabled:opacity-30"
            >
              <ChevronLeft size={15} />
            </button>
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-1.5 justify-center">
                {rosters.map((r, idx) => (
                  <button
                    key={`${r.month}-${r.year}`}
                    onClick={() => handleMonthChange(idx)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-black whitespace-nowrap transition-all ${
                      idx === selectedIdx
                        ? 'bg-accent text-accent-fg shadow-sm'
                        : 'bg-white border border-border text-text-muted'
                    }`}
                  >
                    {r.month} {r.year}
                  </button>
                ))}
              </div>
            </div>
            <button
              disabled={selectedIdx <= 0}
              onClick={() => handleMonthChange(selectedIdx - 1)}
              className="w-8 h-8 rounded-full border border-border bg-white flex items-center justify-center disabled:opacity-30"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* ── Calendar ── */}
        <div className="bg-white rounded-[1.75rem] border border-border shadow-sm overflow-hidden">

          {/* Month title */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h2 className="text-[14px] font-black text-text">{roster.month} {roster.year}</h2>
            {/* Legend */}
            <div className="flex items-center gap-2">
              {[
                { label: 'Flight', bg: 'bg-sky-500' },
                { label: 'Standby', bg: 'bg-amber-500' },
                { label: 'Off', bg: 'bg-emerald-600' },
              ].map(l => (
                <span key={l.label} className="flex items-center gap-1 text-[8px] font-black text-text-subtle uppercase tracking-wider">
                  <span className={`w-2 h-2 rounded-sm ${l.bg}`} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>

          {/* DOW headers — Monday first */}
          <div className="grid grid-cols-7 px-2 pb-1">
            {DOW.map(d => (
              <div key={d} className="text-center text-[9px] font-black uppercase tracking-widest text-text-subtle py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="px-2 pb-3 space-y-1">
            {weeks.map((week, wIdx) => (
              <React.Fragment key={wIdx}>
                {/* Week row */}
                <div className="grid grid-cols-7 gap-1">
                  {week.map((cell, cIdx) => (
                    <DayCellComp
                      key={cell ? cell.date : `pad-${wIdx}-${cIdx}`}
                      cell={cell}
                      isSelected={cell?.date === selectedDate}
                      onTap={() => {
                        if (!cell) return;
                        setSelectedDate(prev => prev === cell.date ? null : cell.date);
                      }}
                    />
                  ))}
                </div>

                {/* Detail panel — inserted after the week that contains the selected day */}
                {wIdx === selectedWeekIdx && selectedCell && (
                  <DayDetailCard
                    cell={selectedCell}
                    onClose={() => setSelectedDate(null)}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="text-center py-3">
          <p className="text-[11px] font-black text-text-subtle uppercase tracking-[0.2em]">Shared via Otarosta</p>
          <p className="text-[9px] text-text-subtle/50 font-bold mt-0.5">Live read-only · Auto-updates</p>
        </div>

      </div>
    </div>
  );
}
