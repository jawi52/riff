/**
 * Adaptive Bitrate (ABR) Stream Decision Engine
 *
 * Implements a hybrid BOLA (Buffer Occupancy based Lyapunov Algorithm)
 * and Throughput-Rule decision engine for adaptive audio streaming.
 *
 * Balances:
 * 1. Perceptual Audio Quality Maximization: Logarithmic utility U(m) = ln(bitrate / minBitrate) + 1
 * 2. Buffer Health Protection: Prevents playback stalls when forward buffer depth drops
 * 3. Hysteresis Damping: Prevents flapping and acoustic quality oscillation
 */

export type AudioQualityTier = 'low' | 'medium' | 'high' | 'ultra';
export type ABRMode = 'auto' | AudioQualityTier;

export interface AudioBitrateProfile {
  quality: AudioQualityTier;
  bitrateKbps: number;
  label: string;
  utility: number; // Logarithmic perceptual score
}

export const AUDIO_BITRATE_PROFILES: Record<AudioQualityTier, AudioBitrateProfile> = {
  low: {
    quality: 'low',
    bitrateKbps: 64,
    label: 'Data Saver (64 kbps)',
    utility: 1.0 // ln(64/64) + 1 = 1.0
  },
  medium: {
    quality: 'medium',
    bitrateKbps: 128,
    label: 'Standard (128 kbps)',
    utility: 1.693 // ln(128/64) + 1 = 0.693 + 1
  },
  high: {
    quality: 'high',
    bitrateKbps: 256,
    label: 'High Fidelity (256 kbps)',
    utility: 2.386 // ln(256/64) + 1 = 1.386 + 1
  },
  ultra: {
    quality: 'ultra',
    bitrateKbps: 320,
    label: 'Studio Lossless (320 kbps)',
    utility: 2.609 // ln(320/64) + 1 = 1.609 + 1
  }
};

export const ORDERED_PROFILES: AudioBitrateProfile[] = [
  AUDIO_BITRATE_PROFILES.low,
  AUDIO_BITRATE_PROFILES.medium,
  AUDIO_BITRATE_PROFILES.high,
  AUDIO_BITRATE_PROFILES.ultra
];

export interface ABROptions {
  minBufferSec?: number; // Minimum buffer threshold before emergency downshift (default: 3s)
  maxBufferSec?: number; // Target maximum forward buffer capacity (default: 25s)
  throughputSafetyFactor?: number; // Safe bandwidth multiplier (default: 0.85)
  switchDampingMs?: number; // Minimum cooldown between quality switches (default: 4000ms)
}

export interface StreamSelectionContext {
  bufferDepthSec: number;
  smoothedThroughputKbps?: number;
  isCellular?: boolean;
}

export class ABREngine {
  private mode: ABRMode = 'auto';
  private currentQuality: AudioQualityTier = 'medium';
  private lastSwitchTimestamp = 0;

  private readonly minBufferSec: number;
  private readonly maxBufferSec: number;
  private readonly throughputSafetyFactor: number;
  private readonly switchDampingMs: number;

  constructor(options: ABROptions = {}) {
    this.minBufferSec = options.minBufferSec ?? 3.0;
    this.maxBufferSec = options.maxBufferSec ?? 25.0;
    this.throughputSafetyFactor = options.throughputSafetyFactor ?? 0.85;
    this.switchDampingMs = options.switchDampingMs ?? 4000;
  }

  /**
   * Sets the operating mode: 'auto' for adaptive selection,
   * or a locked quality tier ('low' | 'medium' | 'high' | 'ultra').
   */
  public setMode(mode: ABRMode): void {
    this.mode = mode;
    if (mode !== 'auto') {
      this.currentQuality = mode;
    }
  }

  public getMode(): ABRMode {
    return this.mode;
  }

  public getCurrentQuality(): AudioQualityTier {
    return this.currentQuality;
  }

  public getCurrentProfile(): AudioBitrateProfile {
    return AUDIO_BITRATE_PROFILES[this.currentQuality];
  }

