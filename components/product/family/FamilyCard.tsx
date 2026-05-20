'use client';

import React, { useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { Download, Share2, Plane, Car, Home, AlertCircle, Check, Moon } from 'lucide-react';
import { useRoster } from '@/lib/contexts/RosterContext';
import type { DutyEvent } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// FamilyCard — warm, magazine-style crew schedule for family members
//
// Design language: cream background, Inter font, red accent (#FF385C)
// Layout:
//   • Header  — logo · name · month/year
//   • Flights — horizontal-scroll cards, sendoff + pickup per rotation
//   • Standby — 4-col chip grid, amber tones
//   • Free    — 8-col chip grid, green tones
//   • Footer  — tagline · branding
// ─────────────────────────────────────────────────────────────────────────────

// ── Constants ─────────────────────────────────────────────────────────────────

const CREAM    = '#FDF8F4';
const RED      = '#FF385C';

const MONTH_NAMES: Record<string, string> = {
  JAN:'January', FEB:'February', MAR:'March',    APR:'April',
  MAY:'May',     JUN:'June',     JUL:'July',     AUG:'August',
  SEP:'September',OCT:'October', NOV:'November', DEC:'December',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function dom(iso: string) { return parseInt(iso.split('-')[2], 10); }

function formatDate(iso: string, day?: string) {
  const [, mm, dd] = iso.split('-');
  const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(dd, 10)} ${months[parseInt(mm, 10)]}${day ? ` · ${day.slice(0,3)}` : ''}`;
}

function addMin(time: string, mins: number): string {
  if (!time?.includes(':')) return time;
  const [h, m] = time.split(':').map(Number);
  const t = h * 60 + m + mins;
  return `${String(Math.floor(t / 60) % 24).padStart(2,'0')}:${String(t % 60).padStart(2,'0')}`;
}
function subMin(time: string, mins: number) { return addMin(time, -mins); }

// ── Data models ───────────────────────────────────────────────────────────────

interface Trip {
  id: string;
  departDate?: string; departDay?: string; departFlight?: string;
  departRoute?: string; departTime?: string;
  returnDate?: string; returnDay?: string; returnFlight?: string;
  returnRoute?: string; returnTime?: string;
  daysAway?: number;
}

interface StandbyDay { date: string; day?: string; dutyStart?: string; dutyEnd?: string; }
interface FreeDay    { date: string; day?: string; }

interface FlightCard {
  kind: 'sendoff' | 'pickup';
  badge: string;          // "2 nights away" / "Same day" etc.
  flight?: string;
  companion?: string;
  date: string; day?: string;
  route?: string; time?: string;
}

// ── Derivation ────────────────────────────────────────────────────────────────

function deriveData(events: DutyEvent[], base = 'KUL') {
  const sorted = [...events].sort((a,b) => a.date.localeCompare(b.date));

  const sends  = sorted.filter(e => e.type === 'FLIGHT' && e.depPort === base);
  const picks  = sorted.filter(e => e.type === 'FLIGHT' && e.arrPort === base);
  const standby = sorted.filter(e => e.type === 'STANDBY');
  const off     = sorted.filter(e => e.type === 'OFF');

  const used = new Set<string>();
  const trips: Trip[] = [];

  for (const s of sends) {
    const ret = picks.find(p => p.date >= s.date && !used.has(p.date));
    const trip: Trip = {
      id: `${s.date}-${s.flightNumber ?? ''}`,
      departDate: s.date, departDay: s.day,
      departFlight: s.flightNumber ?? s.item,
      departRoute:  s.depPort && s.arrPort ? `${s.depPort} → ${s.arrPort}` : undefined,
      departTime:   s.std,
    };
    if (ret) {
      used.add(ret.date);
      trip.returnDate   = ret.date;   trip.returnDay    = ret.day;
      trip.returnFlight = ret.flightNumber ?? ret.item;
      trip.returnRoute  = ret.depPort && ret.arrPort ? `${ret.depPort} → ${ret.arrPort}` : undefined;
      trip.returnTime   = ret.sta;
      trip.daysAway     = Math.round((new Date(ret.date).getTime() - new Date(s.date).getTime()) / 86_400_000);
    }
    trips.push(trip);
  }

  for (const p of picks) {
    if (!used.has(p.date)) {
      trips.push({
        id: `ret-${p.date}`,
        returnDate: p.date, returnDay: p.day,
        returnFlight: p.flightNumber ?? p.item,
        returnRoute: p.depPort && p.arrPort ? `${p.depPort} → ${p.arrPort}` : undefined,
        returnTime: p.sta,
      });
    }
  }

  trips.sort((a,b) => (a.departDate ?? a.returnDate ?? '').localeCompare(b.departDate ?? b.returnDate ?? ''));

  // Build individual flight cards
  const cards: FlightCard[] = [];
  for (const t of trips) {
    const badge = t.daysAway != null
      ? t.daysAway === 0 ? 'Same day' : `${t.daysAway} night${t.daysAway !== 1 ? 's' : ''} away`
      : '';
    if (t.departDate)
      cards.push({ kind:'sendoff', badge, flight: t.departFlight, companion: t.returnFlight,
        date: t.departDate, day: t.departDay, route: t.departRoute, time: t.departTime });
    if (t.returnDate)
      cards.push({ kind:'pickup', badge, flight: t.returnFlight, companion: t.departFlight,
        date: t.returnDate, day: t.returnDay, route: t.returnRoute, time: t.returnTime });
  }
  cards.sort((a,b) => a.date.localeCompare(b.date));

  return {
    flightCards: cards,
    flightCount: cards.length,
    standbyDays: standby.map(e => ({ date:e.date, day:e.day, dutyStart:e.signOn, dutyEnd:e.signOff })),
    freeDays:    off.map(e => ({ date:e.date, day:e.day })),
  };
}

// ── FlightCardTile ────────────────────────────────────────────────────────────

function FlightCardTile({ card }: { card: FlightCard }) {
  const isSend = card.kind === 'sendoff';
  const suggestion = card.time
    ? isSend ? `Drop by ${subMin(card.time, 150)}` : `Pick up at ${addMin(card.time, 40)}`
    : null;
  const flightPair = [card.flight, card.companion].filter(Boolean).join(' · ');

  return (
    <div className="w-[196px] shrink-0 rounded-2xl bg-white border border-border/70 p-4 flex flex-col gap-3 shadow-sm">

      {/* Badge row */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1 bg-red-50 rounded-full px-2 py-0.5">
          <Moon size={9} className="text-[#FF385C]" />
          <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[#FF385C]">
            {card.badge || 'Night Away'}
          </span>
        </div>
        {flightPair && (
          <span className="text-[8px] font-bold text-text-subtle font-mono truncate">
            {flightPair}
          </span>
        )}
      </div>

      {/* Kind label */}
      <div className={`flex items-center gap-1.5 ${isSend ? 'text-sky-600' : 'text-emerald-600'}`}>
        <Plane
          size={12}
          style={{ transform: isSend ? 'rotate(45deg)' : 'rotate(225deg)' }}
          className="shrink-0"
        />
        <span className="text-[9px] font-black uppercase tracking-[0.2em]">
          {isSend ? 'Send-off' : 'Pick-up'}
        </span>
      </div>

      {/* Date + route */}
      <div>
        <div className="text-[14px] font-black text-text tracking-tight leading-tight">
          {formatDate(card.date, card.day)}
        </div>
        <div className="text-[11px] font-bold text-text-muted font-mono mt-0.5">
          {card.route ?? '–'}
        </div>
      </div>

      {/* Time — big */}
      <div className="text-[32px] font-black text-text font-mono leading-none tracking-tight">
        {card.time ?? '–'}
      </div>

      {/* Suggestion pill */}
      {suggestion && (
        <div className={`flex items-center gap-1.5 rounded-xl px-3 py-2 ${isSend ? 'bg-sky-50' : 'bg-emerald-50'}`}>
          <Car size={10} className={isSend ? 'text-sky-500 shrink-0' : 'text-emerald-500 shrink-0'} />
          <span className={`text-[10px] font-bold leading-tight ${isSend ? 'text-sky-700' : 'text-emerald-700'}`}>
            {suggestion}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Standby Section ───────────────────────────────────────────────────────────

function StandbySection({ days }: { days: StandbyDay[] }) {
  return (
    <section>
      {/* Label */}
      <div className="flex items-center justify-between mb-3 px-6">
        <div className="flex items-center gap-2">
          <span className="text-base">⏳</span>
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-800">
            Standby · {days.length} {days.length === 1 ? 'Day' : 'Days'}
          </span>
        </div>
        <span className="text-[11px] font-bold text-amber-500 italic">Keep plans flexible</span>
      </div>

      {/* 4-col grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-6">
        {days.map((d, i) => (
          <div
            key={i}
            className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3"
          >
            <div className="flex items-baseline gap-1.5 mb-0.5">
              <span className="text-[22px] font-black text-amber-900 leading-none">{dom(d.date)}</span>
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-wide">{d.day?.slice(0,3)}</span>
            </div>
            {d.dutyStart && (
              <div className="text-[10px] font-mono font-bold text-amber-500">
                {d.dutyStart}{d.dutyEnd ? `–${d.dutyEnd}` : ''}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Free Days Section ─────────────────────────────────────────────────────────

function FreeDaysSection({ days }: { days: FreeDay[] }) {
  return (
    <section>
      {/* Label */}
      <div className="flex items-center justify-between mb-3 px-6">
        <div className="flex items-center gap-2">
          <Home size={14} className="text-emerald-600" />
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-800">
            Free Days · {days.length}
          </span>
        </div>
        <span className="text-[11px] font-bold text-emerald-500 italic">Plan something together ✨</span>
      </div>

      {/* 8-col grid */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 px-6">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center bg-emerald-50 border border-emerald-100 rounded-xl py-2.5">
            <span className="text-[18px] font-black text-emerald-800 leading-none">{dom(d.date)}</span>
            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-wide mt-0.5">
              {d.day?.slice(0,3)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── PrintCard (html-to-image) ─────────────────────────────────────────────────

interface PrintCardProps {
  crewName: string; rank?: string;
  month: string; year: string;
  flightCards: FlightCard[];
  standbyDays: StandbyDay[];
  freeDays: FreeDay[];
}

const PrintCard = React.forwardRef<HTMLDivElement, PrintCardProps>(
  ({ crewName, rank, month, year, flightCards, standbyDays, freeDays }, ref) => {
    const monthLabel = MONTH_NAMES[month] ?? month;
    const firstName  = crewName.split(' ').slice(0,2).join(' ');

    return (
      <div ref={ref} style={{ width:430, background:CREAM, fontFamily:'Inter,-apple-system,sans-serif', borderRadius:24, overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.16)' }}>

        {/* ── Header ── */}
        <div style={{ padding:'28px 28px 20px', background:'#fff', borderBottom:`1px solid rgba(0,0,0,0.06)` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:RED, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:18, color:'#fff' }}>✈</span>
              </div>
              <span style={{ fontSize:9, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase', color:'#9CA3AF' }}>
                Crew Family Hub
              </span>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF' }}>Schedule</div>
              <div style={{ fontSize:28, fontWeight:900, color:RED, letterSpacing:'-1px', lineHeight:1 }}>{monthLabel}</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#6B7280' }}>{year}</div>
            </div>
          </div>
          <div style={{ fontSize:28, fontWeight:900, color:'#111', letterSpacing:'-1px', lineHeight:1.05 }}>{firstName}</div>
          {rank && <div style={{ fontSize:12, fontWeight:700, color:'#9CA3AF', marginTop:4 }}>{rank} · Malaysia Airlines</div>}
        </div>

        <div style={{ padding:'20px 0', display:'flex', flexDirection:'column', gap:24 }}>

          {/* ── Flight cards ── */}
          {flightCards.length > 0 && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 24px', marginBottom:12 }}>
                <span style={{ fontSize:10, fontWeight:900, letterSpacing:'0.25em', textTransform:'uppercase', color:'#6B7280' }}>Flight Duties</span>
                <span style={{ fontSize:10, fontWeight:800, color:RED, background:'#FFF0F3', border:`1px solid #FFD6DE`, borderRadius:20, padding:'2px 10px' }}>
                  {flightCards.length} {flightCards.length === 1 ? 'Duty' : 'Duties'}
                </span>
              </div>
              <div style={{ display:'flex', gap:10, overflowX:'hidden', padding:'0 24px', flexWrap:'wrap' }}>
                {flightCards.map((card, i) => {
                  const isSend = card.kind === 'sendoff';
                  const sugg   = card.time ? (isSend ? `Drop by ${subMin(card.time,150)}` : `Pick up at ${addMin(card.time,40)}`) : null;
                  const pair   = [card.flight, card.companion].filter(Boolean).join(' · ');
                  return (
                    <div key={i} style={{ width:175, borderRadius:14, background:'#fff', border:'1px solid #E5E7EB', padding:14, boxSizing:'border-box' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:4, background:'#FFF0F3', borderRadius:20, padding:'3px 8px' }}>
                          <span style={{ fontSize:8 }}>🌙</span>
                          <span style={{ fontSize:7, fontWeight:900, color:RED, letterSpacing:'0.15em', textTransform:'uppercase' }}>
                            {card.badge || 'Night Away'}
                          </span>
                        </div>
                        {pair && <span style={{ fontSize:7, fontWeight:700, color:'#9CA3AF', fontFamily:'monospace' }}>{pair}</span>}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:8, color: isSend ? '#0284C7' : '#059669' }}>
                        <span style={{ fontSize:10 }}>{isSend ? '🛫' : '🛬'}</span>
                        <span style={{ fontSize:8, fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase' }}>
                          {isSend ? 'Send-off' : 'Pick-up'}
                        </span>
                      </div>
                      <div style={{ fontSize:11, fontWeight:900, color:'#111', lineHeight:1.2 }}>{formatDate(card.date, card.day)}</div>
                      <div style={{ fontSize:9, fontWeight:700, color:'#6B7280', fontFamily:'monospace', marginBottom:6 }}>{card.route}</div>
                      <div style={{ fontSize:26, fontWeight:900, color:'#111', fontFamily:'monospace', lineHeight:1, marginBottom:8 }}>{card.time || '–'}</div>
                      {sugg && (
                        <div style={{ background: isSend ? '#EFF6FF' : '#ECFDF5', borderRadius:8, padding:'5px 8px', display:'flex', alignItems:'center', gap:4 }}>
                          <span style={{ fontSize:9 }}>🚗</span>
                          <span style={{ fontSize:8, fontWeight:700, color: isSend ? '#1D4ED8' : '#065F46' }}>{sugg}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Standby ── */}
          {standbyDays.length > 0 && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 24px', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:12 }}>⏳</span>
                  <span style={{ fontSize:10, fontWeight:900, letterSpacing:'0.25em', textTransform:'uppercase', color:'#92400E' }}>
                    Standby · {standbyDays.length} Days
                  </span>
                </div>
                <span style={{ fontSize:10, fontWeight:700, color:'#D97706', fontStyle:'italic' }}>Keep plans flexible</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, padding:'0 24px' }}>
                {standbyDays.map((d, i) => (
                  <div key={i} style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:12, padding:'10px 12px' }}>
                    <div style={{ display:'flex', alignItems:'baseline', gap:5, marginBottom:2 }}>
                      <span style={{ fontSize:20, fontWeight:900, color:'#92400E', lineHeight:1 }}>{dom(d.date)}</span>
                      <span style={{ fontSize:9, fontWeight:800, color:'#D97706', textTransform:'uppercase' }}>{d.day?.slice(0,3)}</span>
                    </div>
                    {d.dutyStart && (
                      <div style={{ fontSize:9, fontFamily:'monospace', fontWeight:700, color:'#B45309' }}>
                        {d.dutyStart}{d.dutyEnd ? `–${d.dutyEnd}` : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Free days ── */}
          {freeDays.length > 0 && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 24px', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:12 }}>🏡</span>
                  <span style={{ fontSize:10, fontWeight:900, letterSpacing:'0.25em', textTransform:'uppercase', color:'#166534' }}>
                    Free Days · {freeDays.length}
                  </span>
                </div>
                <span style={{ fontSize:10, fontWeight:700, color:'#16A34A', fontStyle:'italic' }}>Plan something together ✨</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap:6, padding:'0 24px' }}>
                {freeDays.map((d, i) => (
                  <div key={i} style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, padding:'8px 4px', textAlign:'center' }}>
                    <div style={{ fontSize:16, fontWeight:900, color:'#15803D', lineHeight:1 }}>{dom(d.date)}</div>
                    <div style={{ fontSize:7, fontWeight:800, color:'#16A34A', textTransform:'uppercase', letterSpacing:'0.05em', marginTop:2 }}>{d.day?.slice(0,3)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div style={{ borderTop:'1px solid rgba(0,0,0,0.06)', padding:'14px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#fff' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:16 }}>🩷</span>
            <div>
              <div style={{ fontSize:9, fontWeight:700, color:'#6B7280', lineHeight:1.5 }}>Thank you for keeping the skies safe.</div>
              <div style={{ fontSize:9, fontWeight:700, color:'#6B7280' }}>Fly well, rest well, live well.</div>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:9, background:'#F3F4F6', border:'1px solid #E5E7EB', borderRadius:12, padding:'4px 10px', color:'#6B7280', fontWeight:700, marginBottom:4 }}>
              Generated from official iFlight roster
            </div>
            <div style={{ fontSize:8, fontWeight:900, letterSpacing:'0.25em', textTransform:'uppercase', color:'#D1D5DB', fontFamily:'monospace', textAlign:'right' }}>
              CEMROSTA.IO
            </div>
          </div>
        </div>
      </div>
    );
  },
);
PrintCard.displayName = 'PrintCard';

// ── Main component ────────────────────────────────────────────────────────────

export function FamilyCard() {
  const { activeRoster } = useRoster();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied]               = useState(false);

  if (!activeRoster) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#FDF8F4]">
        <Plane size={24} className="text-text-subtle mb-3" />
        <p className="text-[13px] font-bold text-text-muted">Upload a roster to generate your Family Hub</p>
      </div>
    );
  }

  const { flightCards, flightCount, standbyDays, freeDays } = deriveData(activeRoster.events ?? []);
  const crewName   = activeRoster.crewName ?? 'Crew Member';
  const firstName  = crewName.split(' ').slice(0, 2).join(' ');
  const month      = activeRoster.month ?? '';
  const year       = activeRoster.year  ?? '';
  const monthLabel = MONTH_NAMES[month] ?? month;

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const url = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `cemrosta-family-${month.toLowerCase()}-${year}.png`;
      a.click();
    } catch (e) { console.error(e); }
    finally     { setIsDownloading(false); }
  }, [isDownloading, month, year]);

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const url  = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], `cemrosta-family-${month.toLowerCase()}.png`, { type:'image/png' });
      if (navigator.share && navigator.canShare?.({ files:[file] })) {
        await navigator.share({ files:[file], title:`${crewName} · ${monthLabel} Schedule` });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { console.error(e); }
  }, [crewName, month, monthLabel]);

  return (
    <div style={{ background: CREAM }} className="font-sans">

      {/* Off-screen print card */}
      <div className="absolute -left-[9999px] top-0 pointer-events-none" aria-hidden>
        <PrintCard
          ref={cardRef}
          crewName={crewName}
          month={month}
          year={year}
          flightCards={flightCards}
          standbyDays={standbyDays}
          freeDays={freeDays}
        />
      </div>

      {/* ── Header ── */}
      <div className="bg-white px-6 pt-7 pb-6 border-b border-border/60">
        <div className="flex items-start justify-between mb-5">

          {/* Logo + name */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg shrink-0"
                style={{ background: RED }}
              >
                ✈
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-text-subtle font-mono">
                Crew Family Hub
              </span>
            </div>
            <h2 className="text-[32px] md:text-[38px] font-black tracking-tight text-text leading-none">
              {firstName}
            </h2>
          </div>

          {/* Month + actions */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[10px] font-bold text-text-muted">Schedule</div>
              <div className="text-[28px] font-black leading-none tracking-tight" style={{ color: RED }}>
                {monthLabel}
              </div>
              <div className="text-[14px] font-bold text-text-muted">{year}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-[11px] font-black text-text-muted hover:text-text transition-all"
              >
                {copied ? <Check size={11} className="text-green-500" /> : <Share2 size={11} />}
                {copied ? 'Copied!' : 'Share'}
              </button>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white text-[11px] font-black shadow-md transition-all disabled:opacity-60"
                style={{ background: RED }}
              >
                <Download size={11} />
                {isDownloading ? 'Saving…' : 'Download Card'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex gap-2 flex-wrap">
          {[
            { v: flightCount,          l:'Flight Duties', color:`text-[${RED}]`, bg:'bg-red-50',    border:'border-red-100' },
            { v: standbyDays.length,   l:'Standby Days',  color:'text-amber-700', bg:'bg-amber-50',  border:'border-amber-100' },
            { v: freeDays.length,      l:'Free Days',     color:'text-emerald-700',bg:'bg-emerald-50',border:'border-emerald-100' },
          ].map(s => (
            <div key={s.l} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold ${s.bg} ${s.border} ${s.color}`}>
              <span className="font-black text-[13px]">{s.v}</span>
              <span className="opacity-80">{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Flight cards ── */}
      {flightCards.length > 0 && (
        <div className="pt-6 pb-2">
          <div className="flex items-center justify-between px-6 mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-text-subtle font-mono">
              Flight Duties
            </span>
            <span className="text-[10px] font-black px-3 py-0.5 rounded-full border" style={{ color: RED, background:'#FFF0F3', borderColor:'#FFD6DE' }}>
              {flightCount} {flightCount === 1 ? 'Duty' : 'Duties'}
            </span>
          </div>
          {/* Horizontal scroll */}
          <div className="overflow-x-auto pb-3 pl-6 pr-3">
            <div className="flex gap-3" style={{ width: 'max-content' }}>
              {flightCards.map((card, i) => (
                <FlightCardTile key={i} card={card} />
              ))}
              {/* Trailing spacer */}
              <div className="w-3 shrink-0" />
            </div>
          </div>
        </div>
      )}

      {/* ── Standby ── */}
      {standbyDays.length > 0 && (
        <div className="py-6 border-t border-border/40">
          <StandbySection days={standbyDays} />
        </div>
      )}

      {/* ── Free Days ── */}
      {freeDays.length > 0 && (
        <div className="py-6 border-t border-border/40">
          <FreeDaysSection days={freeDays} />
        </div>
      )}

      {/* ── Footer ── */}
      <div className="bg-white border-t border-border/60 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-lg">🩷</span>
          <div>
            <p className="text-[11px] font-bold text-text-muted leading-snug">
              Thank you for keeping the skies safe.
            </p>
            <p className="text-[11px] font-bold text-text-muted">
              Fly well, rest well, live well.
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-bold text-text-muted border border-border rounded-full px-3 py-1 mb-1">
            Generated from official iFlight roster
          </div>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-text-subtle font-mono">
            CEMROSTA.IO
          </p>
        </div>
      </div>

    </div>
  );
}
