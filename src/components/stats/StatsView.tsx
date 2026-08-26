import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Flame,
  CheckCircle2,
  Share2,
  Sparkles,
  ChevronRight,
  Heart,
  BarChart3,
  Disc3,
  X,
  Copy,
  Check
} from 'lucide-react';
import { StatsTimeframe, ListeningStatsReport, Track } from '../../types';
import { generateListeningReport } from '../../lib/statsEngine';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useLibraryStore } from '../../stores/useLibraryStore';

export const StatsView: React.FC = () => {
  const [timeframe, setTimeframe] = useState<StatsTimeframe>('week');
  const [report, setReport] = useState<ListeningStatsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWrappedOpen, setIsWrappedOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const { playTrack, navigateToArtist } = usePlayerStore();
  const { likedTracks, toggleLikeTrack } = useLibraryStore();

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    generateListeningReport(timeframe).then((res) => {
      if (isMounted) {
        setReport(res);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [timeframe]);

  const handlePlayStatTrack = (trackItem: { trackId: string; title: string; artist: string; coverUrl: string }) => {
    const trackObj: Track = {
      id: trackItem.trackId,
      title: trackItem.title,
      artist: trackItem.artist,
      coverUrl: trackItem.coverUrl,
      duration: 210,
      sourceType: 'saavn',
      isLiked: likedTracks.some((t) => t.id === trackItem.trackId)
    };
    playTrack(trackObj);
  };

  const handleCopyWrappedSummary = () => {
    if (!report) return;
    const topArt = report.topArtists[0]?.artist || 'The Weeknd';
    const topSong = report.topTracks[0]?.title || 'Starboy';
    const summary = `🎵 My Riff Music Insights (${report.timeframeLabel}):\n⏱️ Total Listening Time: ${report.formattedTotalDuration}\n🎧 Tracks Played: ${report.totalPlays}\n👑 Top Artist: ${topArt}\n🔥 Top Song: ${topSong}\n⚡ Daily Streak: ${report.dailyStreakDays} Days\n\nStream zero-ad music on Riff Universal PWA!`;
    navigator.clipboard.writeText(summary);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  if (isLoading || !report) {
    return (
      <div className="space-y-6 pb-20 select-none animate-in fade-in duration-300">
        <div className="flex items-center justify-between pt-1">
          <div className="h-8 w-48 bg-white/10 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl glass-card animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-3xl glass-panel animate-pulse" />
      </div>
    );
  }

  const maxMinutesInChart = Math.max(...report.chartData.map((d) => d.minutes), 1);
  const topArtist = report.topArtists[0];

  return (
    <div className="space-y-6 pb-20 select-none animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & TIMEFRAME SELECTOR */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <BarChart3 className="w-3 h-3 text-cyan-400" />
              <span>Personal Analytics</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Listening Insights
          </h1>
        </div>

        {/* Action: Open Riff Music Wrapped */}
        <button
          onClick={() => setIsWrappedOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-black text-xs transition shadow-lg hover:shadow-cyan-500/20 active:scale-95 cursor-pointer w-fit"
        >
          <Sparkles className="w-4 h-4 fill-white" />
          <span>Riff Wrapped Card</span>
        </button>
      </div>

      {/* Dynamic Timeframe Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {[
          { id: 'today', label: 'Today' },
          { id: 'week', label: 'Last 7 Days' },
          { id: 'this_month', label: 'This Month' },
          { id: 'last_month', label: 'Last Month' },
          { id: 'this_year', label: 'This Year' },
          { id: 'all_time', label: 'All Time' }
        ].map((tab) => {
          const isActive = timeframe === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(10);
                setTimeframe(tab.id as StatsTimeframe);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-black shadow-md scale-[1.02]'
                  : 'bg-white/[0.06] text-neutral-300 hover:bg-white/[0.12] hover:text-white border border-white/[0.06]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 2. FOUR KEY STAT METRIC CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Listening Time */}
        <div className="p-4 rounded-2xl glass-card space-y-2 relative overflow-hidden group hover:border-violet-500/40 transition">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Listening Time</span>
            <Clock className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-violet-300">
            {report.formattedTotalDuration}
          </p>
          <p className="text-[10px] text-neutral-400 font-medium">
            {timeframe === 'today' ? 'Active listening session' : `Across ${report.timeframeLabel}`}
          </p>
        </div>

        {/* Card 2: Total Tracks Played */}
        <div className="p-4 rounded-2xl glass-card space-y-2 relative overflow-hidden group hover:border-cyan-500/40 transition">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Songs Played</span>
            <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
          </div>
          <p className="text-xl md:text-2xl font-black text-white">
            {report.totalPlays.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{report.completionRatePercent}% completion rate</span>
          </p>
        </div>

        {/* Card 3: Top Artist Spotlight */}
        <div className="p-4 rounded-2xl glass-card space-y-2 relative overflow-hidden group hover:border-pink-500/40 transition">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Top Artist</span>
            <Disc3 className="w-4 h-4 text-pink-400" />
          </div>
          <div className="flex items-center gap-2.5 min-w-0">
            {topArtist && (
              <img src={topArtist.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/20" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-white truncate group-hover:text-pink-300 transition">
                {topArtist?.artist || 'The Weeknd'}
              </p>
              <p className="text-[10px] text-neutral-400 truncate">
                {topArtist ? `${topArtist.plays} plays (${topArtist.percentage}%)` : 'Top rotation'}
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Active Streak & Peak Hour */}
        <div className="p-4 rounded-2xl glass-card space-y-2 relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Daily Streak</span>
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-xl md:text-2xl font-black text-amber-300 flex items-center gap-1.5">
            <span>{report.dailyStreakDays} Days</span>
            <span className="text-sm">🔥</span>
          </p>
          <p className="text-[10px] text-neutral-400 font-medium truncate">
            Peak: {report.peakListeningHour}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE LISTENING TIMELINE CHART */}
      {/* ========================================================================= */}
      <section className="p-5 md:p-6 rounded-3xl glass-panel border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-black text-white">Listening Activity Trend</h3>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            {hoveredBarIndex !== null
              ? `${report.chartData[hoveredBarIndex].label}: ${report.chartData[hoveredBarIndex].minutes} mins (${report.chartData[hoveredBarIndex].plays} songs)`
              : `Total: ${report.formattedTotalDuration}`}
          </span>
        </div>

        {/* Responsive Bar Chart Canvas */}
        <div className="h-44 flex items-end justify-between gap-2 pt-4 px-2">
          {report.chartData.map((dp, idx) => {
            const heightPercent = Math.max(8, Math.round((dp.minutes / maxMinutesInChart) * 100));
            const isHovered = hoveredBarIndex === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredBarIndex(idx)}
                onMouseLeave={() => setHoveredBarIndex(null)}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
              >
                {/* Bar */}
                <div className="w-full max-w-[40px] flex items-end h-full">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-xl transition-all duration-300 ${
                      isHovered
                        ? 'bg-gradient-to-t from-cyan-500 to-white shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-x-105'
                        : 'bg-gradient-to-t from-violet-700/80 to-cyan-500/80 hover:from-violet-600 hover:to-cyan-400'
                    }`}
                  />
                </div>

                {/* X-Axis Label */}
                <span
                  className={`text-[10px] font-bold transition-colors ${
                    isHovered ? 'text-cyan-300 font-black' : 'text-neutral-400'
                  }`}
                >
                  {dp.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. TOP ARTISTS & TOP SONGS SPLIT VIEW */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: Top 10 Artists */}
        <section className="p-5 rounded-3xl glass-panel border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Disc3 className="w-4 h-4 text-violet-400" />
              <span>Top Artists</span>
            </h3>
            <span className="text-xs text-neutral-400 font-mono">By Time Listened</span>
          </div>

          <div className="space-y-1">
            {report.topArtists.slice(0, 5).map((art, idx) => (
              <div
                key={art.artist}
                onClick={() => navigateToArtist(art.artist)}
                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/[0.06] active:bg-white/[0.10] transition cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-4 text-center text-xs font-mono font-bold text-neutral-400">
                    #{idx + 1}
                  </span>
                  <img src={art.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/10" />
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm font-bold text-white truncate group-hover:text-cyan-400 transition">
                      {art.artist}
                    </p>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {art.plays} plays • Top: {art.topSongTitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-right shrink-0">
                  <div>
                    <p className="text-xs font-black text-white font-mono">{art.formattedDuration}</p>
                    <p className="text-[10px] text-violet-400 font-bold">{art.percentage}%</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT: Top 10 Songs */}
        <section className="p-5 rounded-3xl glass-panel border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
              <span>Top Songs</span>
            </h3>
            <span className="text-xs text-neutral-400 font-mono">Most Played</span>
          </div>

          <div className="space-y-1">
            {report.topTracks.slice(0, 5).map((track, idx) => {
              const isLiked = likedTracks.some((t) => t.id === track.trackId);

              return (
                <div
                  key={track.trackId}
                  onClick={() => handlePlayStatTrack(track)}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/[0.06] active:bg-white/[0.10] transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-4 text-center text-xs font-mono font-bold text-neutral-400">
                      #{idx + 1}
                    </span>
                    <img src={track.coverUrl} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-sm" />
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-bold text-white truncate group-hover:text-cyan-400 transition">
                        {track.title}
                      </p>
                      <p className="text-[11px] text-neutral-400 truncate">{track.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLikeTrack({
                          id: track.trackId,
                          title: track.title,
                          artist: track.artist,
                          coverUrl: track.coverUrl,
                          duration: 210,
                          sourceType: 'saavn'
                        });
                      }}
                      className="p-1 text-neutral-400 hover:text-white"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                    <div className="text-right">
                      <p className="text-xs font-black text-white font-mono">{track.plays} plays</p>
                      <p className="text-[10px] text-neutral-400 font-mono">{track.formattedDuration}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 5. TOP GENRES PROGRESSION */}
      {/* ========================================================================= */}
      <section className="p-5 md:p-6 rounded-3xl glass-panel border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>Genre & Vibe Distribution</span>
          </h3>
          <span className="text-xs text-neutral-400 font-mono">Taste Fingerprint</span>
        </div>

        <div className="space-y-3">
          {report.topGenres.slice(0, 4).map((genre, idx) => {
            const colors = [
              'bg-gradient-to-r from-violet-600 to-indigo-500',
              'bg-gradient-to-r from-cyan-500 to-teal-400',
              'bg-gradient-to-r from-pink-500 to-rose-400',
              'bg-gradient-to-r from-amber-500 to-yellow-400'
            ];

            return (
              <div key={genre.genre} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white">{genre.genre}</span>
                  <span className="text-neutral-400 font-mono">{genre.percentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    style={{ width: `${genre.percentage}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${colors[idx % colors.length]}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. RIFF WRAPPED SHARABLE CARD MODAL */}
      {/* ========================================================================= */}
      {isWrappedOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-[#12131d] via-[#1a132e] to-[#0d1624] border border-white/20 p-6 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Ambient Background Blur Bubbles */}
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-violet-600/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-cyan-600/30 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-black text-white uppercase tracking-wider">
                  ⚡ RIFF WRAPPED
                </span>
                <span className="text-xs text-neutral-300 font-bold">{report.timeframeLabel}</span>
              </div>
              <button
                onClick={() => setIsWrappedOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hero Totals */}
            <div className="text-center space-y-1 relative z-10 py-2">
              <p className="text-xs uppercase font-extrabold text-cyan-300 tracking-widest">You Listened To</p>
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-violet-300 tracking-tight">
                {report.formattedTotalDuration}
              </h2>
              <p className="text-xs text-neutral-400 font-medium">Across {report.totalPlays} songs on Riff PWA</p>
            </div>

            {/* Top 1 Spotlight */}
            <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center gap-4 relative z-10">
              {topArtist && (
                <img src={topArtist.avatarUrl} alt="" className="w-14 h-14 rounded-2xl object-cover shrink-0 ring-2 ring-violet-400/50 shadow-lg" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-violet-400">#1 Top Artist</p>
                <p className="text-base font-black text-white truncate">{topArtist?.artist || 'The Weeknd'}</p>
                <p className="text-xs text-neutral-300 truncate">Top Track: {topArtist?.topSongTitle || 'Starboy'}</p>
              </div>
            </div>

            {/* Top 5 Artists List */}
            <div className="space-y-2 relative z-10">
              <p className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Top 5 Heavy Rotation</p>
              <div className="grid grid-cols-1 gap-1.5">
                {report.topArtists.slice(0, 5).map((art, idx) => (
                  <div key={art.artist} className="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-white/[0.03]">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-cyan-400 font-black">#{idx + 1}</span>
                      <span className="font-bold text-white truncate">{art.artist}</span>
                    </div>
                    <span className="text-neutral-400 font-mono text-[11px]">{art.formattedDuration}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-2 pt-2 relative z-10">
              <button
                onClick={handleCopyWrappedSummary}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-black font-black text-xs hover:bg-neutral-200 transition active:scale-95 shadow-xl cursor-pointer"
              >
                {copiedToast ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedToast ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
              </button>

              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'My Riff Music Wrapped',
                      text: `I listened to ${report.formattedTotalDuration} of music on Riff PWA! Top artist: ${topArtist?.artist}`,
                      url: window.location.href
                    }).catch(() => {});
                  } else {
                    handleCopyWrappedSummary();
                  }
                }}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition cursor-pointer"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsView;
