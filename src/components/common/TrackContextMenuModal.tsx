import React, { useState } from 'react';
import { Track } from '../../types';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { toast } from 'sonner';
import { 
  X, 
  ListPlus, 
  Check, 
  Plus, 
  Download, 
  CheckCircle2, 
  Heart, 
  ListMusic, 
  Radio, 
  Share2, 
  Play
} from 'lucide-react';

interface TrackContextMenuModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TrackContextMenuModal: React.FC<TrackContextMenuModalProps> = ({
  track,
  isOpen,
  onClose,
}) => {
  const { 
    playlists, 
    likedTracks, 
    offlineTracks, 
    addTrackToPlaylist, 
    removeTrackFromPlaylist, 
    createPlaylist, 
    cacheTrackForOffline, 
    deleteOfflineTrack,
    toggleLikeTrack 
  } = useLibraryStore();

  const { playTrack, generateSongRadio } = usePlayerStore();

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !track) return null;

  const isLiked = likedTracks.some((t) => t.id === track.id);
  const isOffline = offlineTracks.some((t) => t.id === track.id);

  const handleTogglePlaylist = async (playlistId: string, playlistTitle: string, isAlreadyIn: boolean) => {
    try {
      if (isAlreadyIn) {
        await removeTrackFromPlaylist(playlistId, track.id);
        toast.info(`Removed from "${playlistTitle}"`);
      } else {
        const success = await addTrackToPlaylist(playlistId, track);
        if (success) {
          toast.success(`Added to "${playlistTitle}"`);
        }
      }
    } catch {
      toast.error('Failed to update playlist');
    }
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = newPlaylistTitle.trim();
    if (!cleanTitle || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const newPlaylist = await createPlaylist(cleanTitle);
      await addTrackToPlaylist(newPlaylist.id, track);
      toast.success(`Created "${cleanTitle}" and added track`);
      setNewPlaylistTitle('');
      setIsCreatingNew(false);
    } catch {
      toast.error('Failed to create playlist');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadToggle = async () => {
    if (isOffline) {
      await deleteOfflineTrack(track.id);
      toast.info('Removed from offline downloads');
    } else {
      toast.loading(`Downloading "${track.title}"...`, { id: `dl_${track.id}` });
      const success = await cacheTrackForOffline(track);
      if (success) {
        toast.success(`"${track.title}" saved offline`, { id: `dl_${track.id}` });
      } else {
        toast.error(`Download failed for "${track.title}"`, { id: `dl_${track.id}` });
      }
    }
  };

  const handleAddToQueue = () => {
    const playerStore = usePlayerStore.getState();
    const currentQueue = playerStore.queue;
    if (!currentQueue.some((t) => t.id === track.id)) {
      playerStore.playTrack(track, [...currentQueue, track]);
    }
    toast.success(`Added "${track.title}" to Up Next queue`);
    onClose();
  };

  const handleStartRadio = () => {
    generateSongRadio(track);
    toast.success(`Starting Song Radio based on "${track.title}"`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#181818] border border-white/10 rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200"
      >
        {/* Header with Track Details */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-[#282828] shrink-0 overflow-hidden shadow-md">
              <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-white truncate leading-tight">
                {track.title}
              </h3>
              <p className="text-xs text-[#b3b3b3] truncate mt-0.5">
                {track.artist}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[#727272] hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Actions & Playlist List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
          {/* 1. Add to Playlist Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider flex items-center gap-1.5">
                <ListPlus className="w-3.5 h-3.5 text-[#1ed760]" />
                Add to Playlist
              </span>
              {!isCreatingNew && (
                <button
                  onClick={() => setIsCreatingNew(true)}
                  className="text-xs font-bold text-[#1ed760] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Playlist
                </button>
              )}
            </div>

            {/* Inline New Playlist Form */}
            {isCreatingNew && (
              <form onSubmit={handleCreateAndAdd} className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                <input
                  type="text"
                  placeholder="Playlist name..."
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  autoFocus
                  className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder-[#727272] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newPlaylistTitle.trim() || isSubmitting}
                  className="px-3 py-1 bg-[#1ed760] text-black text-xs font-bold rounded-lg hover:brightness-110 disabled:opacity-50 cursor-pointer"
                >
                  Create & Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-2 text-xs text-[#727272] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            )}

            {/* Existing Playlists Scrollable List */}
            {playlists.length === 0 ? (
              <div className="text-center py-4 bg-white/5 rounded-xl border border-white/5 text-xs text-[#727272]">
                No custom playlists yet. Create one above!
              </div>
            ) : (
              <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                {playlists.map((pl) => {
                  const isInThisPlaylist = (pl.tracks || []).some((t) => t.id === track.id);

                  return (
                    <button
                      key={pl.id}
                      onClick={() => handleTogglePlaylist(pl.id, pl.title, isInThisPlaylist)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition cursor-pointer ${
                        isInThisPlaylist 
                          ? 'bg-[#1ed760]/15 border border-[#1ed760]/30 text-white' 
                          : 'bg-white/5 hover:bg-white/10 text-[#b3b3b3] hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-md bg-[#242424] flex items-center justify-center shrink-0 text-[#1ed760]">
                          <ListMusic className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-white">
                            {pl.title}
                          </p>
                          <p className="text-[10px] text-[#727272]">
                            {(pl.tracks || []).length} songs
                          </p>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        isInThisPlaylist ? 'bg-[#1ed760] text-black' : 'border border-white/20'
                      }`}>
                        {isInThisPlaylist && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Quick Action Buttons Grid */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            {/* Play Now */}
            <button
              onClick={() => {
                playTrack(track);
                onClose();
              }}
              className="w-full flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-white/10 text-xs font-bold text-white transition cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-full bg-[#1ed760] text-black flex items-center justify-center shrink-0">
                <Play className="w-4 h-4 fill-black ml-0.5" />
              </div>
              <span>Play Now</span>
            </button>

            {/* Offline Download Button */}
            <button
              onClick={handleDownloadToggle}
              className="w-full flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-white/10 text-xs font-bold text-white transition cursor-pointer text-left"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isOffline ? 'bg-[#1ed760]/20 text-[#1ed760]' : 'bg-white/10 text-white'
              }`}>
                {isOffline ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <span>{isOffline ? 'Downloaded (Offline Available)' : 'Download for Offline Play'}</span>
                <p className="text-[10px] text-[#727272] font-normal">320kbps Studio Master IndexedDB storage</p>
              </div>
            </button>

            {/* Like Track */}
            <button
              onClick={() => toggleLikeTrack(track)}
              className="w-full flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-white/10 text-xs font-bold text-white transition cursor-pointer text-left"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isLiked ? 'bg-[#1ed760]/20 text-[#1ed760]' : 'bg-white/10 text-white'
              }`}>
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#1ed760]' : ''}`} />
              </div>
              <span>{isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}</span>
            </button>

            {/* Add to Queue */}
            <button
              onClick={handleAddToQueue}
              className="w-full flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-white/10 text-xs font-bold text-white transition cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-white">
                <ListMusic className="w-4 h-4" />
              </div>
              <span>Add to Up Next Queue</span>
            </button>

            {/* Start Radio */}
            <button
              onClick={handleStartRadio}
              className="w-full flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-white/10 text-xs font-bold text-white transition cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[#1ed760]">
                <Radio className="w-4 h-4" />
              </div>
              <span>Start Song Radio</span>
            </button>

            {/* Share */}
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: track.title,
                    text: `Listening to ${track.title} by ${track.artist} on Riff`,
                    url: window.location.href,
                  }).catch(() => {});
                } else if (navigator.clipboard) {
                  navigator.clipboard.writeText(`${track.title} by ${track.artist} - ${window.location.href}`);
                  toast.success('Track info copied to clipboard');
                }
                onClose();
              }}
              className="w-full flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-white/10 text-xs font-bold text-white transition cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-white">
                <Share2 className="w-4 h-4" />
              </div>
              <span>Share Song</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
