import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { Track } from '../../types';
import { 
  Heart, 
  Download, 
  ShieldCheck, 
  Clock, 
  LogOut, 
  ExternalLink,
  Smartphone,
  ChevronLeft,
  Play,
  Pause,
  Radio,
  Music
} from 'lucide-react';

interface LibraryViewProps {
  onLogout: () => void;
  isStandaloneApp?: boolean;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onLogout,
  isStandaloneApp = false,
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'liked' | 'downloaded'>('overview');
  const { user, lastActiveAt, logout } = useAuthStore();
  const { likedTracks, offlineTracks, toggleLikeTrack, loadLibrary } = useLibraryStore();
  const { currentTrack, playbackState, playTrack, togglePlayPause } = usePlayerStore();

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const handleTrackClick = (track: Track, trackList: Track[]) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      playTrack(track, trackList);
    }
  };

  const handlePlayAll = (trackList: Track[]) => {
    if (trackList.length === 0) return;
    if (currentTrack && trackList.some((t) => t.id === currentTrack.id)) {
      togglePlayPause();
    } else {
      playTrack(trackList[0], trackList);
    }
  };

  const isLikedPlaying = currentTrack && likedTracks.some((t) => t.id === currentTrack.id) && playbackState === 'playing';

  const thirtyDaysRemaining = lastActiveAt 
    ? Math.max(0, Math.ceil((lastActiveAt + 30 * 86400000 - Date.now()) / (86400000)))
    : 30;

  // Render Liked Songs View
  if (activeSection === 'liked') {
    return (
      <div className="space-y-6 pb-32 animate-in fade-in duration-200">
        {/* Back Button */}
        <button
          onClick={() => setActiveSection('overview')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#b3b3b3] hover:text-white transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        {/* Playlist Header Banner */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 p-6 rounded-2xl bg-gradient-to-b from-indigo-900/60 to-[#181818] border border-white/10 shadow-xl">
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-700 flex items-center justify-center text-white shrink-0 shadow-2xl shadow-indigo-900/50">
            <Heart className="w-16 h-16 sm:w-20 sm:h-20 fill-white" />
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
            <span className="text-xs font-bold text-[#1ed760] uppercase tracking-wider">
              Playlist
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Liked Songs
            </h1>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-[#b3b3b3]">
              <span className="font-bold text-white">{user?.displayName || 'Listener'}</span>
              <span>•</span>
              <span>{likedTracks.length} {likedTracks.length === 1 ? 'song' : 'songs'}</span>
            </div>
          </div>

          {/* Big Green Play Button */}
          {likedTracks.length > 0 && (
            <button
              onClick={() => handlePlayAll(likedTracks)}
              className="w-14 h-14 rounded-full bg-[#1ed760] hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-xl shadow-[#1ed760]/30 transition cursor-pointer shrink-0"
              aria-label="Play all liked songs"
            >
              {isLikedPlaying ? (
                <Pause className="w-6 h-6 fill-black" />
              ) : (
                <Play className="w-6 h-6 fill-black ml-1" />
              )}
            </button>
          )}
        </div>

        {/* Tracks List */}
        {likedTracks.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-[#181818]/60 border border-white/5 rounded-2xl p-8">
            <div className="w-14 h-14 mx-auto rounded-full bg-white/5 flex items-center justify-center text-[#727272]">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Songs you like will appear here</h3>
            <p className="text-xs text-[#b3b3b3] max-w-sm mx-auto">
              Save songs by tapping the heart icon on any song, chart, or search result.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {likedTracks.map((track, idx) => {
              const isThisPlaying = currentTrack?.id === track.id && playbackState === 'playing';

              return (
                <div
                  key={track.id}
                  onClick={() => handleTrackClick(track, likedTracks)}
                  className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-white/10 transition cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-3">
                    <span className="w-5 text-right text-xs text-[#727272] group-hover:text-white tabular-nums shrink-0">
                      {idx + 1}
                    </span>

                    <div className="w-11 h-11 rounded-md bg-[#242424] shrink-0 relative overflow-hidden shadow-sm">
                      <img
                        src={track.coverUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {isThisPlaying && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Radio className="w-4 h-4 text-[#1ed760] animate-pulse" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate leading-tight ${isThisPlaying ? 'text-[#1ed760]' : 'text-white'}`}>
                        {track.title}
                      </p>
                      <p className="text-xs text-[#b3b3b3] truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-xs text-[#b3b3b3]">
                    {/* Unlike Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLikeTrack(track);
                      }}
                      className="p-1.5 text-[#1ed760] hover:text-white transition cursor-pointer"
                      title="Remove from Liked Songs"
                    >
                      <Heart className="w-4 h-4 fill-[#1ed760]" />
                    </button>

                    <span className="hidden sm:inline text-[#1ed760] font-semibold text-[11px]">
                      320k
                    </span>
                    <span className="tabular-nums">
                      {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Render Downloaded Audio View
  if (activeSection === 'downloaded') {
    return (
      <div className="space-y-6 pb-32 animate-in fade-in duration-200">
        <button
          onClick={() => setActiveSection('overview')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#b3b3b3] hover:text-white transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 p-6 rounded-2xl bg-gradient-to-b from-emerald-950/60 to-[#181818] border border-white/10 shadow-xl">
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shrink-0 shadow-2xl">
            <Download className="w-16 h-16 sm:w-20 sm:h-20" />
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
            <span className="text-xs font-bold text-[#1ed760] uppercase tracking-wider">
              Offline Storage
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Downloaded Audio
            </h1>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-[#b3b3b3]">
              <span className="font-bold text-white">OPFS Local Cache</span>
              <span>•</span>
              <span>{offlineTracks.length} {offlineTracks.length === 1 ? 'track' : 'tracks'} stored</span>
            </div>
          </div>
        </div>

        {offlineTracks.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-[#181818]/60 border border-white/5 rounded-2xl p-8">
            <div className="w-14 h-14 mx-auto rounded-full bg-white/5 flex items-center justify-center text-[#727272]">
              <Music className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">No downloaded tracks yet</h3>
            <p className="text-xs text-[#b3b3b3] max-w-sm mx-auto">
              Audio tracks played while online are automatically cached in high-performance browser storage for instant sub-40ms replay.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {offlineTracks.map((track, idx) => {
              const isThisPlaying = currentTrack?.id === track.id && playbackState === 'playing';

              return (
                <div
                  key={track.id}
                  onClick={() => handleTrackClick(track, offlineTracks)}
                  className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-white/10 transition cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-3">
                    <span className="w-5 text-right text-xs text-[#727272] group-hover:text-white tabular-nums shrink-0">
                      {idx + 1}
                    </span>

                    <div className="w-11 h-11 rounded-md bg-[#242424] shrink-0 relative overflow-hidden shadow-sm">
                      <img
                        src={track.coverUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {isThisPlaying && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Radio className="w-4 h-4 text-[#1ed760] animate-pulse" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate leading-tight ${isThisPlaying ? 'text-[#1ed760]' : 'text-white'}`}>
                        {track.title}
                      </p>
                      <p className="text-xs text-[#b3b3b3] truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-xs text-[#b3b3b3]">
                    <span className="text-[#1ed760] font-bold text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#1ed760]/10 border border-[#1ed760]/20">
                      Saved Offline
                    </span>
                    <span className="tabular-nums">
                      {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Render Default Overview View
  return (
    <div className="space-y-6 pb-32">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Your Library
        </h1>
      </div>

      {/* User Info & 30-Day Session Card */}
      <div className="bg-[#181818] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.email || 'riff'}`}
            alt="Avatar"
            className="w-14 h-14 rounded-full bg-[#282828] object-cover border-2 border-[#1ed760]"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-white truncate">
              {user?.displayName || 'Listener'}
            </h2>
            <p className="text-xs text-[#b3b3b3] truncate">
              {user?.email || 'Authenticated User'}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1ed760]" />
              <span className="text-[11px] text-[#1ed760] font-semibold">
                {isStandaloneApp ? 'Standalone App' : 'Web Player'}
              </span>
            </div>
          </div>
        </div>

        {/* 30-Day Auto-Renewal Badge */}
        <div className="p-3 rounded-xl bg-[#242424] border border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#b3b3b3]">
            <ShieldCheck className="w-4 h-4 text-[#1ed760]" />
            <span>30-Day Inactivity Rule</span>
          </div>
          <div className="flex items-center gap-1 text-[#1ed760] font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{thirtyDaysRemaining} days remaining</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-2 px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span>Supabase Cloud</span>
            <ExternalLink className="w-3 h-3 text-[#7c7c7c]" />
          </a>

          <button
            onClick={handleLogout}
            className="py-2 px-4 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold text-red-400 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Quick Library Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Liked Songs Tile */}
        <div 
          onClick={() => setActiveSection('liked')}
          className="bg-[#181818] hover:bg-[#222222] p-4 rounded-xl border border-white/5 transition cursor-pointer flex items-center justify-between group shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition">
              <Heart className="w-8 h-8 fill-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-base group-hover:text-[#1ed760] transition">
                Liked Songs
              </h3>
              <p className="text-xs text-[#b3b3b3] mt-0.5">
                {likedTracks.length} {likedTracks.length === 1 ? 'saved song' : 'saved songs'}
              </p>
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 text-[#727272] group-hover:text-white rotate-180 transition" />
        </div>

        {/* Offline Cache Tile */}
        <div 
          onClick={() => setActiveSection('downloaded')}
          className="bg-[#181818] hover:bg-[#222222] p-4 rounded-xl border border-white/5 transition cursor-pointer flex items-center justify-between group shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-900 flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition">
              <Download className="w-8 h-8" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-base group-hover:text-[#1ed760] transition">
                Downloaded Audio
              </h3>
              <p className="text-xs text-[#b3b3b3] mt-0.5">
                {offlineTracks.length} {offlineTracks.length === 1 ? 'offline track' : 'offline tracks'}
              </p>
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 text-[#727272] group-hover:text-white rotate-180 transition" />
        </div>
      </div>

      {/* PWA Device Card */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 text-xs text-[#b3b3b3]">
        <Smartphone className="w-5 h-5 text-[#1ed760] shrink-0" />
        <p>
          Riff is optimized for mobile screens. Install as a PWA to enjoy full offline caching, audio hardware acceleration, and lock-screen controls.
        </p>
      </div>
    </div>
  );
};
