import React from 'react';
import { formatKilometers } from '../utils/format';
import type { RecapData } from './types';

// ── Design tokens (inline for Satori compatibility) ──────────────────────────
const BG = '#0A0B0F';
const SURFACE = '#14161C';
const BORDER = '#262A35';
const ACCENT = '#C8102E'; // MH red
const TEXT = '#F4F5F7';
const TEXT_MUTED = '#9CA0AD';
const MONO = 'IBM Plex Mono';

// ── Shared sub-components ────────────────────────────────────────────────────

function CemrostaWordmark({ size = 28 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Stacked bar mark */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ width: size * 0.6, height: size * 0.1, background: ACCENT, opacity: 0.3 }} />
        <div style={{ width: size * 0.6, height: size * 0.2, background: ACCENT, opacity: 0.6 }} />
        <div style={{ width: size * 0.6, height: size * 0.4, background: ACCENT }} />
      </div>
      <div style={{ fontSize: size, fontWeight: 700, color: TEXT }}>cemrosta</div>
    </div>
  );
}

function StatCell({
  value,
  label,
  size = 60,
}: {
  value: string;
  label: string;
  size?: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: size, fontWeight: 800, color: TEXT, marginBottom: 8, fontFamily: MONO }}>
        {value}
      </div>
      <div
        style={{
          fontSize: Math.round(size * 0.33),
          color: TEXT_MUTED,
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Divider({ vertical = false }: { vertical?: boolean }) {
  return (
    <div
      style={
        vertical
          ? { width: 1, height: 80, background: BORDER }
          : { height: 1, width: '100%', background: BORDER }
      }
    />
  );
}

// ── Stories template (1080 × 1920) ───────────────────────────────────────────

export function StoriesTemplate({
  data,
  watermark = true,
}: {
  data: RecapData;
  watermark?: boolean;
}) {
  const { period, crewHandle, totalSectors, totalKm, superlative } = data;

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: BG,
        backgroundImage: `linear-gradient(180deg, #1C1F27 0%, #0A0B0F 55%)`,
        padding: '100px 80px',
        color: TEXT,
        fontFamily: 'sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 120,
        }}
      >
        <CemrostaWordmark size={36} />
        <div style={{ fontSize: 36, fontWeight: 700, color: TEXT_MUTED }}>
          {period.label}
        </div>
      </div>

      {/* Hero stat — total km for 6m/1y, sectors for monthly */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 140,
        }}
      >
        <div
          style={{
            fontSize: 200,
            fontWeight: 900,
            lineHeight: 1,
            color: TEXT,
            marginBottom: 20,
            fontFamily: MONO,
          }}
        >
          {period.type === 'month'
            ? String(totalSectors)
            : formatKilometers(totalKm)}
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: ACCENT,
            letterSpacing: '0.35em',
            textTransform: 'uppercase' as const,
          }}
        >
          {period.type === 'month' ? 'Sectors' : 'KM Flown'}
        </div>
      </div>

      {/* Secondary stats pill */}
      <div
        style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${BORDER}`,
          borderRadius: 40,
          padding: '60px 40px',
          justifyContent: 'space-around',
          marginBottom: 120,
        }}
      >
        <StatCell value={String(totalSectors)} label="Sectors" size={60} />
        <Divider vertical />
        <StatCell value={formatKilometers(totalKm)} label="KM" size={60} />
        {period.type !== 'month' && (
          <>
            <Divider vertical />
            <StatCell
              value={String(Math.round(totalKm / 40_075 * 10) / 10) + '×'}
              label="Earth laps"
              size={60}
            />
          </>
        )}
      </div>

      {/* Superlative card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 40,
          padding: 60,
          marginTop: 'auto',
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: ACCENT,
            marginBottom: 30,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.2em',
          }}
        >
          {superlative.label}
        </div>
        <div style={{ fontSize: 56, fontWeight: 900, marginBottom: 15, color: TEXT }}>
          {superlative.value}
        </div>
        <div style={{ fontSize: 32, color: TEXT_MUTED, fontWeight: 600 }}>
          {superlative.subValue}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 80,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, color: TEXT }}>{crewHandle}</div>
        {watermark && (
          <div style={{ fontSize: 28, fontWeight: 600, color: '#5E6473' }}>cemrosta.com</div>
        )}
      </div>
    </div>
  );
}

// ── Card template (1200 × 630) ───────────────────────────────────────────────

export function CardTemplate({
  data,
  watermark = true,
}: {
  data: RecapData;
  watermark?: boolean;
}) {
  const { period, crewHandle, totalSectors, totalKm, superlative } = data;
  const heroValue =
    period.type === 'month' ? String(totalSectors) : formatKilometers(totalKm);
  const heroLabel = period.type === 'month' ? 'Sectors' : 'KM Flown';

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        backgroundColor: BG,
        color: TEXT,
        fontFamily: 'sans-serif',
      }}
    >
      {/* Left column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '50%',
          padding: 60,
          justifyContent: 'space-between',
          borderRight: `1px solid ${BORDER}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <CemrostaWordmark size={22} />
          <div style={{ width: 1, height: 24, background: BORDER, marginLeft: 8 }} />
          <div style={{ fontSize: 22, fontWeight: 600, color: TEXT_MUTED }}>{period.label}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 130,
              fontWeight: 900,
              lineHeight: 1,
              marginBottom: 10,
              fontFamily: MONO,
            }}
          >
            {heroValue}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: ACCENT,
              letterSpacing: '0.35em',
              textTransform: 'uppercase' as const,
            }}
          >
            {heroLabel}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>{crewHandle}</div>
          {watermark && (
            <div style={{ fontSize: 16, fontWeight: 600, color: '#5E6473' }}>cemrosta.com</div>
          )}
        </div>
      </div>

      {/* Right column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '50%',
          padding: 60,
          backgroundColor: SURFACE,
        }}
      >
        {/* Secondary stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 44, fontWeight: 800, marginBottom: 6, fontFamily: MONO }}>
              {totalSectors}
            </div>
            <div
              style={{
                fontSize: 13,
                color: TEXT_MUTED,
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.1em',
              }}
            >
              Sectors
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 44, fontWeight: 800, marginBottom: 6, fontFamily: MONO }}>
              {formatKilometers(totalKm)}
            </div>
            <div
              style={{
                fontSize: 13,
                color: TEXT_MUTED,
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.1em',
              }}
            >
              KM Flown
            </div>
          </div>
        </div>

        {/* Superlative */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 30,
            padding: 40,
            marginTop: 'auto',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: ACCENT,
              marginBottom: 14,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.2em',
            }}
          >
            {superlative.label}
          </div>
          <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 10, color: TEXT }}>
            {superlative.value}
          </div>
          <div style={{ fontSize: 18, color: TEXT_MUTED, fontWeight: 600 }}>
            {superlative.subValue}
          </div>
        </div>
      </div>
    </div>
  );
}
