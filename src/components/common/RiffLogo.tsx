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
    sm: { icon: "w-7 h-7", text: "text-lg", dot: "w-1.5 h-1.5" },
    md: { icon: "w-9 h-9", text: "text-xl", dot: "w-2 h-2" },
    lg: { icon: "w-12 h-12", text: "text-2xl", dot: "w-2.5 h-2.5" },
    xl: { icon: "w-16 h-16", text: "text-4xl", dot: "w-3 h-3" },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Icon with Glowing Ambient Gradient */}
      <div className="relative group">
        {glow && (
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/30 via-teal-500/20 to-cyan-500/30 blur-md opacity-70 group-hover:opacity-100 transition duration-500" />
        )}
        <div className={`relative ${currentSize.icon} flex items-center justify-center rounded-xl bg-[#0e1017] border border-white/10 shadow-inner overflow-hidden`}>
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full p-1"
          >
            <defs>
              <linearGradient id="riffNeonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1ed760" />
                <stop offset="60%" stopColor="#1db954" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>

            {/* Monogram R Icon Architecture */}
            {/* 1. Stem */}
            <rect x="15" y="14" width="8.5" height="36" rx="2.5" fill="#ffffff" />

            {/* 2. Bowl Arch */}
            <path
              d="M23.5 14 H36 C45 14 50 18.5 50 26.5 C50 34.5 45 39 36 39 H23.5 V14 Z"
              fill="#ffffff"
            />

            {/* 3. Dark Inner Space */}
            <path
              d="M23.5 20.5 H34.5 C38 20.5 41.5 22.5 41.5 26.5 C41.5 30.5 38 32.5 34.5 32.5 H23.5 V20.5 Z"
              fill="#0e1017"
            />

            {/* 4. Emerald Equalizer Kinetic Pulse */}
            <rect
              x="25.5"
              y="24"
              width="8.5"
              height="5"
              rx="2.5"
              fill="url(#riffNeonGrad)"
            />

            {/* 5. 45-degree Kinetic Leg */}
            <polygon
              points="27.5,37 36,37 49,50 39.5,50"
              fill="#ffffff"
            />

            {/* 6. Sonic Pulse Indicator */}
            <circle
              cx="49"
              cy="26.5"
              r="2.8"
              fill="#1ed760"
            />
          </svg>
        </div>
      </div>

      {/* Modern Typography Wordmark */}
      {showText && (
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-tight ${currentSize.text} text-white font-sans`}>
            RIFF
          </span>
          <span className={`${currentSize.dot} rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse`} />
        </div>
      )}
    </div>
  );
};
