import React from 'react';
import { formatKilometers } from '../utils/format';
import { PATCH_IMAGE_MAP } from '../patches/patch-images';
import type { RecapData } from './types';

// ── Design tokens ─────────────────────────────────────────────────────────────
// Passport / travel-stamp aesthetic — matches city patch artwork language
const BG_GRAD  = 'linear-gradient(160deg, #0E1E30 0%, #0A1520 55%, #0D1A28 100%)';
const BG_SOLID = '#0A1520'; // fallback for Satori gradient issues
const GOLD     = '#C8A84B';
const PARCHMENT = '#F5EDD8';
const GOLD_DIM  = 'rgba(200,168,75,0.55)';
const GOLD_FAINT = 'rgba(200,168,75,0.2)';
const PARCHMENT_DIM = 'rgba(245,237,216,0.5)';
const PARCHMENT_FAINT = 'rgba(245,237,216,0.35)';
const SURFACE  = 'rgba(255,255,255,0.04)';
const AWARD_BG = 'rgba(200,168,75,0.08)';
const MONO = 'IBM Plex Mono';

// Perforated-line background — stamp/passport feel
const PERF_BG =
  'repeating-linear-gradient(90deg, rgba(200,168,75,0.45) 0px, rgba(200,168,75,0.45) 5px, transparent 5px, transparent 13px)';

// ── Patch medallion ───────────────────────────────────────────────────────────

function PatchMedallion({
  iata,
  size,
  baseUrl,
  labelSize,
}: {
  iata: string;
  size: number;
  baseUrl: string;
  labelSize: number;
}) {
  const filename = PATCH_IMAGE_MAP[iata];
  const patchUrl = filename && baseUrl ? `${baseUrl}/images/city_patches/${filename}` : null;
  const imgSize = Math.round(size * 0.74);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          border: `1.5px solid ${GOLD_DIM}`,
          background: SURFACE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {patchUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={patchUrl}
            width={imgSize}
            height={imgSize}
            style={{ objectFit: 'contain' }}
          />
        )}
      </div>
      <div
        style={{
          fontSize: labelSize,
          fontWeight: 700,
          color: GOLD_DIM,
          letterSpacing: '0.1em',
          fontFamily: MONO,
        }}
      >
        {iata}
      </div>
    </div>
  );
}

// ── Stories template (1080 × 1920) ────────────────────────────────────────────

