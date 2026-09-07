import React from "react";

interface RiffLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  glow?: boolean;
}

export const RiffLogo: React.FC<RiffLogoProps> = ({
  size = "md",
  className = "",
  glow = true,
}) => {
  const sizeMap = {
    sm: { text: "text-xl tracking-tight", dot: "w-2 h-2" },
    md: { text: "text-2xl sm:text-3xl tracking-tight", dot: "w-2.5 h-2.5" },
    lg: { text: "text-4xl sm:text-5xl tracking-tighter", dot: "w-3 h-3" },
    xl: { text: "text-6xl sm:text-7xl tracking-tighter", dot: "w-3.5 h-3.5" },
  };

  const current = sizeMap[size];

  return (
    <div className={`inline-flex items-center select-none relative group ${className}`}>
      {/* Subtle Spotify Green Glow */}
      {glow && (
        <div 
          className="absolute -inset-2 bg-[#1ed760]/15 blur-xl opacity-40 group-hover:opacity-80 transition duration-500 pointer-events-none rounded-full" 
        />
      )}

      {/* Pure Typography Wordmark */}
      <div className="relative flex items-center gap-1.5">
        <span className={`font-black font-sans uppercase ${current.text} text-white tracking-[-0.03em]`}>
          RIFF
        </span>
        <span className={`${current.dot} rounded-full bg-[#1ed760] shadow-sm shadow-[#1ed760]/60 animate-pulse`} />
      </div>
    </div>
  );
};
