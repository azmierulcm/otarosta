import React from 'react';

interface MHTailProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Malaysia Airlines tail logo mark — wau bulan + blue stripe.
 *
 * The wau is drawn as a thick stroke arc (a bold C-shape) rather than a filled
 * crescent, which renders correctly at any size without masks or ID management.
 *
 * Geometry (viewBox 0 0 24 32):
 *   Arc centre (20, 14), r=10.  Endpoints (20, 4) top → (20, 24) bottom.
 *   sweep=0 (counterclockwise in SVG / y-down) → arc sweeps around the LEFT
 *   side, creating the opening on the right — matching the MH livery.
 *   strokeWidth=6 fills the crescent body; round linecaps form the horn tips.
 */
export function MHTail({ size = 20, className, style }: MHTailProps) {
  const w = Math.round(size * 0.75);
  const h = size;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 24 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* Red wau bulan — bold C-arc, opening right */}
      <path
        d="M 20 4 A 10 10 0 0 0 20 24"
        stroke="#C8102E"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Blue stripe — base of tail fin */}
      <rect x="0" y="27" width="24" height="4" rx="0.5" fill="#003087" />
    </svg>
  );
}
