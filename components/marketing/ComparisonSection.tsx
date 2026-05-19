'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPinned, Share2, Download, Check } from 'lucide-react';
import { getPatchImageUrl } from '@/lib/patches/patch-images';

/* ── City patches for passport card ───────────────────────────────────────── */
const PASSPORT_PATCHES = ['KUL', 'LHR', 'SIN', 'HKG', 'BKK', 'SYD', 'CDG', 'NRT', 'PEN', 'DEL', 'DPS', 'ICN'];

/* ── Calendar month data — May 2026 (May 1 = Friday, Mon-Sun week) ────────── */
type DutyKind = 'flight' | 'layover' | 'standby';
const DUTY_STYLE: Record<DutyKind, { bg: string; text: string; dot: string }> = {
  flight:  { bg: 'bg-sky-50',    text: 'text-sky-700',    dot: 'bg-sky-400' },
  layover: { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  standby: { bg: 'bg-yellow-50', text: 'text-yellow-800', dot: 'bg-yellow-400' },
};
const MAY_DUTIES: Record<number, { kind: DutyKind; detail: string[] }> = {
  4:  { kind: 'flight',  detail: ['KUL → SIN', 'MH610 · 08:00–10:20'] },
  5:  { kind: 'flight',  detail: ['SIN → KUL', 'MH611 · 11:30–13:50'] },
  7:  { kind: 'flight',  detail: ['KUL → HKG', 'MH070 · 07:55–11:55'] },
  8:  { kind: 'layover', detail: ['Layover · Hong Kong'] },
  9:  { kind: 'flight',  detail: ['HKG → KUL', 'MH071 · 12:45–17:10'] },
  12: { kind: 'standby', detail: ['Standby · KUL Base'] },
  14: { kind: 'flight',  detail: ['KUL → LHR', 'MH001 · 23:50–06:10+'] },
  15: { kind: 'layover', detail: ['Layover · London'] },
  16: { kind: 'layover', detail: ['Layover · London'] },
  17: { kind: 'flight',  detail: ['LHR → KUL', 'MH002 · 13:30–08:20+'] },
  21: { kind: 'flight',  detail: ['KUL → SYD', 'MH121 · 22:55–10:50+'] },
  22: { kind: 'layover', detail: ['Layover · Sydney'] },
  23: { kind: 'flight',  detail: ['SYD → KUL', 'MH120 · 12:30–18:50'] },
  27: { kind: 'standby', detail: ['Standby · KUL Base'] },
  28: { kind: 'flight',  detail: ['KUL → CDG', 'MH098 · 01:00–07:30'] },
  29: { kind: 'layover', detail: ['Layover · Paris'] },
  30: { kind: 'flight',  detail: ['CDG → KUL', 'MH099 · 10:30–06:30+'] },
};
// 4 leading nulls (Mon–Thu), then days 1–31
const CALENDAR_CELLS: Array<number | null> = [
  null, null, null, null, 1, 2, 3,
  4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17,
  18, 19, 20, 21, 22, 23, 24,
  25, 26, 27, 28, 29, 30, 31,
];
const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/* ── Sub-components ────────────────────────────────────────────────────────── */
function CalendarCard() {
  const [hovered, setHovered] = useState<number | null>(null);
  const duty = hovered ? MAY_DUTIES[hovered] ?? null : null;

  return (
    <div className="bg-white border border-border rounded-[2rem] p-6 flex flex-col gap-4 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-500 h-full">
      {/* Header */}
      <div>
        <div className="text-[9px] font-black uppercase tracking-[0.35em] text-accent font-mono mb-1.5">01 · Calendar Sync</div>
        <div className="text-xl font-black text-text tracking-tight leading-none">Your roster, live<br />in any calendar.</div>
      </div>

      {/* Month label */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-text font-mono uppercase tracking-widest">May 2026</span>
        <div className="flex items-center gap-1 text-[10px] font-bold text-success">
          <Check size={10} strokeWidth={3} className="text-success" />
          Synced
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_HEADERS.map((d, i) => (
            <div key={i} className="text-center text-[9px] font-black text-text-subtle">{d}</div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7 gap-[3px]">
          {CALENDAR_CELLS.map((day, i) => {
            if (!day) return <div key={i} />;
            const d = MAY_DUTIES[day];
            const style = d ? DUTY_STYLE[d.kind] : null;
            const isHov = hovered === day;
            return (
              <div
                key={i}
                onMouseEnter={() => setHovered(day)}
                onMouseLeave={() => setHovered(null)}
                className={`aspect-square rounded-md flex flex-col items-center justify-center cursor-pointer transition-all relative ${
                  style
                    ? `${style.bg} ${isHov ? 'ring-2 ring-accent/40 scale-110 z-10 shadow-sm' : ''}`
                    : 'hover:bg-surface-2'
                }`}
              >
                <span className={`text-[9px] font-black leading-none ${style ? style.text : 'text-text-subtle'}`}>
                  {day}
                </span>
                {style && (
                  <div className={`w-[3px] h-[3px] rounded-full mt-[2px] ${style.dot}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hover detail panel */}
      <div className="rounded-xl border border-border px-3 py-2 min-h-[52px] flex items-center">
        {duty && hovered ? (
          <div className="flex items-start gap-2">
            <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${DUTY_STYLE[duty.kind].dot}`} />
            <div>
              <p className="text-[9px] font-black uppercase tracking-wide text-text-muted mb-0.5">
                May {hovered}
              </p>
              {duty.detail.map((line, i) => (
                <p key={i} className={`leading-snug ${
                  i === 0 ? 'text-[11px] font-black text-text' : 'text-[10px] text-text-muted font-bold font-mono'
                }`}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-text-subtle font-bold italic">Hover a day to see duty details</p>
        )}
      </div>

      {/* Export strip */}
      <div className="flex items-center gap-2">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent text-accent-fg text-[11px] font-black">
          <Download size={12} strokeWidth={3} />
          Export .ics
        </button>
        <div className="flex items-center gap-1 text-[10px] text-text-muted font-bold">
          <Check size={11} className="text-success" strokeWidth={3} />
          Google
        </div>
        <div className="flex items-center gap-1 text-[10px] text-text-muted font-bold">
          <Check size={11} className="text-success" strokeWidth={3} />
          Apple
        </div>
      </div>
    </div>
  );
}

function PassportCard() {
  return (
    <div className="bg-white border border-border rounded-[2rem] p-6 flex flex-col gap-5 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-500 h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.35em] text-accent font-mono mb-1.5">02 · Destination Passport</div>
          <div className="text-xl font-black text-text tracking-tight leading-none">Every city<br />you&apos;ve ever landed.</div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-accent/5 border border-accent/10 flex items-center justify-center shrink-0">
          <MapPinned size={18} className="text-accent" />
        </div>
      </div>

      {/* Patch grid — real artwork */}
      <div className="flex-1 grid grid-cols-4 gap-2 content-start">
        {PASSPORT_PATCHES.map((code) => {
          const url = getPatchImageUrl(code);
          return (
            <div key={code} className="flex flex-col items-center gap-0.5">
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={code} className="w-full aspect-square object-contain drop-shadow-sm" />
              ) : (
                <div className="w-full aspect-square rounded-lg bg-accent/5 border border-accent/15 flex items-center justify-center text-[8px] font-black font-mono text-accent">
                  {code}
                </div>
              )}
              <span className="text-[7px] font-black font-mono text-text-subtle">{code}</span>
            </div>
          );
        })}
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-full aspect-square rounded-lg border border-dashed border-border flex items-center justify-center text-[8px] font-black text-text-subtle font-mono">
            +35
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="pt-4 border-t border-border grid grid-cols-3 gap-2 text-center">
        {[
          { val: '47', label: 'Cities' },
          { val: '3', label: 'Continents' },
          { val: '1,240', label: 'Sectors' },
        ].map(({ val, label }) => (
          <div key={label}>
            <div className="text-xl font-black text-text tracking-tighter">{val}</div>
            <div className="text-[8px] font-black text-text-subtle uppercase tracking-widest font-mono mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecapCard() {
  const LHR = getPatchImageUrl('LHR');
  const CDG = getPatchImageUrl('CDG');

  return (
    <div className="bg-white border border-border rounded-[2rem] p-6 flex flex-col gap-5 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-500 h-full">
      {/* Header */}
      <div>
        <div className="text-[9px] font-black uppercase tracking-[0.35em] text-accent font-mono mb-1.5">03 · Recap Card</div>
        <div className="text-xl font-black text-text tracking-tight leading-none">Share the mission.<br />Look great doing it.</div>
      </div>

      {/* Mini LiveRosterCard preview */}
      <div className="flex-1 relative rounded-2xl overflow-hidden"
           style={{ background: '#FFFCF8', outline: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl pointer-events-none"
             style={{ background: '#FF385C', opacity: 0.09 }} />
        <div className="relative p-4 flex flex-col gap-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                   style={{ background: 'linear-gradient(135deg, #FF385C, #E61E4D)' }}>
                AC
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-[11px] font-bold" style={{ color: '#222' }}>Ahmad Crew</p>
                  <span className="rounded-full px-1 py-[1px] text-[7px] font-bold text-white"
                        style={{ background: '#222' }}>MH</span>
                </div>
                <p className="text-[8px]" style={{ color: '#717171' }}>Captain · A350</p>
              </div>
            </div>
            <span className="rounded-full px-2 py-0.5 text-[7px] font-black uppercase tracking-widest"
                  style={{ background: 'rgba(255,56,92,0.10)', color: '#FF385C' }}>
              May 2026
            </span>
          </div>

          {/* Stamps */}
          <div>
            <p className="text-[7px] font-black uppercase tracking-widest mb-2"
               style={{ color: '#FF385C' }}>
              Stamps collected
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[{ patch: LHR, city: 'London', visits: 4 }, { patch: CDG, city: 'Paris', visits: 2 }].map((d) => (
                <div key={d.city} className="flex flex-col items-center">
                  {d.patch && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.patch} alt={d.city} className="w-full h-16 object-contain" />
                  )}
                  <p className="text-[8px] font-bold text-center mt-0.5" style={{ color: '#222' }}>{d.city}</p>
                  <p className="text-[7px]" style={{ color: '#717171' }}>{d.visits} visits</p>
                </div>
              ))}
            </div>
            <p className="text-center text-[7px] font-bold mt-1" style={{ color: '#717171' }}>+7 more stamps this month</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 grid-rows-2 gap-1">
            <div className="col-span-2 row-span-2 rounded-xl px-2.5 py-2 flex flex-col justify-between"
                 style={{ background: '#fff', outline: '1px solid rgba(0,0,0,0.07)' }}>
              <div>
                <p className="text-[7px] font-bold uppercase tracking-wider"
                   style={{ color: '#FF385C' }}>Hours</p>
                <p className="text-[22px] font-bold leading-none tracking-tight mt-0.5"
                   style={{ color: '#222' }}>
                  147<span className="text-[9px] font-medium" style={{ color: '#717171' }}>h</span>
                </p>
              </div>
              <span className="text-[7px] font-bold rounded-full px-1.5 py-[1px] w-fit"
                    style={{ background: '#E8F5EF', color: '#0F6E56' }}>
                +12% vs prev
              </span>
            </div>
            {[
              { label: 'Flights', value: '18' },
              { label: 'Cities',  value: '9'  },
              { label: 'Standby', value: '3d' },
              { label: 'Off',     value: '12d' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg px-1.5 py-1.5 flex flex-col gap-0.5"
                   style={{ background: '#F7F5F0' }}>
                <p className="text-[11px] font-bold leading-none" style={{ color: '#222' }}>{s.value}</p>
                <p className="text-[7px]" style={{ color: '#717171' }}>{s.label}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-[7px] font-black uppercase tracking-widest font-mono"
             style={{ color: '#B0ABA5' }}>
            cemrosta.io
          </p>
        </div>
      </div>

      {/* Share strip */}
      <div className="flex items-center gap-2">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#25D366] text-white text-[11px] font-black">
          Share to WhatsApp
        </button>
        <button className="w-10 h-10 rounded-xl border border-border flex items-center justify-center shrink-0 hover:bg-surface-2 transition-colors">
          <Share2 size={14} className="text-text-muted" />
        </button>
      </div>
    </div>
  );
}

/* ── Section ───────────────────────────────────────────────────────────────── */
export const ComparisonSection = () => {
  return (
    <section className="py-40 px-4 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">

        {/* Heading */}
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-2 mb-6 text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle font-mono">
            {'// WHAT YOU GET'}
          </div>
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-text mb-8 leading-none">
            Stop fighting <br /> your roster PDF.
          </h2>
          <p className="text-xl md:text-2xl text-text-muted font-bold max-w-xl mx-auto leading-snug tracking-tight">
            We&apos;ve automated the manual tasks so you can focus on what matters—your next mission.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {[CalendarCard, PassportCard, RecapCard].map((Card, i) => (
            <motion.div
              key={i}
              className="flex"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Card />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
