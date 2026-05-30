'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pause, Play, Volume2, VolumeX, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRoster } from '@/lib/contexts/RosterContext';
import { getLifetimeDestinations, type EarnedDestination } from '@/lib/actions/destinations';
import { computeLifetimeStats } from '@/lib/utils/stats';
import { formatKilometers, formatBlockHours } from '@/lib/utils/format';
import { DESTINATION_CATALOG } from '@/lib/data/destination-catalog';
import { getPatchImageUrl } from '@/lib/patches/patch-images';

// ── Design tokens (matches templates.tsx — passport dark theme) ──────────────
const BG         = '#0A1520';
const GOLD       = '#C8A84B';
const GOLD_SOFT  = '#BF9B3A';
const PARCHMENT  = '#F5EDD8';
const MUTED      = 'rgba(245,237,216,0.45)';
const GOLD_FAINT = 'rgba(200,168,75,0.18)';

// ── Slide duration ────────────────────────────────────────────────────────────
const SLIDE_MS = 5000;

// ── Types ─────────────────────────────────────────────────────────────────────
type SlideType = 'intro' | 'stat' | 'quote' | 'topCity' | 'stamps' | 'outro';

interface Slide {
  id: number;
  type: SlideType;
  title?: string;
  sub?: string;
  label?: string;
  value?: string;       // pre-formatted string (for non-animated display)
  rawValue?: number;    // numeric for count-up animation
  unit?: string;
  footnote?: string;
  iata?: string;
  cityName?: string;
  visits?: number;
  patchIatas?: string[];
  earnedCount?: number;
  totalCount?: number;
}

// ── Catalog lookup helpers ────────────────────────────────────────────────────
function catalogCity(iata: string): string {
  return DESTINATION_CATALOG.find(d => d.iata === iata)?.city ?? iata;
}

// ── Slide builder ─────────────────────────────────────────────────────────────
function buildSlides(
  displayName: string,
  km: number,
  sectors: number,
  blockMinutes: number,
  rosterCount: number,
  earned: EarnedDestination[],
  catalogSize: number,
): Slide[] {
  const firstName   = displayName.split(' ')[0];
  const year        = new Date().getFullYear();
  const earthLaps   = (km / 40_075).toFixed(1);
  const daysInAir   = Math.round(blockMinutes / 1440);
  const monthlyAvg  = rosterCount > 0 ? Math.round(sectors / rosterCount) : 0;

  const nonHome = earned.filter(d => !d.isHome).sort((a, b) => b.visits - a.visits);
  const top3    = nonHome.slice(0, 3).map(d => d.iata);
  const topDest = nonHome[0] ?? null;

  const slides: Slide[] = [];

  // 1. Intro
  slides.push({
    id: slides.length,
    type: 'intro',
    title: `Your ${year}\nin the air.`,
    sub: `Welcome back, ${firstName}.`,
  });

  // 2. Distance
  if (km > 0) {
    slides.push({
      id: slides.length,
      type: 'stat',
      label: 'Total Distance',
      value: formatKilometers(km),
      rawValue: Math.round(km),
      unit: 'KM flown',
      footnote: `That's ${earthLaps}× around the earth`,
    });
  }

  // 3. Sectors
  if (sectors > 0) {
    slides.push({
      id: slides.length,
      type: 'stat',
      label: 'Sectors Flown',
      value: sectors.toLocaleString(),
      rawValue: sectors,
      unit: 'Flights',
      footnote: monthlyAvg > 0 ? `avg. ${monthlyAvg} per month` : undefined,
    });
  }

  // 4. Block hours
  if (blockMinutes > 0) {
    slides.push({
      id: slides.length,
      type: 'stat',
      label: 'Time in the Air',
      value: formatBlockHours(blockMinutes),
      rawValue: Math.round(blockMinutes / 60),
      unit: 'Block Hours',
      footnote: daysInAir > 0 ? `${daysInAir} full days in the sky` : undefined,
    });
  }

  // 5. Top destination (with patch)
  if (topDest) {
    slides.push({
      id: slides.length,
      type: 'topCity',
      iata: topDest.iata,
      cityName: catalogCity(topDest.iata),
      visits: topDest.visits,
    });
  }

  // 6. Stamps collected
  if (earned.length > 0) {
    slides.push({
      id: slides.length,
      type: 'stamps',
      earnedCount: nonHome.length,
      totalCount: catalogSize,
      patchIatas: top3,
      title: 'Cities in your passport',
    });
  }

  // 7. Outro
  slides.push({
    id: slides.length,
    type: 'outro',
    title: 'Ready for next year?',
    sub: `See you in ${year + 1}, ${firstName}.`,
  });

  return slides;
}

