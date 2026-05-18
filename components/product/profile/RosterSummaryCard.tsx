'use client';

import React, { useState, useMemo } from 'react';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useRoster } from '@/lib/contexts/RosterContext';
import type { EarnedDestination } from '@/lib/actions/destinations';
import type { RosterSummary } from '@/lib/types/roster';

// ─────────────────────────────────────────────────────────────────────────────
// RosterSummaryCard
//
// Replaces MonthlyRecap in the profile page with a rich, period-switchable
// summary card. Styled entirely with cemrosta CSS variables — no hardcoded
// colours. Data comes from useRoster() (real summaries) + earnedDestinations
// (lifetime visit counts for the destinations list and map pins).
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
  // r.month can be "MAY", "May", "05", "5" etc.
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
  /** Estimated block hours: km ÷ 850 (MAS avg block speed) */
  blockHours: number;
}

function aggregateStats(slice: RosterSummary[], period: Period): PeriodStats {
  const totalKm             = slice.reduce((s, r) => s + r.totalKm, 0);
  const totalSectors        = slice.reduce((s, r) => s + r.totalSectors, 0);
  const uniqueDestinations  = slice.reduce((s, r) => s + r.uniqueDestinations, 0);
  return {
    totalKm,
    totalSectors,
    uniqueDestinations,
    rosterCount: slice.length,
    label: periodLabel(slice, period),
    blockHours: Math.round(totalKm / 850),
  };
}

/** pct delta vs previous period; returns null if no comparison data */
function deltaVsPrev(current: RosterSummary[], prev: RosterSummary[]): number | null {
  if (!prev.length) return null;
  const cur  = current.reduce((s, r) => s + r.totalKm, 0);
  const prv  = prev.reduce((s, r) => s + r.totalKm, 0);
  if (prv === 0) return null;
  return Math.round(((cur - prv) / prv) * 100);
}

// ── Number formatters ─────────────────────────────────────────────────────────

const fmtKm   = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
const fmtNum  = (n: number) => n.toLocaleString();

// ── Airport → SVG coordinate map ─────────────────────────────────────────────
// SVG viewBox: 0 0 1000 500. Approximate positions for common MAS destinations.

const AIRPORT_SVG: Record<string, [number, number]> = {
  KUL: [745, 282], SIN: [752, 298], BKK: [738, 265], HKG: [782, 235],
  ICN: [825, 195], NRT: [820, 183], PEK: [783, 196], PVG: [795, 213],
  TPE: [800, 225], MNL: [795, 268], CGK: [758, 322], DPS: [780, 330],
  DEL: [668, 228], BOM: [662, 238], CMB: [680, 270], MAA: [672, 260],
  DXB: [622, 220], DOH: [618, 222], AUH: [625, 225], MCT: [638, 232],
  IST: [560, 182], CAI: [568, 212], JNB: [572, 372], CPT: [528, 390],
  ADD: [600, 280], NBO: [600, 310],
  LHR: [500, 145], CDG: [508, 150], AMS: [504, 143], FRA: [518, 152],
  MAD: [490, 168], BCN: [495, 163], FCO: [530, 170], ZRH: [515, 152],
  VIE: [530, 155], MUC: [524, 150],
  SYD: [868, 402], MEL: [862, 418], BNE: [878, 390], PER: [798, 398],
  AKL: [932, 418], CHC: [928, 428],
  JFK: [272, 186], LAX: [174, 217], ORD: [240, 190], YYZ: [258, 183],
  GRU: [288, 358], EZE: [278, 388],
};

// Fallback: continent centre-of-mass if IATA not in our map
const FALLBACK_POS: [number, number] = [500, 250];

function getPinPos(iata: string): [number, number] {
  return AIRPORT_SVG[iata.toUpperCase()] ?? FALLBACK_POS;
}

// ─────────────────────────────────────────────────────────────────────────────

interface RosterSummaryCardProps {
  earnedDestinations: EarnedDestination[];
  onGenerateCard?: () => void;
}

