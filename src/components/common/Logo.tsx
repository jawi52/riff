import React from 'react';
import { usePlayerStore } from '../../stores/usePlayerStore';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  glow?: boolean;
  animated?: boolean;
  onClick?: () => void;
}

const heightMap = {
  sm: 24,
  md: 30,
  lg: 38,
  xl: 48,
};

export interface RiffTextLogoProps {
  height?: number;
  size?: number;
  glow?: boolean;
  animated?: boolean;
  className?: string;
}

/**
 * Dark Smoked Glass & Chrome Typographic "riff" Logotype
 * Precision Swiss architecture with dark acoustic cuts.
 */
export const RiffTextLogo: React.FC<RiffTextLogoProps> = ({
  height,
  size,
  animated = false,
  className = ''
}) => {
  const finalHeight = height || size || 28;
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  // Aspect ratio: 110 : 30 (3.66 : 1)
  const width = Math.round(finalHeight * 3.66);

  return (
    <svg
      width={width}
      height={finalHeight}
      viewBox="0 0 110 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 select-none ${className}`}
    >
      <defs>
        <linearGradient id={`riffDarkG_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id={`riffDotG_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>

      <g>
        {/* ================= LOWERCASE 'r' ================= */}
        <rect x="4" y="9" width="5" height="17" rx="2.5" fill={`url(#riffDarkG_${id})`} />
        <path
          d="M8.5 13 C10.5 10 14 8.5 18 9 C19.5 9.2 20.8 9.8 21.5 10.5 L19.5 14.5 C19 14 18 13.5 17 13.5 C14.5 13.5 13 15 13 18.5 V26 H8 V13 Z"
          fill={`url(#riffDarkG_${id})`}
        />

        {/* ================= LOWERCASE 'i' ================= */}
        <rect x="27" y="9" width="5" height="17" rx="2.5" fill={`url(#riffDarkG_${id})`} />
        {/* Glowing Pulse Dot */}
        <circle
          cx="29.5"
          cy="4"
          r="3"
          fill={`url(#riffDotG_${id})`}
          className={animated ? 'animate-pulse' : ''}
        />

        {/* ================= FIRST 'f' ================= */}
        <path
          d="M44 4 C39 4 36.5 7 36.5 12.5 V26 H41.5 V14 C41.5 11.5 42.8 10 45 10 C45.8 10 46.5 10.2 47 10.6 V5.2 C46.2 4.4 45.2 4 44 4 Z"
          fill={`url(#riffDarkG_${id})`}
        />
        <rect x="33.5" y="11" width="13" height="4" rx="2" fill={`url(#riffDarkG_${id})`} />

        {/* ================= SECOND 'f' ================= */}
        <path
          d="M59 4 C54 4 51.5 7 51.5 12.5 V26 H56.5 V14 C56.5 11.5 57.8 10 60 10 C60.8 10 61.5 10.2 62 10.6 V5.2 C61.2 4.4 60.2 4 59 4 Z"
          fill={`url(#riffDarkG_${id})`}
        />
        <rect x="48.5" y="11" width="13" height="4" rx="2" fill={`url(#riffDarkG_${id})`} />

        {/* ================= DARK CHROME EQUALIZER ================= */}
        <g className={animated ? 'animate-pulse' : ''}>
          <rect x="74" y="11" width="3" height="11" rx="1.5" fill="#64748b" />
          <rect x="80" y="7" width="3" height="17" rx="1.5" fill="#94a3b8" />
          <rect x="86" y="3" width="3" height="23" rx="1.5" fill="#e2e8f0" />
          <rect x="92" y="8" width="3" height="15" rx="1.5" fill="#94a3b8" />
          <rect x="98" y="12" width="3" height="9" rx="1.5" fill="#64748b" />
        </g>
      </g>
    </svg>
  );
};

export const RiffIcon = RiffTextLogo;

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
  animated,
  onClick,
}) => {
  const { playbackState } = usePlayerStore();
  const isPlaying = animated !== undefined ? animated : playbackState === 'playing';
  const height = typeof size === 'number' ? size : heightMap[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center group cursor-pointer select-none transition-transform hover:scale-[1.03] active:scale-[0.97] ${className}`}
      title="riff"
    >
      <RiffTextLogo
        height={height}
        animated={isPlaying}
      />
    </div>
  );
};

export default Logo;
