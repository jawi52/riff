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
 * Modern High-Impact Typographic "RIFF" Wordmark
 * Precision-cut geometric letterforms with embedded acoustic wave energy.
 */
export const RiffTextLogo: React.FC<RiffTextLogoProps> = ({
  height,
  size,
  animated = false,
  className = ''
}) => {
  const finalHeight = height || size || 28;
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  // Aspect ratio: 112 : 28 (4 : 1)
  const width = Math.round(finalHeight * 4);

  return (
    <svg
      width={width}
      height={finalHeight}
      viewBox="0 0 112 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 select-none ${className}`}
    >
      <defs>
        <linearGradient id={`riffTextG_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d4d4d8" />
        </linearGradient>
        <linearGradient id={`riffWaveG_${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>

      <g>
        {/* ================= LETTER 'R' ================= */}
        <path
          d="M2 3 H15 C19.5 3 22.5 5.5 22.5 9.5 C22.5 13.5 19.5 16 15 16 H7.5 V25 H2 V3 Z"
          fill={`url(#riffTextG_${id})`}
        />
        {/* R Inner Window */}
        <path d="M7.5 7.5 H14 C16 7.5 17 8.2 17 9.5 C17 10.8 16 11.5 14 11.5 H7.5 V7.5 Z" fill="#07080c" />
        {/* R Acoustic Slash Leg */}
        <path d="M12.5 15 L20.5 25 H26.5 L17.5 15 H12.5 Z" fill={`url(#riffTextG_${id})`} />

        {/* ================= LETTER 'I' ================= */}
        <rect x="31" y="3" width="5.5" height="22" rx="1.5" fill={`url(#riffTextG_${id})`} />

        {/* ================= FIRST 'F' ================= */}
        <path
          d="M41 3 H56 V7.5 H46.5 V12 H54 V16.5 H46.5 V25 H41 V3 Z"
          fill={`url(#riffTextG_${id})`}
        />
        {/* F Sound Notch */}
        <rect x="49" y="4.5" width="2" height="1.5" rx="0.5" fill={`url(#riffWaveG_${id})`} />

        {/* ================= SECOND 'F' ================= */}
        <path
          d="M60 3 H75 V7.5 H65.5 V12 H73 V16.5 H65.5 V25 H60 V3 Z"
          fill={`url(#riffTextG_${id})`}
        />
        {/* F Sound Notch */}
        <rect x="68" y="4.5" width="2" height="1.5" rx="0.5" fill={`url(#riffWaveG_${id})`} />

        {/* ================= ACOUSTIC EQUALIZER BARS ================= */}
        <g className={animated ? 'animate-pulse' : ''}>
          <rect x="80" y="10" width="3" height="10" rx="1.5" fill={`url(#riffWaveG_${id})`} />
          <rect x="85.5" y="5" width="3" height="20" rx="1.5" fill={`url(#riffWaveG_${id})`} />
          <rect x="91" y="2" width="3" height="26" rx="1.5" fill={`url(#riffWaveG_${id})`} />
          <rect x="96.5" y="7" width="3" height="16" rx="1.5" fill={`url(#riffWaveG_${id})`} />
          <rect x="102" y="11" width="3" height="8" rx="1.5" fill={`url(#riffWaveG_${id})`} />
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
      title="RIFF"
    >
      <RiffTextLogo
        height={height}
        animated={isPlaying}
      />
    </div>
  );
};

export default Logo;
