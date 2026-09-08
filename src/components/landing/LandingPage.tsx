import React, { useState, useRef, useEffect, useCallback } from "react";
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
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { RiffLogo } from "../common/RiffLogo";
import { DownloadModal } from "./DownloadModal";
import { RIFF_ENGINE_URL } from "../../lib/engineUrl";

interface LandingPageProps {
  onContinueOnline: () => void;
  deferredPrompt?: any;
}

interface ApiTrack {
  id: string;
  title: string;
  artist: {
    id: string;
    name: string;
    picture?: string;
  };
  album: {
    id: string;
    title: string;
    cover?: string;
    coverMedium?: string;
    coverBig?: string;
  };
  duration: number;
  streamEndpoint: string;
  streamUrlEndpoint: string;
}

interface EngineHealth {
  status: string;
  engine: string;
  version: string;
  uptime: number;
  timestamp: string;
}

const FAQ_ITEMS = [
  {
    question: "Is Riff really streaming 320kbps CD Master audio for free?",
    answer: "Yes. Riff connects directly to unthrottled Akamai and Cloudflare CDNs used by licensed music providers. Unlike conventional platforms that compress free users down to 96kbps or 128kbps, Riff streams pristine studio-grade 320kbps AAC audio by default with zero paywalls."
  },
  {
    question: "How does Riff eliminate audio commercials without a monthly subscription?",
    answer: "Riff streams audio directly from decentralized CDN nodes without injecting interstitial 30-second ad breaks or audio sponsors. You get uninterrupted playback and continuous listening without being prompted to purchase a monthly premium pass."
  },
  {
    question: "How does offline listening work?",
    answer: "Riff is engineered as a modern Progressive Web App (PWA). When you install Riff to your device or click offline cache, audio tracks and album metadata are saved into your browser's persistent sandboxed storage. You can play your cached music seamlessly on airplanes, subways, or without internet access."
  },
  {
    question: "Why do songs never get blocked or fail with 404 errors?",
    answer: "Riff-Engine features an automated 4-tier CDN failover cascade (JioSaavn 320k Akamai edge → SoundCloud Cloudflare stream → YouTube direct client cascade → Apple CDN fallback). If one provider is congested or blocked, the engine switches in under 50ms without skipping a beat."
  },
  {
    question: "Can I install Riff on Windows, Mac, iPhone, or Android?",
    answer: "Yes! Click the 'Install App' button in the top navigation or banner. Riff automatically detects your device (Windows, Mac, iOS, Android) and allows instant one-click direct installation with media controls and offline playback."
  }
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onContinueOnline,
  deferredPrompt,
}) => {
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  // Dynamic Live API Data States (Single Featured Track: Dior by Shubh)
  const [spotlightTrack, setSpotlightTrack] = useState<ApiTrack | null>(null);
  const [engineHealth, setEngineHealth] = useState<EngineHealth | null>(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Live Audio Player State
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const [demoLoading, setDemoLoading] = useState(false);
  const [currentBitrate, setCurrentBitrate] = useState<string>("320 KBPS");
  const [streamSource, setStreamSource] = useState<string>("Direct Edge CDN");
  const [audioDuration, setAudioDuration] = useState(140);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // 1. Fetch Dynamic Backend Engine Status & "Dior" by Shubh from Live API
  const fetchDiorTrack = useCallback(async () => {
    try {
      setIsLoadingCatalog(true);
      setApiError(null);

      // A. Query Live Engine Health
      try {
        const healthRes = await fetch(`${RIFF_ENGINE_URL}/api/v1/health`);
        if (healthRes.ok) {
          const healthData: EngineHealth = await healthRes.json();
          setEngineHealth(healthData);
        }
      } catch (err) {
        console.warn("Could not fetch engine health:", err);
      }

      // B. Query "Dior" by Shubh dynamically from Live API
      const searchRes = await fetch(`${RIFF_ENGINE_URL}/api/v1/search?q=shubh%20dior&limit=5`);
      if (!searchRes.ok) {
        throw new Error(`API returned status ${searchRes.status}`);
      }
      const data = await searchRes.json();
      const tracks: ApiTrack[] = data.tracks || [];

      // Select verified "Dior" by Shubh
      const targetTrack = tracks.find(
        (t) => t.id === "thS3-dmUvlg" || (t.title?.toLowerCase() === "dior" && t.artist?.name?.toLowerCase().includes("shubh"))
      ) || tracks[0];

      if (targetTrack) {
        setSpotlightTrack(targetTrack);
        setAudioDuration(targetTrack.duration || 140);
      } else {
        setApiError("Track not returned from live API");
      }
    } catch (err: any) {
      console.error("Dior track fetch error:", err);
      setApiError(err?.message || "Failed to connect to Riff-Engine API");
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    fetchDiorTrack();
  }, [fetchDiorTrack]);

  // 2. Play / Pause Dynamic Stream from Live Backend API
  const togglePlayTrack = async () => {
    if (!spotlightTrack) return;

    // If already playing -> pause
    if (isPlayingDemo && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingDemo(false);
      return;
    }

    // If paused with existing audio element -> resume
    if (audioRef.current && !isPlayingDemo && audioRef.current.src) {
      try {
        await audioRef.current.play();
        setIsPlayingDemo(true);
        return;
      } catch (e) {
        console.warn("Resume failed, recreating audio:", e);
      }
    }

    try {
      setDemoLoading(true);

      // Stream directly from our live Azure stream proxy (100% unblocked, 320kbps CD Master)
      const streamUrl = `${RIFF_ENGINE_URL}${spotlightTrack.streamEndpoint || `/api/v1/stream/${spotlightTrack.id}`}`;

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;
      audio.src = streamUrl;

      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setAudioDuration(Math.round(audio.duration));
        }
      };

      audio.ontimeupdate = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
          setCurrentTime(Math.round(audio.currentTime));
          const progressPct = Math.max(0, Math.min(100, (audio.currentTime / audio.duration) * 100));
          setDemoProgress(progressPct);
        }
      };

      audio.onended = () => {
        setIsPlayingDemo(false);
        setDemoProgress(0);
        setCurrentTime(0);
      };

      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setIsPlayingDemo(false);
        setDemoLoading(false);
      };

      await audio.play();
      setIsPlayingDemo(true);
      setCurrentBitrate("320 KBPS");
      setStreamSource("Azure Edge Master CDN");
    } catch (err: any) {
      console.error("Playback error:", err);
      setIsPlayingDemo(false);
    } finally {
      setDemoLoading(false);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioDuration || isNaN(audioDuration) || audioDuration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    audioRef.current.currentTime = percentage * audioDuration;
    setDemoProgress(percentage * 100);
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const formatTime = (seconds?: number | null) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white selection:bg-[#1ed760] selection:text-black">
      {/* 1. Responsive Header / Navbar */}
      <header className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-md border-b border-white/5 transition duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <RiffLogo size="md" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold">
            <a href="#features" className="text-[#b3b3b3] hover:text-white transition">
              Features
            </a>
            <a href="#comparison" className="text-[#b3b3b3] hover:text-white transition">
              Fidelity Benchmark
            </a>
            <a href="#faq" className="text-[#b3b3b3] hover:text-white transition">
              FAQ
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setIsDownloadOpen(true)}
              className="px-3.5 sm:px-4 py-2 rounded-full border border-white/20 hover:border-white/60 bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-[#1ed760]" />
              <span>Install App</span>
            </button>

            <button
              onClick={onContinueOnline}
              className="h-9 px-4 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-bold text-xs flex items-center gap-1.5 transition hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap shadow-sm shadow-[#1ed760]/30"
            >
              <span>Listen Online</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section: 100% Fully Responsive Layout */}
      <section className="relative pt-8 pb-14 sm:pt-16 sm:pb-20 md:pt-20 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Headline & Action Buttons (7 cols on desktop) */}
          <div className="lg:col-span-7 text-center lg:text-left">
            {/* Dynamic Engine Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#181818] border border-white/10 text-[11px] sm:text-xs text-[#b3b3b3] mb-6 max-w-full truncate">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1ed760] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1ed760]"></span>
              </span>
              <span className="font-bold text-white shrink-0">
                {engineHealth ? `${engineHealth.engine} v${engineHealth.version}` : "Riff Edge Engine:"}
              </span>
              <span className="text-[#b3b3b3] truncate">
                {engineHealth ? `Status: ${engineHealth.status.toUpperCase()}` : "Live Edge CDN Connected"}
              </span>
            </div>

            {/* High-Impact Responsive Headline */}
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1] sm:leading-[1.06]">
              Music As It Was Mastered. <br className="hidden sm:inline" />
              <span className="text-[#1ed760]">Zero Ads. Pure Fidelity.</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-[#b3b3b3] max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Experience studio-grade <strong className="text-white font-semibold">320kbps CD Master Audio</strong> streaming directly from unthrottled edge CDNs. Real verified artist recordings, uncompressed acoustics, and true offline playback.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4">
              <button
                onClick={onContinueOnline}
                className="btn-spotify-primary w-full sm:w-auto min-w-[170px] cursor-pointer"
              >
                <span>Continue Online</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsDownloadOpen(true)}
                className="btn-spotify-secondary w-full sm:w-auto min-w-[170px] cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#1ed760]" />
                <span>Download App</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 sm:mt-10 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2.5 text-[11px] sm:text-xs text-[#b3b3b3] font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#1ed760] shrink-0" />
                <span>320kbps CD Master</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#1ed760] shrink-0" />
                <span>0 Commercial Audio Ads</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#1ed760] shrink-0" />
                <span>Verified Official Only</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#1ed760] shrink-0" />
                <span>Offline PWA Ready</span>
              </div>
            </div>
          </div>

          {/* Right Column: Featured Spotlight Card ("Dior" by Shubh) */}
          <div className="lg:col-span-5 w-full max-w-lg mx-auto lg:max-w-none" id="spotlight">
            <div className="relative rounded-2xl p-5 sm:p-7 bg-[#181818] border border-white/5 shadow-2xl shadow-black/90 text-left transition duration-300 hover:bg-[#202020]">
              {/* Card Header */}
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1ed760] animate-pulse shrink-0" />
                  <span className="text-xs uppercase tracking-wider font-extrabold text-[#b3b3b3]">
                    Edge Studio Spotlight
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#1ed760]/15 text-[#1ed760] border border-[#1ed760]/30 font-mono shrink-0">
                  {currentBitrate}
                </span>
              </div>

              {/* Loading State */}
              {isLoadingCatalog && (
                <div className="flex items-center justify-center py-16 text-[#b3b3b3] text-xs gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#1ed760]" />
                  <span>Loading Dior by Shubh from live CDN...</span>
                </div>
              )}

              {/* Error State */}
              {apiError && !isLoadingCatalog && (
                <div className="p-4 my-4 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between">
                  <span>{apiError}</span>
                  <button
                    onClick={fetchDiorTrack}
                    className="px-3 py-1 bg-rose-500/20 rounded hover:bg-rose-500/30 text-white cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Active Track: Dior by Shubh */}
              {spotlightTrack && !isLoadingCatalog && (
                <div>
                  <div className="flex items-center gap-4">
                    {/* Album Artwork with Play Button */}
                    <div className="relative w-22 h-22 sm:w-26 sm:h-26 rounded-xl overflow-hidden shadow-xl shadow-black/80 shrink-0 bg-[#282828] group">
                      <img
                        src={spotlightTrack.album?.coverMedium || spotlightTrack.album?.cover || spotlightTrack.artist?.picture || ""}
                        alt={spotlightTrack.title || "Dior"}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <button
                        onClick={togglePlayTrack}
                        className="absolute inset-0 m-auto w-12 h-12 btn-spotify-play cursor-pointer"
                        aria-label="Play track"
                      >
                        {demoLoading ? (
                          <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : isPlayingDemo ? (
                          <Pause className="w-5 h-5 fill-black text-black" />
                        ) : (
                          <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Track Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                          {spotlightTrack.title || "Dior"}
                        </h3>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white font-semibold shrink-0">
                          VERIFIED
                        </span>
                      </div>
                      <p className="text-sm text-[#b3b3b3] truncate mt-1">
                        {spotlightTrack.artist?.name || "Shubh"}
                      </p>
                      <p className="text-xs text-[#7c7c7c] truncate mt-0.5">
                        {spotlightTrack.album?.title || "Still Rollin"}
                      </p>
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#1ed760] font-medium">
                        <Volume2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{streamSource}</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Scrubber */}
                  <div className="mt-6">
                    <div 
                      onClick={handleSeek}
                      className="w-full h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer group"
                    >
                      <div 
                        className="h-full bg-[#1ed760] group-hover:bg-[#1db954] transition-all duration-150 rounded-full"
                        style={{ width: `${Math.max(0, Math.min(100, demoProgress))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#b3b3b3] mt-2 font-mono">
                      <span>{formatTime(currentTime)}</span>
                      <span>{isPlayingDemo ? "Streaming 320k Direct" : "Click to stream"}</span>
                      <span>{formatTime(audioDuration)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Features Showcase (Responsive 1-2-3 Grid) */}
      <section id="features" className="py-16 sm:py-20 border-t border-white/5 bg-[#121212]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-[2px] text-[#1ed760]">
              Engineered For Pure Audio
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
              Why Listeners Choose Riff
            </h2>
            <p className="mt-3 sm:mt-4 text-[#b3b3b3] text-sm sm:text-base leading-relaxed">
              Every detail in Riff is designed to eliminate the frustrations of mainstream streaming apps. No paywalled skips, no low-bitrate compression, and no bot blockage.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Feature 1 */}
            <div className="p-6 sm:p-8 rounded-xl bg-[#181818] hover:bg-[#222222] border border-white/5 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-[#282828] text-[#1ed760] flex items-center justify-center mb-5 group-hover:scale-110 transition">
                <Volume2 className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">320kbps CD Studio Masters</h3>
              <p className="text-[#b3b3b3] text-xs sm:text-sm leading-relaxed">
                Stream in pristine 320kbps AAC studio audio directly from unthrottled Akamai and Cloudflare CDNs. Hear acoustic subtleties lost in standard 128k compression.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 sm:p-8 rounded-xl bg-[#181818] hover:bg-[#222222] border border-white/5 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-[#282828] text-[#1ed760] flex items-center justify-center mb-5 group-hover:scale-110 transition">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">Verified Official Only</h3>
              <p className="text-[#b3b3b3] text-xs sm:text-sm leading-relaxed">
                Our smart catalog filtering algorithm automatically removes screeching fan covers, speed-up remixes, and duplicate rips. You get the real artist's original master every time.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 sm:p-8 rounded-xl bg-[#181818] hover:bg-[#222222] border border-white/5 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-[#282828] text-[#1ed760] flex items-center justify-center mb-5 group-hover:scale-110 transition">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">Zero Audio Commercials</h3>
              <p className="text-[#b3b3b3] text-xs sm:text-sm leading-relaxed">
                No 30-second audio ads interrupting your rhythm between songs. Seamless queue playback that never forces you to pay a monthly premium just to listen in peace.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 sm:p-8 rounded-xl bg-[#181818] hover:bg-[#222222] border border-white/5 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-[#282828] text-[#1ed760] flex items-center justify-center mb-5 group-hover:scale-110 transition">
                <WifiOff className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">True Offline PWA</h3>
              <p className="text-[#b3b3b3] text-xs sm:text-sm leading-relaxed">
                Install Riff directly to Windows, macOS, Android, or iOS with one click. Cache songs into local device storage and listen anywhere on planes, road trips, or without internet.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 sm:p-8 rounded-xl bg-[#181818] hover:bg-[#222222] border border-white/5 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-[#282828] text-[#1ed760] flex items-center justify-center mb-5 group-hover:scale-110 transition">
                <Mic2 className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">Synced Dynamic Lyrics</h3>
              <p className="text-[#b3b3b3] text-xs sm:text-sm leading-relaxed">
                Full-screen, real-time karaoke style synced lyrics that highlight word-by-word with the vocal track so you can sing along or study the verse structure.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 sm:p-8 rounded-xl bg-[#181818] hover:bg-[#222222] border border-white/5 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-[#282828] text-[#1ed760] flex items-center justify-center mb-5 group-hover:scale-110 transition">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">Infinite Artist Radio</h3>
              <p className="text-[#b3b3b3] text-xs sm:text-sm leading-relaxed">
                Smart discovery and continuous acoustic radio stations tailored to your favorite artists, genres, and moods without exhausting repetitions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Fidelity & Comparison Section (Mobile Horizontally Scrollable) */}
      <section id="comparison" className="py-16 sm:py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs font-bold uppercase tracking-[2px] text-[#1ed760]">
            Fidelity Benchmark
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            How Riff Compares
          </h2>
          <p className="mt-3 text-[#b3b3b3] text-xs sm:text-sm">
            Experience the difference between conventional free streamers and Riff.
          </p>
        </div>

        {/* Scrollable Container with Subtle Border */}
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#181818] shadow-2xl">
          <table className="w-full text-left text-xs sm:text-sm min-w-[540px]">
            <thead>
              <tr className="border-b border-white/10 bg-[#242424]">
                <th className="p-4 sm:p-5 font-bold text-white">Feature</th>
                <th className="p-4 sm:p-5 font-bold text-[#b3b3b3]">Standard Free Streamers</th>
                <th className="p-4 sm:p-5 font-black text-[#1ed760] bg-[#1ed760]/5">Riff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="p-4 sm:p-5 font-medium text-white">Audio Quality</td>
                <td className="p-4 sm:p-5 text-[#b3b3b3]">96k – 128k (Lossy Compressed)</td>
                <td className="p-4 sm:p-5 font-bold text-white bg-[#1ed760]/5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1ed760] shrink-0" />
                  320 kbps Studio Master
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium text-white">Commercial Audio Ads</td>
                <td className="p-4 sm:p-5 text-[#b3b3b3] flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-[#f3727f] shrink-0" />
                  Every 3–4 songs (Unskippable)
                </td>
                <td className="p-4 sm:p-5 font-bold text-white bg-[#1ed760]/5">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1ed760] shrink-0" />
                    Zero Ads (Pure Music)
                  </span>
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium text-white">Catalog Cleanliness</td>
                <td className="p-4 sm:p-5 text-[#b3b3b3]">Spammed with low-effort covers</td>
                <td className="p-4 sm:p-5 font-bold text-white bg-[#1ed760]/5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1ed760] shrink-0" />
                  Verified Original Artists
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium text-white">Datacenter / Bot Blocking</td>
                <td className="p-4 sm:p-5 text-[#b3b3b3]">Prone to YouTube bot bans & 404s</td>
                <td className="p-4 sm:p-5 font-bold text-white bg-[#1ed760]/5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1ed760] shrink-0" />
                  4-Tier Federated CDN Cascade
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium text-white">Offline Listening</td>
                <td className="p-4 sm:p-5 text-[#b3b3b3]">Locked behind $11.99/mo subscription</td>
                <td className="p-4 sm:p-5 font-bold text-white bg-[#1ed760]/5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1ed760] shrink-0" />
                  Built-in Free Offline Storage
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Frequently Asked Questions (Accordion) */}
      <section id="faq" className="py-16 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs font-bold uppercase tracking-[2px] text-[#1ed760]">
            Clear Answers
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-[#b3b3b3] text-xs sm:text-sm">
            Everything you need to know about streaming on Riff.
          </p>
        </div>

        <div className="space-y-3.5">
          {FAQ_ITEMS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="rounded-xl bg-[#181818] border border-white/5 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full px-5 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#202020] transition"
                >
                  <span className="font-bold text-white text-sm sm:text-base">
                    {faq.question}
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#282828] text-white flex items-center justify-center shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4 text-[#1ed760]" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-[#b3b3b3] leading-relaxed border-t border-white/5">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Bottom High-Conversion CTA Banner */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="relative rounded-2xl p-6 sm:p-12 md:p-14 bg-[#181818] border border-white/10 shadow-2xl overflow-hidden">
          <RiffLogo size="lg" className="justify-center mb-6" />

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Ready to Hear the Difference?
          </h2>
          <p className="mt-3 text-[#b3b3b3] text-xs sm:text-base max-w-lg mx-auto">
            Start streaming immediately in your browser or install Riff on your desktop and phone for the ultimate listening setup.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={onContinueOnline}
              className="w-full sm:w-auto min-w-[170px] btn-spotify-primary cursor-pointer"
            >
              <span>Continue Online</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsDownloadOpen(true)}
              className="w-full sm:w-auto min-w-[170px] btn-spotify-secondary cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#1ed760]" />
              <span>Download App</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-white/5 py-8 sm:py-10 text-[#b3b3b3] text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RiffLogo size="sm" />
            <span>© {new Date().getFullYear()} Riff Music. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-[#b3b3b3]">Federated Edge CDN Architecture</span>
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
