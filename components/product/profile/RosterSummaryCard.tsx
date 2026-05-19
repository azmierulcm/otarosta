'use client';

import React, { useState, useMemo } from 'react';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useRoster } from '@/lib/contexts/RosterContext';
import type { EarnedDestination } from '@/lib/actions/destinations';
import type { RosterSummary } from '@/lib/types/roster';

// ─────────────────────────────────────────────────────────────────────────────
// RosterSummaryCard — redesigned to match LiveRosterCard visual language
// ─────────────────────────────────────────────────────────────────────────────

type Period = 'month' | '6m' | '1y';

const PERIOD_TABS: { id: Period; label: string }[] = [
  { id: 'month', label: 'This month' },
  { id: '6m',   label: '6 months' },
  { id: '1y',   label: 'Year' },
];

// ── Month helpers ─────────────────────────────────────────────────────────────

const MONTH_ABBR_TO_IDX: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function rosterMonthLabel(r: RosterSummary): string {
  const key = r.month.trim().toUpperCase();
  const idx = MONTH_ABBR_TO_IDX[key] ?? (parseInt(r.month, 10) - 1);
  return `${MONTH_SHORT[idx] ?? r.month} ${r.year}`;
}

function periodLabel(rosterSlice: RosterSummary[], period: Period): string {
  if (!rosterSlice.length) return '—';
  const newest = rosterSlice[0];
  const oldest = rosterSlice[rosterSlice.length - 1];
  if (period === 'month') return rosterMonthLabel(newest);
  return `${rosterMonthLabel(oldest)} — ${rosterMonthLabel(newest)}`;
}

// ── Stats aggregation ─────────────────────────────────────────────────────────

interface PeriodStats {
  totalKm: number;
  totalSectors: number;
  uniqueDestinations: number;
  rosterCount: number;
  label: string;
  blockHours: number;
}

function aggregateStats(slice: RosterSummary[], period: Period): PeriodStats {
  const totalKm            = slice.reduce((s, r) => s + r.totalKm, 0);
  const totalSectors       = slice.reduce((s, r) => s + r.totalSectors, 0);
  const uniqueDestinations = slice.reduce((s, r) => s + r.uniqueDestinations, 0);
  return {
    totalKm,
    totalSectors,
    uniqueDestinations,
    rosterCount: slice.length,
    label: periodLabel(slice, period),
    blockHours: Math.round(totalKm / 850),
  };
}

function deltaVsPrev(current: RosterSummary[], prev: RosterSummary[]): number | null {
  if (!prev.length) return null;
  const cur = current.reduce((s, r) => s + r.totalKm, 0);
  const prv = prev.reduce((s, r) => s + r.totalKm, 0);
  if (prv === 0) return null;
  return Math.round(((cur - prv) / prv) * 100);
}

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtKm  = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
const fmtNum = (n: number) => n.toLocaleString();

// ── SVG map positions ─────────────────────────────────────────────────────────

const AIRPORT_SVG: Record<string, [number, number]> = {
  KUL: [745, 282], SIN: [752, 298], BKK: [738, 265], HKG: [782, 235],
  ICN: [825, 195], NRT: [820, 183], PEK: [783, 196], PVG: [795, 213],
  TPE: [800, 225], MNL: [795, 268], CGK: [758, 322], DPS: [780, 330],
  DEL: [668, 228], BOM: [662, 238], CMB: [680, 270], MAA: [672, 260],
  DXB: [622, 220], DOH: [618, 222], AUH: [625, 225], MCT: [638, 232],
  IST: [560, 182], CAI: [568, 212], JNB: [572, 372], CPT: [528, 390],
  ADD: [600, 280], NBO: [600, 310],
  LHR: [500, 145], CDG: [508, 150], AMS: [504, 143], FRA: [518, 152],
  MAD: [490, 168], FCO: [530, 170], ZRH: [515, 152], VIE: [530, 155], MUC: [524, 150],
  SYD: [868, 402], MEL: [862, 418], BNE: [878, 390], PER: [798, 398], AKL: [932, 418],
  JFK: [272, 186], LAX: [174, 217], ORD: [240, 190], YYZ: [258, 183], GRU: [288, 358],
  // MAS regional
  PEN: [730, 268], KNO: [730, 285], BPN: [790, 300], PKU: [724, 278],
  JOG: [765, 320], UPG: [800, 315], PNH: [762, 272], SGN: [762, 272],
  HAN: [762, 252], CNX: [730, 255], HKT: [726, 275],
};

function getPinPos(iata: string): [number, number] {
  return AIRPORT_SVG[iata.toUpperCase()] ?? [500, 250];
}

// ── Tiny inline icon ──────────────────────────────────────────────────────────

