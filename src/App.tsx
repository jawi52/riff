import { useState, useEffect } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { RiffLogo } from './components/common/RiffLogo';
import { ArrowLeft, Sparkles } from 'lucide-react';

export function App() {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Capture PWA installation prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // 1. Landing Page View (Default)
  if (view === 'landing') {
    return (
      <LandingPage
        onContinueOnline={() => setView('app')}
        deferredPrompt={deferredPrompt}
      />
    );
  }

  // 2. Online Player / App Placeholder (Ready for Next Page Build)
  return (
    <div className="min-h-screen bg-[#07080c] text-white flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      <RiffLogo size="lg" className="mb-6" />

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 mb-4">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span>Riff Web Player Online</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
        Online Mode Active
      </h1>
      <p className="text-neutral-400 text-sm max-w-md mb-8">
        Landing page is complete. Ready to build the next page (e.g. Home Feed, Official Search Explorer, or Player Shell).
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setView('landing')}
          className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white transition flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Landing Page
        </button>
      </div>
    </div>
  );
}

export default App;