export function StoriesTemplate({
  data,
  watermark = true,
  baseUrl = '',
}: {
  data: RecapData;
  watermark?: boolean;
  baseUrl?: string;
}) {
  const { period, crewHandle, totalSectors, totalKm, topDestinations, superlative } = data;
  const top3 = topDestinations.slice(0, 3);

  const heroValue =
    period.type === 'month' ? String(totalSectors) : formatKilometers(totalKm);
  const heroLabel = period.type === 'month' ? 'Sectors Flown' : 'KM Flown';

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: BG_GRAD,
        backgroundColor: BG_SOLID,
        padding: '0',
        color: PARCHMENT,
        fontFamily: 'sans-serif',
      }}
    >
      {/* Top perf */}
      <div style={{ padding: '56px 80px 0' }}>
        <div style={{ height: 2, width: '100%', backgroundImage: PERF_BG }} />
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          padding: '40px 80px 36px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: GOLD_DIM,
              letterSpacing: '0.38em',
              textTransform: 'uppercase' as const,
              fontFamily: MONO,
            }}
          >
            Cemrosta
          </div>
          <div style={{ fontSize: 42, fontWeight: 700, color: PARCHMENT }}>
            Crew Logbook
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: GOLD_DIM,
              letterSpacing: '0.2em',
              textTransform: 'uppercase' as const,
              fontFamily: MONO,
            }}
          >
            {period.type === 'month' ? 'Monthly' : period.type === '6m' ? '6-Month' : 'Annual'}
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, color: PARCHMENT }}>
            {period.label}
          </div>
        </div>
      </div>

      {/* Mid perf */}
      <div style={{ padding: '0 80px' }}>
        <div style={{ height: 2, width: '100%', backgroundImage: PERF_BG }} />
      </div>

      {/* Patch medallions row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 48,
          padding: '72px 80px 64px',
        }}
      >
        {top3.map(({ iata }) => (
          <PatchMedallion key={iata} iata={iata} size={180} baseUrl={baseUrl} labelSize={20} />
        ))}
        {top3.length === 0 && (
          /* placeholder rings when no data */
          [0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 180,
                height: 180,
                borderRadius: 90,
                border: `1.5px solid ${GOLD_FAINT}`,
                background: SURFACE,
              }}
            />
          ))
        )}
      </div>

      {/* Mid perf */}
      <div style={{ padding: '0 80px' }}>
        <div style={{ height: 2, width: '100%', backgroundImage: PERF_BG }} />
      </div>

      {/* Hero stat */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '80px 80px 60px',
        }}
      >
        <div
          style={{
            fontSize: 220,
            fontWeight: 900,
            lineHeight: 1,
            color: PARCHMENT,
            letterSpacing: '-0.03em',
            fontFamily: MONO,
          }}
        >
          {heroValue}
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: GOLD,
            letterSpacing: '0.35em',
            textTransform: 'uppercase' as const,
            marginTop: 16,
            fontFamily: MONO,
          }}
        >
          {heroLabel}
        </div>
      </div>

      {/* Secondary stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          padding: '0 80px 64px',
          gap: 32,
        }}
      >
        {[
          { value: String(totalSectors), label: 'Sectors' },
          { value: formatKilometers(totalKm), label: 'KM Flown' },
          ...(period.type !== 'month'
            ? [{ value: `${+(totalKm / 40_075).toFixed(1)}×`, label: 'Earth Laps' }]
            : []),
        ].map((s, i, arr) => (
          <div
            key={s.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              borderRight: i < arr.length - 1 ? `1px solid ${GOLD_FAINT}` : 'none',
            }}
          >
            <div
              style={{
                fontSize: 70,
                fontWeight: 800,
                color: PARCHMENT,
                fontFamily: MONO,
                letterSpacing: '-0.02em',
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: GOLD_DIM,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                marginTop: 8,
                fontFamily: MONO,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Mid perf */}
      <div style={{ padding: '0 80px' }}>
        <div style={{ height: 2, width: '100%', backgroundImage: PERF_BG }} />
      </div>

      {/* Mission award */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 48,
          margin: '64px 80px',
          padding: '52px 56px',
          background: AWARD_BG,
          border: `1.5px solid ${GOLD_FAINT}`,
          borderRadius: 32,
        }}
      >
        {/* Seal circle */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            border: `2px solid ${GOLD}`,
            background: 'rgba(200,168,75,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 44,
            flexShrink: 0,
          }}
        >
          ✦
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: GOLD,
              letterSpacing: '0.22em',
              textTransform: 'uppercase' as const,
              fontFamily: MONO,
            }}
          >
            {superlative.label}
          </div>
          <div style={{ fontSize: 52, fontWeight: 900, color: PARCHMENT, lineHeight: 1.1 }}>
            {superlative.value}
          </div>
          <div style={{ fontSize: 32, color: PARCHMENT_DIM, fontWeight: 500 }}>
            {superlative.subValue}
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom perf */}
      <div style={{ padding: '0 80px' }}>
        <div style={{ height: 2, width: '100%', backgroundImage: PERF_BG }} />
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '28px 80px 56px',
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 700, color: PARCHMENT }}>{crewHandle}</div>
        {watermark && (
          <div style={{ fontSize: 26, fontWeight: 600, color: 'rgba(200,168,75,0.35)', fontFamily: MONO }}>
            cemrosta.com
          </div>
        )}
      </div>
    </div>
  );
}

// ── Card template (1200 × 630) ────────────────────────────────────────────────

