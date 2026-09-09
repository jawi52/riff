import React, { useEffect, useState } from 'react';
import { RiffLogo } from './RiffLogo';

interface SplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onFinish, 
  minDurationMs = 1200 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, minDurationMs);

    const finishTimer = setTimeout(() => {
      setIsVisible(false);
      if (onFinish) onFinish();
    }, minDurationMs + 400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [minDurationMs, onFinish]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-[#0c0d12] flex flex-col items-center justify-center select-none transition-opacity duration-400 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center space-y-6">
        {/* Ambient Pulsing Glow behind Logo */}
        <div className="absolute -inset-10 bg-[#1ed760]/20 rounded-full blur-3xl animate-pulse pointer-events-none" />

        {/* Large Logo Monogram & Wordmark */}
        <RiffLogo size="xl" glow={true} className="animate-in zoom-in-95 duration-500" />

        {/* Audio Equalizer Soundwave Bars Animation */}
        <div className="flex items-center gap-1.5 h-6">
          <span className="w-1 bg-[#1ed760] rounded-full animate-bounce [animation-delay:0ms] h-3" />
          <span className="w-1 bg-[#00f2fe] rounded-full animate-bounce [animation-delay:150ms] h-5" />
          <span className="w-1 bg-[#1ed760] rounded-full animate-bounce [animation-delay:300ms] h-6" />
          <span className="w-1 bg-[#00f2fe] rounded-full animate-bounce [animation-delay:450ms] h-4" />
          <span className="w-1 bg-[#1ed760] rounded-full animate-bounce [animation-delay:600ms] h-2" />
        </div>

        <p className="text-[11px] font-bold tracking-widest text-[#727272] uppercase">
          Studio Master Sound
        </p>
      </div>
    </div>
  );
};
