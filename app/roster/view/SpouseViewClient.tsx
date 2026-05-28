'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DateTime } from 'luxon';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, PlaneTakeoff, PlaneLanding,
  Check, ChevronRight, ChevronLeft,
  AlertCircle, Loader2, X,
} from 'lucide-react';
import { getAirportMeta } from '@/lib/utils/destinations';
import type { DutyEvent } from '@/lib/types';

// ─── API types ────────────────────────────────────────────────────────────────

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

// ─── Internal types ───────────────────────────────────────────────────────────

type DayType = 'flight' | 'standby' | 'off' | 'training' | 'rest';

interface Sector {
  id: string;
  flightNo: string;
  dep: string;
  arr: string;
  depTime: string;
  arrTime: string;
  aircraft: string;
}

interface RosterDay {
  date: number;
  dateStr: string;
  type: DayType;
  base: string;
  dutyStart?: string;
  dutyEnd?: string;
  crewStatus?: string;
  sectors: Sector[];
  sectorCount: number;     // FLIGHT events count (for "2×" display)
}

// ─── Colour config — matches DutyCalendar.tsx exactly ─────────────────────────

const DUTY_CFG: Record<DayType, {
  bg: string; text: string; dot: string;
  pill: string; border: string;
}> = {
  flight:   { bg: 'bg-sky-50',    text: 'text-sky-700',   dot: 'bg-sky-400',   pill: 'bg-sky-100 text-sky-700',    border: 'border-sky-200/60' },
  standby:  { bg: 'bg-amber-50',  text: 'text-amber-800', dot: 'bg-amber-400', pill: 'bg-amber-100 text-amber-800', border: 'border-amber-200/60' },
  off:      { bg: 'bg-green-50',  text: 'text-green-700', dot: 'bg-green-400', pill: 'bg-green-100 text-green-700', border: 'border-green-200/40' },
  training: { bg: 'bg-teal-50',   text: 'text-teal-700',  dot: 'bg-teal-400',  pill: 'bg-teal-100 text-teal-700',  border: 'border-teal-200/60' },
  rest:     { bg: '',             text: 'text-text-subtle', dot: '',           pill: 'bg-surface-2 text-text-subtle', border: 'border-border' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cityName(iata?: string | null) {
  if (!iata) return iata ?? '';
  return getAirportMeta(iata).city || iata;
}

function isOvernight(f: DutyEvent) {
  return !!(f.std && f.sta && f.sta < f.std);
}

function sortRostersChronologically(rosters: SharedRoster[]): SharedRoster[] {
  return [...rosters].sort((a, b) => {
    const dtA = DateTime.fromFormat(`${a.month} ${a.year}`, 'MMMM yyyy');
    const dtB = DateTime.fromFormat(`${b.month} ${b.year}`, 'MMMM yyyy');
    return dtA.toMillis() - dtB.toMillis();
  });
}

// ─── Build one RosterDay from the DutyEvent[] for that date ──────────────────

function buildDay(dateStr: string, events: DutyEvent[], base: string): RosterDay {
  const dt       = DateTime.fromISO(dateStr);
  const flights  = events.filter(e => e.type === 'FLIGHT');
  const standby  = events.find(e => e.type === 'STANDBY');
  const layover  = events.find(e => e.type === 'LAYOVER');
  const off      = events.find(e => e.type === 'OFF');
  const training = events.find(e => e.type === 'TRAINING' || e.type === 'GROUND');

  if (flights.length > 0) {
    const first   = flights[0];
    const last    = flights[flights.length - 1];
    const overnight = isOvernight(last);
    const sectors: Sector[] = flights.map((f, i) => ({
      id:       f.id || `${dateStr}-${i}`,
      flightNo: f.item || f.flightNumber || '—',
      dep:      f.depPort || '—',
      arr:      f.arrPort || '—',
      depTime:  f.std     || f.signOn   || '—',
      arrTime:  `${f.sta || f.signOff || '—'}${isOvernight(f) ? '+' : ''}`,
      aircraft: f.acType  || '—',
    }));
    return {
      date: dt.day, dateStr, type: 'flight', base,
      dutyStart:  first.std    || first.signOn,
      dutyEnd:    `${last.sta  || last.signOff || ''}${overnight ? '+' : ''}`,
      crewStatus: first.dutyCode === 'DH' ? 'Deadheading' : 'Operating',
      sectors,
      sectorCount: flights.length,
    };
  }

  if (standby || layover) {
    const ev = standby || layover!;
    const sector: Sector | null = ev.depPort && ev.arrPort ? {
      id: `${dateStr}-sby`, flightNo: ev.item || '—',
      dep: ev.depPort, arr: ev.arrPort,
      depTime: ev.signOn || '—', arrTime: ev.signOff || '—', aircraft: '—',
    } : null;
    return {
      date: dt.day, dateStr, type: 'standby', base,
      dutyStart:  ev.signOn,
      dutyEnd:    ev.signOff,
      crewStatus: standby
        ? (ev.item?.startsWith('S4') ? 'Airport standby' : 'Home standby')
        : 'On layover',
      sectors: sector ? [sector] : [],
      sectorCount: 0,
    };
  }

  if (training) {
    return {
      date: dt.day, dateStr, type: 'training', base,
      dutyStart:  training.signOn,
      dutyEnd:    training.signOff,
      crewStatus: training.description || 'Ground duty',
      sectors: [], sectorCount: 0,
    };
  }

  if (off) {
    return {
      date: dt.day, dateStr, type: 'off', base,
      crewStatus: off.item === 'DO' ? 'Day off' : 'Off at base',
      sectors: [], sectorCount: 0,
    };
  }

  return { date: dt.day, dateStr, type: 'rest', base, crewStatus: 'Rest day', sectors: [], sectorCount: 0 };
}

function buildRosterDays(roster: SharedRoster, base: string): RosterDay[] {
  const start = DateTime.fromFormat(`${roster.month} ${roster.year}`, 'MMMM yyyy');
  if (!start.isValid) return [];
  const em = new Map<string, DutyEvent[]>();
  for (const e of roster.events ?? []) {
    const list = em.get(e.date) ?? [];
    list.push(e);
    em.set(e.date, list);
  }
  return Array.from({ length: start.daysInMonth ?? 30 }, (_, i) => {
    const d       = i + 1;
    const dateStr = start.set({ day: d }).toFormat('yyyy-MM-dd');
    return buildDay(dateStr, em.get(dateStr) ?? [], base);
  });
}

function buildCalendarMatrix(roster: SharedRoster): (number | null)[][] {
  const start = DateTime.fromFormat(`${roster.month} ${roster.year}`, 'MMMM yyyy');
  if (!start.isValid) return [];
  const offset = start.weekday === 7 ? 6 : start.weekday - 1;
  const flat: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= (start.daysInMonth ?? 30); d++) flat.push(d);
  while (flat.length % 7 !== 0) flat.push(null);
  const out: (number | null)[][] = [];
  for (let i = 0; i < flat.length; i += 7) out.push(flat.slice(i, i + 7));
  return out;
}

// ─── Day cell (matches DutyCalendar.tsx style) ────────────────────────────────

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function DayCell({
  day, rday, isToday, isSelected, onClick,
}: {
  day: number | null;
  rday: RosterDay | null;
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  if (!day) return <div />;

  const type = rday?.type ?? 'rest';
  const cfg  = DUTY_CFG[type];
  const hasDuty = type !== 'rest';

  return (
    <div
      onClick={onClick}
      className={[
        'relative flex flex-col items-center justify-center',
        'rounded-2xl aspect-square cursor-pointer select-none',
        'transition-all duration-150 hover:opacity-80',
        cfg.bg,
      ].join(' ')}
    >
      {/* Date number */}
      <span className={[
        'text-[13px] font-bold leading-none',
        hasDuty ? cfg.text : isToday ? 'text-accent font-extrabold' : 'text-text-subtle',
      ].join(' ')}>
        {day}
      </span>

      {/* Dot or sector count */}
      {hasDuty && (
        rday!.sectorCount > 1
          ? <span className={`mt-0.5 text-[7px] font-extrabold opacity-70 ${cfg.text}`}>{rday!.sectorCount}×</span>
          : <div className={`mt-1 h-1 w-1 rounded-full opacity-70 ${cfg.dot}`} />
      )}

      {/* Selected ring */}
      {isSelected && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-accent" />
      )}
      {/* Today ring (not selected) */}
      {isToday && !isSelected && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-accent/40" />
      )}
    </div>
  );
}