export function CardTemplate({
  data,
  watermark = true,
  baseUrl = '',
}: {
  data: RecapData;
  watermark?: boolean;
  baseUrl?: string;
}) {
  const { period, crewHandle, totalSectors, totalKm, topDestinations, superlative } = data;
  const top3 = topDestinations.slice(0, 3);

  const heroValue =
    period.type === 'month' ? String(totalSectors) : formatKilometers(totalKm);
  const heroLabel = period.type === 'month' ? 'Sectors Flown' : 'KM Flown';

  const periodTypeLabel =
    period.type === 'month' ? 'Monthly' : period.type === '6m' ? '6-Month' : 'Annual';

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: BG_GRAD,
        backgroundColor: BG_SOLID,
        color: PARCHMENT,
        fontFamily: 'sans-serif',
      }}
    >
      {/* Top perf */}
      <div style={{ padding: '28px 60px 0' }}>
        <div style={{ height: 1, width: '100%', backgroundImage: PERF_BG }} />
      </div>

      {/* Header row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          padding: '20px 60px 16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: GOLD_DIM,
              letterSpacing: '0.38em',
              textTransform: 'uppercase' as const,
              fontFamily: MONO,
            }}
          >
            Cemrosta
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: PARCHMENT }}>Crew Logbook</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: GOLD_DIM,
              letterSpacing: '0.22em',
              textTransform: 'uppercase' as const,
              fontFamily: MONO,
            }}
          >
            {periodTypeLabel}
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: PARCHMENT }}>{period.label}</div>
        </div>
      </div>

      {/* Mid perf */}
      <div style={{ padding: '0 60px' }}>
        <div style={{ height: 1, width: '100%', backgroundImage: PERF_BG }} />
      </div>

      {/* Main body — two columns */}
      <div style={{ display: 'flex', flex: 1, padding: '28px 60px', gap: 48 }}>

        {/* LEFT COLUMN: patches + mission award */}
        <div style={{ display: 'flex', flexDirection: 'column', width: 360, gap: 20 }}>

          {/* Patch medallions */}
          <div style={{ display: 'flex', gap: 14 }}>
            {top3.length > 0
              ? top3.map(({ iata }) => (
                  <PatchMedallion key={iata} iata={iata} size={96} baseUrl={baseUrl} labelSize={11} />
                ))
              : [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 48,
                      border: `1.5px solid ${GOLD_FAINT}`,
                      background: SURFACE,
                    }}
                  />
                ))}
          </div>

          {/* Mission award card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: AWARD_BG,
              border: `1px solid ${GOLD_FAINT}`,
              borderRadius: 20,
              padding: '20px 22px',
              gap: 6,
              marginTop: 'auto',
            }}
          >
            {/* Seal + label row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  border: `1.5px solid ${GOLD}`,
                  background: 'rgba(200,168,75,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                ✦
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: GOLD,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase' as const,
                  fontFamily: MONO,
                }}
              >
                {superlative.label}
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: PARCHMENT, lineHeight: 1.1 }}>
              {superlative.value}
            </div>
            <div style={{ fontSize: 16, color: PARCHMENT_FAINT, fontWeight: 500 }}>
              {superlative.subValue}
            </div>
          </div>
        </div>

        {/* Vertical separator */}
        <div
          style={{
            width: 1,
            alignSelf: 'stretch',
            backgroundImage: PERF_BG,
            backgroundSize: 'auto 100%',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* RIGHT COLUMN: hero stat + secondary stats */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'center',
            gap: 20,
          }}
        >
          {/* Hero number */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div
              style={{
                fontSize: 140,
                fontWeight: 900,
                lineHeight: 1,
                color: PARCHMENT,
                letterSpacing: '-0.03em',
                fontFamily: MONO,
              }}
            >
              {heroValue}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: GOLD,
                letterSpacing: '0.35em',
                textTransform: 'uppercase' as const,
                fontFamily: MONO,
              }}
            >
              {heroLabel}
            </div>
          </div>

          {/* Secondary stats */}
          <div style={{ display: 'flex', gap: 28 }}>
            {[
              { value: formatKilometers(totalKm), label: 'KM Flown' },
              { value: String(topDestinations.length), label: 'Cities' },
            ].map((s, i, arr) => (
              <div
                key={s.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  paddingRight: i < arr.length - 1 ? 28 : 0,
                  borderRight: i < arr.length - 1 ? `1px solid ${GOLD_FAINT}` : 'none',
                }}
              >
                <div
                  style={{
                    fontSize: 38,
                    fontWeight: 800,
                    color: PARCHMENT,
                    fontFamily: MONO,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: GOLD_DIM,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                    fontFamily: MONO,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom perf */}
      <div style={{ padding: '0 60px' }}>
        <div style={{ height: 1, width: '100%', backgroundImage: PERF_BG }} />
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 60px 22px',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: PARCHMENT }}>{crewHandle}</div>
        {watermark && (
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'rgba(200,168,75,0.35)',
              fontFamily: MONO,
            }}
          >
            cemrosta.com
          </div>
        )}
      </div>
    </div>
  );
}
