import React, { useState } from 'react';
import { Heart, Upload, Download, ListMusic, Play, Trash2, PlusCircle, CheckCircle2, Music } from 'lucide-react';
import { useLibraryStore } from '../../stores/useLibraryStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { DBTrack } from '../../lib/db';
import { generateCanonicalTrackId } from '../../lib/dedup';
import { saveAudioToOPFS } from '../../lib/opfs';

function formatDuration(sec: number): string {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const LibraryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'liked' | 'local' | 'playlists' | 'offline'>('liked');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const {
    likedTracks,
    localTracks,
    offlineTracks,
    playlists,
    addLocalTrack,
    removeLocalTrack,
    createPlaylist,
    deletePlaylist
  } = useLibraryStore();

  const { playTrack, currentTrack, playbackState } = usePlayerStore();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let addedCount = 0;
    let duplicateCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadStatus(`Ingesting ${i + 1}/${files.length}: ${file.name}...`);

      try {
        const title = file.name.replace(/\.[^/.]+$/, '');
        const artist = 'Local Artist';
        const canonicalId = generateCanonicalTrackId(artist, title, 180);

        // Try saving to OPFS or IndexedDB Blob
        let opfsKey = '';
        try {
          opfsKey = await saveAudioToOPFS(canonicalId, file);
        } catch {}

        const dbTrack: DBTrack = {
          id: canonicalId,
          title,
          artist,
          album: 'Local Ingestion',
          duration: 180,
          coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
          sourceType: 'local',
          audioBlob: file,
          localBlobKey: opfsKey || canonicalId,
          isOfflineCached: true,
          addedAt: Date.now()
        };

        const added = await addLocalTrack(dbTrack);
        if (added) {
          addedCount++;
        } else {
          duplicateCount++;
        }
      } catch (err) {
        console.error('Error processing file:', file.name, err);
      }
    }

    setUploadStatus(
      `Done! Added ${addedCount} song(s)${duplicateCount > 0 ? `, skipped ${duplicateCount} duplicate(s)` : ''}.`
    );
    setTimeout(() => setUploadStatus(null), 4000);
  };

  const handleCreateNewPlaylist = () => {
    const name = prompt('Enter Playlist Name:', 'Curated Set #01');
    if (name && name.trim()) {
      createPlaylist(name.trim());
    }
  };

  const tabs = [
    { id: 'liked', label: `FAVORITES (${likedTracks.length})`, icon: Heart },
    { id: 'local', label: `LOCAL OPFS (${localTracks.length})`, icon: Upload },
    { id: 'playlists', label: `PLAYLISTS (${playlists.length})`, icon: ListMusic },
    { id: 'offline', label: `OFFLINE (${offlineTracks.length})`, icon: Download }
  ];

  return (
    <div className="space-y-8 pb-32 select-none">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-neutral-400 text-xs font-mono tracking-wider uppercase">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1db954]" />
            <span>SANDBOXED BROWSER VAULT</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black font-mono tracking-tight text-white uppercase">
            YOUR <span className="text-[#1db954]">LIBRARY</span>
          </h1>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-2 flex-wrap bg-neutral-900/60 p-1.5 rounded-2xl border border-white/[0.07]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-white text-black shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#1db954]' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Local MP3 Drag-and-Drop Ingestion Zone */}
      {activeTab === 'local' && (
        <div className="relative rounded-3xl p-8 border-2 border-dashed border-white/15 hover:border-[#1db954]/60 glass-card-editorial text-center space-y-4 transition-all group cursor-pointer shadow-xl">
          <input
            type="file"
            multiple
            accept="audio/*,.mp3,.flac,.wav,.aac,.ogg,.m4a"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="w-14 h-14 rounded-2xl bg-[#1db954]/15 border border-[#1db954]/30 text-[#1db954] mx-auto flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-black font-mono uppercase text-white tracking-tight">
              DRAG & DROP AUDIO FILES HERE
            </h3>
            <p className="text-xs font-mono text-neutral-400 mt-1">
              Supports MP3, FLAC, WAV, AAC, M4A • 100% In-Browser Sandboxed Ingestion
            </p>
          </div>
          {uploadStatus && (
            <div className="inline-block px-4 py-1.5 rounded-full bg-[#1db954]/20 text-[#1db954] text-xs font-mono font-bold border border-[#1db954]/40">
              {uploadStatus}
            </div>
          )}
        </div>
      )}

      {/* Tab 1: Liked Songs */}
      {activeTab === 'liked' && (
        <div className="space-y-4">
          {likedTracks.length === 0 ? (
            <div className="text-center py-20 text-neutral-500 space-y-3">
              <Heart className="w-12 h-12 mx-auto text-neutral-600 mb-2" />
              <p className="text-base font-black font-mono uppercase text-white">No Favorite Songs Yet</p>
              <p className="text-xs font-mono text-neutral-400">Click the heart icon on any song to save it to your local library.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {likedTracks.map((track, i) => {
                const isCurrent = currentTrack?.id === track.id && playbackState === 'playing';
                const rankFormatted = (i + 1).toString().padStart(2, '0');

                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track, likedTracks)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer group select-none ${
                      isCurrent
                        ? 'bg-[#1db954]/15 border-[#1db954]/50 shadow-lg shadow-[#1db954]/10'
                        : 'glass-card-editorial hover:bg-white/[0.06] border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-mono text-sm font-black text-neutral-500 group-hover:text-white w-5 text-center transition-colors">
                        {rankFormatted}
                      </span>
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                        <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold font-mono tracking-tight truncate ${isCurrent ? 'text-[#1db954]' : 'text-white group-hover:text-[#1db954]'}`}>
                          {track.title}
                        </p>
                        <p className="text-xs text-neutral-400 truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-neutral-500 hidden sm:inline-block">
                        {formatDuration(track.duration)}
                      </span>
                      <Heart className="w-4 h-4 text-[#1db954] fill-[#1db954]" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Local Tracks */}
      {activeTab === 'local' && (
        <div className="space-y-4">
          {localTracks.length === 0 ? (
            <p className="text-center py-10 text-xs font-mono text-neutral-500">Drop local files above to store them in your browser OPFS repository.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {localTracks.map((track, i) => {
                const isCurrent = currentTrack?.id === track.id && playbackState === 'playing';
                const rankFormatted = (i + 1).toString().padStart(2, '0');

                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track, localTracks)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer group select-none ${
                      isCurrent
                        ? 'bg-[#1db954]/15 border-[#1db954]/50 shadow-lg shadow-[#1db954]/10'
                        : 'glass-card-editorial hover:bg-white/[0.06] border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-mono text-sm font-black text-neutral-500 group-hover:text-white w-5 text-center transition-colors">
                        {rankFormatted}
                      </span>
                      <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-md">
                        <Music className="w-5 h-5 text-[#1db954]" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold font-mono tracking-tight truncate ${isCurrent ? 'text-[#1db954]' : 'text-white group-hover:text-[#1db954]'}`}>
                          {track.title}
                        </p>
                        <p className="text-xs text-neutral-400 font-mono truncate mt-0.5">LOCAL OPFS STREAM</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLocalTrack(track.id);
                      }}
                      className="p-2 text-neutral-500 hover:text-red-400 transition-colors"
                      title="Delete from OPFS"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Custom Playlists */}
      {activeTab === 'playlists' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={handleCreateNewPlaylist}
              className="btn-spotify-emerald flex items-center gap-2 px-5 py-2.5 rounded-full text-black font-mono font-black text-xs tracking-wider uppercase shadow-lg"
            >
              <PlusCircle className="w-4 h-4" />
              <span>NEW CURATED SET</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                className="p-5 rounded-2xl glass-card-editorial hover:border-[#1db954]/50 transition-all space-y-4 cursor-pointer group"
              >
                <div className="relative w-full h-44 rounded-xl overflow-hidden shadow-lg bg-neutral-900">
                  <img src={pl.coverUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono text-white/90">
                    <span className="font-bold">{pl.trackCount} TRACKS</span>
                    <span className="text-[#1db954]">CURATED</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-black font-mono uppercase text-white tracking-tight group-hover:text-[#1db954] transition-colors">
                      {pl.title}
                    </h4>
                    <p className="text-xs text-neutral-400 font-mono">CUSTOM SET</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePlaylist(pl.id);
                    }}
                    className="p-2 text-neutral-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Offline Ready */}
      {activeTab === 'offline' && (
        <div className="space-y-4">
          {offlineTracks.length === 0 ? (
            <div className="text-center py-20 text-neutral-500 space-y-3">
              <Download className="w-12 h-12 mx-auto text-neutral-600 mb-2" />
              <p className="text-base font-black font-mono uppercase text-white">No Offline Tracks Saved</p>
              <p className="text-xs font-mono text-neutral-400">Tap download on any song to listen without an internet connection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {offlineTracks.map((track, i) => {
                const isCurrent = currentTrack?.id === track.id && playbackState === 'playing';
                const rankFormatted = (i + 1).toString().padStart(2, '0');

                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track, offlineTracks)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer group select-none ${
                      isCurrent
                        ? 'bg-[#1db954]/15 border-[#1db954]/50 shadow-lg shadow-[#1db954]/10'
                        : 'glass-card-editorial hover:bg-white/[0.06] border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-mono text-sm font-black text-neutral-500 group-hover:text-white w-5 text-center transition-colors">
                        {rankFormatted}
                      </span>
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                        <img src={track.coverUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold font-mono tracking-tight truncate ${isCurrent ? 'text-[#1db954]' : 'text-white group-hover:text-[#1db954]'}`}>
                          {track.title}
                        </p>
                        <p className="text-xs text-neutral-400 truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-neutral-500 hidden sm:inline-block">
                        {formatDuration(track.duration)}
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-[#1db954]" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
