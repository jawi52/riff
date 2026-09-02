import { create } from 'zustand';
import { AppSettings, QualityTier, Track } from '../types';
import { audioEngine } from '../lib/audioEngine';

interface SettingsState extends AppSettings {
  isSettingsOpen: boolean;
  isAuthModalOpen: boolean;
  isAiPromptModalOpen: boolean;
  isWaveTagModalOpen: boolean;
  isCreditsModalOpen: boolean;
  activeCreditsTrack: Track | null;
  activeWaveTagData: { title: string; subtitle: string; coverUrl: string; id: string; type: 'track' | 'playlist' } | null;

  // Actions
  setSettingsOpen: (open: boolean) => void;
  setAuthModalOpen: (open: boolean) => void;
  setAiPromptModalOpen: (open: boolean) => void;
  setWaveTagModalOpen: (open: boolean, data?: SettingsState['activeWaveTagData']) => void;
  setCreditsModalOpen: (open: boolean, track?: Track | null) => void;
  setStreamingQuality: (quality: QualityTier) => void;
  setDataSaverEnabled: (enabled: boolean) => void;
  setCellularQuality: (quality: 'standard' | 'saver') => void;
  setAllowCellularDownloads: (allow: boolean) => void;
  setEqualizerPreset: (preset: AppSettings['equalizerPreset']) => void;
  setEQBand: (index: number, value: number) => void;
  setPushEnabled: (enabled: boolean) => void;
  setTheme: (theme: AppSettings['theme']) => void;
  setCrossfadeSeconds: (seconds: number) => void;
  setNormalizeLoudness: (enabled: boolean) => void;
  setLoudnessPreset: (preset: 'normal' | 'quiet' | 'loud') => void;
  setMonoAudio: (enabled: boolean) => void;
  setPrivateSessionEnabled: (enabled: boolean) => void;
  setExplicitFilterEnabled: (enabled: boolean) => void;
  setSmartShuffleActive: (active: boolean) => void;
  setFriendActivityEnabled: (enabled: boolean) => void;
}

const EQ_PRESETS: Record<AppSettings['equalizerPreset'], number[]> = {
  flat: [0, 0, 0, 0, 0],
  bass_boost: [6, 4, 1, 0, -1],
  vocal: [-2, 1, 4, 3, 1],
  electronic: [5, 3, -1, 2, 4],
  rock: [4, 2, -1, 3, 5],
  acoustic: [2, 1, 2, 3, 2]
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'deep-obsidian',
  streamingQuality: 'auto',
  cellularQuality: 'standard',
  wifiQuality: 'high',
  allowCellularDownloads: false,
  dataSaverEnabled: false,
  equalizerPreset: 'flat',
  eqBands: [0, 0, 0, 0, 0],
  pushEnabled: false,
  
  // Advanced Audio & Privacy Defaults
  crossfadeSeconds: 4,
  normalizeLoudness: true,
  loudnessPreset: 'normal',
  isMonoAudio: false,
  privateSessionEnabled: false,
  explicitFilterEnabled: false,
  smartShuffleActive: false,
  friendActivityEnabled: true,

  // Modals
  isSettingsOpen: false,
  isAuthModalOpen: false,
  isAiPromptModalOpen: false,
  isWaveTagModalOpen: false,
  isCreditsModalOpen: false,
  activeCreditsTrack: null,
  activeWaveTagData: null,

  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
  setAiPromptModalOpen: (open) => set({ isAiPromptModalOpen: open }),
  setWaveTagModalOpen: (open, data) => set({ isWaveTagModalOpen: open, activeWaveTagData: data || null }),
  setCreditsModalOpen: (open, track) => set({ isCreditsModalOpen: open, activeCreditsTrack: track || null }),
  setStreamingQuality: (quality) => set({ streamingQuality: quality }),
  setDataSaverEnabled: (enabled) => set({ dataSaverEnabled: enabled }),
  setCellularQuality: (quality) => set({ cellularQuality: quality }),
  setAllowCellularDownloads: (allow) => set({ allowCellularDownloads: allow }),

  setEqualizerPreset: (preset) => {
    const bands = EQ_PRESETS[preset] || EQ_PRESETS.flat;
    audioEngine.setEQGains(bands);
    set({ equalizerPreset: preset, eqBands: [...bands] });
  },

  setEQBand: (index, value) => {
    const newBands = [...get().eqBands];
    newBands[index] = Math.max(-12, Math.min(12, value));
    audioEngine.setEQGains(newBands);
    set({ eqBands: newBands, equalizerPreset: 'flat' });
  },

  setPushEnabled: (enabled) => set({ pushEnabled: enabled }),
  setTheme: (theme) => set({ theme }),

  setCrossfadeSeconds: (seconds) => set({ crossfadeSeconds: Math.max(0, Math.min(12, seconds)) }),
  setNormalizeLoudness: (enabled) => {
    audioEngine.setLoudnessNormalization(enabled, get().loudnessPreset);
    set({ normalizeLoudness: enabled });
  },
  setLoudnessPreset: (preset) => {
    audioEngine.setLoudnessNormalization(get().normalizeLoudness, preset);
    set({ loudnessPreset: preset });
  },
  setMonoAudio: (enabled) => {
    audioEngine.setMonoAudio(enabled);
    set({ isMonoAudio: enabled });
  },
  setPrivateSessionEnabled: (enabled) => set({ privateSessionEnabled: enabled }),
  setExplicitFilterEnabled: (enabled) => set({ explicitFilterEnabled: enabled }),
  setSmartShuffleActive: (active) => set({ smartShuffleActive: active }),
  setFriendActivityEnabled: (enabled) => set({ friendActivityEnabled: enabled })
}));
