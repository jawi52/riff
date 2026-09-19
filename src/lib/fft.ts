/**
 * Cooley-Tukey Radix-2 Fast Fourier Transform (FFT) & Spectral Audio Analyzer
 *
 * Implements O(N log N) Decimation-In-Time (DIT) FFT with:
 * - In-place bit-reversal permutations.
 * - Pre-computed trigonometric twiddle factor tables.
 * - Hann windowing for spectral leakage suppression.
 * - Forward & Inverse FFT (IFFT) transformations.
 * - Perceptual frequency band energy decomposition (Sub-bass, Bass, Mids, Highs).
 * - Spectral Centroid (timbral brightness center of mass).
 * - Spectral Flux & Adaptive Dynamic Thresholding for real-time beat/onset detection.
 */

export interface SpectralBands {
  subBass: number;     // 20 Hz - 60 Hz (rumbles, deep sub kicks)
  bass: number;        // 60 Hz - 250 Hz (bass guitars, punchy kicks)
  lowMids: number;     // 250 Hz - 500 Hz (warmth, brass, woodwinds)
  midRange: number;    // 500 Hz - 2000 Hz (vocals, guitars, main synth leads)
  highMids: number;    // 2000 Hz - 6000 Hz (presence, vocal transients, percussion attack)
  brilliance: number;  // 6000 Hz - 20000 Hz (air, sparkle, cymbals, harmonic sizzle)
  totalEnergy: number; // Aggregate sum of all frequency bins
}

export interface ComplexSpectrum {
  real: Float32Array;
  imag: Float32Array;
}

export class CooleyTukeyFFT {
  public readonly size: number;
  private readonly numBits: number;
  private readonly bitReversalTable: Uint32Array;
  private readonly cosTable: Float32Array;
  private readonly sinTable: Float32Array;
  private readonly hannWindow: Float32Array;

  constructor(size: number) {
    if (size < 2 || (size & (size - 1)) !== 0) {
      throw new Error(`FFT size must be a positive power of 2, received: ${size}`);
    }

    this.size = size;
    this.numBits = Math.round(Math.log2(size));

    // 1. Precompute Bit-Reversal Table
    this.bitReversalTable = new Uint32Array(size);
    for (let i = 0; i < size; i++) {
      let rev = 0;
      let val = i;
      for (let b = 0; b < this.numBits; b++) {
        rev = (rev << 1) | (val & 1);
        val >>= 1;
      }
      this.bitReversalTable[i] = rev;
    }

    // 2. Precompute Twiddle Factors (W_N^k = e^(-j * 2 * pi * k / N))
    const halfSize = size >> 1;
    this.cosTable = new Float32Array(halfSize);
    this.sinTable = new Float32Array(halfSize);
    const angleStep = (2 * Math.PI) / size;
    for (let k = 0; k < halfSize; k++) {
      this.cosTable[k] = Math.cos(angleStep * k);
      this.sinTable[k] = Math.sin(angleStep * k);
    }

    // 3. Precompute Hann Window: w[n] = 0.5 * (1 - cos(2 * pi * n / (N - 1)))
    this.hannWindow = new Float32Array(size);
    const denom = size - 1;
    for (let n = 0; n < size; n++) {
      this.hannWindow[n] = 0.5 * (1 - Math.cos((2 * Math.PI * n) / denom));
    }
  }

  /**
   * Applies Hann window in-place or returns windowed Float32Array to suppress spectral leakage.
   */
  public applyHannWindow(samples: Float32Array): Float32Array {
    const len = Math.min(samples.length, this.size);
    const windowed = new Float32Array(this.size);
    for (let i = 0; i < len; i++) {
      windowed[i] = samples[i] * this.hannWindow[i];
    }
    return windowed;
  }

  /**
   * Radix-2 Decimation-In-Time (DIT) Forward Fast Fourier Transform:
   * Time Domain -> Frequency Domain
   * X[k] = sum_{n=0}^{N-1} x[n] * e^(-j * 2 * pi * k * n / N)
   */
  public forward(input: Float32Array): ComplexSpectrum {
    const N = this.size;
    const real = new Float32Array(N);
    const imag = new Float32Array(N);

    // Bit-reversal permutation step
    const inputLen = input.length;
    for (let i = 0; i < N; i++) {
      const rev = this.bitReversalTable[i];
      real[rev] = i < inputLen ? input[i] : 0;
      imag[rev] = 0;
    }

    // Cooley-Tukey Butterfly Stages
    for (let stage = 1; stage <= this.numBits; stage++) {
      const subDftSize = 1 << stage;         // 2, 4, 8, ..., N
      const halfDftSize = subDftSize >> 1;    // 1, 2, 4, ..., N/2
      const twiddleStep = N / subDftSize;

      for (let k = 0; k < N; k += subDftSize) {
        for (let j = 0; j < halfDftSize; j++) {
          const twiddleIdx = j * twiddleStep;
          const c = this.cosTable[twiddleIdx];
          const s = this.sinTable[twiddleIdx];

          const u = k + j;
          const v = k + j + halfDftSize;

          const rV = real[v];
          const iV = imag[v];

          // Complex multiplication: (c - j*s) * (rV + j*iV) = (c*rV + s*iV) + j*(c*iV - s*rV)
          const tReal = c * rV + s * iV;
          const tImag = c * iV - s * rV;

          const rU = real[u];
          const iU = imag[u];

          real[u] = rU + tReal;
          imag[u] = iU + tImag;

          real[v] = rU - tReal;
          imag[v] = iU - tImag;
        }
      }
    }

    return { real, imag };
  }

