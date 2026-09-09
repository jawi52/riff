import { Track } from '../types';

export class RiffAudioEngine {
  private static instance: RiffAudioEngine;
  private audio: HTMLAudioElement;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private isDspConnected = false;
  public isMono = false;

  private readonly EQ_FREQUENCIES = [60, 250, 1000, 4000, 14000];

  private constructor() {
    if (typeof Audio !== 'undefined') {
      this.audio = new Audio();
      this.audio.preload = 'auto';
      this.audio.autoplay = false;
    } else {
      this.audio = {
        play: async () => {},
        pause: () => {},
        load: () => {},
        currentTime: 0,
        duration: 0,
        volume: 1,
        src: ''
      } as unknown as HTMLAudioElement;
    }
  }

  public static getInstance(): RiffAudioEngine {
    if (!RiffAudioEngine.instance) {
      RiffAudioEngine.instance = new RiffAudioEngine();
    }
    return RiffAudioEngine.instance;
  }

  public initWebAudio(): void {
    if (this.isDspConnected) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      this.gainNode = this.audioContext.createGain();
      this.compressorNode = this.audioContext.createDynamicsCompressor();
      
      // Default -14 LUFS standard compressor settings
      this.compressorNode.threshold.value = -14;
      this.compressorNode.knee.value = 12;
      this.compressorNode.ratio.value = 4;
      this.compressorNode.attack.value = 0.003;
      this.compressorNode.release.value = 0.25;

      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 128;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Safe MediaElementAudioSource connection
      try {
        this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
        
        let lastNode: AudioNode = this.sourceNode;
        this.eqFilters = this.EQ_FREQUENCIES.map((freq, index) => {
          const filter = this.audioContext!.createBiquadFilter();
          if (index === 0) {
            filter.type = 'lowshelf';
          } else if (index === this.EQ_FREQUENCIES.length - 1) {
            filter.type = 'highshelf';
          } else {
            filter.type = 'peaking';
            filter.Q.value = 1.0;
          }
          filter.frequency.value = freq;
          filter.gain.value = 0;

          lastNode.connect(filter);
          lastNode = filter;
          return filter;
        });

        lastNode.connect(this.compressorNode);
        this.compressorNode.connect(this.gainNode);
        this.gainNode.connect(this.analyserNode);
        this.analyserNode.connect(this.audioContext.destination);

        this.isDspConnected = true;
      } catch (err) {
        console.warn('Web Audio source connection bypassed (direct audio playback active):', err);
      }
    } catch (e) {
      console.warn('AudioContext init:', e);
    }
  }

  public async playTrack(streamUrl: string): Promise<void> {
    if (!streamUrl) {
      throw new Error('No stream URL provided');
    }

    if (this.audio.src !== streamUrl) {
      this.audio.src = streamUrl;
      this.audio.load();
    }

    try {
      await this.audio.play();
    } catch (err: any) {
      console.warn('Playback play() call failed:', err.message);
      throw err;
    }
  }

  public pause(): void {
    this.audio.pause();
  }

  public async resume(): Promise<void> {
    return this.audio.play();
  }

  public seek(seconds: number): void {
    if (Number.isFinite(seconds)) {
      this.audio.currentTime = seconds;
    }
  }

  public setVolume(val: number): void {
    const clamped = Math.max(0, Math.min(1, val));
    this.audio.volume = clamped;
    if (this.gainNode && this.audioContext) {
      try {
        this.gainNode.gain.setValueAtTime(clamped, this.audioContext.currentTime);
      } catch {}
    }
  }

  public fadeVolume(targetVolume: number, durationSec: number): void {
    if (!this.gainNode || !this.audioContext) {
      this.setVolume(targetVolume);
      return;
    }
    try {
      const now = this.audioContext.currentTime;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
      this.gainNode.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, targetVolume)), now + durationSec);
    } catch {
      this.setVolume(targetVolume);
    }
  }

  public setLoudnessNormalization(enabled: boolean, preset: 'normal' | 'quiet' | 'loud' = 'normal'): void {
    if (!this.compressorNode || !this.audioContext) return;
    try {
      if (!enabled) {
        this.compressorNode.threshold.value = 0;
        this.compressorNode.ratio.value = 1;
        return;
      }
      const thresholds = {
        quiet: -19,
        normal: -14,
        loud: -11
      };
      this.compressorNode.threshold.value = thresholds[preset] || -14;
      this.compressorNode.ratio.value = preset === 'loud' ? 5 : 3.5;
    } catch {}
  }

  public setMonoAudio(enabled: boolean): void {
    this.isMono = enabled;
  }

  public setEQGains(gains: number[]): void {
    this.eqFilters.forEach((filter, i) => {
      if (gains[i] !== undefined) {
        filter.gain.value = gains[i];
      }
    });
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyserNode) {
      const simulated = new Uint8Array(64);
      if (!this.audio.paused) {
        const time = Date.now() / 150;
        for (let i = 0; i < 64; i++) {
          simulated[i] = Math.floor(Math.abs(Math.sin(time + i * 0.2)) * 180 + 40);
        }
      }
      return simulated;
    }

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  public syncMediaSession(
    track: Track, 
    onNext?: () => void, 
    onPrev?: () => void,
    onPlay?: () => void,
    onPause?: () => void
  ): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    const cover = track.coverUrl || '/favicon.svg';

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album || 'Riff - High Fidelity Master',
      artwork: [
        { src: cover, sizes: '96x96', type: 'image/png' },
        { src: cover, sizes: '128x128', type: 'image/png' },
        { src: cover, sizes: '192x192', type: 'image/png' },
        { src: cover, sizes: '256x256', type: 'image/png' },
        { src: cover, sizes: '384x384', type: 'image/png' },
        { src: cover, sizes: '512x512', type: 'image/png' }
      ]
    });

    navigator.mediaSession.playbackState = 'playing';

    // Play/Pause
    navigator.mediaSession.setActionHandler('play', () => {
      this.resume();
      if (onPlay) onPlay();
      navigator.mediaSession.playbackState = 'playing';
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      this.pause();
      if (onPause) onPause();
      navigator.mediaSession.playbackState = 'paused';
    });

    // Seek scrub bar on lockscreen
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined && Number.isFinite(details.seekTime)) {
        this.seek(details.seekTime);
        this.updatePositionState();
      }
    });

    // Skip backward 10s
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const skipTime = details.seekOffset || 10;
      this.seek(Math.max(0, this.audio.currentTime - skipTime));
      this.updatePositionState();
    });

    // Skip forward 10s
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const skipTime = details.seekOffset || 10;
      this.seek(Math.min(this.audio.duration || 0, this.audio.currentTime + skipTime));
      this.updatePositionState();
    });

    // Next / Prev track
    if (onNext) {
      navigator.mediaSession.setActionHandler('nexttrack', onNext);
    }
    if (onPrev) {
      navigator.mediaSession.setActionHandler('previoustrack', onPrev);
    }

    this.updatePositionState();
  }

  public setMediaPlaybackState(state: 'playing' | 'paused' | 'none'): void {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = state;
    }
  }

  public updatePositionState(): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    if (!('setPositionState' in navigator.mediaSession)) return;

    try {
      const duration = this.audio.duration;
      const position = this.audio.currentTime;
      if (Number.isFinite(duration) && duration > 0 && Number.isFinite(position) && position >= 0) {
        navigator.mediaSession.setPositionState({
          duration: Math.max(duration, position),
          playbackRate: this.audio.playbackRate || 1.0,
          position: Math.min(position, duration)
        });
      }
    } catch {}
  }

  public getAudioElement(): HTMLAudioElement {
    return this.audio;
  }
}

export const audioEngine = RiffAudioEngine.getInstance();
