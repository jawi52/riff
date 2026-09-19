/**
 * Equal-Power Audio Crossfade Engine
 *
 * Implements DJ-style seamless transitions between consecutive audio tracks.
 * Uses trigonometric equal-power curve (cos / sin) to guarantee constant acoustic energy
 * and eliminate the -3dB perceptual volume drop inherent in linear crossfading.
 */

export interface CrossfadeGains {
  outgoingGain: number;
  incomingGain: number;
  totalPower: number;
}

/**
 * Calculates equal-power gains for a crossfade at a given progress point [0, 1].
 *
 * Formula:
 * outgoingGain = cos(progress * pi / 2)
 * incomingGain = sin(progress * pi / 2)
 *
 * Notice: outgoingGain^2 + incomingGain^2 === 1.0 at all progress points.
 */
export function calculateEqualPowerGains(progress: number): CrossfadeGains {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const angle = clamped * (Math.PI / 2);
  const outgoingGain = Math.cos(angle);
  const incomingGain = Math.sin(angle);
  const totalPower = outgoingGain * outgoingGain + incomingGain * incomingGain;

  return {
    outgoingGain,
    incomingGain,
    totalPower
  };
}

/**
 * Crossfade controller managing transition triggers, duration constraints,
 * and state progression.
 */
export class CrossfadeController {
  private durationSec: number;
  private isCrossfading = false;

  constructor(durationSec = 4) {
    this.durationSec = Math.max(0, Math.min(12, durationSec));
  }

  public getDuration(): number {
    return this.durationSec;
  }

  public setDuration(seconds: number): void {
    this.durationSec = Math.max(0, Math.min(12, Number.isFinite(seconds) ? seconds : 0));
  }

  public isEnabled(): boolean {
    return this.durationSec > 0;
  }

  public getIsCrossfading(): boolean {
    return this.isCrossfading;
  }

  public setIsCrossfading(active: boolean): void {
    this.isCrossfading = active;
  }

  /**
   * Determines whether a crossfade transition should trigger given the current
   * track playback position and duration.
   */
  public shouldTriggerCrossfade(currentTime: number, duration: number): boolean {
    if (!this.isEnabled() || this.isCrossfading) return false;
    if (!Number.isFinite(duration) || duration <= 0) return false;
    if (!Number.isFinite(currentTime) || currentTime < 0) return false;

    // Minimum track length guard: don't crossfade short snippets
    if (duration < this.durationSec * 2) return false;

    const remaining = duration - currentTime;
    return remaining <= this.durationSec && remaining > 0.2;
  }

  /**
   * Resets active crossfading state.
   */
  public reset(): void {
    this.isCrossfading = false;
  }
}

export const crossfadeController = new CrossfadeController(4);