  /**
   * Inverse Fast Fourier Transform (IFFT):
   * Frequency Domain -> Time Domain
   * Uses the algebraic property: IFFT(X) = (1/N) * conj(FFT(conj(X)))
   */
  public inverse(real: Float32Array, imag: Float32Array): Float32Array {
    const N = this.size;
    const conjReal = new Float32Array(N);
    const conjImag = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      conjReal[i] = real[i];
      conjImag[i] = -imag[i]; // Conjugate
    }

    // Forward FFT of conjugated spectrum
    // We execute standard forward step using conjReal
    // To handle arbitrary complex input in forward, we pass input array and manually init imag
    const outReal = new Float32Array(N);
    const outImag = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      const rev = this.bitReversalTable[i];
      outReal[rev] = conjReal[i];
      outImag[rev] = conjImag[i];
    }

    for (let stage = 1; stage <= this.numBits; stage++) {
      const subDftSize = 1 << stage;
      const halfDftSize = subDftSize >> 1;
      const twiddleStep = N / subDftSize;

      for (let k = 0; k < N; k += subDftSize) {
        for (let j = 0; j < halfDftSize; j++) {
          const twiddleIdx = j * twiddleStep;
          const c = this.cosTable[twiddleIdx];
          const s = this.sinTable[twiddleIdx];

          const u = k + j;
          const v = k + j + halfDftSize;

          const rV = outReal[v];
          const iV = outImag[v];

          const tReal = c * rV + s * iV;
          const tImag = c * iV - s * rV;

          const rU = outReal[u];
          const iU = outImag[u];

          outReal[u] = rU + tReal;
          outImag[u] = iU + tImag;

          outReal[v] = rU - tReal;
          outImag[v] = iU - tImag;
        }
      }
    }

    // Conjugate result and scale by 1 / N
    const reconstructed = new Float32Array(N);
    const invN = 1 / N;
    for (let i = 0; i < N; i++) {
      reconstructed[i] = outReal[i] * invN;
    }

    return reconstructed;
  }

  /**
   * Computes magnitude spectrum |X[k]| up to the Nyquist frequency bin (N/2 + 1).
   * Magnitudes are scaled by 2/N (with DC and Nyquist scaled by 1/N) to represent true peak amplitudes.
   */
  public getMagnitudes(real: Float32Array, imag: Float32Array): Float32Array {
    const half = (this.size >> 1) + 1;
    const magnitudes = new Float32Array(half);
    const scale = 2 / this.size;

    for (let k = 0; k < half; k++) {
      const mag = Math.sqrt(real[k] * real[k] + imag[k] * imag[k]);
      // DC (k = 0) and Nyquist (k = size/2) have weight 1/N
      magnitudes[k] = (k === 0 || k === half - 1) ? mag / this.size : mag * scale;
    }

    return magnitudes;
  }

  /**
   * Computes power spectral density (PSD): P[k] = |X[k]|^2
   */
  public getPowerSpectrum(magnitudes: Float32Array): Float32Array {
    const power = new Float32Array(magnitudes.length);
    for (let i = 0; i < magnitudes.length; i++) {
      power[i] = magnitudes[i] * magnitudes[i];
    }
    return power;
  }
}

/**
 * High-Precision Spectral Audio Feature Extractor
 */