const Ico = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICON = {
  plane:   'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-3 3-2-.5c-.4-.1-.8 0-1 .3l-.3.3c-.3.4-.3 1 .1 1.3L6 18l1.8 2.8c.3.4.9.4 1.3.1l.3-.3c.3-.2.4-.6.3-1l-.5-2 3-3 4.3 4.8c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1Z',
  globe:   'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.5-2.5 4-6 4-9s-1.5-6.5-4-9m0 18c-2.5-2.5-4-6-4-9s1.5-6.5 4-9M3.5 9h17M3.5 15h17',
  clock:   'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14v4l3 3',
  pin:     'M12 21s-7-7.5-7-12a7 7 0 0 1 14 0c0 4.5-7 12-7 12ZM12 9a2 2 0 1 0 .001 4.001A2 2 0 0 0 12 9Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface RosterSummaryCardProps {
  earnedDestinations: EarnedDestination[];
  onGenerateCard?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function RosterSummaryCard({ earnedDestinations, onGenerateCard }: RosterSummaryCardProps) {
  const { rosters } = useRoster();
  const [period, setPeriod] = useState<Period>('month');

  const { currentSlice, prevSlice } = useMemo(() => {
    const n = period === 'month' ? 1 : period === '6m' ? 6 : 12;
    return { currentSlice: rosters.slice(0, n), prevSlice: rosters.slice(n, n * 2) };
  }, [rosters, period]);

  const stats   = useMemo(() => aggregateStats(currentSlice, period), [currentSlice, period]);
  const delta   = useMemo(() => deltaVsPrev(currentSlice, prevSlice), [currentSlice, prevSlice]);
  const positive = (delta ?? 0) >= 0;

  const topDests = useMemo(
    () => earnedDestinations.filter((d) => !d.isHome).slice(0, 3),
    [earnedDestinations],
  );

  const mapPins = useMemo(() => {
    const all = [
      { iata: 'KUL', isHome: true },
      ...earnedDestinations.filter((d) => !d.isHome).slice(0, 5).map((d) => ({ iata: d.iata, isHome: false })),
    ];
    return all.map((p) => ({ ...p, pos: getPinPos(p.iata) }));
  }, [earnedDestinations]);

  const topRoute = useMemo(() => {
    const top = earnedDestinations.find((d) => !d.isHome);
    return top ? `KUL → ${top.iata}` : null;
  }, [earnedDestinations]);

  if (!rosters.length) return null;

  return (
    <div className="bg-bg border border-border rounded-[var(--radius-xl)] overflow-hidden"
         style={{ boxShadow: 'var(--shadow-md)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 pt-5 pb-4 border-b border-border">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-text-subtle font-mono">
          // Roster Summary
        </p>

        {/* Period tabs — pill strip */}
        <div className="flex items-center gap-0.5 bg-surface rounded-full p-1 border border-border">
          {PERIOD_TABS.map((tab) => {
            const active = tab.id === period;
            return (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id)}
                className="px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all"
                style={{
                  background: active ? 'var(--accent)' : 'transparent',
                  color:      active ? 'var(--accent-fg)' : 'var(--text-muted)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] divide-y md:divide-y-0 md:divide-x divide-border">

        {/* ── Left: hero + stats ──────────────────────────────────────────── */}
        <div className="p-6 flex flex-col gap-5">

          {/* Period pill */}
          <div>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              {stats.label}
            </span>
          </div>

          {/* Hero: km in the sky */}
          <div>
            <div className="flex items-end gap-2 leading-none">
              <span className="text-[52px] font-black leading-none tracking-tighter text-text font-mono">
                {fmtKm(stats.totalKm)}
              </span>
              <span className="mb-2 text-[13px] font-bold text-text-muted">km in the sky</span>
            </div>

            {/* Delta + top route */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {delta !== null && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{
                    background: positive ? 'var(--success-soft)' : 'var(--danger-soft)',
                    color:      positive ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {positive
                    ? <TrendingUp  size={11} strokeWidth={2.5} />
                    : <TrendingDown size={11} strokeWidth={2.5} />}
                  {positive ? '+' : ''}{delta}% vs prev
                </span>
              )}
              {topRoute && (
                <span className="text-[11px] font-bold text-text-muted">
                  Top route: <span className="text-text">{topRoute}</span>
                </span>
              )}
            </div>
          </div>

          {/* 4-up stat grid — matching card style */}
          <div className="grid grid-cols-4 gap-2">
            <StatModule icon={ICON.plane}  value={fmtNum(stats.totalSectors)}       label="Sectors"  />
            <StatModule icon={ICON.pin}    value={fmtNum(stats.uniqueDestinations)} label="Dests"    />
            <StatModule icon={ICON.clock}  value={fmtNum(stats.blockHours)}         label="Block h"  />
            <StatModule icon={ICON.globe}  value={fmtNum(stats.rosterCount)}        label="Months"   />
          </div>
        </div>

        {/* ── Right: map + destinations ─────────────────────────────────────── */}
        <div className="p-6 flex flex-col gap-5">

          {/* Mini world map */}
          <div className="rounded-[var(--radius-lg)] overflow-hidden border border-border"
               style={{ background: 'var(--surface)' }}>
            <MiniWorldMap pins={mapPins} />
          </div>

          {/* Top destinations */}
          {topDests.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-subtle font-mono mb-2.5">
                Top Destinations
              </p>
              <ul className="space-y-1.5">
                {topDests.map((d, i) => (
                  <li
                    key={d.iata}
                    className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border px-3 py-2.5 transition-colors hover:bg-surface"
                    style={{ background: 'var(--surface)' }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank circle */}
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-accent-fg shrink-0"
                        style={{ background: 'var(--accent)' }}
                      >
                        {i + 1}
                      </span>
                      <div className="leading-tight">
                        <p className="text-[13px] font-black text-text tracking-tight">{d.iata}</p>
                        <p className="text-[10px] font-bold text-text-muted">{d.visits}×</p>
                      </div>
                    </div>
                    {d.isNew && (
                      <span
                        className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-accent-fg"
                        style={{ background: 'var(--accent)' }}
                      >
                        New
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer: mission recap CTA ─────────────────────────────────────── */}
      {onGenerateCard && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-subtle font-mono">
            // Mission Recap
          </p>
          <button
            onClick={onGenerateCard}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-[12px] font-bold text-text hover:bg-surface hover:border-accent hover:text-accent transition-all"
          >
            Generate card
            <ArrowRight size={13} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Stat module — matching LiveRosterCard SmallStat style ─────────────────────

function StatModule({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="flex flex-col items-start rounded-[var(--radius-lg)] border border-border px-2.5 py-3 gap-1 transition-colors"
         style={{ background: 'var(--surface)' }}>
      <span style={{ color: 'var(--accent)' }}><Ico d={icon} size={13} /></span>
      <p className="text-[18px] font-black leading-none tracking-tight text-text font-mono">{value}</p>
      <p className="text-[10px] font-bold text-text-muted">{label}</p>
    </div>
  );
}

// ── Mini world map ─────────────────────────────────────────────────────────────

interface MapPin { iata: string; isHome: boolean; pos: [number, number] }

function MiniWorldMap({ pins }: { pins: MapPin[] }) {
  const continents = [
    { cx: 190, cy: 180, rx: 90,  ry: 55 },
    { cx: 270, cy: 320, rx: 42,  ry: 78 },
    { cx: 505, cy: 165, rx: 60,  ry: 42 },
    { cx: 525, cy: 305, rx: 60,  ry: 85 },
    { cx: 720, cy: 210, rx: 120, ry: 65 },
    { cx: 855, cy: 405, rx: 55,  ry: 32 },
  ];

  const home  = pins.find((p) => p.isHome);
  const dests = pins.filter((p) => !p.isHome);

  return (
    <svg viewBox="0 0 1000 500" className="w-full">
      <defs>
        <pattern id="rc-dots" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="currentColor" opacity="0.05" />
        </pattern>
      </defs>

      {/* Dot grid background */}
      <rect x="0" y="0" width="1000" height="500" fill="url(#rc-dots)" className="text-text" />

      {/* Continent blobs */}
      <g fill="var(--accent)" opacity="0.07">
        {continents.map((c, i) => (
          <ellipse key={i} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} />
        ))}
      </g>

      {/* Equator line */}
      <line x1="0" y1="250" x2="1000" y2="250"
            stroke="currentColor" strokeOpacity="0.06" strokeWidth="1"
            strokeDasharray="4 10" className="text-text" />

      {/* Route arcs: home → each destination */}
      {home && dests.map((dest) => {
        const [hx, hy] = home.pos;
        const [dx, dy] = dest.pos;
        const mx = (hx + dx) / 2;
        const my = Math.min(hy, dy) - 60;
        return (
          <path
            key={dest.iata}
            d={`M ${hx} ${hy} Q ${mx} ${my} ${dx} ${dy}`}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="4 10"
            opacity="0.5"
          />
        );
      })}

      {/* Destination pins */}
      {dests.map((p) => {
        const [x, y] = p.pos;
        return (
          <g key={p.iata}>
            <circle cx={x} cy={y} r="14" fill="var(--accent)" opacity="0.12" />
            <circle cx={x} cy={y} r="5"  fill="var(--accent)" stroke="white" strokeWidth="2" />
          </g>
        );
      })}

      {/* Home pin (KUL) */}
      {home && (
        <g>
          <circle cx={home.pos[0]} cy={home.pos[1]} r="18" fill="var(--accent)" opacity="0.15" />
          <circle cx={home.pos[0]} cy={home.pos[1]} r="7"  fill="var(--accent)" stroke="white" strokeWidth="2.5" />
        </g>
      )}
    </svg>
  );
}
