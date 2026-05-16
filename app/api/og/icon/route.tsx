import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const VALID_SIZES = [32, 180, 192, 512] as const
type IconSize = (typeof VALID_SIZES)[number]

function isValidSize(n: number): n is IconSize {
  return (VALID_SIZES as readonly number[]).includes(n)
}

export async function GET(req: NextRequest) {
  const raw = parseInt(req.nextUrl.searchParams.get('size') ?? '192', 10)
  const size: IconSize = isValidSize(raw) ? raw : 192

  // Larger PWA icons use accent background + white mark for visual pop
  const usePop = size >= 192
  const bg = usePop ? '#E5484D' : '#FFFFFF'
  const stroke = usePop ? '#FFFFFF' : '#222222'

  // Mark occupies 56% of the icon canvas
  const markSize = Math.round(size * 0.56)

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg viewBox="0 0 28 28" width={markSize} height={markSize}>
          <circle
            cx="20"
            cy="8"
            r="6"
            stroke={stroke}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="3" y1="25" x2="9" y2="19" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="27" x2="14" y2="21" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <line x1="13" y1="26" x2="17" y2="20" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  )
}