export class SpectralAnalyzer {
  /**
   * Partitions the magnitude spectrum into standard perceptual frequency bands:
   * Sub-bass (20-60 Hz), Bass (60-250 Hz), Low Mids (250-500 Hz),
   * Midrange (500-2000 Hz), High Mids (2000-6000 Hz), Brilliance (6000-20000 Hz).
   */
  public static extractBands(
    magnitudes: Float32Array,
    sampleRate = 44100,
    fftSize?: number
  ): SpectralBands {
    const actualFftSize = fftSize || (magnitudes.length - 1) * 2;
    const binResolution = sampleRate / actualFftSize;

    const bands: SpectralBands = {
      subBass: 0,
      bass: 0,
      lowMids: 0,
      midRange: 0,
      highMids: 0,
      brilliance: 0,
      totalEnergy: 0,
    };

    let totalEnergy = 0;
    for (let k = 0; k < magnitudes.length; k++) {
      const mag = magnitudes[k];
      totalEnergy += mag;
      const freq = k * binResolution;

      if (freq >= 20 && freq < 60) {
        bands.subBass += mag;
      } else if (freq >= 60 && freq < 250) {
        bands.bass += mag;
      } else if (freq >= 250 && freq < 500) {
        bands.lowMids += mag;
      } else if (freq >= 500 && freq < 2000) {
        bands.midRange += mag;
      } else if (freq >= 2000 && freq < 6000) {
        bands.highMids += mag;
      } else if (freq >= 6000 && freq <= 20000) {
        bands.brilliance += mag;
      }
    }

    bands.totalEnergy = totalEnergy;
    return bands;
  }

  /**
   * Computes the Spectral Centroid (perceived brightness) in Hertz:
   * Centroid = sum(freq_k * mag_k) / sum(mag_k)
   */
  public static getSpectralCentroid(
    magnitudes: Float32Array,
    sampleRate = 44100,
    fftSize?: number
  ): number {
    const actualFftSize = fftSize || (magnitudes.length - 1) * 2;
    const binResolution = sampleRate / actualFftSize;

    let weightedSum = 0;
    let totalMagnitude = 0;

    for (let k = 0; k < magnitudes.length; k++) {
      const mag = magnitudes[k];
      const freq = k * binResolution;
      weightedSum += freq * mag;
      totalMagnitude += mag;
    }

    return totalMagnitude > 0 ? weightedSum / totalMagnitude : 0;
  }

  /**
   * Computes Spectral Flux between two consecutive frames using half-wave rectification:
   * Flux = sum(max(0, |X_t[k]| - |X_{t-1}[k]|))
   * Captures sudden onset transients (drum kicks, guitar plucks) while ignoring decay.
   */
  public static computeSpectralFlux(
    currentMag: Float32Array,
    prevMag: Float32Array
  ): number {
    const len = Math.min(currentMag.length, prevMag.length);
    let flux = 0;

    for (let k = 0; k < len; k++) {
      const diff = currentMag[k] - prevMag[k];
      if (diff > 0) {
        flux += diff;
      }
    }

    return flux;
  }
}

/**
 * Adaptive Real-Time Rhythmic Beat & Transient Detector
 * Uses a rolling history buffer of spectral flux observations with dynamic thresholding.
 */
export class SpectralBeatDetector {
  private readonly historySize: number;
  private readonly history: Float32Array;
  private historyIndex = 0;
  private count = 0;
  private readonly sensitivityMultiplier: number;
  private readonly minThreshold: number;
  private lastBeatTime = 0;
  private readonly minBeatIntervalMs: number;

  constructor(options: {
    historySize?: number;
    sensitivityMultiplier?: number;
    minThreshold?: number;
    minBeatIntervalMs?: number;
  } = {}) {
    this.historySize = options.historySize ?? 32;
    this.history = new Float32Array(this.historySize);
    this.sensitivityMultiplier = options.sensitivityMultiplier ?? 1.4;
    this.minThreshold = options.minThreshold ?? 0.05;
    this.minBeatIntervalMs = options.minBeatIntervalMs ?? 150; // Max ~400 BPM to avoid flutter
  }

  /**
   * Analyzes an incoming frame's spectral flux or energy value.
   * Returns true if a rhythmic beat / onset is detected.
   */
  public process(flux: number, timestampMs = Date.now()): boolean {
    // 1. Calculate running average of recent history
    let sum = 0;
    const validCount = Math.min(this.count, this.historySize);
    for (let i = 0; i < validCount; i++) {
      sum += this.history[i];
    }
    const mean = validCount > 0 ? sum / validCount : 0;

    // 2. Dynamic threshold = max(minThreshold, sensitivity * mean)
    const threshold = Math.max(this.minThreshold, mean * this.sensitivityMultiplier);

    // 3. Check for beat condition with cooldown interval
    const isOverThreshold = flux > threshold;
    const timeSinceLastBeat = timestampMs - this.lastBeatTime;
    const isBeatDetected = isOverThreshold && timeSinceLastBeat >= this.minBeatIntervalMs;

    if (isBeatDetected) {
      this.lastBeatTime = timestampMs;
    }

    // 4. Update rolling history
    this.history[this.historyIndex] = flux;
    this.historyIndex = (this.historyIndex + 1) % this.historySize;
    this.count++;

    return isBeatDetected;
  }

  public reset(): void {
    this.history.fill(0);
    this.historyIndex = 0;
    this.count = 0;
    this.lastBeatTime = 0;
  }
}