const DEMO_SLIDES: Slide[] = [
  { id: 0, type: 'intro',  title: 'Your year\nin the air.',  sub: 'Upload a roster to unlock your story.' },
  { id: 1, type: 'quote',  title: 'Every sector tells a story.', sub: 'Your passport is waiting.' },
  { id: 2, type: 'outro',  title: 'Ready to begin?', sub: 'Upload your first roster to get started.' },
];

// ── Web Audio ambient music ───────────────────────────────────────────────────
// Am7 chord drone: A C E G — calm, cinematic, aviation-appropriate
function startAmbient(ctx: AudioContext): () => void {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 3);
  master.connect(ctx.destination);

  // Subtle delay for depth
  const delay = ctx.createDelay(1.5);
  delay.delayTime.value = 0.45;
  const delayFb = ctx.createGain();
  delayFb.gain.value = 0.28;
  delay.connect(delayFb);
  delayFb.connect(delay);
  delayFb.connect(master);

  const freqs = [110, 130.81, 164.81, 196]; // A2, C3, E3, G3 = Am7
  freqs.forEach((freq, i) => {
    const osc    = ctx.createOscillator();
    const lp     = ctx.createBiquadFilter();
    const env    = ctx.createGain();

    osc.type            = 'sine';
    osc.frequency.value = freq;
    osc.detune.value    = (i - 1.5) * 4; // subtle chorus

    lp.type            = 'lowpass';
    lp.frequency.value = 600 - i * 40;

    env.gain.value = 0.35 / (i * 0.6 + 1);

    // Very slow tremolo
    const lfo     = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type            = 'sine';
    lfo.frequency.value = 0.15 + i * 0.05;
    lfoGain.gain.value  = env.gain.value * 0.2;
    lfo.connect(lfoGain);
    lfoGain.connect(env.gain);
    lfo.start();

    osc.connect(lp);
    lp.connect(env);
    env.connect(master);
    env.connect(delay);
    osc.start();
  });

  return () => {
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
    setTimeout(() => { try { ctx.close(); } catch { /* ignore */ } }, 1500);
  };
}

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, active: boolean, duration = 1400): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active || !target) { setVal(0); return; }
    const t0 = performance.now();
    let raf: number;
    function tick(now: number) {
      const t = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(ease * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return val;
}

// ── Slide renderers ───────────────────────────────────────────────────────────

function IntroSlide({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-5">
      <div
        className="text-[10px] font-black uppercase tracking-[0.4em] mb-2"
        style={{ color: GOLD, opacity: 0.7 }}
      >
        OTAROSTA PASSPORT
      </div>
      <h2
        className="text-5xl sm:text-6xl font-black leading-tight tracking-tighter whitespace-pre-line"
        style={{ color: PARCHMENT }}
      >
        {title}
      </h2>
      <p className="text-lg font-medium italic" style={{ color: GOLD_SOFT }}>
        {sub}
      </p>
    </div>
  );
}

function StatSlide({ label, value, rawValue, unit, footnote, isActive }: Slide & { isActive: boolean }) {
  const counted = useCountUp(rawValue ?? 0, isActive && !!rawValue);
  const display = rawValue ? counted.toLocaleString() : value;

  return (
    <div className="flex flex-col items-center text-center gap-3">
      <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: MUTED }}>
        {label}
      </p>
      <div
        className="text-8xl sm:text-9xl font-black leading-none tracking-tighter tabular-nums"
        style={{ color: PARCHMENT }}
      >
        {display}
      </div>
      <p className="text-xl font-black uppercase tracking-widest" style={{ color: GOLD }}>
        {unit}
      </p>
      {footnote && (
        <p className="text-sm font-medium mt-3 px-4 leading-snug" style={{ color: MUTED }}>
          — {footnote} —
        </p>
      )}
    </div>
  );
}

function QuoteSlide({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-6 px-4">
      <div className="text-6xl leading-none" style={{ color: GOLD, opacity: 0.3 }}>&ldquo;</div>
      <h2 className="text-3xl font-black leading-snug tracking-tight -mt-8" style={{ color: PARCHMENT }}>
        {title}
      </h2>
      {sub && (
        <p className="text-base font-medium" style={{ color: MUTED }}>{sub}</p>
      )}
    </div>
  );
}

