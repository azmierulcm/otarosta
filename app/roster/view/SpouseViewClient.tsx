'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { DateTime } from 'luxon';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, Moon, Coffee, ChevronRight, CalendarDays,
  MapPin, BadgeCheck, AlertCircle, Loader2,
  ChevronLeft, Clock, X,
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

// ─── Card data model (adapted from your design) ────────────────────────────────

type CardType = 'flight' | 'off' | 'standby' | 'training' | 'blank';

interface Sector {
  from: string;
  to: string;
  flight: string;
  depart: string;
  arrive: string;
}

interface CardItem {
  date: number;
  dateStr: string;
  day: string;         // "Mon" etc.
  type: CardType;
  code?: string;
  home: string;
  start?: string;
  end?: string;
  work?: string;
  continues: boolean;
  sectors: Sector[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cn(...parts: (string | boolean | undefined | null)[]): string {
  return parts.filter(Boolean).join(' ');
}

function cityName(iata?: string | null): string {
  if (!iata) return iata ?? '';
  return getAirportMeta(iata).city || iata;
}

function isOvernightFlight(f: DutyEvent): boolean {
  if (!f.std || !f.sta) return false;
  return f.sta < f.std;
}

// Convert our DutyEvent[] for a given day into a CardItem
function buildCardItem(
  dateStr: string,
  events: DutyEvent[],
  base: string,
): CardItem {
  const dt  = DateTime.fromISO(dateStr);
  const day = dt.toFormat('ccc'); // "Mon", "Tue" …

  const flights  = events.filter(e => e.type === 'FLIGHT');
  const standby  = events.find(e => e.type === 'STANDBY');
  const layover  = events.find(e => e.type === 'LAYOVER');
  const off      = events.find(e => e.type === 'OFF');
  const training = events.find(e => e.type === 'TRAINING' || e.type === 'GROUND');

  // ── Flight day ──
  if (flights.length > 0) {
    const first = flights[0];
    const last  = flights[flights.length - 1];
    const overnight = isOvernightFlight(last);
    const sectors: Sector[] = flights.map(f => ({
      from:   f.depPort || '—',
      to:     f.arrPort || '—',
      flight: f.item || f.flightNumber || '—',
      depart: f.std || f.signOn || '—',
      arrive: `${f.sta || f.signOff || '—'}${isOvernightFlight(f) ? '+' : ''}`,
    }));
    // Also attach layover sector if exists (represents the overnight leg)
    if (layover && layover.depPort && layover.arrPort) {
      sectors.push({
        from:   layover.depPort,
        to:     layover.arrPort,
        flight: layover.item || 'LAY',
        depart: layover.signOn || '—',
        arrive: layover.signOff || '—',
      });
    }
    return {
      date: dt.day, dateStr, day,
      type: 'flight',
      code: first.item || first.flightNumber,
      home: base,
      start: first.std || first.signOn,
      end:  `${last.sta || last.signOff || ''}${overnight ? '+' : ''}`,
      work: first.dutyCode,
      continues: overnight || !!layover,
      sectors,
    };
  }

  // ── Standby day (includes LAYOVER-only days — pilot away on standby) ──
  if (standby || (layover && !flights.length)) {
    const ev = standby || layover!;
    const sectors: Sector[] = (ev.depPort && ev.arrPort) ? [{
      from:   ev.depPort,
      to:     ev.arrPort,
      flight: ev.item || '',
      depart: ev.signOn || '—',
      arrive: ev.signOff || '—',
    }] : [];
    return {
      date: dt.day, dateStr, day,
      type: 'standby',
      code: ev.item,
      home: base,
      start: ev.signOn,
      end:   ev.signOff,
      continues: false,
      sectors,
    };
  }

  // ── Training / ground duty ──
  if (training) {
    return {
      date: dt.day, dateStr, day,
      type: 'training',
      code: training.item || training.description,
      home: base,
      start: training.signOn,
      end:   training.signOff,
      continues: false,
      sectors: [],
    };
  }

  // ── Off day ──
  if (off) {
    return {
      date: dt.day, dateStr, day,
      type: 'off',
      code: off.item || 'D',
      home: base,
      continues: false,
      sectors: [],
    };
  }

  // ── Blank / rest ──
  return {
    date: dt.day, dateStr, day,
    type: 'blank',
    home: base,
    continues: false,
    sectors: [],
  };
}

// Build the full month's card list (all days, including blanks with no events)
function buildRosterCards(roster: SharedRoster, base: string): CardItem[] {
  const start = DateTime.fromFormat(`${roster.month} ${roster.year}`, 'MMMM yyyy');
  if (!start.isValid) return [];

  // Group events by date
  const eventMap = new Map<string, DutyEvent[]>();
  for (const e of roster.events ?? []) {
    const list = eventMap.get(e.date) ?? [];
    list.push(e);
    eventMap.set(e.date, list);
  }

  const daysInMonth = start.daysInMonth ?? 30;
  const cards: CardItem[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dt      = start.set({ day: d });
    const dateStr = dt.toFormat('yyyy-MM-dd');
    cards.push(buildCardItem(dateStr, eventMap.get(dateStr) ?? [], base));
  }
  return cards;
}

// ─── Type styles ──────────────────────────────────────────────────────────────

const TYPE_STYLES: Record<CardType, {
  card: string; bar: string; badge: string; text: string;
}> = {
  flight:   { card: 'bg-sky-50 border-sky-200',       bar: 'from-sky-600 to-cyan-500',       badge: 'bg-sky-100 text-sky-700',       text: 'text-sky-900'     },
  off:      { card: 'bg-emerald-50 border-emerald-200', bar: 'from-emerald-700 to-lime-600',  badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-900' },
  standby:  { card: 'bg-yellow-50 border-yellow-200',  bar: 'from-yellow-600 to-amber-400',   badge: 'bg-yellow-100 text-yellow-800',  text: 'text-yellow-900'  },
  training: { card: 'bg-fuchsia-50 border-fuchsia-200', bar: 'from-fuchsia-700 to-pink-500', badge: 'bg-fuchsia-100 text-fuchsia-700', text: 'text-fuchsia-900' },
  blank:    { card: 'bg-slate-50 border-slate-200',    bar: 'from-slate-300 to-slate-200',    badge: 'bg-slate-100 text-slate-500',    text: 'text-slate-700'   },
};

const TYPE_LABEL: Record<CardType, string> = {
  flight: 'Flight', off: 'Off', standby: 'Standby', training: 'Training', blank: 'Rest',
};

// ─── RosterCard ───────────────────────────────────────────────────────────────

function RosterCard({
  item, isSelected, onClick, isToday,
}: {
  item: CardItem;
  isSelected: boolean;
  onClick: () => void;
  isToday: boolean;
}) {
  const style = TYPE_STYLES[item.type];

  return (
    <motion.button
      type="button"
      layout
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'group relative min-h-[132px] w-full overflow-hidden rounded-3xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg',
        style.card,
        isSelected  && 'ring-2 ring-slate-950/80',
        isToday     && 'ring-2 ring-accent shadow-md',
      )}
    >
      {/* Gradient bar */}
      <div className={cn('absolute inset-x-0 top-0 h-9 bg-gradient-to-r', style.bar)} />

      {/* Header row */}
      <div className="relative z-10 flex items-center justify-between">
        <span className={cn(
          'grid h-8 w-8 place-items-center rounded-lg border border-white/70 bg-white text-sm font-black shadow-sm',
          isToday && 'bg-accent text-accent-fg border-accent/30',
        )}>
          {String(item.date).padStart(2, '0')}
        </span>
        <div className="flex items-center gap-1 text-white/90">
          {item.type === 'flight' &&
            Array.from({ length: Math.min(item.sectors.length || 1, 3) }).map((_, i) => (
              <Plane key={i} size={12} />
            ))
          }
          {item.continues && <ChevronRight size={14} strokeWidth={3} />}
        </div>
      </div>

      {/* Body */}
      <div className="mt-8 space-y-2">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {item.day}
          </span>
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', style.badge)}>
            {TYPE_LABEL[item.type]}
          </span>
        </div>

        {/* Off / Training */}
        {(item.type === 'off' || item.type === 'training') && (
          <div className="grid place-items-center py-2">
            <div className={cn('text-2xl font-black', style.text)}>{item.code || '—'}</div>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <MapPin size={11} />{item.home}
            </div>
          </div>
        )}

        {/* Blank / Rest */}
        {item.type === 'blank' && (
          <div className="flex h-12 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-[11px] font-semibold text-slate-400">
            Rest
          </div>
        )}

        {/* Flight / Standby with sectors */}
        {(item.type === 'flight' || item.type === 'standby') && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-1 text-[11px] text-slate-600">
              <span>{item.start}</span>
              <span className={cn('text-[15px] font-black', style.text)}>{item.code}</span>
              <span>{item.end}</span>
            </div>
            {item.sectors.slice(0, 2).map((s, i) => (
              <div
                key={`${item.dateStr}-${s.flight}-${i}`}
                className="rounded-2xl bg-white/70 px-2.5 py-1.5 shadow-sm ring-1 ring-black/5"
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>{s.depart}</span>
                  <span className="text-slate-800">{s.flight}</span>
                  <span>{s.arrive}</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[11px] font-black text-slate-800">
                  <span>{s.from}</span>
                  <Plane size={10} className="text-slate-400" />
                  <span>{s.to}</span>
                </div>
              </div>
            ))}
            {item.sectors.length > 2 && (
              <p className="text-center text-[10px] font-bold text-slate-500">
                +{item.sectors.length - 2} more sector{item.sectors.length - 2 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  item,
  onClose,
}: {
  item: CardItem;
  onClose: () => void;
}) {
  const style = TYPE_STYLES[item.type];

  return (
    <motion.div
      key={item.dateStr}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.18 }}
      className="sticky bottom-4 z-20 mx-auto mt-4 w-full rounded-[2rem] border border-white/70 bg-white/95 p-4 shadow-2xl shadow-slate-900/15 backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('rounded-xl px-3 py-1 text-sm font-black', style.badge)}>
              {String(item.date).padStart(2, '0')} {item.day}
            </span>
            {item.type === 'flight' && item.work && (
              <span className="rounded-xl bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">
                {item.work}
              </span>
            )}
            {item.continues && (
              <span className="rounded-xl bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700 flex items-center gap-1">
                <ChevronRight size={13} strokeWidth={3} /> Continues next day
              </span>
            )}
          </div>
          <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
            {item.code || 'Open Day'}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {item.start && item.end
              ? `${item.work ? `${item.work} · ` : ''}${item.start} → ${item.end}`
              : `Base: ${item.home}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white">
            {item.type === 'off'      ? <Coffee size={18} />     :
             item.type === 'training' ? <BadgeCheck size={18} /> :
             item.type === 'standby'  ? <Clock size={18} />      :
             <Plane size={18} />}
          </div>
          <button
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-surface-2 text-text-muted hover:bg-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Sectors */}
      {item.sectors.length > 0 ? (
        <div className="mt-4 grid gap-2 grid-cols-1 sm:grid-cols-2">
          {item.sectors.map((s, i) => (
            <div
              key={`${s.flight}-${i}`}
              className="rounded-3xl bg-slate-50 p-3 ring-1 ring-slate-200"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-3">
                <span>Sector {i + 1}</span>
                <span className="font-black text-slate-700">{s.flight}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[20px] font-black text-slate-950 leading-none">{s.from}</p>
                  <p className="text-[11px] font-semibold text-slate-500 mt-1">{cityName(s.from)}</p>
                  <p className="text-[13px] font-black text-slate-700 mt-1">{s.depart}</p>
                </div>
                <div className="flex flex-1 items-center gap-2 text-slate-300">
                  <span className="h-px flex-1 bg-slate-300" />
                  <Plane size={16} className="text-slate-400" />
                  <span className="h-px flex-1 bg-slate-300" />
                </div>
                <div className="text-right">
                  <p className="text-[20px] font-black text-slate-950 leading-none">{s.to}</p>
                  <p className="text-[11px] font-semibold text-slate-500 mt-1">{cityName(s.to)}</p>
                  <p className="text-[13px] font-black text-slate-700 mt-1">{s.arrive}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-3xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
          {item.type === 'off'
            ? `Rest day at ${item.home}.`
            : item.type === 'blank'
            ? 'No duty scheduled.'
            : `${item.code || 'Duty'} at ${item.home}.`}
        </div>
      )}
    </motion.div>
  );
}

// ─── Hero status (today) ──────────────────────────────────────────────────────

function buildHeroLabel(rosters: SharedRoster[], now: DateTime, base: string): {
  label: string; sub: string; tag: string; grad: string;
} {
  const todayStr = now.toFormat('yyyy-MM-dd');
  const nowTime  = now.toFormat('HH:mm');
  const allEvts  = rosters.flatMap(r => r.events ?? []);
  const today    = allEvts.filter(e => e.date === todayStr);

  const flying = today.find(
    e => e.type === 'FLIGHT' && e.std && e.sta && nowTime >= e.std && nowTime <= e.sta,
  );
  if (flying) return {
    label: 'In the Air',
    sub:   `${cityName(flying.depPort)} → ${cityName(flying.arrPort)}`,
    tag:   flying.sta ? `Lands at ${flying.sta} local` : 'Currently flying',
    grad:  'from-sky-600 to-cyan-500',
  };

  if (today.find(e => e.type === 'LAYOVER')) {
    const lay = today.find(e => e.type === 'LAYOVER')!;
    return {
      label: 'On Layover', sub: cityName(lay.arrPort) || 'Away',
      tag: '', grad: 'from-indigo-600 to-purple-500',
    };
  }

  const sby = today.find(e => e.type === 'STANDBY' && e.signOn && e.signOff
    && nowTime >= e.signOn! && nowTime <= e.signOff!);
  if (sby) return {
    label: 'On Standby', sub: `Until ${sby.signOff}`,
    tag: 'May be called for a flight', grad: 'from-amber-500 to-yellow-400',
  };

  // Find next trip
  const sorted = Array.from(new Set(allEvts.map(e => e.date))).sort();
  const next = sorted.find(d => d > todayStr && ['FLIGHT','STANDBY','LAYOVER'].includes(
    allEvts.filter(e => e.date === d)[0]?.type,
  ));
  const daysTo = next ? Math.ceil(DateTime.fromISO(next).diff(now, 'days').days) : null;

  return {
    label: 'At Home',
    sub:   cityName(base) || base,
    tag:   daysTo != null ? (daysTo <= 1 ? 'Next trip tomorrow' : `Next trip in ${daysTo} days`) : 'No upcoming trips',
    grad:  'from-emerald-600 to-lime-500',
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

const FILTERS: { key: CardType | 'all'; label: string }[] = [
  { key: 'all',      label: 'All'      },
  { key: 'flight',   label: 'Flight'   },
  { key: 'off',      label: 'Off'      },
  { key: 'standby',  label: 'Standby'  },
  { key: 'training', label: 'Training' },
];

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SpouseViewClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [apiData, setApiData]           = useState<{ pilot: PilotInfo; rosters: SharedRoster[] } | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [now, setNow]                   = useState(() => DateTime.now());
  const [selectedIdx, setSelectedIdx]   = useState(0);
  const [selected, setSelected]         = useState<CardItem | null>(null);
  const [filter, setFilter]             = useState<CardType | 'all'>('all');

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

  const roster = apiData?.rosters[selectedIdx];

  const cards = useMemo(
    () => roster ? buildRosterCards(roster, apiData?.pilot.base ?? 'KUL') : [],
    [roster, apiData?.pilot.base],
  );

  const stats = useMemo(() => ({
    flights:  cards.filter(c => c.type === 'flight').length,
    sectors:  cards.reduce((n, c) => n + c.sectors.length, 0),
    offDays:  cards.filter(c => c.type === 'off').length,
  }), [cards]);

  const hero = useMemo(
    () => apiData ? buildHeroLabel(apiData.rosters, now, apiData.pilot.base) : null,
    [apiData, now],
  );

  const todayStr = now.toFormat('yyyy-MM-dd');

  const filtered = useMemo(
    () => filter === 'all' ? cards : cards.filter(c => c.type === filter),
    [cards, filter],
  );

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f7f5] gap-3">
        <Loader2 size={28} className="animate-spin text-sky-600" />
        <p className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-500">Loading roster…</p>
      </div>
    );
  }

  // ── Error ──
  if (error || !apiData || !roster || !hero) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f7f5] p-8 text-center gap-4">
        <div className="w-20 h-20 rounded-[2rem] bg-red-50 flex items-center justify-center">
          <AlertCircle size={36} className="text-red-500" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-950 mb-2">
            {error === 'no-token' ? 'Missing link' : 'Link not found'}
          </h1>
          <p className="text-[13px] text-slate-500 font-bold leading-relaxed max-w-xs mx-auto">
            {error === 'no-token'
              ? 'This page needs a share link from the pilot.'
              : 'This link may have expired or been reset. Ask the pilot to share a new one.'}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-full border border-slate-200 text-[13px] font-black text-slate-500 hover:text-slate-900 bg-white"
        >
          Try again
        </button>
      </div>
    );
  }

  const { pilot, rosters } = apiData;

  return (
    <main className="min-h-screen bg-[#f6f7f5] px-4 py-6 text-slate-950">
      <div className="mx-auto max-w-7xl space-y-4">

        {/* ── Header ── */}
        <header className="overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/15">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em]',
                `bg-gradient-to-r ${hero.grad} bg-clip-text text-transparent`,
              )}>
                <CalendarDays size={13} className="text-white/60" />
                <span className="text-white/70">{hero.label}</span>
                {hero.sub && <span className="text-white/50">· {hero.sub}</span>}
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight md:text-4xl">
                {pilot.full_name}
                {pilot.rank && <span className="ml-2 text-white/50 font-bold text-lg">{pilot.rank}</span>}
              </h1>
              <p className="mt-1 text-[13px] text-white/55 font-bold">
                {roster.month} {roster.year} Duty Roster
                {hero.tag && <span className="ml-2 text-amber-400">· {hero.tag}</span>}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 md:min-w-72">
              {[
                { n: stats.flights,  label: 'Flight days' },
                { n: stats.sectors,  label: 'Sectors'     },
                { n: stats.offDays,  label: 'Off days'    },
              ].map(s => (
                <div key={s.label} className="rounded-3xl bg-white/10 p-3 text-center">
                  <p className="text-2xl font-black">{s.n}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* ── Month picker (only if > 1 month uploaded) ── */}
        {rosters.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              disabled={selectedIdx >= rosters.length - 1}
              onClick={() => { setSelectedIdx(i => i + 1); setSelected(null); }}
              className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center disabled:opacity-30 shadow-sm"
            >
              <ChevronLeft size={15} />
            </button>
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 justify-center">
                {rosters.map((r, idx) => (
                  <button
                    key={`${r.month}-${r.year}`}
                    onClick={() => { setSelectedIdx(idx); setSelected(null); }}
                    className={cn(
                      'px-4 py-2 rounded-full text-[12px] font-black whitespace-nowrap transition-all shadow-sm',
                      idx === selectedIdx
                        ? 'bg-slate-950 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    {r.month} {r.year}
                  </button>
                ))}
              </div>
            </div>
            <button
              disabled={selectedIdx <= 0}
              onClick={() => { setSelectedIdx(i => i - 1); setSelected(null); }}
              className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center disabled:opacity-30 shadow-sm"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* ── Filter tabs ── */}
        <section className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setSelected(null); }}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition-all shadow-sm',
                filter === f.key
                  ? 'bg-slate-950 text-white shadow-slate-900/20'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
              )}
            >
              {f.label}
            </button>
          ))}
        </section>

        {/* ── Desktop DOW header ── */}
        {filter === 'all' && (
          <div className="hidden grid-cols-7 gap-2 lg:grid">
            {DOW.map(d => (
              <div key={d} className="rounded-2xl bg-[#7c1d0c] px-3 py-2 text-center text-[13px] font-black uppercase tracking-wide text-white">
                {d}
              </div>
            ))}
          </div>
        )}

        {/* ── Card grid ── */}
        <section className={cn(
          'grid gap-3',
          filter === 'all'
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 lg:gap-2'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        )}>
          {filtered.map(item => (
            <RosterCard
              key={item.dateStr}
              item={item}
              isSelected={selected?.dateStr === item.dateStr}
              isToday={item.dateStr === todayStr}
              onClick={() => setSelected(prev => prev?.dateStr === item.dateStr ? null : item)}
            />
          ))}
        </section>

        {/* ── Detail panel ── */}
        <AnimatePresence>
          {selected && (
            <DetailPanel item={selected} onClose={() => setSelected(null)} />
          )}
        </AnimatePresence>

        {/* ── Legend ── */}
        <section className="rounded-[2rem] bg-white p-4 ring-1 ring-slate-200 shadow-sm">
          <h3 className="text-[13px] font-black text-slate-950 mb-3">Legend</h3>
          <div className="grid gap-2 text-[12px] text-slate-600 grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-sky-50 p-2.5"><b className="text-sky-800">Blue</b> — Flight duty with sectors</div>
            <div className="rounded-2xl bg-emerald-50 p-2.5"><b className="text-emerald-800">Green</b> — Day off (D / DO)</div>
            <div className="rounded-2xl bg-yellow-50 p-2.5"><b className="text-yellow-800">Yellow</b> — Standby block</div>
            <div className="rounded-2xl bg-fuchsia-50 p-2.5"><b className="text-fuchsia-800">Purple</b> — Training / ground</div>
          </div>
        </section>

        <p className="text-center text-[11px] font-bold text-slate-400 pb-4">
          Shared via Otarosta · Live read-only view
        </p>

      </div>
    </main>
  );
}
