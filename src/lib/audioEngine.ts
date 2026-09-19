import { Track } from '../types';
import { calculateEqualPowerGains, crossfadeController } from './crossfade';

export class RiffAudioEngine {
  private static instance: RiffAudioEngine;
  private audioA: HTMLAudioElement;
  private audioB: HTMLAudioElement;
  private activeDeckId: 'A' | 'B' = 'A';
  private audioProxy: HTMLAudioElement;

  private audioContext: AudioContext | null = null;
  private sourceNodeA: MediaElementAudioSourceNode | null = null;
  private sourceNodeB: MediaElementAudioSourceNode | null = null;
  private deckGainA: GainNode | null = null;
  private deckGainB: GainNode | null = null;
  private gainNode: GainNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private isDspConnected = false;
  public isMono = false;
  private masterVolume = 0.85;

  private isCrossfading = false;
  private crossfadeTimer: any = null;
  private crossfadeInterval: any = null;

  private readonly EQ_FREQUENCIES = [60, 250, 1000, 4000, 14000];

  private constructor() {
    this.audioA = this.createAudioElement();
    this.audioB = this.createAudioElement();

    const eventHandlers: Record<string, any> = {};

    const attachDeckEvents = (deck: HTMLAudioElement, deckId: 'A' | 'B') => {
      const eventNames = ['timeupdate', 'ended', 'waiting', 'playing', 'pause', 'error', 'loadedmetadata', 'canplay'];
      eventNames.forEach((evtName) => {
        const handlerName = `on${evtName}`;
        const trigger = (e: Event) => {
          if (this.activeDeckId === deckId) {
            if (typeof eventHandlers[handlerName] === 'function') {
              eventHandlers[handlerName].call(this.audioProxy, e);
            }
          }
        };
        if (typeof deck.addEventListener === 'function') {
          deck.addEventListener(evtName, trigger);
        } else {
          (deck as any)[handlerName] = trigger;
        }
      });
    };

    attachDeckEvents(this.audioA, 'A');
    attachDeckEvents(this.audioB, 'B');

    this.audioProxy = new Proxy(this.audioA, {
      get: (_target, prop) => {
        const active = this.getActiveAudio();
        if (typeof prop === 'string' && prop.startsWith('on')) {
          return eventHandlers[prop] || null;
        }
        if (prop === 'addEventListener') {
          return (type: string, listener: any, options?: any) => {
            const wrapped = (e: Event) => {
              if (this.getActiveAudio() === (e.target || active)) {
                listener(e);
              }
            };
            this.audioA.addEventListener?.(type, wrapped, options);
            this.audioB.addEventListener?.(type, wrapped, options);
          };
        }
        if (prop === 'removeEventListener') {
          return (type: string, listener: any, options?: any) => {
            this.audioA.removeEventListener?.(type, listener, options);
            this.audioB.removeEventListener?.(type, listener, options);
          };
        }
        const val = (active as any)[prop];
        if (typeof val === 'function') {
          return val.bind(active);
        }
        return val;
      },
      set: (_target, prop, value) => {
        if (typeof prop === 'string' && prop.startsWith('on')) {
          eventHandlers[prop] = value;
          return true;
        }
        const active = this.getActiveAudio();
        (active as any)[prop] = value;
        return true;
      }
    });
  }

  private createAudioElement(): HTMLAudioElement {
    if (typeof Audio !== 'undefined') {
      const el = new Audio();
      el.preload = 'auto';
      el.autoplay = false;
      return el;
    } else {
      return {
        play: async () => {},
        pause: () => {},
        load: () => {},
        currentTime: 0,
        duration: 0,
        volume: 1,
        src: '',
        paused: true
      } as unknown as HTMLAudioElement;
    }
  }

  public static getInstance(): RiffAudioEngine {
    if (!RiffAudioEngine.instance) {
      RiffAudioEngine.instance = new RiffAudioEngine();
    }
    return RiffAudioEngine.instance;
  }

  public getActiveAudio(): HTMLAudioElement {
    return this.activeDeckId === 'A' ? this.audioA : this.audioB;
  }

  public getInactiveAudio(): HTMLAudioElement {
    return this.activeDeckId === 'A' ? this.audioB : this.audioA;
  }