function TopCitySlide({ iata, cityName, visits }: Slide) {
  const patchUrl = iata ? getPatchImageUrl(iata) : null;

  return (
    <div className="flex flex-col items-center text-center gap-4">
      <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: MUTED }}>
        Most Visited City
      </p>
      {/* Patch */}
      <div
        className="w-36 h-36 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          border: `2px solid ${GOLD}55`,
          background: GOLD_FAINT,
          boxShadow: `0 0 48px ${GOLD}33`,
        }}
      >
        {patchUrl
          ? <img src={patchUrl} alt={cityName} className="w-28 h-28 object-contain" />
          : (
            <span className="text-4xl font-black" style={{ color: GOLD }}>{iata}</span>
          )
        }
      </div>
      <div>
        <h2 className="text-4xl font-black tracking-tight" style={{ color: PARCHMENT }}>
          {cityName}
        </h2>
        <p className="text-sm font-bold uppercase tracking-[0.2em] mt-1" style={{ color: GOLD }}>
          {iata}
        </p>
      </div>
      {visits && visits > 0 && (
        <div
          className="px-5 py-2 rounded-full text-sm font-bold"
          style={{ background: GOLD_FAINT, color: GOLD, border: `1px solid ${GOLD}44` }}
        >
          {visits} {visits === 1 ? 'landing' : 'landings'}
        </div>
      )}
    </div>
  );
}