// ─── Selected-day detail bar (matches DutyCalendar.tsx style) ────────────────

function DetailBar({ rday, monthAbbr }: { rday: RosterDay; monthAbbr: string }) {
  const cfg       = DUTY_CFG[rday.type];
  const dateLabel = `${monthAbbr} ${rday.date}`;
  const isRest    = rday.type === 'rest';

  return (
    <div className="flex min-h-[52px] flex-wrap items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3">
      {/* Date pill */}
      <span className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-extrabold ${isRest ? 'border border-border bg-surface-2 text-text-subtle' : cfg.pill}`}>
        {dateLabel}
      </span>

      {/* Flight: route + flight no + times */}
      {rday.type === 'flight' && rday.sectors.length > 0 && (() => {
        const first = rday.sectors[0];
        return (
          <>
            <span className="text-[14px] font-extrabold text-text">
              {first.dep} → {first.arr}
            </span>
            <span className="rounded-full border border-accent px-2.5 py-1 font-mono text-[11px] font-extrabold text-accent shrink-0">
              {first.flightNo}
            </span>
            {first.depTime !== '—' && (
              <span className="ml-auto shrink-0 font-mono text-[12px] font-semibold text-text-muted">
                {first.depTime}{first.arrTime !== '—' ? ` → ${first.arrTime}` : ''}
              </span>
            )}
            {rday.sectors.length > 1 && (
              <span className="shrink-0 font-mono text-[10px] font-extrabold text-text-subtle">
                +{rday.sectors.length - 1}
              </span>
            )}
          </>
        );
      })()}

      {/* Standby / training / off: label + times */}
      {rday.type !== 'flight' && !isRest && (
        <>
          <span className={`text-[14px] font-bold ${cfg.text}`}>
            {rday.crewStatus}
          </span>
          {rday.dutyStart && (
            <span className="ml-auto shrink-0 font-mono text-[12px] font-semibold text-text-muted">
              {rday.dutyStart}{rday.dutyEnd ? ` → ${rday.dutyEnd}` : ''}
            </span>
          )}
        </>
      )}

      {/* Rest */}
      {isRest && (
        <span className="text-[14px] font-semibold text-text-subtle">Rest day</span>
      )}
    </div>
  );
}

// ─── Sector detail modal (tap on flight day in detail bar) ────────────────────

function SectorModal({ rday, monthYear, onClose }: { rday: RosterDay; monthYear: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-border bg-white shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1.5 w-full bg-sky-400" />
        <div className="p-5">
          <button onClick={onClose} className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-surface text-text-muted hover:bg-surface-2">
            <X size={14} />
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-text-subtle">
            {monthYear} · Day {rday.date}
          </p>
          <p className="mt-0.5 text-lg font-extrabold text-text">Flight Duty</p>
          {rday.dutyStart && (
            <p className="mt-1 font-mono text-[12px] text-text-muted">
              Report {rday.dutyStart}
            </p>
          )}
          <div className="mt-4 space-y-3">
            {rday.sectors.map((s, i) => (
              <div key={s.id} className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[13px] font-bold text-sky-700">{s.flightNo}</span>
                  {s.aircraft !== '—' && <span className="text-[11px] text-text-subtle">{s.aircraft}</span>}
                </div>
                <div className="mt-3 flex items-center">
                  <div className="flex-1">
                    <p className="text-[26px] font-black leading-none text-text">{s.dep}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-text-muted">
                      <PlaneTakeoff size={10} className="text-sky-500" /> {s.depTime}
                    </p>
                    <p className="text-[10px] text-text-subtle">{cityName(s.dep)}</p>
                  </div>
                  <div className="flex flex-1 items-center justify-center gap-1 px-2">
                    <span className="h-px flex-1 bg-sky-200" />
                    <Plane size={12} className="rotate-45 text-sky-400" />
                    <span className="h-px flex-1 bg-sky-200" />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-[26px] font-black leading-none text-text">{s.arr}</p>
                    <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-text-muted">
                      <PlaneLanding size={10} className="text-sky-500" /> {s.arrTime}
                    </p>
                    <p className="text-[10px] text-text-subtle">{cityName(s.arr)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Stats card ───────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[.16em] text-text-subtle">{label}</p>
      <p className="mt-1.5 text-2xl font-black text-text">{value}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SpouseViewClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [apiData, setApiData]       = useState<{ pilot: PilotInfo; rosters: SharedRoster[] } | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [now, setNow]               = useState(() => DateTime.now());
  const [rosterIdx, setRosterIdx]   = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalDay, setModalDay]     = useState<RosterDay | null>(null);

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
        const rosters = sortRostersChronologically(json.rosters ?? []);
        const todayFmt = now.toFormat('MMMM yyyy');
        const idx = rosters.findIndex(r => `${r.month} ${r.year}` === todayFmt);
        const selIdx = idx >= 0 ? idx : rosters.length - 1;
        setRosterIdx(selIdx);
        // Default selected date to today if in range, else first day of month
        const todayStr = now.toFormat('yyyy-MM-dd');
        setSelectedDate(todayStr);
        setApiData({ ...json, rosters });
      })
      .catch(err => setError(String(err?.message ?? err)))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const rosters  = apiData?.rosters ?? [];
  const roster   = rosters[rosterIdx];
  const pilot    = apiData?.pilot;
  const todayStr = now.toFormat('yyyy-MM-dd');

  const rosterDays = useMemo(
    () => roster ? buildRosterDays(roster, pilot?.base ?? 'KUL') : [],
    [roster, pilot?.base],
  );

  const dayMap = useMemo(
    () => new Map(rosterDays.map(d => [d.date, d])),
    [rosterDays],
  );

  const weeks = useMemo(() => roster ? buildCalendarMatrix(roster) : [], [roster]);

  const selectedDay: RosterDay | null = useMemo(() => {
    if (!selectedDate || !roster) return null;
    const start = DateTime.fromFormat(`${roster.month} ${roster.year}`, 'MMMM yyyy');
    // Check if selectedDate is in this month
    const selDt = DateTime.fromISO(selectedDate);
    if (selDt.month !== start.month || selDt.year !== start.year) return null;
    return dayMap.get(selDt.day) ?? null;
  }, [selectedDate, roster, dayMap]);

  const stats = useMemo(() => ({
    flights:  rosterDays.filter(d => d.type === 'flight').length,
    standby:  rosterDays.filter(d => d.type === 'standby').length,
    sectors:  rosterDays.reduce((n, d) => n + d.sectorCount, 0),
    off:      rosterDays.filter(d => d.type === 'off').length,
  }), [rosterDays]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface">
        <Loader2 size={26} className="animate-spin text-accent" />
        <p className="text-[12px] font-semibold uppercase tracking-[.25em] text-text-muted">Loading roster…</p>
      </div>
    );
  }

  // ── Error ──
  if (error || !apiData || !roster || !pilot) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-surface p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-soft">
          <AlertCircle size={30} className="text-danger" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">
            {error === 'no-token' ? 'Missing share link' : 'Link not found'}
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-text-muted">
            {error === 'no-token'
              ? 'This page needs a share link from the pilot.'
              : 'This link may have expired or been reset. Ask the pilot to share a new one.'}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-full border border-border bg-white px-6 py-2.5 text-[13px] font-semibold text-text-muted shadow-sm hover:border-border-hover hover:text-text"
        >
          Try again
        </button>
      </div>
    );
  }

  const monthYear  = `${roster.month} ${roster.year}`;
  const monthAbbr  = `${roster.month.slice(0, 3).toUpperCase()} ${roster.year}`;
  const initials   = pilot.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-surface px-4 py-6 sm:px-6 md:py-8">
      <div className="mx-auto w-full max-w-lg space-y-3">

        {/* ── Chrome bar (matches DutyCalendar) ── */}
        <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-surface-2 px-5 py-3">
          <div className="flex items-center gap-2">
            {/* Month nav */}
            <button
              disabled={rosterIdx <= 0}
              onClick={() => { setRosterIdx(i => i - 1); setSelectedDate(null); }}
              className="grid h-7 w-7 place-items-center rounded-full border border-border bg-white text-text-muted shadow-sm disabled:opacity-30 hover:border-border-hover"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="font-mono text-[13px] font-extrabold uppercase tracking-[.2em] text-text">
              {monthAbbr}
            </span>
            <button
              disabled={rosterIdx >= rosters.length - 1}
              onClick={() => { setRosterIdx(i => i + 1); setSelectedDate(null); }}
              className="grid h-7 w-7 place-items-center rounded-full border border-border bg-white text-text-muted shadow-sm disabled:opacity-30 hover:border-border-hover"
            >
              <ChevronRight size={13} />
            </button>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-[11px] font-extrabold text-success">
            <Check size={11} strokeWidth={3} /> Synced
          </span>
        </div>

        {/* ── Pilot info ── */}
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-sm">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-sm font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-bold text-text">{pilot.full_name}</p>
            {(pilot.rank || pilot.airline) && (
              <p className="truncate text-[12px] text-text-muted">
                {[pilot.rank, pilot.airline].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>

        {/* ── Calendar grid ── */}
        <div className="rounded-2xl border border-border bg-white p-4">
          {/* DOW headers */}
          <div className="mb-1 grid grid-cols-7">
            {DOW.map(d => (
              <div key={d} className="py-2 text-center font-mono text-[9px] font-bold uppercase tracking-wide text-text-subtle/50">
                {d}
              </div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {weeks.map((week, wi) =>
              week.map((d, di) => {
                if (!d) return <div key={`pad-${wi}-${di}`} />;
                const dateStr = DateTime.fromFormat(`${roster.month} ${roster.year}`, 'MMMM yyyy')
                  .set({ day: d }).toFormat('yyyy-MM-dd');
                const rday    = dayMap.get(d) ?? null;
                return (
                  <DayCell
                    key={dateStr}
                    day={d}
                    rday={rday}
                    isToday={dateStr === todayStr}
                    isSelected={selectedDate === dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* ── Selected day detail bar ── */}
        <AnimatePresence mode="wait">
          {selectedDay !== undefined && (
            <motion.div
              key={selectedDate ?? 'none'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
            >
              <DetailBar
                rday={selectedDay ?? { date: 0, dateStr: '', type: 'rest', base: pilot.base, sectors: [], sectorCount: 0, crewStatus: 'Rest day' }}
                monthAbbr={monthAbbr}
              />
              {/* Tap to expand for flight days */}
              {selectedDay?.type === 'flight' && selectedDay.sectors.length > 0 && (
                <button
                  onClick={() => setModalDay(selectedDay)}
                  className="mt-1.5 w-full rounded-2xl border border-sky-100 bg-sky-50 py-2.5 text-[12px] font-bold text-sky-600 hover:bg-sky-100"
                >
                  View flight details
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard label="Flight days" value={stats.flights} />
          <StatCard label="Sectors"     value={stats.sectors} />
          <StatCard label="Standby"     value={stats.standby} />
          <StatCard label="Days off"    value={stats.off} />
        </div>

        {/* ── Legend ── */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-[11px] font-semibold">
          {([
            ['bg-sky-400',   'text-sky-700',   'bg-sky-50',   'Flight'],
            ['bg-amber-400', 'text-amber-800', 'bg-amber-50', 'Standby'],
            ['bg-green-400', 'text-green-700', 'bg-green-50', 'Day off'],
            ['bg-teal-400',  'text-teal-700',  'bg-teal-50',  'Training'],
          ] as const).map(([dot, text, bg, label]) => (
            <div key={label} className={`flex items-center gap-2 rounded-xl ${bg} px-3 py-2.5`}>
              <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
              <span className={text}>{label}</span>
            </div>
          ))}
        </div>

        <p className="pb-2 text-center text-[11px] text-text-subtle">
          Otarosta · Shared roster · Live read-only view
        </p>
      </div>

      {/* ── Flight detail modal ── */}
      <AnimatePresence>
        {modalDay && (
          <SectorModal
            rday={modalDay}
            monthYear={monthYear}
            onClose={() => setModalDay(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
