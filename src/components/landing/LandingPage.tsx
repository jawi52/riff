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
  RefreshCw
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

export const LandingPage: React.FC<LandingPageProps> = ({
  onContinueOnline,
  deferredPrompt,
}) => {
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  // Dynamic Live API Data States (Zero Hardcoding)
  const [liveTracks, setLiveTracks] = useState<ApiTrack[]>([]);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [engineHealth, setEngineHealth] = useState<EngineHealth | null>(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Live Audio Player State
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const [demoLoading, setDemoLoading] = useState(false);
  const [currentBitrate, setCurrentBitrate] = useState<string>("320 kbps");
  const [streamSource, setStreamSource] = useState<string>("Direct Edge CDN");
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Fetch Dynamic Backend Engine Status & Live Tracks
  const fetchLiveCatalog = useCallback(async () => {
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

      // B. Query Real Verified Tracks Catalog from Live API
      const searchRes = await fetch(`${RIFF_ENGINE_URL}/api/v1/search?q=top%20hits&limit=5`);
      if (!searchRes.ok) {
        throw new Error(`API returned status ${searchRes.status}`);
      }
      const data = await searchRes.json();
      const tracks: ApiTrack[] = data.tracks || [];

      if (tracks.length > 0) {
        setLiveTracks(tracks);
        setAudioDuration(tracks[0].duration || 210);
      } else {
        setApiError("No tracks returned from live API");
      }
    } catch (err: any) {
      console.error("Live catalog fetch error:", err);
      setApiError(err?.message || "Failed to connect to Riff-Engine API");
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveCatalog();
  }, [fetchLiveCatalog]);

  const activeTrack: ApiTrack | null = liveTracks[activeTrackIndex] || null;

  // 2. Play / Pause Dynamic Stream from Live Backend API
  const togglePlayTrack = async (targetIndex?: number) => {
    const nextIndex = typeof targetIndex === "number" ? targetIndex : activeTrackIndex;
    const trackToPlay = liveTracks[nextIndex];
    if (!trackToPlay) return;

    // If clicking same track while playing -> pause
    if (nextIndex === activeTrackIndex && isPlayingDemo && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingDemo(false);
      return;
    }

    // Stop current audio if switching tracks
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlayingDemo(false);
    }

    if (nextIndex !== activeTrackIndex) {
      setActiveTrackIndex(nextIndex);
    }

    try {
      setDemoLoading(true);

      // Fetch dynamic stream URL from live Riff-Engine resolver API
      const res = await fetch(`${RIFF_ENGINE_URL}/api/v1/stream-url/${trackToPlay.id}`);
      if (!res.ok) {
        throw new Error(`Failed to resolve stream: status ${res.status}`);
      }
      const data = await res.json();
      const directUrl = data.url || `${RIFF_ENGINE_URL}${trackToPlay.streamEndpoint}`;

      setCurrentBitrate(data.bitrate || "320 kbps");
      setStreamSource(data.engine || "Direct Edge CDN");

      const audio = new Audio(directUrl);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setAudioDuration(Math.round(audio.duration));
        }
      };

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setDemoProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setIsPlayingDemo(false);
        setDemoProgress(0);
      };

      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setIsPlayingDemo(false);
        setDemoLoading(false);
      };

      await audio.play();
      setIsPlayingDemo(true);
    } catch (err: any) {
      console.error("Playback error:", err);
      // Fallback: try direct streaming proxy
      try {
        const proxyUrl = `${RIFF_ENGINE_URL}${trackToPlay.streamEndpoint}`;
        const fallbackAudio = new Audio(proxyUrl);
        audioRef.current = fallbackAudio;
        await fallbackAudio.play();
        setIsPlayingDemo(true);
      } catch (fallbackErr) {
        console.error("Proxy fallback error:", fallbackErr);
      }
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
    <div className="min-h-screen bg-[#121212] text-white selection:bg-[#1ed760] selection:text-black">
      {/* 1. Header / Navbar (OpenDesign Spotify Achromatic Chrome) */}
      <header className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-md border-b border-white/5 transition duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RiffLogo size="md" />
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold">
            <a href="#features" className="text-[#b3b3b3] hover:text-white transition">
              Features
            </a>
            <a href="#demo" className="text-[#b3b3b3] hover:text-white transition">
              Live Edge Player
            </a>
            <a href="#comparison" className="text-[#b3b3b3] hover:text-white transition">
              Fidelity Benchmark
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDownloadOpen(true)}
              className="px-4 py-2 rounded-full border border-[#7c7c7c] hover:border-white text-white font-bold text-xs uppercase tracking-[1.4px] transition hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer bg-transparent"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install App</span>
            </button>

            <button
              onClick={onContinueOnline}
              className="px-5 py-2 rounded-full bg-[#1ed760] hover:bg-[#1db954] text-black font-extrabold text-xs uppercase tracking-[1.4px] transition hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-md shadow-black/40"
            >
              <span>Listen Online</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Dynamic Engine Status Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#181818] border border-white/10 text-xs text-[#b3b3b3] mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1ed760] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1ed760]"></span>
          </span>
          <span className="font-bold text-white">
            {engineHealth ? `${engineHealth.engine} v${engineHealth.version}:` : "Riff-Engine Live:"}
          </span>
          <span className="text-[#b3b3b3]">
            {engineHealth ? `Status: ${engineHealth.status.toUpperCase()} (${Math.round(engineHealth.uptime)}s uptime)` : "Connecting to Live Edge API..."}
          </span>
        </div>

        {/* Headline with High-Contrast Crisp Typography */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
          Music As It Was Mastered. <br className="hidden sm:inline" />
          <span className="text-[#1ed760]">
            Zero Ads. Pure Fidelity.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-[#b3b3b3] max-w-2xl mx-auto leading-relaxed">
          Experience studio-grade <strong className="text-white font-semibold">320kbps CD Master Audio</strong> with zero commercial ad interruptions. Real original tracks, instant streaming across global edge CDNs, and seamless offline playback.
        </p>

        {/* Primary CTA Buttons (Pill Geometry per OpenDesign Spotify) */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          {/* Continue Online Button */}
          <button
            onClick={onContinueOnline}
            className="w-full sm:w-auto btn-spotify-primary shadow-lg shadow-black/50 cursor-pointer"
          >
            <span>Continue Online</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>

          {/* Download App Button */}
          <button
            onClick={() => setIsDownloadOpen(true)}
            className="w-full sm:w-auto btn-spotify-secondary cursor-pointer"
          >
            <Download className="w-4 h-4 mr-2" />
            <span>Download It</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-[#b3b3b3] font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#1ed760]" />
            <span>320kbps Studio Master</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#1ed760]" />
            <span>0 Commercial Audio Ads</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#1ed760]" />
            <span>Verified Official Tracks Only</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#1ed760]" />
            <span>Offline PWA Ready</span>
          </div>
        </div>

        {/* 3. Fully Dynamic Live Music Player Card (Direct from API) */}
        <div id="demo" className="mt-16 max-w-2xl mx-auto">
          <div className="relative rounded-xl p-6 sm:p-8 bg-[#181818] border border-white/5 shadow-2xl shadow-black/90 text-left overflow-hidden group hover:bg-[#202020] transition duration-300">
            {/* Header / Dynamic Status */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1ed760] animate-pulse" />
                <span className="text-xs uppercase tracking-wider font-extrabold text-[#b3b3b3]">
                  Live API Streaming Stream
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#1ed760]/15 text-[#1ed760] border border-[#1ed760]/30 font-mono">
                {currentBitrate.toUpperCase()}
              </span>
            </div>

            {/* Loading / Error States */}
            {isLoadingCatalog && (
              <div className="flex items-center justify-center py-12 text-[#b3b3b3] text-xs gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#1ed760]" />
                <span>Loading live verified catalog from Riff-Engine...</span>
              </div>
            )}

            {apiError && !isLoadingCatalog && (
              <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between">
                <span>{apiError}</span>
                <button
                  onClick={fetchLiveCatalog}
                  className="px-3 py-1 bg-rose-500/20 rounded hover:bg-rose-500/30 text-white cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Dynamic Active Track Card */}
            {activeTrack && !isLoadingCatalog && (
              <>
                <div className="flex items-center gap-5">
                  {/* Album Cover Art */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-md overflow-hidden shadow-lg shadow-black/80 shrink-0 bg-[#282828]">
                    <img
                      src={activeTrack.album?.coverMedium || activeTrack.album?.cover || activeTrack.artist?.picture || ""}
                      alt={activeTrack.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <button
                      onClick={() => togglePlayTrack()}
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
                        {activeTrack.title}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white font-semibold uppercase tracking-wider">
                        VERIFIED
                      </span>
                    </div>
                    <p className="text-sm text-[#b3b3b3] truncate mt-0.5">
                      {activeTrack.artist?.name} • {activeTrack.album?.title}
                    </p>
                    <p className="text-xs text-[#b3b3b3] font-medium mt-1 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-[#1ed760]" />
                      {streamSource} • Studio Master
                    </p>
                  </div>
                </div>

                {/* Audio Progress Bar */}
                <div className="mt-6">
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#1ed760] transition-all duration-300 rounded-full"
                      style={{ width: `${demoProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#b3b3b3] mt-2 font-mono">
                    <span>{isPlayingDemo ? `Streaming (${currentBitrate})` : "Click Play to Stream Live"}</span>
                    <span>{Math.floor(audioDuration / 60)}:{(audioDuration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>

                {/* Dynamic Live Tracks Selector Pills (Pill Filter Voice) */}
                {liveTracks.length > 1 && (
                  <div className="mt-6 pt-5 border-t border-white/5">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-[#b3b3b3] mb-2.5">
                      Live Catalog Samples:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {liveTracks.map((track, idx) => (
                        <button
                          key={track.id}
                          onClick={() => togglePlayTrack(idx)}
                          className={`px-3.5 py-1.5 rounded-full text-xs transition cursor-pointer flex items-center gap-1.5 ${
                            idx === activeTrackIndex
                              ? "bg-white text-black font-bold"
                              : "bg-[#282828] hover:bg-[#333333] text-white font-medium"
                          }`}
                        >
                          <span className="truncate max-w-[140px]">{track.title}</span>
                          <span className={`text-[10px] opacity-70 ${idx === activeTrackIndex ? 'text-black' : 'text-[#b3b3b3]'}`}>
                            ({track.artist.name.split(' ')[0]})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* 4. Core Features Showcase (Spotify 3-Step Card Rhythm) */}
      <section id="features" className="py-20 border-t border-white/5 bg-[#121212]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-[2px] text-[#1ed760]">
              Built For Serious Listeners
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
              Engineered With Zero Compromises
            </h2>
            <p className="mt-4 text-[#b3b3b3] text-sm sm:text-base leading-relaxed">
              Every detail in Riff is designed to eliminate the frustrations of mainstream streaming apps. No paywalled skips, no low-bitrate compression, and no bot blockage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-8 rounded-lg bg-[#181818] hover:bg-[#222222] border border-white/5 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-[#282828] text-[#1ed760] flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Volume2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">320kbps CD Studio Masters</h3>
              <p className="text-[#b3b3b3] text-sm leading-relaxed">
                Stream in pristine 320kbps AAC studio audio directly from unthrottled Akamai and Cloudflare CDNs. Hear acoustic subtleties lost in standard 128k compression.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-lg bg-[#181818] hover:bg-[#222222] border border-white/5 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-[#282828] text-[#1ed760] flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Verified Official Only</h3>
              <p className="text-[#b3b3b3] text-sm leading-relaxed">
                Our smart catalog filtering algorithm automatically removes screeching fan covers, speed-up remixes, and duplicate rips. You get the real artist's original master every time.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-lg bg-[#181818] hover:bg-[#222222] border border-white/5 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-[#282828] text-[#1ed760] flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Zero Audio Commercials</h3>
              <p className="text-[#b3b3b3] text-sm leading-relaxed">
                No 30-second audio ads interrupting your rhythm between songs. Seamless queue playback that never forces you to pay a monthly premium just to listen in peace.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-lg bg-[#181818] hover:bg-[#222222] border border-white/5 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-[#282828] text-[#1ed760] flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <WifiOff className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">True Offline PWA</h3>
              <p className="text-[#b3b3b3] text-sm leading-relaxed">
                Install Riff directly to Windows, macOS, Android, or iOS with one click. Cache songs into local device storage and listen anywhere on planes, road trips, or without internet.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-lg bg-[#181818] hover:bg-[#222222] border border-white/5 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-[#282828] text-[#1ed760] flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Mic2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Synced Dynamic Lyrics</h3>
              <p className="text-[#b3b3b3] text-sm leading-relaxed">
                Full-screen, real-time karaoke style synced lyrics that highlight word-by-word with the vocal track so you can sing along or study the verse structure.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-lg bg-[#181818] hover:bg-[#222222] border border-white/5 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-[#282828] text-[#1ed760] flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Infinite Artist Radio</h3>
              <p className="text-[#b3b3b3] text-sm leading-relaxed">
                Smart discovery and continuous acoustic radio stations tailored to your favorite artists, genres, and moods without exhausting repetitions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Fidelity & Comparison Section */}
      <section id="comparison" className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-[2px] text-[#1ed760]">
            Fidelity Benchmark
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            How Riff Compares
          </h2>
          <p className="mt-3 text-[#b3b3b3] text-sm">
            Experience the difference between conventional free streamers and Riff.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/5 bg-[#181818] shadow-2xl">
          <table className="w-full text-left text-sm">
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
                <td className="p-4 sm:p-5 text-[#b3b3b3]">Spammed with low-effort covers & remixes</td>
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

      {/* 6. Bottom High-Conversion CTA Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="relative rounded-2xl p-10 sm:p-14 bg-[#181818] border border-white/10 shadow-2xl overflow-hidden">
          <RiffLogo size="lg" className="justify-center mb-6" />

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Ready to Hear the Difference?
          </h2>
          <p className="mt-3 text-[#b3b3b3] text-sm sm:text-base max-w-lg mx-auto">
            Start streaming immediately in your browser or install Riff on your desktop and phone for the ultimate listening setup.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onContinueOnline}
              className="w-full sm:w-auto btn-spotify-primary cursor-pointer"
            >
              <span>Continue Online</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>

            <button
              onClick={() => setIsDownloadOpen(true)}
              className="w-full sm:w-auto btn-spotify-secondary cursor-pointer"
            >
              <Download className="w-4 h-4 mr-2" />
              <span>Download Standalone App</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-white/5 py-10 text-[#b3b3b3] text-xs text-center">
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
