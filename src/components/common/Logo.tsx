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
 * Pure Typographic "Riff" Wordmark Logo
 * Handcrafted vector letterforms for 'R', 'i', 'f', 'f' with electric neon audio styling.
 * Zero icon box / squircle — the typography itself is the brand logo.
 */
export const RiffTextLogo: React.FC<RiffTextLogoProps> = ({
  height,
  size,
  glow = true,
  animated = false,
  className = ''
}) => {
  const finalHeight = height || size || 28;
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  // Aspect ratio is 115 : 32 (3.59 : 1)
  const width = Math.round(finalHeight * 3.59);

  return (
    <svg
      width={width}
      height={finalHeight}
      viewBox="0 0 115 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 select-none ${className}`}
    >
      <defs>
        {/* Crisp Gradient for 'R' and 'ff' */}
        <linearGradient id={`riffTextGrad_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e5e7eb" />
        </linearGradient>

        {/* Electric Emerald to Cyan Sonic Gradient */}
        <linearGradient id={`riffSonicGrad_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="60%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>

        {/* Glow Filter */}
        {glow && (
          <filter id={`riffGlow_${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <g>
        {/* ================= LETTER 'R' ================= */}
        {/* R Stem */}
        <rect x="2" y="4" width="5.5" height="24" rx="1.5" fill={`url(#riffTextGrad_${id})`} />
        
        {/* R Upper Bowl */}
        <path
          d="M7.5 4 H16.5 C21.5 4 24.5 6.8 24.5 11.5 C24.5 16.2 21.5 19 16.5 19 H7.5 V4 Z"
          fill={`url(#riffTextGrad_${id})`}
        />
        {/* Inner Bowl Cutout */}
        <path
          d="M7.5 8.5 H15.5 C18 8.5 19.5 9.8 19.5 11.5 C19.5 13.2 18 14.5 15.5 14.5 H7.5 V8.5 Z"
          fill="#06070a"
        />

        {/* Electric Emerald Wave Riff slice across R */}
        <rect
          x="7.5"
          y="10.5"
          width="7.5"
          height="2"
          rx="1"
          fill={`url(#riffSonicGrad_${id})`}
          filter={glow ? `url(#riffGlow_${id})` : undefined}
        />

        {/* R Leg */}
        <path
          d="M13 17.5 L20.5 28 H26.5 L18.5 17.5 H13 Z"
          fill={`url(#riffTextGrad_${id})`}
        />

        {/* ================= LETTER 'i' ================= */}
        {/* i Stem */}
        <rect x="33" y="11" width="5" height="17" rx="1.5" fill={`url(#riffTextGrad_${id})`} />
        {/* Glowing Sonic Dot above i */}
        <circle
          cx="35.5"
          cy="5.5"
          r="3"
          fill={`url(#riffSonicGrad_${id})`}
          filter={glow ? `url(#riffGlow_${id})` : undefined}
          className={animated ? 'animate-pulse' : ''}
        />

        {/* ================= FIRST LETTER 'f' ================= */}
        {/* Stem and arch */}
        <path
          d="M51 4 C45.5 4 43 7.5 43 13 V28 H48 V14 C48 11 49.5 10 52 10 C53 10 54 10.3 54.8 10.8 V5 C53.8 4.3 52.5 4 51 4 Z"
          fill={`url(#riffTextGrad_${id})`}
        />
        {/* Crossbar */}
        <rect x="40" y="12" width="13" height="4.5" rx="1.2" fill={`url(#riffTextGrad_${id})`} />

        {/* ================= SECOND LETTER 'f' ================= */}
        {/* Stem and arch */}
        <path
          d="M67 4 C61.5 4 59 7.5 59 13 V28 H64 V14 C64 11 65.5 10 68 10 C69 10 70 10.3 70.8 10.8 V5 C69.8 4.3 68.5 4 67 4 Z"
          fill={`url(#riffTextGrad_${id})`}
        />
        {/* Crossbar flowing into sonic riff waves */}
        <rect x="56" y="12" width="13" height="4.5" rx="1.2" fill={`url(#riffTextGrad_${id})`} />

        {/* ================= SONIC AUDIO RIFF WAVE TRAIL ================= */}
        <g filter={glow ? `url(#riffGlow_${id})` : undefined}>
          {/* Sonic Soundwave Frequency Bars */}
          <rect x="74" y="14" width="2.5" height="9" rx="1.2" fill="#10b981" />
          <rect x="79" y="10" width="2.5" height="15" rx="1.2" fill="#06b6d4" />
          <rect x="84" y="7" width="2.5" height="19" rx="1.2" fill="#10b981" />
          <rect x="89" y="12" width="2.5" height="12" rx="1.2" fill="#3b82f6" />
          <rect x="94" y="15" width="2.5" height="7" rx="1.2" fill="#10b981" />
        </g>
      </g>
    </svg>
  );
};

export const RiffIcon = RiffTextLogo;

/**
 * Pure Text Logo Component
 */
export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
  glow = true,
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
      title="Riff"
    >
      <RiffTextLogo
        height={height}
        glow={glow}
        animated={isPlaying}
      />
    </div>
  );
};

export default Logo;