  public getActiveDeckId(): 'A' | 'B' {
    return this.activeDeckId;
  }

  public isCrossfadeActive(): boolean {
    return this.isCrossfading;
  }

  public getDeckGain(deck: 'A' | 'B'): number {
    if (this.isDspConnected && this.audioContext) {
      const node = deck === 'A' ? this.deckGainA : this.deckGainB;
      return node?.gain.value ?? (this.activeDeckId === deck ? 1 : 0);
    }
    const audio = deck === 'A' ? this.audioA : this.audioB;
    return audio.volume;
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

      // Safe MediaElementAudioSource connection for dual decks
      try {
        this.deckGainA = this.audioContext.createGain();
        this.deckGainB = this.audioContext.createGain();
        this.deckGainA.gain.value = this.activeDeckId === 'A' ? 1.0 : 0.0;
        this.deckGainB.gain.value = this.activeDeckId === 'B' ? 1.0 : 0.0;

        this.sourceNodeA = this.audioContext.createMediaElementSource(this.audioA);
        this.sourceNodeB = this.audioContext.createMediaElementSource(this.audioB);

        this.sourceNodeA.connect(this.deckGainA);
        this.sourceNodeB.connect(this.deckGainB);

        const sumNode = this.audioContext.createGain();
        sumNode.gain.value = 1.0;
        this.deckGainA.connect(sumNode);
        this.deckGainB.connect(sumNode);

        let lastNode: AudioNode = sumNode;
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

    this.cancelCrossfade();

    const active = this.getActiveAudio();
    const inactive = this.getInactiveAudio();

    inactive.pause();
    inactive.currentTime = 0;
    inactive.volume = 0;

    if (this.isDspConnected && this.audioContext) {
      const activeGain = this.activeDeckId === 'A' ? this.deckGainA : this.deckGainB;
      const inactiveGain = this.activeDeckId === 'A' ? this.deckGainB : this.deckGainA;
      try {
        const now = this.audioContext.currentTime;
        if (activeGain) {
          activeGain.gain.cancelScheduledValues(now);
          activeGain.gain.setValueAtTime(1.0, now);
        }
        if (inactiveGain) {
          inactiveGain.gain.cancelScheduledValues(now);
          inactiveGain.gain.setValueAtTime(0.0, now);
        }
      } catch {}
    }

    active.volume = this.masterVolume;
    if (active.src !== streamUrl) {
      active.src = streamUrl;
      active.load();
    }

    try {
      await active.play();
    } catch (err: any) {
      console.warn('Playback play() call failed:', err.message);
      throw err;
    }
  }

  public async crossfadeTo(streamUrl: string, durationSec = 4): Promise<void> {
    const duration = Math.max(0.5, Math.min(12, Number.isFinite(durationSec) ? durationSec : 4));

    if (durationSec <= 0) {
      return this.playTrack(streamUrl);
    }

    this.cancelCrossfade();
    this.isCrossfading = true;
    crossfadeController.setIsCrossfading(true);

    const outgoingDeck = this.getActiveAudio();
    const incomingDeck = this.getInactiveAudio();
    const outgoingDeckId = this.activeDeckId;
    const incomingDeckId = outgoingDeckId === 'A' ? 'B' : 'A';
    const outgoingGainNode = outgoingDeckId === 'A' ? this.deckGainA : this.deckGainB;
    const incomingGainNode = incomingDeckId === 'A' ? this.deckGainA : this.deckGainB;

    outgoingDeck.volume = this.masterVolume;
    incomingDeck.volume = 0;
    incomingDeck.src = streamUrl;
    incomingDeck.currentTime = 0;
    incomingDeck.load();

    if (this.isDspConnected && this.audioContext && outgoingGainNode && incomingGainNode) {
      try {
        const now = this.audioContext.currentTime;
        const SAMPLES = 64;
        const outCurve = new Float32Array(SAMPLES);
        const inCurve = new Float32Array(SAMPLES);
        for (let i = 0; i < SAMPLES; i++) {
          const gains = calculateEqualPowerGains(i / (SAMPLES - 1));
          outCurve[i] = gains.outgoingGain;
          inCurve[i] = gains.incomingGain;
        }
        outgoingGainNode.gain.cancelScheduledValues(now);
        incomingGainNode.gain.cancelScheduledValues(now);
        outgoingGainNode.gain.setValueCurveAtTime(outCurve, now, duration);
        incomingGainNode.gain.setValueCurveAtTime(inCurve, now, duration);
      } catch (e) {
        console.warn('Web Audio curve scheduling fallback:', e);
      }
    }

    // Switch active deck to the incoming deck for store/UI bindings
    this.activeDeckId = incomingDeckId;

    try {
      await incomingDeck.play();
    } catch (err) {
      console.warn('Incoming deck play() failed during crossfade:', err);
      this.cancelCrossfade();
      this.activeDeckId = outgoingDeckId;
      throw err;
    }

    const startTime = Date.now();
    this.crossfadeInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(1, elapsed / duration);
      const { outgoingGain, incomingGain } = calculateEqualPowerGains(progress);

      if (!this.isDspConnected) {
        outgoingDeck.volume = Math.max(0, Math.min(1, this.masterVolume * outgoingGain));
        incomingDeck.volume = Math.max(0, Math.min(1, this.masterVolume * incomingGain));
      }

      if (progress >= 1) {
        if (this.crossfadeInterval) {
          clearInterval(this.crossfadeInterval);
          this.crossfadeInterval = null;
        }
      }
    }, 25);

