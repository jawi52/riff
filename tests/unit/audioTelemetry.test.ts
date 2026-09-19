import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ReservoirSampler,
  ExponentialMovingAverage,
  AudioPlaybackTelemetry,
  audioTelemetry
} from '../../src/lib/audioTelemetry';

describe('Audio Playback Telemetry & Quality of Experience (QoE) Engine', () => {
  describe('Reservoir Sampling (Algorithm R)', () => {
    it('retains all items while stream length is less than or equal to capacity', () => {
      const sampler = new ReservoirSampler<number>(5);
      sampler.add(10);
      sampler.add(20);
      sampler.add(30);

      expect(sampler.getSample()).toEqual([10, 20, 30]);
      expect(sampler.getStreamLength()).toBe(3);
      expect(sampler.getCapacity()).toBe(5);
    });

    it('strictly bounds sample size at capacity K for unbounded streams', () => {
      const capacity = 20;
      const sampler = new ReservoirSampler<number>(capacity);

      // Ingest 500 items
      for (let i = 0; i < 500; i++) {
        sampler.add(i);
      }

      expect(sampler.getStreamLength()).toBe(500);
      expect(sampler.getSample().length).toBe(capacity);
    });

    it('exhibits uniform distribution across early, middle, and late stream elements', () => {
      const capacity = 50;
      const totalStream = 1000;
      const sampler = new ReservoirSampler<number>(capacity);

      for (let i = 0; i < totalStream; i++) {
        sampler.add(i);
      }

      const sample = sampler.getSample();
      expect(sample.length).toBe(capacity);

      // Partition stream into tertiles
      const earlyCount = sample.filter((x) => x < 333).length;
      const midCount = sample.filter((x) => x >= 333 && x < 666).length;
      const lateCount = sample.filter((x) => x >= 666).length;

      // Each tertile should have a non-zero representation
      expect(earlyCount).toBeGreaterThan(2);
      expect(midCount).toBeGreaterThan(2);
      expect(lateCount).toBeGreaterThan(2);
    });

    it('supports batch ingestion via addBatch', () => {
      const sampler = new ReservoirSampler<string>(10);
      sampler.addBatch(['a', 'b', 'c', 'd', 'e']);
      expect(sampler.getStreamLength()).toBe(5);
      expect(sampler.getSample()).toEqual(['a', 'b', 'c', 'd', 'e']);
    });

    it('calculates accurate percentiles on sampled data', () => {
      const sampler = new ReservoirSampler<number>(100);
      // Ingest 1 to 100
      for (let i = 1; i <= 100; i++) {
        sampler.add(i);
      }

      const percentiles = sampler.getPercentiles((x) => x, [0, 50, 90, 100]);
      expect(percentiles[0]).toBe(1);
      expect(percentiles[50]).toBeCloseTo(50.5, 1);
      expect(percentiles[90]).toBeCloseTo(90.1, 1);
      expect(percentiles[100]).toBe(100);
    });

    it('handles empty reservoir percentiles gracefully', () => {
      const sampler = new ReservoirSampler<number>(10);
      const percentiles = sampler.getPercentiles((x) => x, [50, 90]);
      expect(percentiles[50]).toBe(0);
      expect(percentiles[90]).toBe(0);
    });

    it('clears reservoir state and resets stream counter', () => {
      const sampler = new ReservoirSampler<number>(5);
      sampler.addBatch([1, 2, 3]);
      expect(sampler.getStreamLength()).toBe(3);

      sampler.clear();
      expect(sampler.getStreamLength()).toBe(0);
      expect(sampler.getSample()).toEqual([]);
    });
  });

  describe('Exponential Moving Average (EMA)', () => {
    it('initializes baseline with first observation without zero-bias', () => {
      const ema = new ExponentialMovingAverage(0.2);
      expect(ema.getValue()).toBe(0);

      ema.update(150);
      // First value should equal exactly the first observation
      expect(ema.getValue()).toBe(150);
    });

    it('converges to steady-state value on constant sequence', () => {
      const ema = new ExponentialMovingAverage(0.3);
      ema.update(50);
      for (let i = 0; i < 20; i++) {
        ema.update(100);
      }
      expect(ema.getValue()).toBeCloseTo(100, 1);
    });

    it('adapts faster with higher alpha smoothing factor', () => {
      const fastEMA = new ExponentialMovingAverage(0.8, 10);
      const slowEMA = new ExponentialMovingAverage(0.1, 10);

      // Step change from 10 to 100
      fastEMA.update(100);
      slowEMA.update(100);

      // Fast: 0.8 * 100 + 0.2 * 10 = 82
      // Slow: 0.1 * 100 + 0.9 * 10 = 19
      expect(fastEMA.getValue()).toBe(82);
      expect(slowEMA.getValue()).toBe(19);
      expect(fastEMA.getValue()).toBeGreaterThan(slowEMA.getValue());
    });

    it('resets to initial state or custom baseline', () => {
      const ema = new ExponentialMovingAverage(0.2);
      ema.update(120);
      expect(ema.getValue()).toBe(120);

      ema.reset();
      expect(ema.getValue()).toBe(0);

      ema.reset(45);
      expect(ema.getValue()).toBe(45);
    });
  });

  describe('Playback Quality of Experience (QoE) Profiler', () => {
    let telemetry: AudioPlaybackTelemetry;

    beforeEach(() => {
      vi.useFakeTimers();
      telemetry = new AudioPlaybackTelemetry();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('tracks session lifecycle and time to first audio (TTFA)', () => {
      telemetry.startSession('track-42');

      vi.advanceTimersByTime(350);
      const ttfa = telemetry.recordFirstAudio();

      expect(ttfa).toBe(350);
      // Repeated call returns identical TTFA
      expect(telemetry.recordFirstAudio()).toBe(350);
    });

    it('tracks buffer stall events and calculates starvation ratio', () => {
      telemetry.startSession('track-staller');

      // Play normally for 1000ms
      vi.advanceTimersByTime(1000);

      // Stall begins
      telemetry.onStallStart();
      // Consecutive call should not duplicate stall count
      telemetry.onStallStart();

      vi.advanceTimersByTime(500); // 500ms stall duration
      const stallDuration = telemetry.onStallEnd();
      expect(stallDuration).toBe(500);

      vi.advanceTimersByTime(500);

      const report = telemetry.getSessionReport();
      expect(report.trackId).toBe('track-staller');
      expect(report.stallCount).toBe(1);
      expect(report.totalStallDurationMs).toBe(500);
      expect(report.sessionDurationMs).toBe(2000);
      expect(report.starvationRatio).toBeCloseTo(500 / 2000, 2);
    });

    it('records chunk downloads and updates bitrate and latency EMAs', () => {
      telemetry.startSession('stream-track');

      // 128KB chunk downloaded in 100ms -> 128 * 1024 * 8 / 100 = 10485.76 kbps
      telemetry.recordChunkDownload(128 * 1024, 100, 'https://cdn.riff.audio/chunk1.m4a');
      telemetry.recordChunkDownload(128 * 1024, 120, 'https://cdn.riff.audio/chunk2.m4a');

      const report = telemetry.getSessionReport();
      expect(report.samplesCollected).toBe(2);
      expect(report.smoothedBitrateKbps).toBeGreaterThan(0);
      expect(report.smoothedLatencyMs).toBeGreaterThan(0);
      expect(report.latencyPercentiles[50]).toBeDefined();
    });

    it('records buffer forward depth health metrics into reservoir', () => {
      telemetry.startSession('buffer-track');
      telemetry.recordBufferHealth(15.2, 45.0);
      telemetry.recordBufferHealth(20.5, 50.0);

      const bufferSampler = telemetry.getBufferHealthSampler();
      expect(bufferSampler.getStreamLength()).toBe(2);
      const samples = bufferSampler.getSample();
      expect(samples[0].bufferedSeconds).toBe(15.2);
      expect(samples[1].playbackPosition).toBe(50.0);
    });

    it('exports singleton audioTelemetry instance', () => {
      expect(audioTelemetry).toBeDefined();
      expect(audioTelemetry instanceof AudioPlaybackTelemetry).toBe(true);
    });
  });
});
