import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg viewBox="0 0 28 28" width={26} height={26}>
          {/* Stamp circle — destination */}
          <circle
            cx="20"
            cy="8"
            r="6"
            stroke="#222222"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Runway dashes — path to destination */}
          <line x1="3" y1="25" x2="9" y2="19" stroke="#222222" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="27" x2="14" y2="21" stroke="#222222" strokeWidth="2" strokeLinecap="round" />
          <line x1="13" y1="26" x2="17" y2="20" stroke="#222222" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
