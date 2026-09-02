import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Globe,
  ShieldCheck,
  Mic2,
  Sliders,
  CheckCircle2,
  Zap,
  Music2,
  ArrowRight,
  Lock
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { PwaInstallModal } from '../common/PwaInstallModal';

interface LandingPageProps {
  deferredPrompt?: any;
}

export const LandingPage: React.FC<LandingPageProps> = ({ deferredPrompt }) => {
  const { setAuthView } = useAuthStore();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setAuthView('register');
          return;
        }
      } catch {
        setIsInstallModalOpen(true);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };

  const handleContinueInBrowser = () => {
    setAuthView('register');
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white selection:bg-[#1db954] selection:text-black overflow-x-hidden font-sans">
      {/* 1. Spotify-Style Floating Top Navigation */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/[0.08] px-6 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-9 h-9 rounded-full bg-[#1db954] flex items-center justify-center text-black font-black shadow-[0_0_20px_rgba(29,185,84,0.4)]">
            <Music2 className="w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">Riff</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-neutral-300">
          <a href="#features" className="hover:text-[#1db954] transition">Features</a>
          <a href="#engine" className="hover:text-[#1db954] transition">Riff-Engine</a>
          <a href="#experience" className="hover:text-[#1db954] transition">Experience</a>
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setAuthView('login')}
            className="text-sm font-bold text-neutral-300 hover:text-white transition px-3 py-2 cursor-pointer"
          >
            Log in
          </button>
          <button
            onClick={() => setAuthView('register')}
            className="text-sm font-black bg-white text-black hover:bg-neutral-200 px-5 py-2.5 rounded-full transition hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
          >
            Sign up free
          </button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-28 px-6 lg:px-16 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Ambient Top Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#1db954]/15 blur-[140px] pointer-events-none rounded-full" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs font-bold text-[#1db954] mb-8 shadow-inner">
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Riff v1.0 • Universal 320kbps Music Engine</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl leading-[1.08] mb-6">
          Listening is everything. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1db954] via-emerald-400 to-cyan-400">
            Reimagined with zero ads.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg lg:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed font-medium">
          Stream over 100 million verified songs in studio-master 320kbps CD quality. Real-time synced karaoke lyrics, 5-band DSP equalizer, and true installable offline listening.
        </p>

        {/* Primary Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-6">
          <button
            onClick={handleInstallClick}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#1db954] text-black font-black text-base hover:bg-[#1ed760] transition hover:scale-105 active:scale-95 shadow-[0_10px_35px_rgba(29,185,84,0.4)] cursor-pointer group"
          >
            <Download className="w-5 h-5 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
            <span>Install App</span>
          </button>

          <button
            onClick={handleContinueInBrowser}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/15 font-bold text-base transition hover:scale-105 active:scale-95 cursor-pointer group"
          >
            <Globe className="w-5 h-5 text-neutral-300 group-hover:text-white" />
            <span>Continue in Browser</span>
            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="flex items-center gap-5 text-xs text-neutral-500 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#1db954]" />
            30-Day Persistent Session
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#1db954]" />
            Zero Ads Forever
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#1db954]" />
            Full Offline PWA
          </span>
        </div>

        {/* 3. Hero Visual Mockup Preview */}
        <div className="mt-16 w-full max-w-5xl rounded-3xl bg-[#121212] border border-white/10 p-4 sm:p-6 shadow-[0_25px_80px_rgba(0,0,0,0.8)] relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-2 text-xs font-bold text-neutral-500">Riff Master Player</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#1db954]/15 text-[#1db954] border border-[#1db954]/30">
              ⚡ Riff-Engine 320k Direct
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {/* Left preview: Pinned playlist */}
            <div className="rounded-2xl bg-[#181818] p-4 flex flex-col justify-between border border-white/5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">Your Library</p>
                <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.04]">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-500 flex items-center justify-center shadow-md">
                    <Music2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Liked Songs</p>
                    <p className="text-xs text-neutral-400">Playlist • Pinned</p>
                  </div>
                </div>
              </div>
              <div className="pt-6 text-xs text-neutral-500 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1db954]" />
                Auto-synced to your device
              </div>
            </div>

            {/* Center preview: Track playback */}
            <div className="rounded-2xl bg-[#181818] p-4 flex flex-col items-center text-center justify-center border border-white/5 relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80"
                alt="Track Cover"
                className="w-28 h-28 rounded-2xl object-cover shadow-2xl mb-3 border border-white/10"
              />
              <p className="text-sm font-black text-white">Blinding Lights</p>
              <p className="text-xs text-neutral-400 mb-3">The Weeknd • After Hours</p>
              
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-2">
                <div className="bg-[#1db954] h-full w-2/3 rounded-full" />
              </div>
              <div className="w-full flex justify-between text-[10px] font-mono text-neutral-500">
                <span>2:15</span>
                <span>3:20</span>
              </div>
            </div>

            {/* Right preview: Real-Time Synced Lyrics */}
            <div className="rounded-2xl bg-[#181818] p-4 flex flex-col justify-between border border-white/5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
                  <Mic2 className="w-3.5 h-3.5 text-[#1db954]" /> Synced Karaoke Lyrics
                </p>
                <div className="space-y-2 text-xs">
                  <p className="text-neutral-500">I've been on my own for long enough</p>
                  <p className="text-[#1db954] font-black text-sm drop-shadow-[0_0_12px_rgba(29,185,84,0.6)]">
                    I said, ooh, I'm blinded by the lights
                  </p>
                  <p className="text-neutral-500">No, I can't sleep until I feel your touch</p>
                </div>
              </div>
              <div className="pt-4 text-[10px] text-neutral-500 font-mono">
                Real-time beat alignment
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Section */}
      <section id="features" className="py-24 px-6 lg:px-16 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs font-black uppercase tracking-widest text-[#1db954] mb-3">Built for Audiophiles</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
            Everything you love about Spotify, without the limits.
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base">
            Engineered from the ground up with high-speed audio resolution, lossless streaming, and modern PWA technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="rounded-3xl bg-[#121212] hover:bg-[#181818] transition-all p-7 border border-white/5 hover:border-[#1db954]/30 group">
            <div className="w-12 h-12 rounded-2xl bg-[#1db954]/10 text-[#1db954] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">100M+ Universal Catalog</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Powered by our dedicated Riff-Engine. Search and stream tracks across international catalogs with 320kbps CD master fidelity.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-3xl bg-[#121212] hover:bg-[#181818] transition-all p-7 border border-white/5 hover:border-[#1db954]/30 group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Mic2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Synchronized Karaoke Lyrics</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Sing along with millisecond-accurate scrolling lyrics. Tap any line in the lyrics to instantly scrub and seek playback.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-3xl bg-[#121212] hover:bg-[#181818] transition-all p-7 border border-white/5 hover:border-[#1db954]/30 group">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Studio Web Audio DSP</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              5-band BiquadFilter hardware-accelerated equalizer with customizable presets and real-time 60 FPS spectrum frequency visualizer.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="rounded-3xl bg-[#121212] hover:bg-[#181818] transition-all p-7 border border-white/5 hover:border-[#1db954]/30 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">True Offline PWA</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              One-click install directly from your browser. Full background audio playback, lock screen media controls, and OPFS storage.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="rounded-3xl bg-[#121212] hover:bg-[#181818] transition-all p-7 border border-white/5 hover:border-[#1db954]/30 group">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Zero Tracking, Zero Ads</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              No audio interstitials, no pop-up banners, and zero third-party telemetry spyware. Pure music directly to your ears.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="rounded-3xl bg-[#121212] hover:bg-[#181818] transition-all p-7 border border-white/5 hover:border-[#1db954]/30 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">30-Day Persistent Session</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Log in once and stay logged in. As long as you open the app at least once every 30 days, your session remains permanently active.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Bottom Call to Action Section */}
      <section className="py-20 px-6 lg:px-16 max-w-5xl mx-auto text-center">
        <div className="rounded-3xl bg-gradient-to-b from-[#181818] to-[#121212] border border-white/10 p-10 sm:p-14 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-radial from-[#1db954]/10 via-transparent to-transparent pointer-events-none" />
          
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Ready to start listening?
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base max-w-xl mx-auto mb-8">
            Create your account in seconds. Access all Spotify features, customized playlists, and 100M+ songs right now.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setAuthView('register')}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#1db954] text-black font-black text-base hover:bg-[#1ed760] transition hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(29,185,84,0.4)] cursor-pointer"
            >
              Sign up free
            </button>
            <button
              onClick={() => setAuthView('login')}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 text-white font-bold text-base hover:bg-white/20 transition cursor-pointer"
            >
              Log in to your account
            </button>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="border-t border-white/[0.08] py-10 px-6 lg:px-16 text-center text-xs text-neutral-500 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-neutral-400">Riff Music</span>
          <span>•</span>
          <span>Universal 320kbps PWA</span>
        </div>
        <p>© 2026 Riff. All rights reserved. Free & open-source music streaming.</p>
      </footer>

      {/* PWA Guided Install Modal */}
      <PwaInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => {
          setIsInstallModalOpen(false);
          setAuthView('register');
        }}
        deferredPrompt={deferredPrompt}
        onInstalled={() => {
          setIsInstallModalOpen(false);
          setAuthView('register');
        }}
      />
    </div>
  );
};
