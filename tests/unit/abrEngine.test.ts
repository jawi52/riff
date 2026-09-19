import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ABREngine,
  AUDIO_BITRATE_PROFILES,
  abrEngine
} from '../../src/lib/abrEngine';

describe('Adaptive Bitrate (ABR) Stream Selector Engine', () => {
  let engine: ABREngine;

  beforeEach(() => {
    vi.useFakeTimers();
    engine = new ABREngine({
      minBufferSec: 3.0,
      maxBufferSec: 20.0,
      throughputSafetyFactor: 0.85,
      switchDampingMs: 3000
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Profiles & Utility Monotonicity', () => {
    it('defines monotonic bitrates and logarithmic perceptual utilities', () => {
      const { low, medium, high, ultra } = AUDIO_BITRATE_PROFILES;

      expect(low.bitrateKbps).toBe(64);
      expect(medium.bitrateKbps).toBe(128);
      expect(high.bitrateKbps).toBe(256);
      expect(ultra.bitrateKbps).toBe(320);

      expect(low.utility).toBeLessThan(medium.utility);
      expect(medium.utility).toBeLessThan(high.utility);
      expect(high.utility).toBeLessThan(ultra.utility);
    });
  });

  describe('Emergency Buffer Underrun Protection', () => {
    it('forces emergency drop to LOW when buffer is below minBufferSec', () => {
      // Buffer is critically low (1.5s), even with 10 Mbps bandwidth
      const profile = engine.selectOptimalProfile({
        bufferDepthSec: 1.5,
        smoothedThroughputKbps: 10000
      });

      expect(profile.quality).toBe('low');
      expect(profile.bitrateKbps).toBe(64);
      expect(engine.getCurrentQuality()).toBe('low');
    });
  });

  describe('Throughput Safety & Bandwidth Constraints', () => {
    it('restricts candidate profiles to those safe for available throughput', () => {
      // 100 kbps bandwidth * 0.85 safety factor = 85 kbps safe -> only 64 kbps fits
      const profile = engine.selectOptimalProfile({
        bufferDepthSec: 10.0,
        smoothedThroughputKbps: 100
      });

      expect(profile.quality).toBe('low');
      expect(profile.bitrateKbps).toBe(64);
    });

    it('selects higher bitrates when both buffer and bandwidth are healthy', () => {
      // Advance past initial damping
      vi.advanceTimersByTime(5000);

      const profile = engine.selectOptimalProfile({
        bufferDepthSec: 18.0,
        smoothedThroughputKbps: 5000
      });

      // With 18s buffer (near max 20s) and 5 Mbps bandwidth, should select high or ultra
      expect(['high', 'ultra']).toContain(profile.quality);
      expect(profile.bitrateKbps).toBeGreaterThanOrEqual(256);
    });
  });

  describe('Cellular Data Saver Mode', () => {
    it('avoids ultra lossless tier on cellular connections to conserve data', () => {
      vi.advanceTimersByTime(5000);

      const profile = engine.selectOptimalProfile({
        bufferDepthSec: 19.0,
        smoothedThroughputKbps: 15000,
        isCellular: true
      });

      expect(profile.quality).not.toBe('ultra');
      expect(profile.bitrateKbps).toBeLessThanOrEqual(256);
    });
  });

  describe('Hysteresis Damping & Anti-Flapping', () => {
    it('prevents rapid quality oscillations during rapid bandwidth fluctuations', () => {
      // Start at medium
      expect(engine.getCurrentQuality()).toBe('medium');

      // Bandwidth drops momentarily for 500ms but buffer is safe (12s)
      engine.selectOptimalProfile({
        bufferDepthSec: 12.0,
        smoothedThroughputKbps: 100 // would suggest low
      });

      // First switch to low occurs
      expect(engine.getCurrentQuality()).toBe('low');

      // Bandwidth jumps back immediately (100ms later)
      vi.advanceTimersByTime(100);
      const flappedProfile = engine.selectOptimalProfile({
        bufferDepthSec: 12.0,
        smoothedThroughputKbps: 5000
      });

      // Should be held in damping (cooldown 3000ms hasn't passed)
      expect(flappedProfile.quality).toBe('low');

      // Advance past damping cooldown (3000ms)
      vi.advanceTimersByTime(3100);
      const stabilizedProfile = engine.selectOptimalProfile({
        bufferDepthSec: 15.0,
        smoothedThroughputKbps: 5000
      });

      // Now successfully transitions
      expect(stabilizedProfile.bitrateKbps).toBeGreaterThan(64);
    });
  });

  describe('Manual Quality Override', () => {
    it('locks quality to user-selected tier in manual mode', () => {
      engine.setMode('ultra');
      expect(engine.getMode()).toBe('ultra');

      // Even with 0.5s buffer and 10 kbps connection, manual mode returns ultra
      const profile = engine.selectOptimalProfile({
        bufferDepthSec: 0.5,
        smoothedThroughputKbps: 10
      });

      expect(profile.quality).toBe('ultra');
      expect(profile.bitrateKbps).toBe(320);

      // Reverting to auto resumes adaptation
      engine.setMode('auto');
      expect(engine.getMode()).toBe('auto');

      const autoProfile = engine.selectOptimalProfile({
        bufferDepthSec: 1.0,
        smoothedThroughputKbps: 10
      });
      expect(autoProfile.quality).toBe('low');
    });
  });

  describe('Singleton abrEngine Export', () => {
    it('exports correctly initialized singleton instance', () => {
      expect(abrEngine).toBeDefined();
      expect(abrEngine instanceof ABREngine).toBe(true);
      expect(abrEngine.getMode()).toBe('auto');
    });
  });
});
