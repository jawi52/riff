import { Track } from '../types';

export class RiffAudioEngine {
  private static instance: RiffAudioEngine;
  private audio: HTMLAudioElement;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private isDspConnected = false;

  private readonly EQ_FREQUENCIES = [60, 250, 1000, 4000, 14000];

  private constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.autoplay = false;
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

        lastNode.connect(this.gainNode);
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
    this.initWebAudio();

    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch {}
    }

    if (this.audio.src !== streamUrl) {
      this.audio.src = streamUrl;
      this.audio.load();
    }

    try {
      await this.audio.play();
    } catch (err: any) {
      console.warn('Playback play() call:', err.message);
      // Retry on user interaction
      throw err;
    }
  }

  public pause(): void {
    this.audio.pause();
  }

  public async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch {}
    }
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
    if (this.gainNode) {
      try {
        this.gainNode.gain.value = clamped;
      } catch {}
    }
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
      // Return simulated subtle frequency waves if analyser node is detached
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

  public syncMediaSession(track: Track, onNext?: () => void, onPrev?: () => void): void {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album || 'Riff Music',
      artwork: [
        { src: track.coverUrl || '/favicon.svg', sizes: '512x512', type: 'image/png' }
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => this.resume());
    navigator.mediaSession.setActionHandler('pause', () => this.pause());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) this.seek(details.seekTime);
    });
    if (onNext) navigator.mediaSession.setActionHandler('nexttrack', onNext);
    if (onPrev) navigator.mediaSession.setActionHandler('previoustrack', onPrev);
  }

  public getAudioElement(): HTMLAudioElement {
    return this.audio;
  }
}

export const audioEngine = RiffAudioEngine.getInstance();
