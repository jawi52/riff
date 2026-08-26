import React, { useEffect, useState } from 'react';
import { X, Wifi, Signal, HardDrive, Trash2, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { getStorageQuotaMetrics, db } from '../../lib/db';
import { QualityTier } from '../../types';

export const SettingsDrawer: React.FC = () => {
  const {
    isSettingsOpen,
    setSettingsOpen,
    streamingQuality,
    setStreamingQuality,
    dataSaverEnabled,
    setDataSaverEnabled,
    setAuthModalOpen
  } = useSettingsStore();

  const { user, logout } = useAuthStore();
  const [quota, setQuota] = useState<{ usedMB: string; quotaMB: string; usagePercent: string }>({
    usedMB: '0',
    quotaMB: '0',
    usagePercent: '0'
  });

  useEffect(() => {
    if (isSettingsOpen) {
      getStorageQuotaMetrics().then(setQuota);
    }
  }, [isSettingsOpen]);

  const handleClearCache = async () => {
    if (confirm('Clear local audio cache? (Your liked playlists and settings will be preserved)')) {
      await db.tracks.where('sourceType').equals('remote').delete();
      getStorageQuotaMetrics().then(setQuota);
      alert('Audio cache cleared successfully!');
    }
  };

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex justify-end animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md glass-editorial border-l border-white/10 h-full flex flex-col justify-between p-6 space-y-6 overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="w-5 h-5 text-[#1db954]" />
              <h2 className="text-lg font-black font-mono tracking-tight text-white uppercase">SETTINGS & PREFERENCES</h2>
            </div>
            <button
              onClick={() => setSettingsOpen(false)}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Account Card */}
          <div className="p-4 rounded-2xl glass-card-editorial border border-white/[0.08] space-y-3">
            <div className="flex items-center gap-3.5">
              <img src={user.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-[#1db954]/50" />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold font-mono text-white truncate">{user.displayName}</h4>
                <p className="text-xs font-mono text-neutral-400 truncate">{user.isGuest ? 'GUEST SESSION // LOCAL' : user.email}</p>
              </div>
            </div>

            {user.isGuest ? (
              <button
                onClick={() => {
                  setSettingsOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl btn-spotify-emerald text-black text-xs font-mono font-black tracking-wider uppercase shadow-md transition-all"
              >
                UPGRADE TO RIFF CLOUD
              </button>
            ) : (
              <button
                onClick={logout}
                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-mono font-bold uppercase transition-all"
              >
                SIGN OUT
              </button>
            )}
          </div>

          {/* Audio Quality Tiers */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-neutral-400 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-[#1db954]" />
              <span>AUDIO STREAMING QUALITY</span>
            </h3>

            <div className="space-y-2">
              {[
                { id: 'auto', label: 'AUTO (SMART ADAPTIVE)', desc: 'Switches automatically based on Wi-Fi vs cellular' },
                { id: 'high', label: 'HIGH STUDIO (320 KBPS)', desc: 'Crystal clear studio lossless AAC/MP3 stream' },
                { id: 'standard', label: 'STANDARD (160 KBPS)', desc: 'Balanced high quality with everyday data saving' },
                { id: 'saver', label: 'DATA SAVER (96 KBPS)', desc: 'Ultra low-latency Opus compression' }
              ].map((tier) => (
                <div
                  key={tier.id}
                  onClick={() => setStreamingQuality(tier.id as QualityTier)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    streamingQuality === tier.id
                      ? 'bg-[#1db954]/15 border-[#1db954]/50 shadow-md shadow-[#1db954]/10 text-white'
                      : 'glass-card-editorial border-white/[0.06] text-neutral-300 hover:border-white/20'
                  }`}
                >
                  <div>
                    <p className="text-xs font-mono font-bold tracking-tight">{tier.label}</p>
                    <p className="text-[11px] font-mono text-neutral-500 mt-0.5">{tier.desc}</p>
                  </div>
                  {streamingQuality === tier.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1db954] shadow-md shadow-[#1db954]/50" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Data Saver Mode Toggle */}
          <div className="p-4 rounded-2xl glass-card-editorial border border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Signal className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="text-xs font-mono font-bold text-white uppercase">STRICT DATA SAVER</h4>
                <p className="text-[11px] font-mono text-neutral-500">Forces 96kbps stream & disables audio prefetch</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={dataSaverEnabled}
              onChange={(e) => setDataSaverEnabled(e.target.checked)}
              className="w-5 h-5 accent-[#1db954] rounded cursor-pointer"
            />
          </div>

          {/* Advanced Audio DSP Studio */}
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-neutral-400 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#1db954]" />
              <span>ADVANCED AUDIO DSP & PLAYBACK</span>
            </h3>

            {/* Crossfade Slider */}
            <div className="p-4 rounded-2xl glass-card-editorial border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase">AUDIO CROSSFADE</h4>
                  <p className="text-[11px] font-mono text-neutral-500">Smooth volume transition between songs</p>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400">{useSettingsStore.getState().crossfadeSeconds}s</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={useSettingsStore.getState().crossfadeSeconds}
                onChange={(e) => useSettingsStore.getState().setCrossfadeSeconds(parseInt(e.target.value))}
                className="w-full accent-cyan-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                <span>0s (Off)</span>
                <span>6s</span>
                <span>12s (Long)</span>
              </div>
            </div>

            {/* ReplayGain Normalization */}
            <div className="p-4 rounded-2xl glass-card-editorial border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase">LOUDNESS NORMALIZATION</h4>
                  <p className="text-[11px] font-mono text-neutral-500">Normalizes tracks to consistent volume level</p>
                </div>
                <input
                  type="checkbox"
                  checked={useSettingsStore.getState().normalizeLoudness}
                  onChange={(e) => useSettingsStore.getState().setNormalizeLoudness(e.target.checked)}
                  className="w-5 h-5 accent-[#1db954] rounded cursor-pointer"
                />
              </div>

              {useSettingsStore.getState().normalizeLoudness && (
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {(['quiet', 'normal', 'loud'] as const).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => useSettingsStore.getState().setLoudnessPreset(preset)}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-mono font-bold uppercase transition cursor-pointer ${
                        useSettingsStore.getState().loudnessPreset === preset
                          ? 'bg-[#1db954] text-black shadow-md'
                          : 'bg-white/5 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mono Audio Toggle */}
            <div className="p-4 rounded-2xl glass-card-editorial border border-white/[0.08] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-mono font-bold text-white uppercase">MONO AUDIO DOWNMIX</h4>
                <p className="text-[11px] font-mono text-neutral-500">Combines stereo channels for single earbud listening</p>
              </div>
              <input
                type="checkbox"
                checked={useSettingsStore.getState().isMonoAudio}
                onChange={(e) => useSettingsStore.getState().setMonoAudio(e.target.checked)}
                className="w-5 h-5 accent-[#1db954] rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Privacy & Content Controls */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-neutral-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1db954]" />
              <span>PRIVACY & SOCIAL CONTROLS</span>
            </h3>

            {/* Private Session (Incognito) */}
            <div className="p-4 rounded-2xl glass-card-editorial border border-white/[0.08] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-mono font-bold text-white uppercase">PRIVATE LISTENING SESSION</h4>
                <p className="text-[11px] font-mono text-neutral-500">Temporarily pause history recording & presence broadcast</p>
              </div>
              <input
                type="checkbox"
                checked={useSettingsStore.getState().privateSessionEnabled}
                onChange={(e) => useSettingsStore.getState().setPrivateSessionEnabled(e.target.checked)}
                className="w-5 h-5 accent-[#1db954] rounded cursor-pointer"
              />
            </div>

            {/* Explicit Content Filter */}
            <div className="p-4 rounded-2xl glass-card-editorial border border-white/[0.08] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-mono font-bold text-white uppercase">EXPLICIT CONTENT FILTER</h4>
                <p className="text-[11px] font-mono text-neutral-500">Filter explicit (E) songs from catalog feeds</p>
              </div>
              <input
                type="checkbox"
                checked={useSettingsStore.getState().explicitFilterEnabled}
                onChange={(e) => useSettingsStore.getState().setExplicitFilterEnabled(e.target.checked)}
                className="w-5 h-5 accent-[#1db954] rounded cursor-pointer"
              />
            </div>

            {/* Friend Activity Toggle */}
            <div className="p-4 rounded-2xl glass-card-editorial border border-white/[0.08] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-mono font-bold text-white uppercase">FRIEND ACTIVITY FEED</h4>
                <p className="text-[11px] font-mono text-neutral-500">Show desktop live listening presence sidebar</p>
              </div>
              <input
                type="checkbox"
                checked={useSettingsStore.getState().friendActivityEnabled}
                onChange={(e) => useSettingsStore.getState().setFriendActivityEnabled(e.target.checked)}
                className="w-5 h-5 accent-[#1db954] rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Storage Quota & Cache Cleaner */}
          <div className="p-4 rounded-2xl glass-card-editorial border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-4 h-4 text-neutral-400" />
                <h4 className="text-xs font-mono font-bold text-white uppercase">DEVICE OPFS STORAGE</h4>
              </div>
              <span className="text-xs font-mono text-[#1db954] font-bold">{quota.usedMB} MB USED</span>
            </div>

            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1db954] shadow-[0_0_8px_#1db954]"
                style={{ width: `${Math.max(2, parseFloat(quota.usagePercent))}%` }}
              />
            </div>

            <button
              onClick={handleClearCache}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-rose-500/20 text-neutral-300 hover:text-rose-400 text-xs font-mono font-bold uppercase transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>PURGE CACHED AUDIO</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs font-mono text-neutral-500 space-y-1 pt-4 border-t border-white/[0.08]">
          <div className="flex items-center justify-center gap-1.5 text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1db954]" />
            <span>RIFF UNIVERSAL AUDIO MESH // PWA 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};
