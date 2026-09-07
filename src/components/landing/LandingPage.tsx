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
  Search,
  ChevronDown,
  ChevronUp,
  Music,
  X
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

const GENRE_PILLS = [
  { id: "top hits", label: "🔥 Top Hits" },
  { id: "arijit singh", label: "🎤 Arijit Singh" },
  { id: "pop hits", label: "✨ Global Pop" },
  { id: "coldplay", label: "🎸 Coldplay" },
  { id: "electronic dance", label: "⚡ Electronic" },
  { id: "taylor swift", label: "🌟 Taylor Swift" },
  { id: "hip hop", label: "🎧 Hip-Hop" },
  { id: "lo-fi beats", label: "☕ Lo-Fi Chill" },
  { id: "the weeknd", label: "🌙 The Weeknd" },
];

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
    answer: "Yes! Click the 'Install App' button in the top navigation or banner. Riff will install in one click as a native, borderless desktop or mobile app with lockscreen controls, media key support, and instant startup."
  }
];

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

  // Live Search & Genre Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("top hits");

  // Live Audio Player State
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const [demoLoading, setDemoLoading] = useState(false);
  const [currentBitrate, setCurrentBitrate] = useState<string>("320 kbps");
  const [streamSource, setStreamSource] = useState<string>("Direct Edge CDN");
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // 1. Fetch Dynamic Backend Engine Status & Live Tracks
  const fetchLiveCatalog = useCallback(async (query: string = "top hits") => {
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
      const searchRes = await fetch(`${RIFF_ENGINE_URL}/api/v1/search?q=${encodeURIComponent(query)}&limit=8`);
      if (!searchRes.ok) {
        throw new Error(`API returned status ${searchRes.status}`);
      }
      const data = await searchRes.json();
      const tracks: ApiTrack[] = data.tracks || [];

      if (tracks.length > 0) {
        setLiveTracks(tracks);
        setActiveTrackIndex(0);
        setAudioDuration(tracks[0].duration || 210);
      } else {
        setApiError(`No tracks found for "${query}". Try another artist or genre.`);
      }
    } catch (err: any) {
      console.error("Live catalog fetch error:", err);
      setApiError(err?.message || "Failed to connect to Riff-Engine API");
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchLiveCatalog("top hits");
  }, [fetchLiveCatalog]);

  // Debounced search handler
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const timer = setTimeout(() => {
      fetchLiveCatalog(searchQuery);
    }, 450);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchLiveCatalog]);

  const handleGenreClick = (genreId: string) => {
    setActiveGenre(genreId);
    setSearchQuery("");
    fetchLiveCatalog(genreId);
  };

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
          setCurrentTime(Math.round(audio.currentTime));
          setDemoProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setIsPlayingDemo(false);
        setDemoProgress(0);
        // Auto play next track in list
        if (nextIndex + 1 < liveTracks.length) {
          togglePlayTrack(nextIndex + 1);
        }
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

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioDuration) return;
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white selection:bg-[#1ed760] selection:text-black pb-28">
      {/* 1. Header / Navbar (OpenDesign Spotify Achromatic Chrome) */}
      <header className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-md border-b border-white/5 transition duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RiffLogo size="md" />
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold">
            <a href="#discover" className="text-[#b3b3b3] hover:text-white transition">
              Live Catalog
            </a>
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
              className="btn-spotify-primary !py-2.5 !px-5 !text-xs !tracking-[1.2px]"
            >
              <span>Listen Online</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section (OpenDesign .hero-grid 1.3fr / 1fr Split Layout) */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline & Action Buttons (7 cols) */}
          <div className="lg:col-span-7 text-left">
            {/* Dynamic Engine Status Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#181818] border border-white/10 text-xs text-[#b3b3b3] mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1ed760] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1ed760]"></span>
              </span>
              <span className="font-bold text-white">
                {engineHealth ? `${engineHealth.engine} v${engineHealth.version}` : "Riff Edge Engine:"}
              </span>
              <span className="text-[#b3b3b3]">
                {engineHealth ? `Status: ${engineHealth.status.toUpperCase()} (${Math.round(engineHealth.uptime)}s uptime)` : "Live Edge CDN Connected"}
              </span>
            </div>

            {/* High-Impact Typography */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.06]">
              Music As It Was Mastered. <br />
              <span className="text-[#1ed760]">Zero Ads. Pure Fidelity.</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-[#b3b3b3] max-w-xl leading-relaxed">
              Experience studio-grade <strong className="text-white font-semibold">320kbps CD Master Audio</strong> streaming directly from unthrottled edge CDNs. Real verified artist recordings, uncompressed acoustics, and true offline playback.
            </p>

            {/* CTA Buttons Cluster (OpenDesign Pill & Circular Play Geometry) */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => togglePlayTrack()}
                className="btn-spotify-play w-14 h-14 shrink-0"
                aria-label="Play spotlight track"
                title="Play spotlight track"
              >
                {demoLoading ? (
                  <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : isPlayingDemo ? (
                  <Pause className="w-6 h-6 fill-black text-black" />
                ) : (
                  <Play className="w-6 h-6 fill-black text-black ml-0.5" />
                )}
              </button>

              <button
                onClick={onContinueOnline}
                className="btn-spotify-primary shadow-lg shadow-black/50"
              >
                <span>Continue Online</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>

              <button
                onClick={() => setIsDownloadOpen(true)}
                className="btn-spotify-secondary"
              >
                <Download className="w-4 h-4 mr-2" />
                <span>Download App</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs text-[#b3b3b3] font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#1ed760]" />
                <span>320kbps CD Master</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#1ed760]" />
                <span>0 Commercial Audio Ads</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#1ed760]" />
                <span>Verified Official Only</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#1ed760]" />
                <span>Offline PWA Ready</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Now-Playing Spotlight Card (5 cols) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-xl p-6 sm:p-7 bg-[#181818] border border-white/5 shadow-2xl shadow-black/90 text-left transition duration-300 hover:bg-[#202020]">
              {/* Card Header */}
              <div className="flex items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1ed760] animate-pulse" />
                  <span className="text-xs uppercase tracking-wider font-extrabold text-[#b3b3b3]">
                    Edge Studio Spotlight
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#1ed760]/15 text-[#1ed760] border border-[#1ed760]/30 font-mono">
                  {currentBitrate.toUpperCase()}
                </span>
              </div>

              {/* Loading State */}
              {isLoadingCatalog && (
                <div className="flex items-center justify-center py-16 text-[#b3b3b3] text-xs gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#1ed760]" />
                  <span>Loading studio audio catalog...</span>
                </div>
              )}

              {/* Active Track Spotlight */}
              {activeTrack && !isLoadingCatalog && (
                <div>
                  <div className="flex items-center gap-4">
                    {/* Large Album Artwork */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-md overflow-hidden shadow-xl shadow-black/80 shrink-0 bg-[#282828] group">
                      <img
                        src={activeTrack.album?.coverMedium || activeTrack.album?.cover || activeTrack.artist?.picture || ""}
                        alt={activeTrack.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <button
                        onClick={() => togglePlayTrack()}
                        className="absolute inset-0 m-auto w-12 h-12 btn-spotify-play"
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

                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                          {activeTrack.title}
                        </h3>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white font-semibold shrink-0">
                          VERIFIED
                        </span>
                      </div>
                      <p className="text-sm text-[#b3b3b3] truncate mt-1">
                        {activeTrack.artist?.name}
                      </p>
                      <p className="text-xs text-[#7c7c7c] truncate mt-0.5">
                        {activeTrack.album?.title}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2 text-xs text-[#1ed760] font-medium">
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{streamSource}</span>
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
                        style={{ width: `${demoProgress}%` }}
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

      {/* 3. Live Search & Genre Filter Bar (OpenDesign Search Pill & Nav Pills) */}
      <section id="discover" className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-6 rounded-2xl bg-[#181818] border border-white/5 shadow-xl">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-[2px] text-[#1ed760]">
                Explore Verified Edge Catalog
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Listen Directly from Live CDN
              </h2>
            </div>

            {/* Live Search Input (OpenDesign 500px Pill) */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b3b3b3]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any song or artist..."
                className="w-full bg-[#1f1f1f] text-white placeholder-[#7c7c7c] text-sm pl-11 pr-10 py-3 rounded-full border border-transparent focus:border-white focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#b3b3b3] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Genre & Filter Navigation Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {GENRE_PILLS.map((genre) => (
              <button
                key={genre.id}
                onClick={() => handleGenreClick(genre.id)}
                className={`nav-pill whitespace-nowrap shrink-0 ${
                  activeGenre === genre.id && !searchQuery ? "active" : ""
                }`}
              >
                {genre.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Ranked Track List Table (OpenDesign .track-row Layout) */}
      <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-2xl bg-[#181818] border border-white/5 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-[#1ed760]" />
              <span>Verified Studio Audio Samples</span>
            </h3>
            <span className="text-xs text-[#b3b3b3] font-mono">
              {liveTracks.length} verified tracks loaded
            </span>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-3 py-2 text-xs font-bold text-[#7c7c7c] uppercase tracking-wider border-b border-white/5">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6 sm:col-span-5">Title</div>
            <div className="hidden sm:block sm:col-span-4">Album</div>
            <div className="col-span-5 sm:col-span-2 text-right">Fidelity / Duration</div>
          </div>

          {/* Error Message */}
          {apiError && (
            <div className="p-4 my-4 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between">
              <span>{apiError}</span>
              <button
                onClick={() => fetchLiveCatalog(activeGenre)}
                className="px-3 py-1 bg-rose-500/20 rounded hover:bg-rose-500/30 text-white cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Track Rows */}
          <div className="divide-y divide-white/5 mt-1">
            {liveTracks.map((track, idx) => {
              const isCurrent = idx === activeTrackIndex;
              return (
                <div
                  key={track.id}
                  onClick={() => togglePlayTrack(idx)}
                  className={`track-row grid grid-cols-12 gap-4 items-center !p-3 ${
                    isCurrent ? "active" : ""
                  }`}
                >
                  {/* Track Index / Play State */}
                  <div className="col-span-1 text-center font-mono text-sm">
                    {isCurrent && isPlayingDemo ? (
                      <span className="text-[#1ed760] font-bold">▶</span>
                    ) : (
                      <span className="text-[#7c7c7c] group-hover:text-white">{idx + 1}</span>
                    )}
                  </div>

                  {/* Title & Artist & Thumbnail */}
                  <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                    <div className="relative w-10 h-10 rounded-md overflow-hidden bg-[#282828] shrink-0">
                      <img
                        src={track.album?.coverMedium || track.album?.cover || track.artist?.picture || ""}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                      {isCurrent && isPlayingDemo && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#1ed760] animate-ping" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${isCurrent ? "text-[#1ed760]" : "text-white"}`}>
                        {track.title}
                      </p>
                      <p className="text-xs text-[#b3b3b3] truncate">
                        {track.artist?.name}
                      </p>
                    </div>
                  </div>

                  {/* Album Name */}
                  <div className="hidden sm:block sm:col-span-4 text-xs text-[#b3b3b3] truncate">
                    {track.album?.title || "Single"}
                  </div>

                  {/* Duration & Fidelity Badge */}
                  <div className="col-span-5 sm:col-span-2 flex items-center justify-end gap-3 text-right">
                    <span className="hidden md:inline px-2 py-0.5 rounded text-[10px] font-bold bg-[#1ed760]/10 text-[#1ed760] border border-[#1ed760]/20 font-mono">
                      320K
                    </span>
                    <span className="text-xs text-[#b3b3b3] font-mono">
                      {formatTime(track.duration || 180)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Curated Album & Playlist Grid (OpenDesign .album-grid) */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-[2px] text-[#1ed760]">
              Curated Master Releases
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Top Albums & Singles
            </h2>
          </div>
          <button
            onClick={onContinueOnline}
            className="text-xs font-bold uppercase tracking-[1.4px] text-[#b3b3b3] hover:text-white transition cursor-pointer"
          >
            Show All
          </button>
        </div>

        {/* 4-Column Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {liveTracks.slice(0, 4).map((track, idx) => (
            <div
              key={`album-${track.id}`}
              onClick={() => togglePlayTrack(idx)}
              className="spotify-card p-4 group cursor-pointer"
            >
              <div className="relative aspect-square rounded-md overflow-hidden bg-[#282828] mb-4">
                <img
                  src={track.album?.coverBig || track.album?.coverMedium || track.album?.cover || ""}
                  alt={track.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlayTrack(idx);
                  }}
                  className="absolute bottom-3 right-3 w-12 h-12 btn-spotify-play opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition duration-300 shadow-xl"
                  aria-label="Play album"
                >
                  <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                </button>
              </div>
              <h4 className="text-sm font-bold text-white truncate mb-1">
                {track.album?.title || track.title}
              </h4>
              <p className="text-xs text-[#b3b3b3] truncate">
                {track.artist?.name} • Album Master
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Core Features Showcase (OpenDesign Spotify 6-Card Grid) */}
      <section id="features" className="py-20 border-t border-white/5 bg-[#121212]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-[2px] text-[#1ed760]">
              Engineered For Pure Audio
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
              Why Listeners Choose Riff
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

      {/* 7. Fidelity & Comparison Section */}
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

      {/* 8. Frequently Asked Questions (Accordion) */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-[2px] text-[#1ed760]">
            Clear Answers
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-[#b3b3b3] text-sm">
            Everything you need to know about streaming on Riff.
          </p>
        </div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="rounded-xl bg-[#181818] border border-white/5 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#202020] transition"
                >
                  <span className="font-bold text-white text-base sm:text-lg">
                    {faq.question}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#282828] text-white flex items-center justify-center shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4 text-[#1ed760]" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm text-[#b3b3b3] leading-relaxed border-t border-white/5">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. Bottom High-Conversion CTA Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
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

      {/* 10. Floating Bottom Now-Playing Dock (OpenDesign Spotify Player Dock) */}
      {activeTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#181818]/95 backdrop-blur-xl border-t border-white/10 px-4 sm:px-6 py-3 shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Left: Current Track Info */}
            <div className="flex items-center gap-3 min-w-0 max-w-[280px] sm:max-w-xs">
              <div className="w-12 h-12 rounded-md overflow-hidden bg-[#282828] shrink-0 relative">
                <img
                  src={activeTrack.album?.coverMedium || activeTrack.album?.cover || activeTrack.artist?.picture || ""}
                  alt={activeTrack.title}
                  className="w-full h-full object-cover"
                />
                {isPlayingDemo && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-[#1ed760] animate-ping" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {activeTrack.title}
                </p>
                <p className="text-xs text-[#b3b3b3] truncate">
                  {activeTrack.artist?.name}
                </p>
              </div>
            </div>

            {/* Center: Playback Controls & Scrubber */}
            <div className="flex-1 max-w-xl hidden sm:flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => togglePlayTrack()}
                  className="w-9 h-9 btn-spotify-play"
                  aria-label="Play or pause"
                >
                  {demoLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : isPlayingDemo ? (
                    <Pause className="w-4 h-4 fill-black text-black" />
                  ) : (
                    <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                  )}
                </button>
              </div>

              <div className="w-full flex items-center gap-3 text-[11px] text-[#b3b3b3] font-mono">
                <span>{formatTime(currentTime)}</span>
                <div 
                  onClick={handleSeek}
                  className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer group"
                >
                  <div 
                    className="h-full bg-[#1ed760] group-hover:bg-[#1db954] rounded-full transition-all"
                    style={{ width: `${demoProgress}%` }}
                  />
                </div>
                <span>{formatTime(audioDuration)}</span>
              </div>
            </div>

            {/* Right: Fidelity Tag & Action */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => togglePlayTrack()}
                className="sm:hidden w-10 h-10 btn-spotify-play"
                aria-label="Play or pause"
              >
                {isPlayingDemo ? (
                  <Pause className="w-4 h-4 fill-black text-black" />
                ) : (
                  <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                )}
              </button>

              <span className="hidden md:inline px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#1ed760]/15 text-[#1ed760] border border-[#1ed760]/30 font-mono">
                320 KBPS AAC
              </span>

              <button
                onClick={onContinueOnline}
                className="px-4 py-2 rounded-full bg-white hover:bg-[#f0f0f0] text-black font-bold text-xs uppercase tracking-[1px] transition hover:scale-105 active:scale-95 cursor-pointer hidden sm:inline-flex items-center gap-1.5"
              >
                <span>Full Web Player</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. Footer */}
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
