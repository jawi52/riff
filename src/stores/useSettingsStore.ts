import { create } from 'zustand';
import { AppSettings, QualityTier } from '../types';
import { audioEngine } from '../lib/audioEngine';

interface SettingsState extends AppSettings {
  isSettingsOpen: boolean;
  isAuthModalOpen: boolean;

  // Actions
  setSettingsOpen: (open: boolean) => void;
  setAuthModalOpen: (open: boolean) => void;
  setStreamingQuality: (quality: QualityTier) => void;
  setDataSaverEnabled: (enabled: boolean) => void;
  setCellularQuality: (quality: 'standard' | 'saver') => void;
  setAllowCellularDownloads: (allow: boolean) => void;
  setEqualizerPreset: (preset: AppSettings['equalizerPreset']) => void;
  setEQBand: (index: number, value: number) => void;
  setPushEnabled: (enabled: boolean) => void;
  setTheme: (theme: AppSettings['theme']) => void;
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
  isSettingsOpen: false,
  isAuthModalOpen: false,

  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
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
  setTheme: (theme) => set({ theme })
}));
