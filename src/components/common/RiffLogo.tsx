import React from "react";

interface RiffLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  glow?: boolean;
}

export const RiffLogo: React.FC<RiffLogoProps> = ({
  size = "md",
  showText = true,
  className = "",
  glow = true,
}) => {
  const sizeMap = {
    sm: { icon: "w-6 h-6", text: "text-lg tracking-tight", dot: "w-1.5 h-1.5" },
    md: { icon: "w-7 h-7 sm:w-8 sm:h-8", text: "text-xl sm:text-2xl tracking-tight", dot: "w-2 h-2" },
    lg: { icon: "w-10 h-10 sm:w-12 sm:h-12", text: "text-3xl sm:text-4xl tracking-tighter", dot: "w-2.5 h-2.5" },
    xl: { icon: "w-14 h-14 sm:w-16 sm:h-16", text: "text-5xl sm:text-6xl tracking-tighter", dot: "w-3 h-3" },
  };

  const current = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none relative group ${className}`}>
      {/* Subtle Spotify Green Glow */}
      {glow && (
        <div 
          className="absolute -inset-2 bg-[#1ed760]/20 blur-xl opacity-50 group-hover:opacity-100 transition duration-500 pointer-events-none rounded-full" 
        />
      )}

      {/* Modern Acoustic Soundwave R Monogram Icon */}
      <div className={`relative ${current.icon} shrink-0`}>
        <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="logoNeon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1ed760" />
              <stop offset="60%" stopColor="#1db954" />
              <stop offset="100%" stopColor="#00f2fe" />
            </linearGradient>
          </defs>
          {/* Rounded chassis background */}
          <rect x="2" y="2" width="60" height="60" rx="16" fill="#181818" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
          
          {/* R Spine */}
          <rect x="16" y="14" width="7" height="36" rx="3.5" fill="url(#logoNeon)" />
          
          {/* R Upper Arch */}
          <path
            d="M 23 14 C 36 14 45 18 45 28 C 45 37 36 41 23 41 L 23 34 C 32 34 38 32 38 28 C 38 23 32 21 23 21 Z"
            fill="url(#logoNeon)"
          />
          
          {/* R Kick Leg */}
          <path
            d="M 30 36 L 42 48 C 43.5 49.5 46 49.5 47.5 48 C 49 46.5 49 44 47.5 42.5 L 36 32 Z"
            fill="url(#logoNeon)"
          />

          {/* Acoustic EQ Bars */}
          <rect x="50" y="22" width="3" height="12" rx="1.5" fill="#00f2fe" opacity="0.9" />
          <rect x="54.5" y="25" width="2.5" height="7" rx="1.25" fill="#1ed760" opacity="0.8" />
        </svg>
      </div>

      {/* Pure Typography Wordmark */}
      {showText && (
        <div className="relative flex items-center gap-1.5">
          <span className={`font-black font-sans uppercase ${current.text} text-white tracking-[-0.03em]`}>
            RIFF
          </span>
          <span className={`${current.dot} rounded-full bg-[#1ed760] shadow-sm shadow-[#1ed760]/60 animate-pulse`} />
        </div>
      )}
    </div>
  );
};