export function RosterSummaryCard({ earnedDestinations, onGenerateCard }: RosterSummaryCardProps) {
  const { rosters } = useRoster();
  const [period, setPeriod] = useState<Period>('month');

  // ── Slice rosters by period ─────────────────────────────────────────────────
  const { currentSlice, prevSlice } = useMemo(() => {
    const n = period === 'month' ? 1 : period === '6m' ? 6 : 12;
    return {
      currentSlice: rosters.slice(0, n),
      prevSlice:    rosters.slice(n, n * 2),
    };
  }, [rosters, period]);

  const stats = useMemo(() => aggregateStats(currentSlice, period), [currentSlice, period]);
  const delta = useMemo(() => deltaVsPrev(currentSlice, prevSlice), [currentSlice, prevSlice]);
  const positive = (delta ?? 0) >= 0;

  // ── Top destinations (from earnedDestinations, excl. home base) ────────────
  const topDests = useMemo(
    () => earnedDestinations.filter((d) => !d.isHome).slice(0, 3),
    [earnedDestinations],
  );

  // ── Map pins (home + top 5 destinations) ──────────────────────────────────
  const mapPins = useMemo(() => {
    const all = [
      { iata: 'KUL', isHome: true },
      ...earnedDestinations.filter((d) => !d.isHome).slice(0, 5).map((d) => ({ iata: d.iata, isHome: false })),
    ];
    return all.map((p) => ({ ...p, pos: getPinPos(p.iata) }));
  }, [earnedDestinations]);

  // ── Top route (KUL → most visited non-home dest) ──────────────────────────
  const topRoute = useMemo(() => {
    const top = earnedDestinations.find((d) => !d.isHome);
    return top ? `KUL → ${top.iata}` : null;
  }, [earnedDestinations]);

  if (!rosters.length) return null;

  return (
    <div
      className="bg-bg border border-border rounded-[var(--radius-lg)] overflow-hidden"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      {/* ── Header row: label + period tabs ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 pt-5 pb-4 border-b border-border">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-text-subtle font-mono">
          // Roster Summary
        </p>

        {/* Period tab strip */}
        <div className="flex items-center gap-1 bg-surface-2 rounded-full p-1">
          {PERIOD_TABS.map((tab) => {
            const active = tab.id === period;
            return (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id)}
                className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all"
                style={{
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? 'var(--accent-fg)' : 'var(--text-muted)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Body: two-column layout ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] divide-y md:divide-y-0 md:divide-x divide-border">

        {/* ── Left: hero stat + 4-up grid ─────────────────────────────────── */}
        <div className="p-6 flex flex-col gap-5">
          {/* Period label */}
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
            {stats.label}
          </p>

          {/* Hero: km in the sky */}
          <div>
            <div className="flex items-end gap-2">
              <span className="text-[52px] font-bold leading-none tracking-tighter text-text font-mono">
                {fmtKm(stats.totalKm)}
              </span>
              <span className="mb-2 text-[13px] font-medium text-text-muted">km in the sky</span>
            </div>

            {/* Delta badge */}
            {delta !== null && (
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[11px] font-bold"
                  style={{
                    background: positive ? 'var(--success-soft)' : 'var(--danger-soft)',
                    color:      positive ? 'var(--success)'      : 'var(--danger)',
                  }}
                >
                  {positive
                    ? <TrendingUp  size={11} strokeWidth={2.5} />
                    : <TrendingDown size={11} strokeWidth={2.5} />}
                  {positive ? '+' : ''}{delta}% vs prev
                </span>
                {topRoute && (
                  <span className="text-[11px] text-text-muted">· top route {topRoute}</span>
                )}
              </div>
            )}
          </div>

          {/* 4-up stat boxes */}
          <div className="grid grid-cols-4 gap-2">
            <StatBox value={fmtNum(stats.totalSectors)}       label="Sectors" />
            <StatBox value={fmtNum(stats.uniqueDestinations)} label="Dests" />
            <StatBox value={fmtNum(stats.blockHours)}         label="Block h" />
            <StatBox value={fmtNum(stats.rosterCount)}        label="Months" />
          </div>
        </div>

        {/* ── Right: mini world map + top destinations ─────────────────────── */}
        <div className="p-6 flex flex-col gap-4">
          {/* Mini world map */}
          <div className="rounded-[var(--radius-md)] overflow-hidden bg-surface border border-border">
            <MiniWorldMap pins={mapPins} />
          </div>

          {/* Top destinations */}
          {topDests.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-subtle mb-2 font-mono">
                Top destinations
              </p>
              <ul className="space-y-1">
                {topDests.map((d, i) => (
                  <li
                    key={d.iata}
                    className="flex items-center justify-between rounded-[var(--radius-md)] bg-surface px-3 py-2 border border-border"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black text-accent-fg"
                        style={{ background: 'var(--accent)' }}
                      >
                        {i + 1}
                      </span>
                      <div className="leading-tight">
                        <p className="text-[12px] font-bold text-text">{d.iata}</p>
                        <p className="text-[10px] text-text-muted font-mono">{d.visits}×</p>
                      </div>
                    </div>
                    {d.isNew && (
                      <span
                        className="text-[9px] font-black uppercase tracking-wider px-1.5 py-[2px] rounded-full text-accent-fg"
                        style={{ background: 'var(--accent)' }}
                      >
                        new
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer: generate card CTA ────────────────────────────────────── */}
      {onGenerateCard && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-subtle font-mono">
            // Mission recap
          </p>
          <button
            onClick={onGenerateCard}
            className="flex items-center gap-1.5 text-[12px] font-bold text-text hover:text-accent transition-colors"
          >
            Generate card
            <ArrowRight size={13} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-start rounded-[var(--radius-md)] bg-surface border border-border px-2 py-2.5">
      <p className="text-[18px] font-bold leading-none tracking-tight text-text font-mono">{value}</p>
      <p className="mt-1 text-[10px] text-text-muted">{label}</p>
    </div>
  );
}

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

  // Arc from home (KUL) to each destination
  const home = pins.find((p) => p.isHome);
  const dests = pins.filter((p) => !p.isHome);

  return (
    <svg viewBox="0 0 1000 500" className="w-full">
      {/* dotted graticule */}
      <defs>
        <pattern id="rc-dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="currentColor" opacity="0.06" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="1000" height="500" fill="url(#rc-dots)" className="text-text" />

      {/* continent blobs */}
      <g className="text-text" fill="currentColor" opacity="0.07">
        {continents.map((c, i) => (
          <ellipse key={i} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} />
        ))}
      </g>

      {/* equator */}
      <line x1="0" y1="250" x2="1000" y2="250" stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" strokeDasharray="4 8" className="text-text" />

      {/* route arcs from home to each destination */}
      {home && dests.map((dest) => {
        const [hx, hy] = home.pos;
        const [dx, dy] = dest.pos;
        const mx = (hx + dx) / 2;
        const my = Math.min(hy, dy) - 55;
        return (
          <path
            key={dest.iata}
            d={`M ${hx} ${hy} Q ${mx} ${my} ${dx} ${dy}`}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="3 9"
            opacity="0.55"
          />
        );
      })}

      {/* destination pins */}
      {dests.map((p) => {
        const [x, y] = p.pos;
        return (
          <g key={p.iata}>
            <circle cx={x} cy={y} r="13" fill="var(--accent)" opacity="0.15" />
            <circle cx={x} cy={y} r="5.5" fill="var(--accent)" stroke="white" strokeWidth="2" />
          </g>
        );
      })}

      {/* home pin (KUL) — slightly larger, solid */}
      {home && (
        <g>
          <circle cx={home.pos[0]} cy={home.pos[1]} r="16" fill="var(--accent)" opacity="0.2" />
          <circle cx={home.pos[0]} cy={home.pos[1]} r="7" fill="var(--accent)" stroke="white" strokeWidth="2.5" />
        </g>
      )}
    </svg>
  );
}
