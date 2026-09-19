/**
 * Dynamic Time Warping (DTW) & 12-Bin Chromagram Audio Alignment Engine
 *
 * Implements:
 * - 12-semitone pitch class Chromagram extraction (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
 *   from audio FFT magnitude frames with octave invariance.
 * - Dynamic Time Warping (DTW) with Sakoe-Chiba constraint band pruning.
 * - Non-linear temporal alignment of audio performances across tempo and duration variances.
 * - Circular transposition search (12-semitone shift) for key-invariant cover song detection.
 */

export interface DTWResult {
  totalDistance: number;
  normalizedDistance: number;
  warpingPath: Array<[number, number]>;
}

export interface CoverMatchResult {
  isMatch: boolean;
  confidence: number; // 0.0 to 1.0
  bestTranspositionShift: number; // 0 to 11 semitones
  normalizedDistance: number;
  warpingPath: Array<[number, number]>;
}

export class ChromaExtractor {
  public static readonly PITCH_CLASSES = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
  ];

  /**
   * Maps a frequency in Hz to its nearest 12-tone equal temperament pitch class (0 = C, 9 = A).
   */
  public static frequencyToPitchClass(freq: number): number {
    if (freq <= 0) return 0;
    // MIDI note: m = 69 + 12 * log2(freq / 440)
    // Pitch class: p = round(m) mod 12
    const midi = 69 + 12 * Math.log2(freq / 440);
    const rounded = Math.round(midi);
    return ((rounded % 12) + 12) % 12;
  }

  /**
   * Projects an FFT magnitude spectrum into an octave-invariant 12-bin chroma vector.
   */
  public static computeChromaVector(
    magnitudes: Float32Array,
    sampleRate = 44100,
    fftSize = 1024
  ): Float32Array {
    const chroma = new Float32Array(12);
    const binResolution = sampleRate / fftSize;

    // Musically relevant harmonic range: ~27.5 Hz (A0) to ~5000 Hz (D#8)
    const minBin = Math.max(1, Math.floor(27.5 / binResolution));
    const maxBin = Math.min(magnitudes.length - 1, Math.floor(5000 / binResolution));

    for (let k = minBin; k <= maxBin; k++) {
      const mag = magnitudes[k];
      if (mag <= 0) continue;

      const freq = k * binResolution;
      const pitchClass = this.frequencyToPitchClass(freq);
      chroma[pitchClass] += mag;
    }

    // L2 Vector Normalization for energy and volume invariance
    let sumSquares = 0;
    for (let i = 0; i < 12; i++) {
      sumSquares += chroma[i] * chroma[i];
    }

    const norm = Math.sqrt(sumSquares);
    if (norm > 0) {
      const invNorm = 1 / norm;
      for (let i = 0; i < 12; i++) {
        chroma[i] *= invNorm;
      }
    }

    return chroma;
  }

  /**
   * Circularly shifts a chroma vector by a number of semitones (for musical key transposition).
   */
  public static transposeChroma(chroma: Float32Array, semitones: number): Float32Array {
    const shifted = new Float32Array(12);
    const shift = ((semitones % 12) + 12) % 12;
    for (let i = 0; i < 12; i++) {
      shifted[(i + shift) % 12] = chroma[i];
    }
    return shifted;
  }

  /**
   * Transposes an entire sequence of chroma frames by semitones.
   */
  public static transposeSequence(sequence: Float32Array[], semitones: number): Float32Array[] {
    if (semitones === 0) return sequence;
    return sequence.map((frame) => this.transposeChroma(frame, semitones));
  }
}

export class DynamicTimeWarping {
  /**
   * Computes Cosine Distance between two normalized 12-dimensional vectors (in range [0, 2]).
   */
  public static cosineDistance(a: Float32Array, b: Float32Array): number {
    let dot = 0;
    for (let i = 0; i < 12; i++) {
      dot += a[i] * b[i];
    }
    // Clamped dot product [-1.0, 1.0]
    const clampedDot = Math.max(-1.0, Math.min(1.0, dot));
    return 1.0 - clampedDot;
  }

  /**
   * Computes Euclidean Distance between two feature vectors.
   */
  public static euclideanDistance(a: Float32Array, b: Float32Array): number {
    let sumSq = 0;
    for (let i = 0; i < 12; i++) {
      const diff = a[i] - b[i];
      sumSq += diff * diff;
    }
    return Math.sqrt(sumSq);
  }

