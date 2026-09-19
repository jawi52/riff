import { PlaybackState } from '../types';

/**
 * Deterministic transition matrix defining all mathematically valid state changes.
 */
const VALID_TRANSITIONS: Record<PlaybackState, readonly PlaybackState[]> = {
  idle: ['resolving', 'error'],
  resolving: ['buffering', 'paused', 'idle', 'error'],
  buffering: ['playing', 'paused', 'resolving', 'error'],
  playing: ['paused', 'buffering', 'resolving', 'idle', 'error'],
  paused: ['playing', 'resolving', 'buffering', 'idle', 'error'],
  error: ['resolving', 'idle'],
};

export interface PlaybackSession {
  readonly generation: number;
  readonly trackId: string;
  readonly signal: AbortSignal;
  readonly isCurrent: () => boolean;
}

/**
 * Finite State Machine (FSM) & Lifecycle Coordinator for Audio Playback
 * Eliminates race conditions, ghost playback, and out-of-sync UI states
 * through strict transition validation and generation sequence tokens.
 */
export class PlayerStateMachine {
  private _state: PlaybackState = 'idle';
  private _generation = 0;
  private _activeTrackId: string | null = null;
  private _activeAbortController: AbortController | null = null;
  private readonly _listeners = new Set<(state: PlaybackState, previous: PlaybackState) => void>();

  constructor(initialState: PlaybackState = 'idle') {
    this._state = initialState;
  }

  get state(): PlaybackState {
    return this._state;
  }

  get generation(): number {
    return this._generation;
  }

  get activeTrackId(): string | null {
    return this._activeTrackId;
  }

  /**
   * Checks if moving to the target state is mathematically valid from current state.
   */
  canTransition(to: PlaybackState): boolean {
    if (this._state === to) return true;
    const allowed = VALID_TRANSITIONS[this._state];
    return allowed ? allowed.includes(to) : false;
  }

  /**
   * Initiates a new playback session for a track.
   * Cancels any pending in-flight network requests, increments the generation counter,
   * and transitions into the 'resolving' state.
   */
  startSession(trackId: string): PlaybackSession {
    // Abort previous in-flight requests (lyrics, stream resolution)
    if (this._activeAbortController) {
      this._activeAbortController.abort();
    }

    const controller = new AbortController();
    this._activeAbortController = controller;
    const currentGen = ++this._generation;
    this._activeTrackId = trackId;

    this.forceTransition('resolving');

    return {
      generation: currentGen,
      trackId,
      signal: controller.signal,
      isCurrent: () => this._generation === currentGen && this._activeTrackId === trackId,
    };
  }

  /**
   * Attempts to transition to the target state.
   * If a session is provided, ensures the transition is only applied if the session is still active.
   * Returns true if transition succeeded, false if invalid or discarded.
   */
  transition(to: PlaybackState, session?: PlaybackSession): boolean {
    // Discard stale transitions from past asynchronous promises
    if (session && !session.isCurrent()) {
      return false;
    }

    if (this._state === to) {
      return true;
    }

    if (!this.canTransition(to)) {
      console.warn(`[PlayerStateMachine] Invalid state transition rejected: ${this._state} -> ${to}`);
      return false;
    }

    const previous = this._state;
    this._state = to;

    this.notifyListeners(to, previous);
    return true;
  }

  /**
   * Forces an immediate transition (used during session creation or emergency reset).
   */
  private forceTransition(to: PlaybackState): void {
    const previous = this._state;
    this._state = to;
    this.notifyListeners(to, previous);
  }

  /**
   * Cancels all pending playback requests and resets machine to 'idle'.
   */
  reset(): void {
    if (this._activeAbortController) {
      this._activeAbortController.abort();
      this._activeAbortController = null;
    }
    this._activeTrackId = null;
    this._generation++;
    this.forceTransition('idle');
  }

  /**
   * Subscribes to state change events.
   */
  subscribe(listener: (state: PlaybackState, previous: PlaybackState) => void): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  private notifyListeners(state: PlaybackState, previous: PlaybackState): void {
    for (const listener of this._listeners) {
      try {
        listener(state, previous);
      } catch (err) {
        console.error('[PlayerStateMachine] Listener error:', err);
      }
    }
  }
}

// Export singleton instance for global player coordination
export const playerStateMachine = new PlayerStateMachine();
