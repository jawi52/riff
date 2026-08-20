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
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
};

/**
 * Bespoke Handcrafted "Riff" Typographic Vector Logotype
 * Precision Swiss geometric typography with electric neon audio accents.
 */
export const RiffTextLogo: React.FC<{
  height?: number;
  glow?: boolean;
  animated?: boolean;
  className?: string;
}> = ({ height = 36, glow = true, animated = false, className = '' }) => {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  // Aspect ratio is 140 : 40 (3.5 : 1)
  const width = Math.round(height * 3.5);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 140 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 select-none ${className}`}
    >
      <defs>
        {/* White to Platinum Gradient for clean crisp typography */}
        <linearGradient id={`textGrad_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>

        {/* High-Octane Emerald to Cyan Electric Gradient */}
        <linearGradient id={`emeraldGrad_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1ed760" />
          <stop offset="60%" stopColor="#1db954" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>

        {/* Dynamic Wave Gradient */}
        <linearGradient id={`waveGrad_${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1ed760" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
        </linearGradient>

        {/* Luminescent Emerald Glow */}
        {glow && (
          <filter id={`glow_${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <g className="transition-all duration-300">
        {/* ================= LETTER 'R' ================= */}
        {/* Stem of R */}
        <rect x="6" y="8" width="7" height="26" rx="2" fill={`url(#textGrad_${id})`} />
        
        {/* Bowl of R */}
        <path
          d="M13 8 H26 C32.5 8 37 12 37 17.5 C37 23 32.5 27 26 27 H13 V8 Z"
          fill={`url(#textGrad_${id})`}
        />
        {/* Inner Cutout of R Bowl */}
        <path
          d="M13 14 H24.5 C27.5 14 29.5 15.5 29.5 17.5 C29.5 19.5 27.5 21 24.5 21 H13 V14 Z"
          fill="#08080a"
        />

        {/* Emerald Sonic Pulse Bar inside R Bowl */}
        <rect
          x="16"
          y="16"
          width="8"
          height="3"
          rx="1.5"
          fill={`url(#emeraldGrad_${id})`}
          filter={glow ? `url(#glow_${id})` : undefined}
          className={animated ? 'animate-pulse' : ''}
        />

        {/* Dynamic Forward Leg of R */}
        <polygon
          points="20,24 27,24 38,34 30,34"
          fill={`url(#textGrad_${id})`}
        />

        {/* ================= LETTER 'i' ================= */}
        {/* Stem of i */}
        <rect x="46" y="16" width="6.5" height="18" rx="2" fill={`url(#textGrad_${id})`} />

        {/* Glowing Emerald Pulse Dot on 'i' */}
        <circle
          cx="49.25"
          cy="10"
          r="3.5"
          fill={`url(#emeraldGrad_${id})`}
          filter={glow ? `url(#glow_${id})` : undefined}
          className={animated ? 'animate-ping' : ''}
          style={{ transformOrigin: '49.25px 10px' }}
        />
        <circle
          cx="49.25"
          cy="10"
          r="3.5"
          fill={`url(#emeraldGrad_${id})`}
        />

        {/* ================= FIRST LETTER 'f' ================= */}
        {/* Stem and top arch of first 'f' */}
        <path
          d="M68 6 C62 6 59 10 59 16 V34 H66 V18 C66 14 68 13 71 13 C72 13 73 13.5 74 14 V7 C72 6.3 70 6 68 6 Z"
          fill={`url(#textGrad_${id})`}
        />
        {/* Crossbar of first 'f' */}
        <rect x="55" y="16" width="16" height="5" rx="1.5" fill={`url(#textGrad_${id})`} />

        {/* ================= SECOND LETTER 'f' ================= */}
        {/* Stem and top arch of second 'f' */}
        <path
          d="M87 6 C81 6 78 10 78 16 V34 H85 V18 C85 14 87 13 90 13 C91 13 92 13.5 93 14 V7 C91 6.3 89 6 87 6 Z"
          fill={`url(#textGrad_${id})`}
        />
        {/* Crossbar of second 'f' */}
        <rect x="74" y="16" width="16" height="5" rx="1.5" fill={`url(#textGrad_${id})`} />

        {/* ================= SONIC RIFF SOUNDWAVE ACCENT ================= */}
        {/* Dynamic audio frequency pulse trailing the 'ff' */}
        <g filter={glow ? `url(#glow_${id})` : undefined}>
          <path
            d="M96 22 Q 102 14, 108 22 T 120 22 T 132 22"
            stroke={`url(#waveGrad_${id})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
            className={animated ? 'animate-pulse' : ''}
          />
          {/* High frequency audio dots */}
          <circle cx="108" cy="22" r="2" fill="#1ed760" />
          <circle cx="120" cy="22" r="2.5" fill="#06b6d4" />
          <circle cx="132" cy="22" r="2" fill="#1ed760" />
        </g>
      </g>
    </svg>
  );
};

/**
 * Minimalist Pure Riff Logo Component
 * Displays only the clean "Riff" text logo without any extra headings or clutter.
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
      className={`inline-flex items-center group cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] ${className}`}
      title="Riff Music"
    >
      <RiffTextLogo
        height={height}
        glow={glow}
        animated={isPlaying}
      />
    </div>
  );
};

// Export standalone icon for favicon and mini elements
export const RiffIcon: React.FC<{
  size?: number;
  glow?: boolean;
  className?: string;
}> = ({ size = 28, glow = true, className = '' }) => {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={`iconEmerald_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1ed760" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        {glow && (
          <filter id={`iconGlow_${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* R Stem */}
      <rect x="6" y="8" width="7" height="28" rx="2" fill="#ffffff" />
      {/* R Bowl */}
      <path
        d="M13 8 H26 C33 8 38 12.5 38 18.5 C38 24.5 33 29 26 29 H13 V8 Z"
        fill="#ffffff"
      />
      <path
        d="M13 14 H24.5 C27.5 14 30 16 30 18.5 C30 21 27.5 23 24.5 23 H13 V14 Z"
        fill="#08080a"
      />
      {/* Emerald Equalizer Pulse Bar */}
      <rect
        x="15"
        y="17"
        width="9"
        height="3"
        rx="1.5"
        fill={`url(#iconEmerald_${id})`}
        filter={glow ? `url(#iconGlow_${id})` : undefined}
      />
      {/* R Forward Leg */}
      <polygon points="20,26 27,26 38,36 30,36" fill="#ffffff" />
      {/* Sonic Wave Dots */}
      <circle cx="39" cy="18.5" r="2.5" fill="#1ed760" filter={glow ? `url(#iconGlow_${id})` : undefined} />
    </svg>
  );
};

export default Logo;
