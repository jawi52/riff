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
 * Pure Bold Luxury Typographic "RIFF" Logotype
 * Ultra-clean Swiss geometry with acoustic micro-accents.
 */
export const RiffTextLogo: React.FC<RiffTextLogoProps> = ({
  height,
  size,
  animated = false,
  className = ''
}) => {
  const finalHeight = height || size || 26;
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  // Aspect ratio: 105 : 28 (3.75 : 1)
  const width = Math.round(finalHeight * 3.75);

  return (
    <svg
      width={width}
      height={finalHeight}
      viewBox="0 0 105 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 select-none ${className}`}
    >
      <defs>
        <linearGradient id={`riffLogoG_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f4f4f5" />
        </linearGradient>
        <linearGradient id={`riffAccentG_${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff4655" />
          <stop offset="100%" stopColor="#ff6b00" />
        </linearGradient>
      </defs>

      <g>
        {/* R */}
        <rect x="2" y="3" width="5.5" height="22" rx="1.5" fill="white" />
        <path d="M7.5 3 H17 C21.5 3 24 5.5 24 9.5 C24 13.5 21.5 16 17 16 H7.5 V3 Z" fill="white" />
        <path d="M7.5 7 H16 C18.2 7 19.5 8 19.5 9.5 C19.5 11 18.2 12 16 12 H7.5 V7 Z" fill="#000000" />
        <path d="M14 15 L21 25 H26.5 L19.5 15 H14 Z" fill="white" />

        {/* I */}
        <rect x="32" y="3" width="5.5" height="22" rx="1.5" fill="white" />
        {/* Accent dot above I */}
        <circle cx="34.75" cy="0" r="0" fill="transparent" />

        {/* First F */}
        <path d="M44 3 H58 V7.5 H49.5 V12 H56 V16.5 H49.5 V25 H44 V3 Z" fill="white" />

        {/* Second F */}
        <path d="M63 3 H77 V7.5 H68.5 V12 H75 V16.5 H68.5 V25 H63 V3 Z" fill="white" />

        {/* Electric Soundwave Bars */}
        <g className={animated ? 'animate-pulse' : ''}>
          <rect x="83" y="10" width="3" height="8" rx="1.5" fill="url(#riffAccentG_${id})" />
          <rect x="88.5" y="5" width="3" height="18" rx="1.5" fill="url(#riffAccentG_${id})" />
          <rect x="94" y="2" width="3" height="24" rx="1.5" fill="url(#riffAccentG_${id})" />
          <rect x="99.5" y="8" width="3" height="12" rx="1.5" fill="url(#riffAccentG_${id})" />
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
      className={`inline-flex items-center group cursor-pointer select-none transition-transform hover:scale-[1.02] active:scale-[0.98] ${className}`}
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
