import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { Track, Playlist } from '../../types';
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
  Music,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  ListMusic,
  X
} from 'lucide-react';

interface LibraryViewProps {
  onLogout: () => void;
  isStandaloneApp?: boolean;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onLogout,
  isStandaloneApp = false,
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'liked' | 'downloaded' | 'playlist'>('overview');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  const { user, lastActiveAt, logout } = useAuthStore();
  const { 
    likedTracks, 
    offlineTracks, 
    playlists,
    downloadProgress,
    toggleLikeTrack, 
    cacheTrackForOffline,
    downloadPlaylist,
    removePlaylistDownload,
    deleteOfflineTrack,
    createPlaylist,
    deletePlaylist,
    removeTrackFromPlaylist,
    loadLibrary 
  } = useLibraryStore();

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

  const handleCreatePlaylistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) return;
    const pl = await createPlaylist(newPlaylistTitle.trim(), newPlaylistDesc.trim());
    setNewPlaylistTitle('');
    setNewPlaylistDesc('');
    setShowCreateModal(false);
    setSelectedPlaylist(pl);
    setActiveSection('playlist');
  };

  const isLikedPlaying = currentTrack && likedTracks.some((t) => t.id === currentTrack.id) && playbackState === 'playing';

  const isTrackOffline = (id: string) => offlineTracks.some((t) => t.id === id);

  const isPlaylistFullyDownloaded = (tracks: Track[]) => {
    if (!tracks || tracks.length === 0) return false;
    return tracks.every((t) => isTrackOffline(t.id));
  };

  const thirtyDaysRemaining = lastActiveAt 
    ? Math.max(0, Math.ceil((lastActiveAt + 30 * 86400000 - Date.now()) / (86400000)))
    : 30;

  // 1. Liked Songs View
  if (activeSection === 'liked') {
    const isDownloadingLiked = downloadProgress.isDownloading && downloadProgress.playlistId === 'liked_songs';
    const isLikedDownloaded = isPlaylistFullyDownloaded(likedTracks);

    return (
      <div className="space-y-6 pb-36 animate-in fade-in duration-200">
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
              {isLikedDownloaded && (
                <>
                  <span>•</span>
                  <span className="text-[#1ed760] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Downloaded
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons: Download Playlist + Big Green Play */}
          <div className="flex items-center gap-3 shrink-0">
            {likedTracks.length > 0 && (
              <button
                onClick={() => {
                  if (isLikedDownloaded) {
                    removePlaylistDownload('liked_songs', likedTracks);
                  } else {
                    downloadPlaylist('liked_songs', likedTracks);
                  }
                }}
                disabled={isDownloadingLiked}
                className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  isLikedDownloaded
                    ? 'bg-[#1ed760]/20 text-[#1ed760] border border-[#1ed760]/40 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                }`}
                title={isLikedDownloaded ? 'Remove Offline Download' : 'Download Complete Playlist for Offline Play'}
              >
                {isDownloadingLiked ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#1ed760]" />
                    <span>Downloading {downloadProgress.completed}/{downloadProgress.total}</span>
                  </>
                ) : isLikedDownloaded ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#1ed760]" />
                    <span>Downloaded</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Playlist</span>
                  </>
                )}
              </button>
            )}

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
              const isDownloaded = isTrackOffline(track.id);

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

                  <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-xs text-[#b3b3b3]">
                    {/* Single Track Download Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isDownloaded) {
                          deleteOfflineTrack(track.id);
                        } else {
                          cacheTrackForOffline(track);
                        }
                      }}
                      className={`p-1.5 rounded-full transition cursor-pointer ${
                        isDownloaded 
                          ? 'text-[#1ed760] hover:text-red-400' 
                          : 'text-[#727272] hover:text-white'
                      }`}
                      title={isDownloaded ? 'Saved Offline (Click to remove)' : 'Download for offline playback'}
                    >
                      {isDownloaded ? (
                        <CheckCircle2 className="w-4 h-4 fill-[#1ed760]/20" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>

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

  // 2. Custom Playlist View
  if (activeSection === 'playlist' && selectedPlaylist) {
    const playlistTracks = selectedPlaylist.tracks || [];
    const isDownloadingPlaylist = downloadProgress.isDownloading && downloadProgress.playlistId === selectedPlaylist.id;
    const isPlaylistDownloaded = isPlaylistFullyDownloaded(playlistTracks);
    const isPlaylistPlaying = currentTrack && playlistTracks.some((t) => t.id === currentTrack.id) && playbackState === 'playing';

    return (
      <div className="space-y-6 pb-36 animate-in fade-in duration-200">
        <button
          onClick={() => setActiveSection('overview')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#b3b3b3] hover:text-white transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        {/* Playlist Header Banner */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 p-6 rounded-2xl bg-gradient-to-b from-teal-950/60 to-[#181818] border border-white/10 shadow-xl">
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 flex items-center justify-center text-white shrink-0 shadow-2xl">
            <ListMusic className="w-16 h-16 sm:w-20 sm:h-20" />
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
            <span className="text-xs font-bold text-[#1ed760] uppercase tracking-wider">
              Custom Playlist
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {selectedPlaylist.title}
            </h1>
            {selectedPlaylist.description && (
              <p className="text-xs text-[#b3b3b3] line-clamp-2">
                {selectedPlaylist.description}
              </p>
            )}
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-[#b3b3b3]">
              <span className="font-bold text-white">{selectedPlaylist.creator}</span>
              <span>•</span>
              <span>{playlistTracks.length} {playlistTracks.length === 1 ? 'song' : 'songs'}</span>
              {isPlaylistDownloaded && (
                <>
                  <span>•</span>
                  <span className="text-[#1ed760] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Downloaded
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {playlistTracks.length > 0 && (
              <button
                onClick={() => {
                  if (isPlaylistDownloaded) {
                    removePlaylistDownload(selectedPlaylist.id, playlistTracks);
                  } else {
                    downloadPlaylist(selectedPlaylist.id, playlistTracks);
                  }
                }}
                disabled={isDownloadingPlaylist}
                className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  isPlaylistDownloaded
                    ? 'bg-[#1ed760]/20 text-[#1ed760] border border-[#1ed760]/40 hover:bg-red-500/20 hover:text-red-400'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                }`}
                title={isPlaylistDownloaded ? 'Remove Offline Download' : 'Download Complete Playlist for Offline Play'}
              >
                {isDownloadingPlaylist ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#1ed760]" />
                    <span>Downloading {downloadProgress.completed}/{downloadProgress.total}</span>
                  </>
                ) : isPlaylistDownloaded ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#1ed760]" />
                    <span>Downloaded</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Playlist</span>
                  </>
                )}
              </button>
            )}

            {playlistTracks.length > 0 && (
              <button
                onClick={() => handlePlayAll(playlistTracks)}
                className="w-14 h-14 rounded-full bg-[#1ed760] hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-xl shadow-[#1ed760]/30 transition cursor-pointer shrink-0"
              >
                {isPlaylistPlaying ? (
                  <Pause className="w-6 h-6 fill-black" />
                ) : (
                  <Play className="w-6 h-6 fill-black ml-1" />
                )}
              </button>
            )}

            {/* Delete Playlist Button */}
            <button
              onClick={async () => {
                if (confirm(`Delete playlist "${selectedPlaylist.title}"?`)) {
                  await deletePlaylist(selectedPlaylist.id);
                  setActiveSection('overview');
                  setSelectedPlaylist(null);
                }
              }}
              className="p-2.5 rounded-full text-[#727272] hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
              title="Delete Playlist"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tracklist */}
        {playlistTracks.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-[#181818]/60 border border-white/5 rounded-2xl p-8">
            <div className="w-14 h-14 mx-auto rounded-full bg-white/5 flex items-center justify-center text-[#727272]">
              <Music className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">This playlist is empty</h3>
            <p className="text-xs text-[#b3b3b3] max-w-sm mx-auto">
              Find songs on Search or Home and add them to this playlist.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {playlistTracks.map((track, idx) => {
              const isThisPlaying = currentTrack?.id === track.id && playbackState === 'playing';
              const isDownloaded = isTrackOffline(track.id);

              return (
                <div
                  key={track.id}
                  onClick={() => handleTrackClick(track, playlistTracks)}
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

                  <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-xs text-[#b3b3b3]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isDownloaded) deleteOfflineTrack(track.id);
                        else cacheTrackForOffline(track);
                      }}
                      className={`p-1.5 rounded-full transition cursor-pointer ${
                        isDownloaded ? 'text-[#1ed760]' : 'text-[#727272] hover:text-white'
                      }`}
                      title={isDownloaded ? 'Saved Offline' : 'Download Track'}
                    >
                      {isDownloaded ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await removeTrackFromPlaylist(selectedPlaylist.id, track.id);
                        const updatedTracks = playlistTracks.filter((t) => t.id !== track.id);
                        setSelectedPlaylist({ ...selectedPlaylist, tracks: updatedTracks });
                      }}
                      className="p-1.5 text-[#727272] hover:text-red-400 transition cursor-pointer"
                      title="Remove from playlist"
                    >
                      <X className="w-4 h-4" />
                    </button>

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

  // 3. Downloaded Audio View
  if (activeSection === 'downloaded') {
    return (
      <div className="space-y-6 pb-36 animate-in fade-in duration-200">
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
              <span className="font-bold text-white">IndexedDB Instant Replay</span>
              <span>•</span>
              <span>{offlineTracks.length} {offlineTracks.length === 1 ? 'track' : 'tracks'} stored</span>
            </div>
          </div>

          {offlineTracks.length > 0 && (
            <button
              onClick={() => handlePlayAll(offlineTracks)}
              className="w-14 h-14 rounded-full bg-[#1ed760] hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-xl shadow-[#1ed760]/30 transition cursor-pointer shrink-0"
              title="Play all downloaded tracks"
            >
              <Play className="w-6 h-6 fill-black ml-1" />
            </button>
          )}
        </div>

        {offlineTracks.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-[#181818]/60 border border-white/5 rounded-2xl p-8">
            <div className="w-14 h-14 mx-auto rounded-full bg-white/5 flex items-center justify-center text-[#727272]">
              <Music className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">No downloaded tracks yet</h3>
            <p className="text-xs text-[#b3b3b3] max-w-sm mx-auto">
              Download individual songs or complete playlists to listen without Wi-Fi or cellular data.
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
                    <span className="text-[#1ed760] font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-[#1ed760]/10 border border-[#1ed760]/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Offline
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteOfflineTrack(track.id);
                      }}
                      className="p-1.5 text-[#727272] hover:text-red-400 transition cursor-pointer"
                      title="Delete from offline storage"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

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

  // 4. Default Overview View
  return (
    <div className="space-y-6 pb-36">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Your Library
        </h1>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#1ed760]" />
          <span>New Playlist</span>
        </button>
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

      {/* Custom User Playlists */}
      {playlists.length > 0 && (
        <div className="space-y-3 pt-2">
          <h2 className="text-lg font-bold text-white">Your Playlists</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => {
                  setSelectedPlaylist(pl);
                  setActiveSection('playlist');
                }}
                className="bg-[#181818] hover:bg-[#222222] p-3.5 rounded-xl border border-white/5 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-[#282828] flex items-center justify-center text-[#1ed760] shrink-0">
                    <ListMusic className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-white group-hover:text-[#1ed760] transition truncate">
                      {pl.title}
                    </h3>
                    <p className="text-[11px] text-[#b3b3b3] mt-0.5">
                      {(pl.tracks || []).length} {(pl.tracks || []).length === 1 ? 'song' : 'songs'}
                    </p>
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-[#727272] group-hover:text-white rotate-180 transition" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PWA Device Card */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 text-xs text-[#b3b3b3]">
        <Smartphone className="w-5 h-5 text-[#1ed760] shrink-0" />
        <p>
          Riff is optimized for mobile screens. Install as a PWA to enjoy full offline caching, audio hardware acceleration, and lock-screen controls.
        </p>
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-white">Create New Playlist</h3>
            <form onSubmit={handleCreatePlaylistSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-[#b3b3b3] font-medium block mb-1">Playlist Name</label>
                <input
                  type="text"
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  placeholder="e.g. Late Night Urdu Chill"
                  autoFocus
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#282828] border border-white/10 text-white text-sm outline-none focus:border-[#1ed760]"
                />
              </div>
              <div>
                <label className="text-xs text-[#b3b3b3] font-medium block mb-1">Description (Optional)</label>
                <textarea
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="What's the vibe of this playlist?"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-[#282828] border border-white/10 text-white text-xs outline-none focus:border-[#1ed760] resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-[#b3b3b3] hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#1ed760] hover:bg-[#20e065] text-black text-xs font-bold transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
