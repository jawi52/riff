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
  sm: 26,
  md: 32,
  lg: 40,
  xl: 52,
};

export interface RiffTextLogoProps {
  height?: number;
  size?: number;
  glow?: boolean;
  animated?: boolean;
  className?: string;
}

/**
 * Bespoke Pure Text "Riff" Typographic Logotype (Electric Ultraviolet & Cyan Edition)
 * Precision aerodynamic italic letterforms with diagonal sound cuts and audio frequency waves.
 */
export const RiffTextLogo: React.FC<RiffTextLogoProps> = ({
  height,
  size,
  glow = true,
  animated = false,
  className = ''
}) => {
  const finalHeight = height || size || 30;
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  // Aspect ratio is 130 : 34 (3.82 : 1)
  const width = Math.round(finalHeight * 3.82);

  return (
    <svg
      width={width}
      height={finalHeight}
      viewBox="0 0 130 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 select-none ${className}`}
    >
      <defs>
        {/* Crisp White to Light Indigo Text Gradient */}
        <linearGradient id={`riffTextG_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        {/* Electric Ultraviolet to Cyan Glow Gradient */}
        <linearGradient id={`riffNeonG_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>

        {/* Ambient Glow */}
        {glow && (
          <filter id={`riffGlow_${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <g transform="skewX(-8)">
        {/* ================= LETTER 'R' ================= */}
        {/* R Main Vertical Stem */}
        <rect x="6" y="5" width="6.5" height="24" rx="2" fill={`url(#riffTextG_${id})`} />
        
        {/* R Upper Bowl */}
        <path
          d="M12 5 H22 C27.5 5 31 8 31 13.5 C31 19 27.5 22 22 22 H12 V5 Z"
          fill={`url(#riffTextG_${id})`}
        />
        {/* R Bowl Inner Cutout */}
        <path
          d="M12.5 9.5 H21 C23.8 9.5 25.5 11 25.5 13.5 C25.5 16 23.8 17.5 21 17.5 H12.5 V9.5 Z"
          fill="#050608"
        />

        {/* Electric Ultraviolet Sonic Cut Slash across R */}
        <rect
          x="12"
          y="12"
          width="10"
          height="2.5"
          rx="1.2"
          fill={`url(#riffNeonG_${id})`}
          filter={glow ? `url(#riffGlow_${id})` : undefined}
        />

        {/* R Dynamic Kicking Leg */}
        <path
          d="M18 20.5 L26 29 H33 L24 20.5 H18 Z"
          fill={`url(#riffTextG_${id})`}
        />

        {/* ================= LETTER 'i' ================= */}
        {/* i Stem */}
        <rect x="39" y="12" width="6" height="17" rx="2" fill={`url(#riffTextG_${id})`} />
        {/* Glowing Electric Neon Diamond / Dot */}
        <circle
          cx="42"
          cy="6.5"
          r="3.5"
          fill={`url(#riffNeonG_${id})`}
          filter={glow ? `url(#riffGlow_${id})` : undefined}
          className={animated ? 'animate-pulse' : ''}
        />

        {/* ================= FIRST LETTER 'f' ================= */}
        <path
          d="M59 5 C53 5 50 8.5 50 14.5 V29 H56 V15.5 C56 12 58 11 60.5 11 C61.5 11 62.5 11.3 63.5 11.8 V6 C62.2 5.3 60.8 5 59 5 Z"
          fill={`url(#riffTextG_${id})`}
        />
        <rect x="46.5" y="13.5" width="15" height="5" rx="1.5" fill={`url(#riffTextG_${id})`} />

        {/* ================= SECOND LETTER 'f' ================= */}
        <path
          d="M77 5 C71 5 68 8.5 68 14.5 V29 H74 V15.5 C74 12 76 11 78.5 11 C79.5 11 80.5 11.3 81.5 11.8 V6 C80.2 5.3 78.8 5 77 5 Z"
          fill={`url(#riffTextG_${id})`}
        />
        <rect x="64.5" y="13.5" width="15" height="5" rx="1.5" fill={`url(#riffTextG_${id})`} />

        {/* ================= ELECTRIC NEON AUDIO EQUALIZER SPECTRUM BARS ================= */}
        <g filter={glow ? `url(#riffGlow_${id})` : undefined}>
          <rect x="85" y="15" width="3" height="9" rx="1.5" fill="#a855f7" />
          <rect x="91" y="10" width="3" height="17" rx="1.5" fill="#8b5cf6" />
          <rect x="97" y="6" width="3" height="23" rx="1.5" fill="#06b6d4" />
          <rect x="103" y="12" width="3" height="14" rx="1.5" fill="#38bdf8" />
          <rect x="109" y="17" width="3" height="7" rx="1.5" fill="#a855f7" />
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
