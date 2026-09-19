import { describe, it, expect, vi } from 'vitest';
import { PlayerStateMachine } from '../../src/lib/playerStateMachine';

describe('Audio Playback Finite State Machine (FSM)', () => {
  it('should initialize to idle and allow valid state transitions', () => {
    const fsm = new PlayerStateMachine('idle');
    expect(fsm.state).toBe('idle');

    // idle -> resolving
    expect(fsm.transition('resolving')).toBe(true);
    expect(fsm.state).toBe('resolving');

    // resolving -> buffering
    expect(fsm.transition('buffering')).toBe(true);
    expect(fsm.state).toBe('buffering');

    // buffering -> playing
    expect(fsm.transition('playing')).toBe(true);
    expect(fsm.state).toBe('playing');

    // playing -> paused
    expect(fsm.transition('paused')).toBe(true);
    expect(fsm.state).toBe('paused');

    // paused -> playing
    expect(fsm.transition('playing')).toBe(true);
    expect(fsm.state).toBe('playing');
  });

  it('should reject mathematically invalid state transitions', () => {
    const fsm = new PlayerStateMachine('idle');

    // Direct idle -> playing without resolving/buffering is invalid
    expect(fsm.transition('playing')).toBe(false);
    expect(fsm.state).toBe('idle');

    // Direct idle -> paused is invalid
    expect(fsm.transition('paused')).toBe(false);
    expect(fsm.state).toBe('idle');
  });

  it('should invalidate stale asynchronous callbacks when a new session starts', () => {
    const fsm = new PlayerStateMachine('idle');

    // 1. User clicks Song A
    const sessionA = fsm.startSession('track_A');
    expect(fsm.state).toBe('resolving');
    expect(sessionA.isCurrent()).toBe(true);
    expect(sessionA.signal.aborted).toBe(false);

    // 2. User rapidly skips to Song B while Song A was still resolving
    const sessionB = fsm.startSession('track_B');
    expect(sessionA.isCurrent()).toBe(false);
    expect(sessionA.signal.aborted).toBe(true); // Signal was aborted!
    expect(sessionB.isCurrent()).toBe(true);
    expect(fsm.generation).toBe(sessionB.generation);

    // 3. Song A's asynchronous network stream finishes later and attempts to update state
    const resultA = fsm.transition('buffering', sessionA);
    expect(resultA).toBe(false); // Discarded!
    expect(fsm.activeTrackId).toBe('track_B');

    // 4. Song B's stream finishes and updates state
    const resultB = fsm.transition('buffering', sessionB);
    expect(resultB).toBe(true);
    expect(fsm.state).toBe('buffering');
  });

  it('should notify subscribers on valid state transitions', () => {
    const fsm = new PlayerStateMachine('idle');
    const listener = vi.fn();

    const unsubscribe = fsm.subscribe(listener);

    fsm.transition('resolving');
    expect(listener).toHaveBeenCalledWith('resolving', 'idle');

    fsm.transition('buffering');
    expect(listener).toHaveBeenCalledWith('buffering', 'resolving');

    unsubscribe();
    fsm.transition('playing');
    expect(listener).toHaveBeenCalledTimes(2); // No more calls after unsubscribe
  });

  it('should reset properly to idle and abort pending controllers', () => {
    const fsm = new PlayerStateMachine('idle');
    const session = fsm.startSession('track_1');

    fsm.reset();
    expect(fsm.state).toBe('idle');
    expect(fsm.activeTrackId).toBeNull();
    expect(session.signal.aborted).toBe(true);
  });
});
