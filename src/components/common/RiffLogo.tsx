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
    sm: { text: "text-2xl tracking-tight", dot: "w-2 h-2" },
    md: { text: "text-3xl tracking-tight", dot: "w-2.5 h-2.5" },
    lg: { text: "text-5xl tracking-tighter", dot: "w-3 h-3" },
    xl: { text: "text-6xl sm:text-7xl tracking-tighter", dot: "w-3.5 h-3.5" },
  };

  const current = sizeMap[size];

  return (
    <div className={`inline-flex items-center select-none relative group ${className}`}>
      {/* Subtle Glow Behind Text Logo */}
      {glow && (
        <div 
          className="absolute -inset-3 bg-gradient-to-r from-violet-600/25 via-indigo-500/20 to-cyan-500/25 blur-xl opacity-60 group-hover:opacity-100 transition duration-500 pointer-events-none rounded-full" 
        />
      )}

      {/* Pure Typography Wordmark */}
      <div className="relative flex items-center gap-1.5">
        <span className={`font-black font-sans uppercase ${current.text} bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent drop-shadow-sm`}>
          RIFF
        </span>
        <span className={`${current.dot} rounded-full bg-gradient-to-tr from-violet-400 to-cyan-400 shadow-sm shadow-violet-500/80 animate-pulse`} />
      </div>
    </div>
  );
};

