import { describe, it, expect } from 'vitest';
import {
  ChromaExtractor,
  DynamicTimeWarping,
  CoverSongMatcher,
} from '../../src/lib/dtw';

describe('Dynamic Time Warping (DTW) & 12-Bin Chromagram Audio Engine', () => {
  describe('ChromaExtractor Pitch Class Resolution & Octave Invariance', () => {
    it('maps exact acoustic frequencies to 12-tone equal temperament pitch classes', () => {
      // 440 Hz -> A (class 9)
      expect(ChromaExtractor.frequencyToPitchClass(440)).toBe(9);
      // 261.63 Hz -> C (class 0)
      expect(ChromaExtractor.frequencyToPitchClass(261.63)).toBe(0);
      // 329.63 Hz -> E (class 4)
      expect(ChromaExtractor.frequencyToPitchClass(329.63)).toBe(4);
      // 392.00 Hz -> G (class 7)
      expect(ChromaExtractor.frequencyToPitchClass(392.0)).toBe(7);
    });

    it('exhibits strict octave invariance across octave registers', () => {
      // A1 (55Hz), A2 (110Hz), A3 (220Hz), A4 (440Hz), A5 (880Hz), A6 (1760Hz)
      const aFrequencies = [55, 110, 220, 440, 880, 1760];
      for (const freq of aFrequencies) {
        expect(ChromaExtractor.frequencyToPitchClass(freq)).toBe(9); // All 'A'
      }
    });

    it('computes L2-normalized 12-bin chroma vector from magnitude spectrum', () => {
      // Synthetic magnitude spectrum: FFT size 1024, sample rate 44100 Hz
      // Bin resolution = 44100 / 1024 = 43.066 Hz
      // Place energy at Bin 10 (430.66 Hz ~ A4)
      const magnitudes = new Float32Array(513);
      magnitudes[10] = 5.0; // A4

      const chroma = ChromaExtractor.computeChromaVector(magnitudes, 44100, 1024);
      expect(chroma.length).toBe(12);

      // Pitch class 9 (A) should have near-total energy
      expect(chroma[9]).toBeGreaterThan(0.95);

      // Vector must be L2-normalized: sum(c_i^2) ~ 1.0
      let sumSq = 0;
      for (let i = 0; i < 12; i++) {
        sumSq += chroma[i] * chroma[i];
      }
      expect(sumSq).toBeCloseTo(1.0, 4);
    });

    it('circularly transposes chroma vectors across 12 semitones', () => {
      // Vector with peak at C (class 0)
      const chromaC = new Float32Array(12);
      chromaC[0] = 1.0;

      // Transpose +2 semitones -> D (class 2)
      const chromaD = ChromaExtractor.transposeChroma(chromaC, 2);
      expect(chromaD[2]).toBeCloseTo(1.0, 5);
      expect(chromaD[0]).toBeCloseTo(0.0, 5);

      // Transpose +12 semitones (full octave) -> C (class 0)
      const octaveWrap = ChromaExtractor.transposeChroma(chromaC, 12);
      expect(octaveWrap[0]).toBeCloseTo(1.0, 5);
    });
  });

  describe('Dynamic Time Warping (DTW) Sequence Alignment', () => {
    // Helper to generate a single-pitch 12-bin chroma frame
    const makePitchFrame = (pitchClass: number): Float32Array => {
      const f = new Float32Array(12);
      f[pitchClass] = 1.0;
      return f;
    };

    it('yields zero distance and exact diagonal path when aligning a sequence with itself', () => {
      // Sequence of chords: C -> E -> G -> A
      const seq = [
        makePitchFrame(0),
        makePitchFrame(4),
        makePitchFrame(7),
        makePitchFrame(9),
      ];

      const result = DynamicTimeWarping.align(seq, seq);
      expect(result.totalDistance).toBeCloseTo(0, 5);
      expect(result.normalizedDistance).toBeCloseTo(0, 5);

      // Warping path must be direct diagonal [(0,0), (1,1), (2,2), (3,3)]
      expect(result.warpingPath).toEqual([
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3],
      ]);
    });

    it('accurately warps and aligns time-stretched sequences of different tempos', () => {
      // Performance A (Fast tempo, 4 frames): [C, G, A, F]
      const seqFast = [
        makePitchFrame(0), // C
        makePitchFrame(7), // G
        makePitchFrame(9), // A
        makePitchFrame(5), // F
      ];

      // Performance B (Slow tempo, 8 frames, held twice as long): [C, C, G, G, A, A, F, F]
      const seqSlow = [
        makePitchFrame(0),
        makePitchFrame(0),
        makePitchFrame(7),
        makePitchFrame(7),
        makePitchFrame(9),
        makePitchFrame(9),
        makePitchFrame(5),
        makePitchFrame(5),
      ];

      const result = DynamicTimeWarping.align(seqFast, seqSlow);

      // Distance should be 0 because the harmonic sequence matches perfectly
      expect(result.totalDistance).toBeCloseTo(0, 4);
      expect(result.normalizedDistance).toBeCloseTo(0, 4);
      expect(result.warpingPath.length).toBeGreaterThanOrEqual(8);
    });

    it('evaluates high distance for completely distinct harmonic sequences', () => {
      const seq1 = [makePitchFrame(0), makePitchFrame(2), makePitchFrame(4)]; // C, D, E
      const seq2 = [makePitchFrame(6), makePitchFrame(8), makePitchFrame(10)]; // F#, G#, A#

      const result = DynamicTimeWarping.align(seq1, seq2);
      expect(result.normalizedDistance).toBeGreaterThan(0.7);
    });

    it('respects Sakoe-Chiba constraint window radius', () => {
      const seqA = [makePitchFrame(0), makePitchFrame(1), makePitchFrame(2)];
      const seqB = [makePitchFrame(0), makePitchFrame(1), makePitchFrame(2)];

      const unconstrained = DynamicTimeWarping.align(seqA, seqB);
      const constrained = DynamicTimeWarping.align(seqA, seqB, { sakoeChibaRadius: 1 });

      expect(constrained.totalDistance).toBeCloseTo(unconstrained.totalDistance, 5);
      for (const [i, j] of constrained.warpingPath) {
        expect(Math.abs(i - j)).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('CoverSongMatcher & Transposition Invariant Detection', () => {
    const makeChordFrame = (chord: number[]): Float32Array => {
      const f = new Float32Array(12);
      for (const p of chord) {
        f[p] = 1.0;
      }
      let norm = 0;
      for (let i = 0; i < 12; i++) norm += f[i] * f[i];
      norm = Math.sqrt(norm);
      for (let i = 0; i < 12; i++) f[i] /= norm;
      return f;
    };

    // Standard progression: C (0,4,7) -> G (7,11,2) -> Am (9,0,4) -> F (5,9,0)
    const songStudio = [
      makeChordFrame([0, 4, 7]), // C
      makeChordFrame([7, 11, 2]), // G
      makeChordFrame([9, 0, 4]), // Am
      makeChordFrame([5, 9, 0]), // F
    ];

    it('identifies live concert version with tempo variations as a match', () => {
      // Live version played at variable tempo: [C, C, G, Am, Am, Am, F, F]
      const songLive = [
        makeChordFrame([0, 4, 7]),
        makeChordFrame([0, 4, 7]),
        makeChordFrame([7, 11, 2]),
        makeChordFrame([9, 0, 4]),
        makeChordFrame([9, 0, 4]),
        makeChordFrame([9, 0, 4]),
        makeChordFrame([5, 9, 0]),
        makeChordFrame([5, 9, 0]),
      ];

      const match = CoverSongMatcher.isCoverOrLiveVersion(songStudio, songLive);
      expect(match.isMatch).toBe(true);
      expect(match.confidence).toBeGreaterThan(0.85);
      expect(match.bestTranspositionShift).toBe(0); // Same key
    });

    it('identifies acoustic cover transposed to a different musical key (+2 semitones)', () => {
      // Transposed up by 2 semitones (Key of D):
      // D (2,6,9) -> A (9,1,4) -> Bm (11,2,6) -> G (7,11,2)
      const songCoverInD = ChromaExtractor.transposeSequence(songStudio, 2);

      const match = CoverSongMatcher.isCoverOrLiveVersion(songStudio, songCoverInD, {
        checkTranspositions: true,
      });

      expect(match.isMatch).toBe(true);
      expect(match.confidence).toBeGreaterThan(0.85);
      // Detected shift: 12 - 2 = 10 (or 2 depending on alignment direction)
      // Since songCoverInD is shifted by +2 from studio, shifting cover by +10 wraps to 0 (12)
      expect(match.bestTranspositionShift).toBe(10);
    });

    it('rejects an unrelated song with different harmonic content', () => {
      const unrelatedSong = [
        makeChordFrame([1, 5, 8]), // C#
        makeChordFrame([6, 10, 1]), // F#
        makeChordFrame([3, 7, 10]), // D#
        makeChordFrame([1, 5, 8]),
      ];

      const match = CoverSongMatcher.isCoverOrLiveVersion(songStudio, unrelatedSong);
      // Normalized distance should be well above threshold
      expect(match.normalizedDistance).toBeGreaterThan(0.25);
      expect(match.isMatch).toBe(false);
      expect(match.confidence).toBeLessThan(0.4);
    });
  });
});