function StampsSlide({ earnedCount, totalCount, patchIatas = [], title }: Slide) {
  return (
    <div className="flex flex-col items-center text-center gap-5">
      <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: MUTED }}>
        {title}
      </p>
      {/* Big count */}
      <div className="flex items-baseline gap-2">
        <span className="text-7xl font-black leading-none tracking-tighter" style={{ color: PARCHMENT }}>
          {earnedCount}
        </span>
        <span className="text-2xl font-bold" style={{ color: MUTED }}>
          / {totalCount}
        </span>
      </div>
      <p className="text-sm font-medium" style={{ color: MUTED }}>stamps collected</p>

      {/* Top 3 patches */}
      {patchIatas.length > 0 && (
        <div className="flex gap-4 mt-2">
          {patchIatas.map(iata => {
            const patchUrl = getPatchImageUrl(iata);
            return (
              <div
                key={iata}
                className="flex flex-col items-center gap-1.5"
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    border: `1.5px solid ${GOLD}44`,
                    background: GOLD_FAINT,
                  }}
                >
                  {patchUrl
                    ? <img src={patchUrl} alt={iata} className="w-14 h-14 object-contain" />
                    : <span className="text-xs font-black" style={{ color: GOLD }}>{iata}</span>
                  }
                </div>
                <span className="text-[9px] font-bold tracking-wider" style={{ color: MUTED }}>
                  {iata}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OutroSlide({
  title,
  sub,
  onBack,
  onShare,
}: {
  title: string;
  sub: string;
  onBack: () => void;
  onShare: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-5">
      <h2
        className="text-4xl font-black leading-tight tracking-tight"
        style={{ color: PARCHMENT }}
      >
        {title}
      </h2>
      <p className="text-lg font-medium italic" style={{ color: GOLD_SOFT }}>
        {sub}
      </p>
      <div className="flex flex-col gap-3 mt-6 w-full max-w-[240px]">
        <button
          onClick={onShare}
          className="flex items-center justify-center gap-2 rounded-full font-bold text-sm py-3 px-6 transition-opacity hover:opacity-80 active:scale-95"
          style={{ background: GOLD, color: BG }}
        >
          <Share2 size={15} />
          Share story
        </button>
        <button
          onClick={onBack}
          className="flex items-center justify-center rounded-full font-bold text-sm py-3 px-6 transition-opacity hover:opacity-80 active:scale-95"
          style={{
            background: 'transparent',
            color: MUTED,
            border: `1px solid rgba(245,237,216,0.2)`,
          }}
        >
          Back to Passport
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function StoryDeck() {
  const router = useRouter();
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const { rosters } = useRoster();

  const [slides, setSlides]         = useState<Slide[]>([]);
  const [isDataLoading, setLoading] = useState(true);
  const [current, setCurrent]       = useState(0);
  const [progress, setProgress]     = useState(0);
  const [isPaused, setIsPaused]     = useState(false);
  const [isMuted, setIsMuted]       = useState(false);

  // Refs — prevent stale closures in rAF loop
  const currentRef  = useRef(0);
  const lenRef      = useRef(0);
  const pausedRef   = useRef(false);
  const progressRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const rafRef      = useRef<number | null>(null);
  const stopAudio   = useRef<(() => void) | null>(null);

  pausedRef.current = isPaused;
  lenRef.current    = slides.length;

  // ── Data fetch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthLoading) return;
    (async () => {
      try {
        const earned = user ? await getLifetimeDestinations(user.uid) : [];
        const stats  = computeLifetimeStats(rosters, earned.filter(d => !d.isHome).length);
        const blockMinutes = rosters.reduce((s, r) => s + (r.totalBlockMinutes ?? 0), 0);
        const name = profile?.full_name || user?.displayName || user?.email?.split('@')[0] || 'Crew';
        const { CATALOG_SIZE } = await import('@/lib/data/destination-catalog');

        const built = stats.sectors > 0 || stats.km > 0
          ? buildSlides(name, stats.km, stats.sectors, blockMinutes, rosters.length, earned, CATALOG_SIZE)
          : DEMO_SLIDES;

        setSlides(built);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthLoading, user, profile, rosters]);

  // ── Audio ───────────────────────────────────────────────────────────────────
  const audioCtxRef = useRef<AudioContext | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const stop = startAmbient(ctx);
      stopAudio.current = stop;
      return () => { stop(); };
    } catch { /* AudioContext not supported */ }
  }, []);

  useEffect(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (isMuted) {
      ctx.suspend().catch(() => {});
    } else {
      ctx.resume().catch(() => {});
    }
  }, [isMuted]);

  // ── rAF progress ticker ─────────────────────────────────────────────────────
  const tick = useCallback((ts: number) => {
    if (pausedRef.current) {
      lastTickRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    if (lastTickRef.current === null) lastTickRef.current = ts;

    const delta = ts - lastTickRef.current;
    lastTickRef.current = ts;
    const next = progressRef.current + (delta / SLIDE_MS) * 100;

    if (next >= 100) {
      progressRef.current = 0;
      setProgress(0);
      if (currentRef.current < lenRef.current - 1) {
        currentRef.current += 1;
        setCurrent(currentRef.current);
      } else {
        setProgress(100);
        return; // stop on last slide
      }
    } else {
      progressRef.current = next;
      setProgress(next);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [slides.length, tick]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (currentRef.current >= lenRef.current - 1) return;
    currentRef.current += 1;
    progressRef.current = 0;
    lastTickRef.current = null;
    setCurrent(currentRef.current);
    setProgress(0);
  }, []);

  const goPrev = useCallback(() => {
    if (currentRef.current <= 0) return;
    currentRef.current -= 1;
    progressRef.current = 0;
    lastTickRef.current = null;
    setCurrent(currentRef.current);
    setProgress(0);
  }, []);

  // ── Keyboard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft')  goPrev();
      if (e.key === ' ')          { e.preventDefault(); setIsPaused(p => !p); }
      if (e.key === 'Escape')     router.push('/passport');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, router]);

  // ── Long-press to pause ─────────────────────────────────────────────────────
  const lpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onPressStart = useCallback(() => {
    lpTimer.current = setTimeout(() => setIsPaused(true), 200);
  }, []);
  const onPressEnd = useCallback(() => {
    if (lpTimer.current) clearTimeout(lpTimer.current);
    setIsPaused(false);
  }, []);

  // ── Share ───────────────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: 'My Year in the Air', url }); return; } catch { /* fall through */ }
    }
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
  }, []);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isDataLoading || slides.length === 0) {
    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center" style={{ background: BG }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-11 h-11 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: `${GOLD}40`, borderTopColor: GOLD }}
          />
          <p className="text-xs font-bold uppercase tracking-[0.35em]" style={{ color: MUTED }}>
            Loading story…
          </p>
        </div>
      </div>
    );
  }

  const slide = slides[current];
  const initials = (profile?.full_name || user?.displayName || 'MA')
    .split(' ').map((n: string) => n[0] ?? '').join('').slice(0, 2).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-[500] flex flex-col items-center justify-center select-none overflow-hidden"
      style={{ background: BG }}
    >
      {/* ── Ambient background glow ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${GOLD}12 0%, transparent 70%)`,
        }}
      />

      {/* ── Progress bars ── */}
      <div className="pointer-events-none absolute top-6 left-0 right-0 px-5 flex gap-1 z-50">
        {slides.map((_, i) => (
          <div
            key={i}
            className="h-[3px] flex-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(245,237,216,0.15)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: GOLD }}
              animate={{ width: i < current ? '100%' : i === current ? `${progress}%` : '0%' }}
              transition={{ duration: 0.06 }}
            />
          </div>
        ))}
      </div>

      {/* ── Header ── */}
      <div className="absolute top-12 left-5 right-5 flex justify-between items-center z-50 pointer-events-none">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-black text-[11px]"
            style={{ background: GOLD, color: BG }}
          >
            {initials}
          </div>
          <div>
            <p className="text-[11px] font-black leading-none" style={{ color: PARCHMENT }}>OTAROSTA</p>
            <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: GOLD_SOFT }}>
              Passport &apos;{new Date().getFullYear().toString().slice(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5 pointer-events-auto">
          <button
            onClick={e => { e.stopPropagation(); setIsMuted(m => !m); }}
            className="p-2 rounded-full transition-colors hover:bg-white/10"
            style={{ color: isMuted ? GOLD_SOFT : 'rgba(245,237,216,0.5)' }}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <button
            onClick={e => { e.stopPropagation(); setIsPaused(p => !p); }}
            className="p-2 rounded-full transition-colors hover:bg-white/10"
            style={{ color: 'rgba(245,237,216,0.5)' }}
            aria-label={isPaused ? 'Play' : 'Pause'}
          >
            {isPaused ? <Play size={17} /> : <Pause size={17} />}
          </button>
          <button
            onClick={e => { e.stopPropagation(); router.push('/passport'); }}
            className="p-2 rounded-full transition-colors hover:bg-white/10"
            style={{ color: 'rgba(245,237,216,0.5)' }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ── Slide content — z-30, sits ABOVE tap zones (z-20) ── */}
      <div className="relative z-30 w-full max-w-sm px-10 flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 1.03 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
            style={{ pointerEvents: slide.type === 'outro' ? 'auto' : 'none' }}
          >
            {slide.type === 'intro'   && <IntroSlide title={slide.title!} sub={slide.sub!} />}
            {slide.type === 'stat'    && <StatSlide  {...slide} isActive={true} />}
            {slide.type === 'quote'   && <QuoteSlide title={slide.title!} sub={slide.sub ?? ''} />}
            {slide.type === 'topCity' && <TopCitySlide {...slide} />}
            {slide.type === 'stamps'  && <StampsSlide {...slide} />}
            {slide.type === 'outro'   && (
              <OutroSlide
                title={slide.title!}
                sub={slide.sub!}
                onBack={() => router.push('/passport')}
                onShare={handleShare}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Tap zones — z-20, BELOW slide content ── */}
      <div
        className="absolute inset-0 z-20 flex"
        onPointerDown={onPressStart}
        onPointerUp={onPressEnd}
        onPointerLeave={onPressEnd}
      >
        {/* Left 30% — go back */}
        <div
          className="h-full"
          style={{ width: '30%', cursor: 'w-resize' }}
          onClick={e => { e.stopPropagation(); goPrev(); }}
        />
        {/* Center 40% — dead zone (slide content is interactive here) */}
        <div className="flex-1 h-full" />
        {/* Right 30% — go forward */}
        <div
          className="h-full"
          style={{ width: '30%', cursor: 'e-resize' }}
          onClick={e => { e.stopPropagation(); goNext(); }}
        />
      </div>

      {/* ── Pause indicator ── */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[45] pointer-events-none"
            style={{
              width: 56, height: 56, borderRadius: 28,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Pause size={24} color={PARCHMENT} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer ── */}
      <div
        className="pointer-events-none absolute bottom-8 flex flex-col items-center gap-2 z-50"
      >
        <p className="text-[9px] font-bold uppercase tracking-[0.4em]" style={{ color: MUTED }}>
          {current + 1} / {slides.length}
        </p>
        <p className="text-[8px] font-bold uppercase tracking-[0.3em]" style={{ color: `${MUTED}77` }}>
          Otarosta.com
        </p>
      </div>
    </div>
  );
}
