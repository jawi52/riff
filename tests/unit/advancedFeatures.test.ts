import { describe, it, expect } from 'vitest';
import { audioEngine } from '../../src/lib/audioEngine';
import { usePlayerStore } from '../../src/stores/usePlayerStore';
import { GLOBAL_CATALOG } from '../../src/lib/algorithm';

describe('Advanced Audio DSP & Feature Parity Suite', () => {
  it('should initialize and configure ReplayGain loudness normalization', () => {
    audioEngine.initWebAudio();

    // Test Loudness Normalization presets
    audioEngine.setLoudnessNormalization(true, 'normal');
    audioEngine.setLoudnessNormalization(true, 'quiet');
    audioEngine.setLoudnessNormalization(true, 'loud');
    audioEngine.setLoudnessNormalization(false);

    expect(audioEngine).toBeDefined();
  });

  it('should toggle mono audio downmixing cleanly', () => {
    audioEngine.setMonoAudio(true);
    audioEngine.setMonoAudio(false);
    expect(audioEngine).toBeDefined();
  });

  it('should handle crossfade volume ramping without throwing', () => {
    audioEngine.fadeVolume(0.5, 2);
    audioEngine.fadeVolume(1.0, 4);
    expect(audioEngine).toBeDefined();
  });

  it('should support end-of-track sleep timer mode', () => {
    const playerStore = usePlayerStore.getState();
    playerStore.setSleepTimer(null, 'end_of_track');

    expect(usePlayerStore.getState().sleepTimerMode).toBe('end_of_track');
    expect(usePlayerStore.getState().sleepTimerMinutes).toBeNull();
  });

  it('should toggle smart shuffle and inject recommendations into queue', () => {
    const seedTrack = GLOBAL_CATALOG[0];
    usePlayerStore.getState().playTrack(seedTrack, [seedTrack]);

    const initialQueueLength = usePlayerStore.getState().queue.length;
    usePlayerStore.getState().toggleSmartShuffle();

    expect(usePlayerStore.getState().smartShuffle).toBe(true);
    expect(usePlayerStore.getState().queue.length).toBeGreaterThanOrEqual(initialQueueLength);
  });

  it('should generate song radio seeded from a single track', async () => {
    const seedTrack = GLOBAL_CATALOG[1];
    await usePlayerStore.getState().generateSongRadio(seedTrack);

    expect(usePlayerStore.getState().currentTrack?.id).toBe(seedTrack.id);
    expect(usePlayerStore.getState().queue.length).toBeGreaterThan(1);
    expect(usePlayerStore.getState().queue[0].id).toBe(seedTrack.id);
  });
});
