import React, { useState, useRef, useEffect } from "react";
import { 
  Play, 
  Pause, 
  Download, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  WifiOff, 
  Volume2, 
  Radio, 
  Mic2, 
  CheckCircle2, 
  XCircle, 
  ExternalLink
} from "lucide-react";
import { RiffLogo } from "../common/RiffLogo";
import { DownloadModal } from "./DownloadModal";
import { RIFF_ENGINE_URL } from "../../lib/engineUrl";

interface LandingPageProps {
  onContinueOnline: () => void;
  deferredPrompt?: any;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onContinueOnline,
  deferredPrompt,
}) => {
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  // Live Interactive Audio Demo
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const [demoLoading, setDemoLoading] = useState(false);
  const [audioDuration, setAudioDuration] = useState(168);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Demo Track: LISA - MONEY (Studio 320kbps Master on Akamai)
  const DEMO_TRACK = {
    id: "4YSHPGn9-LM",
    title: "MONEY",
    artist: "LISA",
    album: "LALISA",
    cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80",
    bitrate: "320 kbps",
    source: "Akamai CD Master",
  };

  const togglePlayDemo = async () => {
    if (isPlayingDemo && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingDemo(false);
      return;
    }

    try {
      setDemoLoading(true);
      if (!audioRef.current) {
        // Fetch direct stream URL from Riff-Engine
        const res = await fetch(`${RIFF_ENGINE_URL}/api/v1/stream-url/${DEMO_TRACK.id}`);
        const data = await res.json();
        const streamUrl = data.audioUrl || `${RIFF_ENGINE_URL}/api/v1/stream/${DEMO_TRACK.id}`;

        const audio = new Audio(streamUrl);
        audio.ontimeupdate = () => {
          if (audio.duration) {
            setDemoProgress((audio.currentTime / audio.duration) * 100);
            setAudioDuration(Math.round(audio.duration));
          }
        };
        audio.onended = () => {
          setIsPlayingDemo(false);
          setDemoProgress(0);
        };
        audioRef.current = audio;
      }

      await audioRef.current.play();
      setIsPlayingDemo(true);
    } catch (err) {
      console.warn("Demo playback failed:", err);
    } finally {
      setDemoLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#07080c] text-white selection:bg-emerald-500/30 selection:text-emerald-300 font-sans relative overflow-x-hidden">
      {/* Background Ambient Glow Gradients */}
      <div className="fixed top-[-150px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-emerald-500/15 via-teal-500/5 to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-[40%] right-[-100px] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* 1. Header / Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#07080c]/80 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <RiffLogo size="md" />
            
            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-400">
              <a href="#features" className="hover:text-white transition">Features</a>
              <a href="#fidelity" className="hover:text-white transition">320k Fidelity</a>
              <a href="#demo" className="hover:text-white transition">Live Demo</a>
              <a href="#comparison" className="hover:text-white transition">Comparison</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Download Button */}
            <button
              onClick={() => setIsDownloadOpen(true)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-200 hover:text-white transition flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Download App</span>
              <span className="sm:hidden">Download</span>
            </button>

            {/* Continue Online Button */}
            <button
              onClick={onContinueOnline}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-xs tracking-wide uppercase transition shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Continue Online</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300 mb-8 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-white">Riff-Engine Live:</span>
          <span className="text-neutral-400">Zero-Bot 4-Tier Edge CDN Resolution</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
          Music As It Was Mastered. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Zero Ads. Pure Fidelity.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Experience studio-grade <strong className="text-white font-semibold">320kbps CD Master Audio</strong> with zero commercial ad interruptions. Real original tracks, instant streaming across global edge CDNs, and seamless offline playback.
        </p>

        {/* Primary CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          {/* Continue Online Button */}
          <button
            onClick={onContinueOnline}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-sm tracking-wider uppercase transition shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <span>Continue Online</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Download App Button */}
          <button
            onClick={() => setIsDownloadOpen(true)}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-white/10 hover:border-white/20 text-white font-bold text-sm transition hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 shadow-lg shadow-black/50 cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download It</span>
          </button>
        </div>

        {/* Value Prop Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-neutral-400 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>320kbps Studio Master</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>0 Commercial Audio Ads</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Verified Official Tracks Only</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Offline PWA Ready</span>
          </div>
        </div>

        {/* 3. Interactive Live Music Player Card */}
        <div id="demo" className="mt-16 max-w-2xl mx-auto">
          <div className="relative rounded-3xl p-6 sm:p-8 bg-[#0f111a]/90 border border-white/10 shadow-2xl shadow-black/80 backdrop-blur-2xl text-left overflow-hidden group">
            {/* Card Ambient Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs uppercase tracking-wider font-extrabold text-neutral-300">
                  Live Studio Fidelity Demo
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                320 KBPS MASTER
              </span>
            </div>

            <div className="flex items-center gap-5">
              {/* Album Art with Floating Play Button */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-lg shadow-black/60 shrink-0 border border-white/10">
                <img
                  src={DEMO_TRACK.cover}
                  alt={DEMO_TRACK.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <button
                  onClick={togglePlayDemo}
                  className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-lg shadow-emerald-500/40 active:scale-95 transition cursor-pointer"
                  aria-label="Play demo track"
                >
                  {demoLoading ? (
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : isPlayingDemo ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>
              </div>

              {/* Track Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                    {DEMO_TRACK.title}
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 font-semibold">
                    OFFICIAL
                  </span>
                </div>
                <p className="text-sm text-neutral-400 truncate mt-0.5">
                  {DEMO_TRACK.artist} • {DEMO_TRACK.album}
                </p>
                <p className="text-xs text-emerald-400/90 font-medium mt-1 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  Direct Akamai Stream • Lossless CD Studio Quality
                </p>
              </div>
            </div>

            {/* Audio Progress Bar */}
            <div className="mt-6">
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                  style={{ width: `${demoProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2 font-mono">
                <span>{isPlayingDemo ? "Playing 320kbps Audio" : "Click Play to Listen"}</span>
                <span>{Math.floor(audioDuration / 60)}:{(audioDuration % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Showcase (Open Design Grid) */}
      <section id="features" className="py-20 border-t border-white/5 bg-[#090b12]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
              Built For Serious Listeners
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
              Engineered With Zero Compromises
            </h2>
            <p className="mt-4 text-neutral-400 text-sm sm:text-base leading-relaxed">
              Every detail in Riff is designed to eliminate the frustrations of mainstream streaming apps. No paywalled skips, no low-bitrate compression, and no bot blockage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-[#0f121d] border border-white/5 hover:border-emerald-500/30 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Volume2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">320kbps CD Studio Masters</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Stream in pristine 320kbps AAC studio audio directly from unthrottled Akamai and Cloudflare CDNs. Hear acoustic subtleties lost in standard 128k compression.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-[#0f121d] border border-white/5 hover:border-cyan-500/30 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Verified Official Only</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Our smart catalog filtering algorithm automatically removes screeching fan covers, speed-up remixes, and duplicate rips. You get the real artist's original master every time.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-[#0f121d] border border-white/5 hover:border-teal-500/30 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Zero Audio Commercials</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                No 30-second audio ads interrupting your rhythm between songs. Seamless queue playback that never forces you to pay a monthly premium just to listen in peace.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl bg-[#0f121d] border border-white/5 hover:border-emerald-500/30 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <WifiOff className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">True Offline PWA</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Install Riff directly to Windows, macOS, Android, or iOS with one click. Cache songs into local device storage and listen anywhere on planes, road trips, or without internet.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-2xl bg-[#0f121d] border border-white/5 hover:border-cyan-500/30 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Mic2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Synced Dynamic Lyrics</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Full-screen, real-time karaoke style synced lyrics that highlight word-by-word with the vocal track so you can sing along or study the verse structure.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-2xl bg-[#0f121d] border border-white/5 hover:border-teal-500/30 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Infinite Artist Radio</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Smart discovery and continuous acoustic radio stations tailored to your favorite artists, genres, and moods without exhausting repetitions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Fidelity & Comparison Section */}
      <section id="comparison" className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-extrabold uppercase tracking-widest text-cyan-400">
            Fidelity Benchmark
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            How Riff Compares
          </h2>
          <p className="mt-3 text-neutral-400 text-sm">
            Experience the difference between conventional free streamers and Riff.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e111a] shadow-2xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 sm:p-5 font-bold text-neutral-300">Feature</th>
                <th className="p-4 sm:p-5 font-bold text-neutral-400">Standard Free Streamers</th>
                <th className="p-4 sm:p-5 font-black text-emerald-400 bg-emerald-500/5">Riff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="p-4 sm:p-5 font-medium text-white">Audio Quality</td>
                <td className="p-4 sm:p-5 text-neutral-400">96k – 128k (Lossy Compressed)</td>
                <td className="p-4 sm:p-5 font-bold text-emerald-400 bg-emerald-500/5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  320 kbps Studio Master
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium text-white">Commercial Audio Ads</td>
                <td className="p-4 sm:p-5 text-neutral-400 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  Every 3–4 songs (Unskippable)
                </td>
                <td className="p-4 sm:p-5 font-bold text-emerald-400 bg-emerald-500/5">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Zero Ads (Pure Music)
                  </span>
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium text-white">Catalog Cleanliness</td>
                <td className="p-4 sm:p-5 text-neutral-400">Spammed with low-effort covers & remixes</td>
                <td className="p-4 sm:p-5 font-bold text-emerald-400 bg-emerald-500/5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Verified Original Artists
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium text-white">Datacenter / Bot Blocking</td>
                <td className="p-4 sm:p-5 text-neutral-400">Prone to YouTube bot bans & 404s</td>
                <td className="p-4 sm:p-5 font-bold text-emerald-400 bg-emerald-500/5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  4-Tier Federated CDN Cascade
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium text-white">Offline Listening</td>
                <td className="p-4 sm:p-5 text-neutral-400">Locked behind \$11.99/mo subscription</td>
                <td className="p-4 sm:p-5 font-bold text-emerald-400 bg-emerald-500/5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Built-in Free Offline Storage
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Bottom High-Conversion CTA Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="relative rounded-3xl p-10 sm:p-14 bg-gradient-to-b from-[#121624] to-[#0a0c14] border border-white/10 shadow-2xl overflow-hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          <RiffLogo size="lg" className="justify-center mb-6" />

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Ready to Hear the Difference?
          </h2>
          <p className="mt-3 text-neutral-400 text-sm sm:text-base max-w-lg mx-auto">
            Start streaming immediately in your browser or install Riff on your desktop and phone for the ultimate listening setup.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onContinueOnline}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue Online</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsDownloadOpen(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download Standalone App</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-white/5 py-10 text-neutral-500 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RiffLogo size="sm" />
            <span>© {new Date().getFullYear()} Riff Music. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-neutral-400">Federated Edge CDN Architecture</span>
            <a 
              href="https://github.com/jawi52/riff" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-white transition flex items-center gap-1"
            >
              GitHub <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Download / Install Modal */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        deferredPrompt={deferredPrompt}
      />
    </div>
  );
};
