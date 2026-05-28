'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { DateTime } from 'luxon';
import {
  Plane, Clock, Home, AlertCircle, Loader2,
  MapPin, ChevronLeft, ChevronRight, ChevronUp,
} from 'lucide-react';
import { getAirportMeta } from '@/lib/utils/destinations';
import type { DutyEvent } from '@/lib/types';

// ─── Types coming from the API ────────────────────────────────────────────────

interface SharedRoster {
  month: string;       // e.g. "May"
  year: string;        // e.g. "2025"
  events: DutyEvent[];
  airline?: string;
  uploadedAt: string;  // ISO string — already serialized server-side
}

interface PilotInfo {
  full_name: string;
  rank: string | null;
  airline: string | null;
  avatar_url: string | null;
  base: string;
}

interface ApiResponse {
  pilot: PilotInfo;
  rosters: SharedRoster[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type DayStatus = 'HOME' | 'FLIGHT' | 'LAYOVER' | 'STANDBY' | 'DUTY';

function city(iata?: string | null): string {
  if (!iata) return '';
  return getAirportMeta(iata).city || iata;
}

function getDayStatus(evts: DutyEvent[]): DayStatus {
  if (evts.some(e => e.type === 'FLIGHT'))                          return 'FLIGHT';
  if (evts.some(e => e.type === 'LAYOVER'))                         return 'LAYOVER';
  if (evts.some(e => e.type === 'STANDBY'))                         return 'STANDBY';
  if (evts.some(e => e.type === 'TRAINING' || e.type === 'GROUND')) return 'DUTY';
  return 'HOME';
}

function dayBg(status: DayStatus, isToday: boolean, isSelected: boolean): string {
  if (isSelected) {
    const map: Record<DayStatus, string> = {
      FLIGHT:  'bg-sky-500 text-white shadow-lg shadow-sky-200',
      LAYOVER: 'bg-indigo-500 text-white shadow-lg shadow-indigo-200',
      STANDBY: 'bg-amber-500 text-white shadow-lg shadow-amber-200',
      DUTY:    'bg-purple-500 text-white shadow-lg shadow-purple-200',
      HOME:    'bg-emerald-500 text-white shadow-lg shadow-emerald-200',
    };
    return map[status];
  }
  if (isToday) {
    const map: Record<DayStatus, string> = {
      FLIGHT:  'bg-sky-400 text-white ring-2 ring-sky-300 ring-offset-1',
      LAYOVER: 'bg-indigo-400 text-white ring-2 ring-indigo-300 ring-offset-1',
      STANDBY: 'bg-amber-400 text-white ring-2 ring-amber-300 ring-offset-1',
      DUTY:    'bg-purple-400 text-white ring-2 ring-purple-300 ring-offset-1',
      HOME:    'bg-emerald-400 text-white ring-2 ring-emerald-300 ring-offset-1',
    };
    return map[status];
  }
  const map: Record<DayStatus, string> = {
    FLIGHT:  'bg-sky-100 text-sky-700',
    LAYOVER: 'bg-indigo-100 text-indigo-700',
    STANDBY: 'bg-amber-100 text-amber-700',
    DUTY:    'bg-purple-100 text-purple-700',
    HOME:    'bg-emerald-50 text-emerald-600',
  };
  return map[status];
}

function describeDayEvents(evts: DutyEvent[]): string[] {
  if (evts.length === 0) return ['Day off · At home'];

  const lines: string[] = [];
  const flights = evts.filter(e => e.type === 'FLIGHT');
  const layover = evts.find(e => e.type === 'LAYOVER');
  const standby = evts.find(e => e.type === 'STANDBY');
  const duty    = evts.find(e => e.type === 'TRAINING' || e.type === 'GROUND');

  for (const f of flights) {
    const from = city(f.depPort) || f.depPort || '?';
    const to   = city(f.arrPort) || f.arrPort || '?';
    const dep  = f.std ? ` · departs ${f.std}` : '';
    const arr  = f.sta ? ` · arrives ${f.sta}` : '';
    lines.push(`✈ ${from} → ${to}${dep}${arr}`);
  }

  if (layover) {
    const c     = city(layover.arrPort) || layover.arrPort || 'Away';
    const hotel = layover.hotel ? ` · ${layover.hotel}` : '';
    lines.push(`🏨 Layover in ${c}${hotel}`);
  }

  if (standby) {
    const times = standby.signOn && standby.signOff
      ? ` ${standby.signOn}–${standby.signOff}` : '';
    lines.push(`⏳ On standby${times}`);
  }

  if (duty && lines.length === 0) {
    lines.push(`📋 ${duty.description || duty.item || 'Duty day'}`);
  }

  return lines.length ? lines : ['Day off · At home'];
}

// ─── Hero status (always reflects today regardless of selected month) ─────────

interface HeroStatus {
  label: string;
  subtitle: string;
  tag: string;
  gradient: string;
  Icon: React.ElementType;
}

function buildHeroStatus(
  allRosters: SharedRoster[],
  now: DateTime,
  base: string,
): HeroStatus {
  const todayStr = now.toFormat('yyyy-MM-dd');
  const nowTime  = now.toFormat('HH:mm');

  // collect all events across all rosters, find today's
  const allEvents = allRosters.flatMap(r => r.events ?? []);
  const todayEvts = allEvents.filter(e => e.date === todayStr);

  // 1. Active flight
  const flying = todayEvts.find(
    e => e.type === 'FLIGHT' && e.std && e.sta && nowTime >= e.std && nowTime <= e.sta,
  );
  if (flying) {
    const from = city(flying.depPort) || flying.depPort || '';
    const to   = city(flying.arrPort) || flying.arrPort || '';
    return {
      label:    'In the Air',
      subtitle: `${from} → ${to}`,
      tag:      flying.sta ? `Lands at ${flying.sta} local` : 'Currently flying',
      gradient: 'from-sky-500 to-sky-600',
      Icon:     Plane,
    };
  }

  // 2. Layover
  const layover = todayEvts.find(e => e.type === 'LAYOVER');
  if (layover) {
    const c         = city(layover.arrPort) || layover.arrPort || 'Away';
    const homeDay   = nextHomeDay(allEvents, now);
    const homeLabel = homeDay
      ? homeDay.hasSame(now.plus({ days: 1 }), 'day')
        ? 'Back tomorrow'
        : `Back in ${Math.ceil(homeDay.diff(now, 'days').days)} days`
      : '';
    return {
      label:    'On Layover',
      subtitle: c,
      tag:      homeLabel,
      gradient: 'from-indigo-500 to-indigo-600',
      Icon:     MapPin,
    };
  }

  // 3. Standby
  const standby = todayEvts.find(
    e => e.type === 'STANDBY' && e.signOn && e.signOff
      && nowTime >= e.signOn && nowTime <= e.signOff,
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

  // 4. Home
  const nextTrip = nextTripDay(allEvents, now);
  const tripTag  = nextTrip
    ? nextTrip.hasSame(now.plus({ days: 1 }), 'day')
      ? 'Next trip tomorrow'
      : `Next trip in ${Math.ceil(nextTrip.diff(now, 'days').days)} days`
    : 'No upcoming trips scheduled';

  return {
    label:    'At Home',
    subtitle: city(base) || base,
    tag:      tripTag,
    gradient: 'from-emerald-500 to-emerald-600',
    Icon:     Home,
  };
}

function buildEventMap(events: DutyEvent[]): Map<string, DutyEvent[]> {
  const map = new Map<string, DutyEvent[]>();
  for (const e of events ?? []) {
    const list = map.get(e.date) ?? [];
    list.push(e);
    map.set(e.date, list);
  }
  return map;
}

function nextHomeDay(events: DutyEvent[], now: DateTime): DateTime | null {
  const map = buildEventMap(events);
  const dates = Array.from(map.keys()).sort();
  for (const d of dates) {
    const dt = DateTime.fromISO(d);
    if (dt <= now.startOf('day')) continue;
    if (getDayStatus(map.get(d)!) === 'HOME') return dt;
  }
  return null;
}

function nextTripDay(events: DutyEvent[], now: DateTime): DateTime | null {
  const map = buildEventMap(events);
  const dates = Array.from(map.keys()).sort();
  for (const d of dates) {
    const dt = DateTime.fromISO(d);
    if (dt <= now.startOf('day')) continue;
    if (getDayStatus(map.get(d)!) !== 'HOME') return dt;
  }
  return null;
}

// ─── Calendar grid ────────────────────────────────────────────────────────────

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalDay {
  date: string;
  dayNum: number;
  status: DayStatus;
  isToday: boolean;
  isPast: boolean;
}

function buildCalendarDays(
  roster: SharedRoster,
  eventMap: Map<string, DutyEvent[]>,
  now: DateTime,
): (CalDay | null)[] {
  const start = DateTime.fromFormat(`${roster.month} ${roster.year}`, 'MMMM yyyy');
  if (!start.isValid) return [];

  const daysInMonth = start.daysInMonth ?? 30;
  // Luxon weekday: Mon=1 … Sun=7; we want Sun=0 offset
  const firstDow = start.weekday === 7 ? 0 : start.weekday;

  const cells: (CalDay | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dt      = start.set({ day: d });
    const dateStr = dt.toFormat('yyyy-MM-dd');
    cells.push({
      date:   dateStr,
      dayNum: d,
      status: getDayStatus(eventMap.get(dateStr) ?? []),
      isToday: dt.hasSame(now, 'day'),
      isPast:  dt < now.startOf('day'),
    });
  }
  return cells;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SpouseViewClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [apiData, setApiData]       = useState<ApiResponse | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [now, setNow]               = useState(() => DateTime.now());
  const [selectedIdx, setSelectedIdx] = useState(0);   // 0 = most recent roster
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Clock tick every minute
  useEffect(() => {
    const t = setInterval(() => setNow(DateTime.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Fetch data
  useEffect(() => {
    if (!token) { setLoading(false); setError('no-token'); return; }

    fetch(`/api/roster/share?token=${encodeURIComponent(token)}`)
      .then(async res => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Failed to load');
        setApiData(json as ApiResponse);
      })
      .catch(err => setError(String(err?.message ?? err)))
      .finally(() => setLoading(false));
  }, [token]);

  // Always reset selected date when switching month
  const handleMonthChange = (idx: number) => {
    setSelectedIdx(idx);
    setSelectedDate(null);
  };

  // Derived data
  const roster     = apiData?.rosters[selectedIdx];
  const eventMap   = useMemo(() => buildEventMap(roster?.events ?? []), [roster]);
  const calDays    = useMemo(
    () => roster ? buildCalendarDays(roster, eventMap, now) : [],
    [roster, eventMap, now],
  );
  const heroStatus = useMemo(
    () => apiData ? buildHeroStatus(apiData.rosters, now, apiData.pilot.base) : null,
    [apiData, now],
  );
  const selectedEvts = selectedDate ? (eventMap.get(selectedDate) ?? []) : [];

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-1 gap-3">
        <Loader2 size={32} className="animate-spin text-accent" />
        <p className="text-[12px] font-black uppercase tracking-[0.3em] text-text-muted">Loading roster…</p>
      </div>
    );
  }

  // ── Error ──
  if (error || !apiData || !heroStatus || !roster) {
    const isNoToken = error === 'no-token';
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-1 p-8 text-center gap-4">
        <div className="w-20 h-20 rounded-[2rem] bg-danger/10 flex items-center justify-center">
          <AlertCircle size={40} className="text-danger" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-text mb-2">
            {isNoToken ? 'Missing link' : 'Link not found'}
          </h1>
          <p className="text-[14px] text-text-muted font-bold leading-relaxed max-w-xs mx-auto">
            {isNoToken
              ? 'This page requires a share link from the pilot.'
              : 'This link may have expired or been reset. Ask the pilot to share a new one.'}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-6 py-3 rounded-full border border-border text-[13px] font-black text-text-muted hover:text-text transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  const { pilot, rosters } = apiData;

  return (
    <div className="min-h-screen bg-surface-1 pb-24">

      {/* ── Hero status (always today) ── */}
      <div className={`bg-gradient-to-br ${heroStatus.gradient} px-6 pt-14 pb-10 rounded-b-[3rem] shadow-xl relative overflow-hidden`}>
        <heroStatus.Icon
          size={150}
          strokeWidth={1}
          className="absolute -right-8 -bottom-8 opacity-[0.07] pointer-events-none"
        />
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mb-3">
            {pilot.full_name}{pilot.rank ? ` · ${pilot.rank}` : ''}
          </p>
          <h1 className="text-[2.6rem] font-black tracking-tighter text-white leading-none mb-1.5">
            {heroStatus.label}
          </h1>
          <p className="text-[19px] font-black text-white/85 mb-5">
            {heroStatus.subtitle}
          </p>
          {heroStatus.tag && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
              <span className="text-[11px] font-black text-white tracking-wide">{heroStatus.tag}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-5 space-y-5">

        {/* ── Month picker ── */}
        {rosters.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              disabled={selectedIdx >= rosters.length - 1}
              onClick={() => handleMonthChange(selectedIdx + 1)}
              className="w-9 h-9 rounded-full border border-border bg-white flex items-center justify-center text-text-muted disabled:opacity-30 transition-opacity"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 justify-center">
                {rosters.map((r, idx) => (
                  <button
                    key={`${r.month}-${r.year}`}
                    onClick={() => handleMonthChange(idx)}
                    className={`px-4 py-2 rounded-full text-[12px] font-black whitespace-nowrap transition-all ${
                      idx === selectedIdx
                        ? 'bg-accent text-accent-fg shadow-md'
                        : 'bg-white border border-border text-text-muted hover:text-text'
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
              className="w-9 h-9 rounded-full border border-border bg-white flex items-center justify-center text-text-muted disabled:opacity-30 transition-opacity"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ── Calendar ── */}
        <div className="bg-white rounded-[2rem] p-5 border border-border shadow-sm">

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-black text-text">
              {roster.month} {roster.year}
            </h2>
            <div className="flex items-center gap-2.5">
              {(['FLIGHT', 'LAYOVER', 'STANDBY'] as const).map(s => {
                const label = s === 'FLIGHT' ? 'Flying' : s === 'LAYOVER' ? 'Away' : 'Standby';
                const dot   = s === 'FLIGHT' ? 'bg-sky-300' : s === 'LAYOVER' ? 'bg-indigo-300' : 'bg-amber-300';
                return (
                  <span key={s} className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-text-subtle">
                    <span className={`w-2 h-2 rounded-sm ${dot}`} />
                    {label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* DOW headers */}
          <div className="grid grid-cols-7 mb-1.5">
            {DOW_LABELS.map(d => (
              <div key={d} className="text-center text-[9px] font-black uppercase tracking-widest text-text-subtle py-0.5">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((day, i) => {
              if (!day) return <div key={`pad-${i}`} />;
              const isSelected = selectedDate === day.date;
              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(isSelected ? null : day.date)}
                  className={`
                    aspect-square rounded-xl flex items-center justify-center
                    text-[13px] font-black transition-all duration-100
                    ${dayBg(day.status, day.isToday, isSelected)}
                    ${day.isPast && !day.isToday ? 'opacity-35' : ''}
                    ${isSelected ? 'scale-110' : 'active:scale-95'}
                  `}
                >
                  {day.dayNum}
                </button>
              );
            })}
          </div>

          {/* Day detail */}
          {selectedDate && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-start justify-between mb-2 gap-2">
                <p className="text-[12px] font-black uppercase tracking-widest text-text-subtle">
                  {DateTime.fromISO(selectedDate).toFormat('EEEE, d MMMM yyyy')}
                </p>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="shrink-0 text-text-subtle hover:text-text transition-colors mt-0.5"
                >
                  <ChevronUp size={16} />
                </button>
              </div>
              <div className="space-y-1.5">
                {describeDayEvents(selectedEvts).map((line, i) => (
                  <p key={i} className="text-[14px] font-bold text-text leading-snug">{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── All events list ── */}
        {(roster.events ?? []).length > 0 ? (
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-text-subtle mb-3 px-1">
              Full Schedule
            </h2>
            <div className="space-y-2">
              {Array.from(
                new Map(
                  (roster.events ?? []).map(e => [e.date, e.date])
                ).keys()
              )
                .sort()
                .map(dateStr => {
                  const dayEvts  = eventMap.get(dateStr) ?? [];
                  const status   = getDayStatus(dayEvts);
                  const dt       = DateTime.fromISO(dateStr);
                  const isToday  = dt.hasSame(now, 'day');
                  const isPast   = dt < now.startOf('day');
                  if (status === 'HOME') return null;
                  return (
                    <div
                      key={dateStr}
                      className={`bg-white rounded-[1.5rem] p-4 border transition-all ${
                        isToday ? 'border-accent shadow-md' : 'border-border'
                      } ${isPast ? 'opacity-50' : ''}`}
                    >
                      <div className="flex gap-3">
                        {/* Date pill */}
                        <div className={`shrink-0 w-11 h-11 rounded-2xl flex flex-col items-center justify-center text-center ${
                          isToday ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-text-muted'
                        }`}>
                          <span className="text-[8px] font-black uppercase leading-none">{dt.toFormat('ccc')}</span>
                          <span className="text-[16px] font-black leading-tight">{dt.toFormat('d')}</span>
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <span className={`inline-block text-[8px] font-black px-1.5 py-0.5 rounded-md tracking-widest uppercase mb-1.5 ${
                            status === 'FLIGHT'  ? 'bg-sky-100 text-sky-700' :
                            status === 'LAYOVER' ? 'bg-indigo-100 text-indigo-700' :
                            status === 'STANDBY' ? 'bg-amber-100 text-amber-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {status}
                          </span>
                          <div className="space-y-0.5">
                            {describeDayEvents(dayEvts).map((line, i) => (
                              <p key={i} className="text-[13px] font-bold text-text leading-snug">{line}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
                .filter(Boolean)}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] p-8 border border-border text-center">
            <p className="text-[13px] font-bold text-text-muted">No duty events for this month.</p>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="text-center py-4">
          <p className="text-[11px] font-black text-text-subtle uppercase tracking-[0.2em]">
            Shared via Otarosta
          </p>
          <p className="text-[10px] text-text-subtle/50 font-bold mt-1">
            Live read-only · Auto-updates
          </p>
        </div>

      </div>
    </div>
  );
}