  /**
   * Computes the optimal audio bitrate profile for the next audio chunk / track
   * using hybrid BOLA (Lyapunov optimization) and Throughput safety rules.
   */
  public selectOptimalProfile(context: StreamSelectionContext): AudioBitrateProfile {
    // If manual override is active, return manual tier immediately
    if (this.mode !== 'auto') {
      return AUDIO_BITRATE_PROFILES[this.mode];
    }

    const { bufferDepthSec, smoothedThroughputKbps = 1000, isCellular = false } = context;
    const now = Date.now();

    // 1. Emergency Stall Prevention Rule:
    // If forward buffer is critically depleted (< minBufferSec), immediately drop to LOW
    if (bufferDepthSec < this.minBufferSec) {
      this.currentQuality = 'low';
      this.lastSwitchTimestamp = now;
      return AUDIO_BITRATE_PROFILES.low;
    }

    // 2. Cellular Data Saver Guard:
    // When on cellular with moderate buffer, clamp maximum bitrate to HIGH (prevent excessive data use)
    const availableProfiles = isCellular
      ? ORDERED_PROFILES.filter((p) => p.quality !== 'ultra')
      : ORDERED_PROFILES;

    // 3. Throughput Safety Filter:
    // Only consider bitrates that comfortably fit within available smoothed bandwidth
    const safeThroughput = smoothedThroughputKbps * this.throughputSafetyFactor;
    const eligibleProfiles = availableProfiles.filter((p) => p.bitrateKbps <= safeThroughput);

    const candidatePool = eligibleProfiles.length > 0 ? eligibleProfiles : [AUDIO_BITRATE_PROFILES.low];

    // 4. BOLA (Buffer Occupancy based Lyapunov Algorithm) Utility Formulation:
    // Utility increases monotonically with bitrate: U(m).
    // Buffer deficit factor penalizes higher bitrates when forward buffer depth drops towards minBufferSec:
    // score = utility - (beta * (bitrate / throughput) * bufferDeficit)
    const bufferSpan = Math.max(1, this.maxBufferSec - this.minBufferSec);
    const bufferDeficit = Math.max(0, Math.min(1.0, (this.maxBufferSec - bufferDepthSec) / bufferSpan));
    const effectiveThroughput = Math.max(1, smoothedThroughputKbps);

    let bestScore = -Infinity;
    let selectedProfile = candidatePool[0];

    for (const profile of candidatePool) {
      const utility = profile.utility;
      const bandwidthRatio = profile.bitrateKbps / effectiveThroughput;
      const penalty = 3.0 * bandwidthRatio * bufferDeficit;
      const score = utility - penalty;

      if (score > bestScore) {
        bestScore = score;
        selectedProfile = profile;
      }
    }

    // 5. Hysteresis Damping:
    // Avoid switching quality back and forth rapidly unless cooldown has expired
    // or the buffer health mandates an upgrade/downgrade
    if (selectedProfile.quality !== this.currentQuality) {
      const elapsedSinceSwitch = now - this.lastSwitchTimestamp;
      const isDowngrade = selectedProfile.bitrateKbps < AUDIO_BITRATE_PROFILES[this.currentQuality].bitrateKbps;

      // Allow immediate downgrade if buffer is dropping below 50% of max
      if (isDowngrade && bufferDepthSec < this.maxBufferSec * 0.4) {
        this.currentQuality = selectedProfile.quality;
        this.lastSwitchTimestamp = now;
      } else if (elapsedSinceSwitch >= this.switchDampingMs) {
        this.currentQuality = selectedProfile.quality;
        this.lastSwitchTimestamp = now;
      }
    }

    return AUDIO_BITRATE_PROFILES[this.currentQuality];
  }

  /**
   * Resets internal switch timestamps and reverts to standard baseline.
   */
  public reset(): void {
    this.currentQuality = 'medium';
    this.lastSwitchTimestamp = 0;
  }
}

// Global Singleton ABR Engine
export const abrEngine = new ABREngine();
