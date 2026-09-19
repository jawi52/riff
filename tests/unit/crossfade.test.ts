import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateEqualPowerGains, CrossfadeController, crossfadeController } from '../../src/lib/crossfade';
import { audioEngine } from '../../src/lib/audioEngine';

describe('Dual-Engine Equal-Power Audio Crossfade Architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    crossfadeController.reset();
    crossfadeController.setDuration(4);
  });

  describe('Equal-Power Mathematical Invariants', () => {
    it('calculates exact endpoint boundary gains', () => {
      const atStart = calculateEqualPowerGains(0);
      expect(atStart.outgoingGain).toBeCloseTo(1.0, 5);
      expect(atStart.incomingGain).toBeCloseTo(0.0, 5);
      expect(atStart.totalPower).toBeCloseTo(1.0, 5);

      const atEnd = calculateEqualPowerGains(1);
      expect(atEnd.outgoingGain).toBeCloseTo(0.0, 5);
      expect(atEnd.incomingGain).toBeCloseTo(1.0, 5);
      expect(atEnd.totalPower).toBeCloseTo(1.0, 5);
    });

    it('guarantees constant acoustic power (1.0) at midpoint, eliminating -3dB linear dip', () => {
      const midpoint = calculateEqualPowerGains(0.5);
      const expectedSqrt2Over2 = Math.SQRT1_2; // ~0.70710678

      expect(midpoint.outgoingGain).toBeCloseTo(expectedSqrt2Over2, 5);
      expect(midpoint.incomingGain).toBeCloseTo(expectedSqrt2Over2, 5);
      // Equal power conservation: g_out^2 + g_in^2 === 1.0 (0 dB loss)
      expect(midpoint.totalPower).toBeCloseTo(1.0, 5);

      // Contrast against linear crossfading power dip: (0.5)^2 + (0.5)^2 = 0.5 (-3.01 dB)
      const linearMidpointPower = 0.5 * 0.5 + 0.5 * 0.5;
      expect(linearMidpointPower).toBe(0.5);
      expect(midpoint.totalPower).toBeGreaterThan(linearMidpointPower);
    });

    it('maintains strict equal power sum across all intermediate progression points', () => {
      for (let p = 0; p <= 1; p += 0.05) {
        const gains = calculateEqualPowerGains(p);
        expect(gains.totalPower).toBeCloseTo(1.0, 5);
        expect(gains.outgoingGain).toBeGreaterThanOrEqual(0);
        expect(gains.outgoingGain).toBeLessThanOrEqual(1);
        expect(gains.incomingGain).toBeGreaterThanOrEqual(0);
        expect(gains.incomingGain).toBeLessThanOrEqual(1);
      }
    });

    it('safely clamps out-of-bounds inputs, NaN, and infinities', () => {
      const underflow = calculateEqualPowerGains(-1);
      expect(underflow.outgoingGain).toBeCloseTo(1.0, 5);
      expect(underflow.incomingGain).toBeCloseTo(0.0, 5);

      const overflow = calculateEqualPowerGains(2.5);
      expect(overflow.outgoingGain).toBeCloseTo(0.0, 5);
      expect(overflow.incomingGain).toBeCloseTo(1.0, 5);

      const nanVal = calculateEqualPowerGains(NaN);
      expect(nanVal.outgoingGain).toBeCloseTo(1.0, 5);
      expect(nanVal.incomingGain).toBeCloseTo(0.0, 5);
    });
  });

  describe('CrossfadeController Lifecycle & Trigger Heuristics', () => {
    it('initializes with clamped duration bounds [0, 12]', () => {
      const controller = new CrossfadeController(4);
      expect(controller.getDuration()).toBe(4);
      expect(controller.isEnabled()).toBe(true);

      controller.setDuration(-5);
      expect(controller.getDuration()).toBe(0);
      expect(controller.isEnabled()).toBe(false);

      controller.setDuration(25);
      expect(controller.getDuration()).toBe(12);

      controller.setDuration(6);
      expect(controller.getDuration()).toBe(6);
    });

    it('correctly predicts when to trigger crossfades', () => {
      const controller = new CrossfadeController(4);

      // Track duration 200s, current time 190s -> 10s remaining (more than 4s duration) -> false
      expect(controller.shouldTriggerCrossfade(190, 200)).toBe(false);

      // 197s out of 200s -> 3s remaining <= 4s -> true
      expect(controller.shouldTriggerCrossfade(197, 200)).toBe(true);

      // 199.9s out of 200s -> 0.1s remaining <= 0.2s guard -> false
      expect(controller.shouldTriggerCrossfade(199.9, 200)).toBe(false);

      // Short snippets (< 2 * crossfade duration) should never trigger crossfade
      expect(controller.shouldTriggerCrossfade(5, 7)).toBe(false);

      // When controller is disabled (duration = 0)
      controller.setDuration(0);
      expect(controller.shouldTriggerCrossfade(197, 200)).toBe(false);
    });

    it('suppresses duplicate triggers while a crossfade is already active', () => {
      const controller = new CrossfadeController(4);
      expect(controller.shouldTriggerCrossfade(197, 200)).toBe(true);

      controller.setIsCrossfading(true);
      expect(controller.getIsCrossfading()).toBe(true);
      expect(controller.shouldTriggerCrossfade(197, 200)).toBe(false);

      controller.reset();
      expect(controller.getIsCrossfading()).toBe(false);
      expect(controller.shouldTriggerCrossfade(197, 200)).toBe(true);
    });
  });

  describe('AudioEngine Dual-Deck Integration', () => {
    it('exposes a transparent audio proxy for the active deck', () => {
      const audioProxy = audioEngine.getAudioElement();
      expect(audioProxy).toBeDefined();

      const initialDeck = audioEngine.getActiveDeckId();
      expect(['A', 'B']).toContain(initialDeck);

      // Test proxy getters & setters
      audioProxy.currentTime = 42;
      expect(audioProxy.currentTime).toBe(42);
      expect(audioEngine.getActiveAudio().currentTime).toBe(42);
    });

    it('attaches and relays event listeners transparently', () => {
      const audioProxy = audioEngine.getAudioElement();
      let timeUpdateCalled = false;

      audioProxy.ontimeupdate = () => {
        timeUpdateCalled = true;
      };

      expect(typeof audioProxy.ontimeupdate).toBe('function');
      (audioProxy.ontimeupdate as any)();
      expect(timeUpdateCalled).toBe(true);
    });

    it('performs dual-deck crossfade transition between Deck A and Deck B', async () => {
      const startingDeckId = audioEngine.getActiveDeckId();
      const expectedIncomingDeckId = startingDeckId === 'A' ? 'B' : 'A';

      await audioEngine.crossfadeTo('https://audio.example.com/stream-2.mp3', 2);

      expect(audioEngine.getActiveDeckId()).toBe(expectedIncomingDeckId);
      expect(audioEngine.isCrossfadeActive()).toBe(true);

      // Inactive deck has 0 volume or was crossfaded
      expect(audioEngine.getDeckGain(startingDeckId)).toBeLessThanOrEqual(0.85);

      // Active incoming deck has the stream
      expect(audioEngine.getActiveAudio().src).toBe('https://audio.example.com/stream-2.mp3');

      // Cancel crossfade cleans up gracefully
      audioEngine.cancelCrossfade();
      expect(audioEngine.isCrossfadeActive()).toBe(false);
    });

    it('cancels active crossfade on user pause or seek', async () => {
      await audioEngine.crossfadeTo('https://audio.example.com/stream-3.mp3', 3);
      expect(audioEngine.isCrossfadeActive()).toBe(true);

      audioEngine.seek(15);
      expect(audioEngine.isCrossfadeActive()).toBe(false);

      await audioEngine.crossfadeTo('https://audio.example.com/stream-4.mp3', 3);
      expect(audioEngine.isCrossfadeActive()).toBe(true);

      audioEngine.pause();
      expect(audioEngine.isCrossfadeActive()).toBe(false);
    });
  });
});
