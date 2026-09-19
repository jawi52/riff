import { describe, it, expect, beforeEach } from 'vitest';
import {
  CooleyTukeyFFT,
  SpectralAnalyzer,
  SpectralBeatDetector,
} from '../../src/lib/fft';

describe('Cooley-Tukey Radix-2 FFT & Spectral Audio Analyzer', () => {
  describe('CooleyTukeyFFT Initialization & Structural Constraints', () => {
    it('initializes correctly for valid power-of-two sizes', () => {
      const sizes = [64, 128, 256, 512, 1024, 2048];
      for (const sz of sizes) {
        const fft = new CooleyTukeyFFT(sz);
        expect(fft.size).toBe(sz);
      }
    });

    it('throws descriptive error on non-power-of-two sizes', () => {
      expect(() => new CooleyTukeyFFT(500)).toThrow(/power of 2/);
      expect(() => new CooleyTukeyFFT(1000)).toThrow(/power of 2/);
      expect(() => new CooleyTukeyFFT(0)).toThrow(/power of 2/);
      expect(() => new CooleyTukeyFFT(-128)).toThrow(/power of 2/);
      expect(() => new CooleyTukeyFFT(1)).toThrow(/power of 2/);
    });

    it('correctly computes Hann window boundary zeroing', () => {
      const fft = new CooleyTukeyFFT(512);
      const signal = new Float32Array(512).fill(1.0);
      const windowed = fft.applyHannWindow(signal);

      expect(windowed[0]).toBeCloseTo(0, 4);
      expect(windowed[511]).toBeCloseTo(0, 4);
      // Center of Hann window reaches 1.0
      expect(windowed[256]).toBeGreaterThan(0.99);
    });
  });

  describe('Forward FFT & Frequency Peak Detection', () => {
    const N = 1024;
    const sampleRate = 44100;
    let fft: CooleyTukeyFFT;

    beforeEach(() => {
      fft = new CooleyTukeyFFT(N);
    });

    it('detects the exact frequency bin of a pure sinusoidal wave', () => {
      // Choose an integer bin: k = 16
      // f = k * (sampleRate / N) = 16 * 44100 / 1024 = 689.0625 Hz
      const targetBin = 16;
      const targetFreq = (targetBin * sampleRate) / N;
      const amplitude = 0.8;

      const input = new Float32Array(N);
      for (let n = 0; n < N; n++) {
        input[n] = amplitude * Math.sin((2 * Math.PI * targetFreq * n) / sampleRate);
      }

      const { real, imag } = fft.forward(input);
      const magnitudes = fft.getMagnitudes(real, imag);

      // Find the bin with the highest magnitude
      let maxMag = 0;
      let peakBin = -1;
      for (let k = 0; k < magnitudes.length; k++) {
        if (magnitudes[k] > maxMag) {
          maxMag = magnitudes[k];
          peakBin = k;
        }
      }

      expect(peakBin).toBe(targetBin);
      // Peak magnitude should be close to original amplitude (0.8)
      expect(maxMag).toBeCloseTo(amplitude, 1);
    });

    it('satisfies Parseval\'s Energy Conservation Theorem', () => {
      // Sum(|x[n]|^2) in time domain == (1 / N) * Sum(|X[k]|^2) in frequency domain
      const input = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        input[i] = (Math.random() - 0.5) * 2; // Uniform white noise [-1, 1]
      }

      let timeDomainEnergy = 0;
      for (let i = 0; i < N; i++) {
        timeDomainEnergy += input[i] * input[i];
      }

      const { real, imag } = fft.forward(input);

      let freqDomainEnergy = 0;
      for (let k = 0; k < N; k++) {
        freqDomainEnergy += (real[k] * real[k] + imag[k] * imag[k]);
      }
      freqDomainEnergy /= N;

      // Check conservation within floating point rounding
      expect(freqDomainEnergy).toBeCloseTo(timeDomainEnergy, 1);
    });
  });

  describe('Inverse FFT (IFFT) Reconstruction', () => {
    const N = 512;
    let fft: CooleyTukeyFFT;

    beforeEach(() => {
      fft = new CooleyTukeyFFT(N);
    });

    it('perfectly reconstructs an arbitrary composite time-domain signal', () => {
      const original = new Float32Array(N);
      for (let n = 0; n < N; n++) {
        // Multi-frequency harmonic combination
        original[n] =
          0.5 * Math.cos((2 * Math.PI * 4 * n) / N) +
          0.3 * Math.sin((2 * Math.PI * 12 * n) / N) +
          0.1 * (Math.random() - 0.5);
      }

      const { real, imag } = fft.forward(original);
      const reconstructed = fft.inverse(real, imag);

      expect(reconstructed.length).toBe(N);
      for (let n = 0; n < N; n++) {
        expect(reconstructed[n]).toBeCloseTo(original[n], 4);
      }
    });
  });

  describe('SpectralAnalyzer Frequency Band Decomposition', () => {
    const N = 1024;
    const sampleRate = 44100;
    let fft: CooleyTukeyFFT;

    beforeEach(() => {
      fft = new CooleyTukeyFFT(N);
    });

    it('isolates sub-bass energy for low rumble frequencies (43 Hz / Bin 1)', () => {
      // Bin 1: 1 * 44100 / 1024 = 43.066 Hz (inside Sub-Bass: 20 - 60 Hz)
      const freq = (1 * sampleRate) / N;
      const signal = new Float32Array(N);
      for (let n = 0; n < N; n++) {
        signal[n] = Math.sin((2 * Math.PI * freq * n) / sampleRate);
      }

      const { real, imag } = fft.forward(signal);
      const magnitudes = fft.getMagnitudes(real, imag);
      const bands = SpectralAnalyzer.extractBands(magnitudes, sampleRate, N);

      expect(bands.subBass).toBeGreaterThan(0.9);
      expect(bands.brilliance).toBeLessThan(0.001);
      expect(bands.totalEnergy).toBeGreaterThan(0);
    });

    it('isolates midrange energy for vocal fundamentals (1000 Hz / Bin 23)', () => {
      // Bin 23: 23 * 44100 / 1024 = 990.5 Hz (inside Midrange: 500 - 2000 Hz)
      const freq = (23 * sampleRate) / N;
      const signal = new Float32Array(N);
      for (let n = 0; n < N; n++) {
        signal[n] = Math.sin((2 * Math.PI * freq * n) / sampleRate);
      }

      const { real, imag } = fft.forward(signal);
      const magnitudes = fft.getMagnitudes(real, imag);
      const bands = SpectralAnalyzer.extractBands(magnitudes, sampleRate, N);

      expect(bands.midRange).toBeGreaterThan(0.9);
      expect(bands.subBass).toBeLessThan(0.001);
      expect(bands.bass).toBeLessThan(0.001);
    });

    it('isolates brilliance for cymbal sizzle (12000 Hz / Bin 278)', () => {
      // Bin 278: 278 * 44100 / 1024 = 11972 Hz (inside Brilliance: 6000 - 20000 Hz)
      const freq = (278 * sampleRate) / N;
      const signal = new Float32Array(N);
      for (let n = 0; n < N; n++) {
        signal[n] = Math.sin((2 * Math.PI * freq * n) / sampleRate);
      }

      const { real, imag } = fft.forward(signal);
      const magnitudes = fft.getMagnitudes(real, imag);
      const bands = SpectralAnalyzer.extractBands(magnitudes, sampleRate, N);

      expect(bands.brilliance).toBeGreaterThan(0.9);
      expect(bands.subBass).toBeLessThan(0.001);
      expect(bands.bass).toBeLessThan(0.001);
    });

    it('computes Spectral Centroid accurately as perceived brightness center of mass', () => {
      // 430.66 Hz pure tone (Bin 10)
      const freqLow = (10 * sampleRate) / N;
      const signalLow = new Float32Array(N);
      for (let n = 0; n < N; n++) {
        signalLow[n] = Math.sin((2 * Math.PI * freqLow * n) / sampleRate);
      }
      const magLow = fft.getMagnitudes(fft.forward(signalLow).real, fft.forward(signalLow).imag);
      const centroidLow = SpectralAnalyzer.getSpectralCentroid(magLow, sampleRate, N);

      // 4005 Hz pure tone (Bin 93)
      const freqHigh = (93 * sampleRate) / N;
      const signalHigh = new Float32Array(N);
      for (let n = 0; n < N; n++) {
        signalHigh[n] = Math.sin((2 * Math.PI * freqHigh * n) / sampleRate);
      }
      const magHigh = fft.getMagnitudes(fft.forward(signalHigh).real, fft.forward(signalHigh).imag);
      const centroidHigh = SpectralAnalyzer.getSpectralCentroid(magHigh, sampleRate, N);

      expect(centroidLow).toBeCloseTo(freqLow, 1);
      expect(centroidHigh).toBeCloseTo(freqHigh, 1);
      expect(centroidHigh).toBeGreaterThan(centroidLow);
    });

    it('handles zero energy spectrum in centroid calculation without NaN or division-by-zero', () => {
      const zeroMags = new Float32Array(N / 2 + 1);
      const centroid = SpectralAnalyzer.getSpectralCentroid(zeroMags, sampleRate, N);
      expect(centroid).toBe(0);
      expect(isNaN(centroid)).toBe(false);
    });
  });

  describe('Spectral Flux & Real-Time Beat Detection', () => {
    it('computes half-wave rectified spectral flux', () => {
      const prev = new Float32Array([0.2, 0.5, 0.1, 0.8]);
      // Rising energy in bins 0 and 2, falling in bin 3
      const current = new Float32Array([0.6, 0.5, 0.4, 0.2]);

      // Bin 0 diff: 0.6 - 0.2 = 0.4
      // Bin 1 diff: 0.5 - 0.5 = 0.0
      // Bin 2 diff: 0.4 - 0.1 = 0.3
      // Bin 3 diff: 0.2 - 0.8 = -0.6 -> clipped to 0
      const flux = SpectralAnalyzer.computeSpectralFlux(current, prev);
      expect(flux).toBeCloseTo(0.7, 5);
    });

    it('SpectralBeatDetector identifies transient beats while ignoring quiet baseline', () => {
      const detector = new SpectralBeatDetector({
        historySize: 10,
        sensitivityMultiplier: 1.5,
        minThreshold: 0.1,
        minBeatIntervalMs: 100,
      });

      let timestamp = 1000;

      // Feed quiet background ambiance (flux ~ 0.02)
      for (let i = 0; i < 8; i++) {
        const beat = detector.process(0.02, timestamp);
        expect(beat).toBe(false);
        timestamp += 20;
      }

      // Feed a sudden loud kick drum transient (flux = 0.8)
      const kickBeat = detector.process(0.8, timestamp);
      expect(kickBeat).toBe(true);

      // Immediate follow-up frame before minBeatIntervalMs (50ms later) should be suppressed by cooldown
      timestamp += 50;
      const echo = detector.process(0.7, timestamp);
      expect(echo).toBe(false);

      // Next beat after cooldown period (150ms later) should trigger
      timestamp += 100;
      const secondKick = detector.process(0.9, timestamp);
      expect(secondKick).toBe(true);
    });

    it('resets detector state cleanly', () => {
      const detector = new SpectralBeatDetector();
      detector.process(1.5, 1000);
      detector.reset();

      // After reset, process should handle fresh inputs
      const beat = detector.process(0.01, 1050);
      expect(beat).toBe(false);
    });
  });
});