    this.crossfadeTimer = setTimeout(() => {
      outgoingDeck.pause();
      outgoingDeck.currentTime = 0;
      outgoingDeck.volume = 0;

      if (this.isDspConnected && this.audioContext && outgoingGainNode && incomingGainNode) {
        try {
          const now = this.audioContext.currentTime;
          outgoingGainNode.gain.cancelScheduledValues(now);
          outgoingGainNode.gain.setValueAtTime(0, now);
          incomingGainNode.gain.cancelScheduledValues(now);
          incomingGainNode.gain.setValueAtTime(1.0, now);
        } catch {}
      }

      incomingDeck.volume = this.masterVolume;
      this.isCrossfading = false;
      crossfadeController.setIsCrossfading(false);
    }, duration * 1000);
  }

  public cancelCrossfade(): void {
    if (this.crossfadeTimer) {
      clearTimeout(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }
    if (this.crossfadeInterval) {
      clearInterval(this.crossfadeInterval);
      this.crossfadeInterval = null;
    }
    this.isCrossfading = false;
    crossfadeController.setIsCrossfading(false);

    const inactive = this.getInactiveAudio();
    inactive.pause();
    inactive.currentTime = 0;
    inactive.volume = 0;
  }

  public pause(): void {
    this.audioA.pause();
    this.audioB.pause();
    this.cancelCrossfade();
  }

  public async resume(): Promise<void> {
    return this.getActiveAudio().play();
  }

  public seek(seconds: number): void {
    if (this.isCrossfading) {
      this.cancelCrossfade();
    }
    if (Number.isFinite(seconds)) {
      this.getActiveAudio().currentTime = seconds;
    }
  }

  public setVolume(val: number): void {
    const clamped = Math.max(0, Math.min(1, val));
    this.masterVolume = clamped;
    if (!this.isCrossfading) {
      this.getActiveAudio().volume = clamped;
    }
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
      if (!this.getActiveAudio().paused) {
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
      this.seek(Math.max(0, this.getActiveAudio().currentTime - skipTime));
      this.updatePositionState();
    });

    // Skip forward 10s
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const skipTime = details.seekOffset || 10;
      this.seek(Math.min(this.getActiveAudio().duration || 0, this.getActiveAudio().currentTime + skipTime));
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
      const active = this.getActiveAudio();
      const duration = active.duration;
      const position = active.currentTime;
      if (Number.isFinite(duration) && duration > 0 && Number.isFinite(position) && position >= 0) {
        navigator.mediaSession.setPositionState({
          duration: Math.max(duration, position),
          playbackRate: active.playbackRate || 1.0,
          position: Math.min(position, duration)
        });
      }
    } catch {}
  }

  public getAudioElement(): HTMLAudioElement {
    return this.audioProxy;
  }
}

export const audioEngine = RiffAudioEngine.getInstance();