  /**
   * Aligns two sequences using Dynamic Time Warping with optional Sakoe-Chiba band pruning.
   */
  public static align(
    seqA: Float32Array[],
    seqB: Float32Array[],
    options: {
      sakoeChibaRadius?: number;
      distanceFn?: (a: Float32Array, b: Float32Array) => number;
    } = {}
  ): DTWResult {
    const N = seqA.length;
    const M = seqB.length;

    if (N === 0 || M === 0) {
      return { totalDistance: 0, normalizedDistance: 0, warpingPath: [] };
    }

    const distFn = options.distanceFn || this.cosineDistance;
    const radius = options.sakoeChibaRadius;

    // Allocate (N+1) x (M+1) DP cumulative cost matrix
    const dp = new Float64Array((N + 1) * (M + 1));
    dp.fill(Infinity);

    const getIdx = (i: number, j: number) => i * (M + 1) + j;
    dp[getIdx(0, 0)] = 0;

    for (let i = 1; i <= N; i++) {
      const frameA = seqA[i - 1];

      for (let j = 1; j <= M; j++) {
        // Sakoe-Chiba constraint window check
        if (radius !== undefined) {
          const expectedJ = Math.round((i / N) * M);
          if (Math.abs(j - expectedJ) > radius) {
            continue;
          }
        }

        const localCost = distFn(frameA, seqB[j - 1]);

        const costDiag = dp[getIdx(i - 1, j - 1)];
        const costLeft = dp[getIdx(i, j - 1)];
        const costUp = dp[getIdx(i - 1, j)];

        dp[getIdx(i, j)] = localCost + Math.min(costDiag, costLeft, costUp);
      }
    }

    const totalDistance = dp[getIdx(N, M)];

    // Backtrack to extract optimal warping path
    const path: Array<[number, number]> = [];
    let currI = N;
    let currJ = M;

    while (currI > 0 || currJ > 0) {
      path.push([currI - 1, currJ - 1]);

      if (currI === 0) {
        currJ--;
      } else if (currJ === 0) {
        currI--;
      } else {
        const diag = dp[getIdx(currI - 1, currJ - 1)];
        const left = dp[getIdx(currI, currJ - 1)];
        const up = dp[getIdx(currI - 1, currI > 0 ? currJ : 0)]; // safe up

        const minVal = Math.min(diag, left, up);
        if (minVal === diag) {
          currI--;
          currJ--;
        } else if (minVal === left) {
          currJ--;
        } else {
          currI--;
        }
      }
    }

    path.reverse();
    const normalizedDistance = path.length > 0 ? totalDistance / path.length : 0;

    return {
      totalDistance,
      normalizedDistance,
      warpingPath: path,
    };
  }
}

/**
 * Cover Song & Audio Performance Matching Subsystem
 */
export class CoverSongMatcher {
  /**
   * Compares two audio performances and checks whether they are covers or live renditions
   * of the same song across tempo variances and 12-key transpositions.
   */
  public static isCoverOrLiveVersion(
    chromaA: Float32Array[],
    chromaB: Float32Array[],
    options: {
      threshold?: number;
      checkTranspositions?: boolean;
      sakoeChibaRadius?: number;
    } = {}
  ): CoverMatchResult {
    const threshold = options.threshold ?? 0.20;
    const checkTrans = options.checkTranspositions ?? true;
    const radius = options.sakoeChibaRadius;

    let bestDistance = Infinity;
    let bestShift = 0;
    let bestResult: DTWResult | null = null;

    const maxShift = checkTrans ? 11 : 0;

    for (let shift = 0; shift <= maxShift; shift++) {
      const shiftedB = shift === 0 ? chromaB : ChromaExtractor.transposeSequence(chromaB, shift);
      const res = DynamicTimeWarping.align(chromaA, shiftedB, { sakoeChibaRadius: radius });

      if (res.normalizedDistance < bestDistance) {
        bestDistance = res.normalizedDistance;
        bestShift = shift;
        bestResult = res;
      }
    }

    const isMatch = bestDistance <= threshold;
    const confidence = Math.max(0, Math.min(1, 1 - bestDistance / (threshold * 1.5)));

    return {
      isMatch,
      confidence: Number(confidence.toFixed(3)),
      bestTranspositionShift: bestShift,
      normalizedDistance: bestDistance,
      warpingPath: bestResult?.warpingPath || [],
    };
  }
}
