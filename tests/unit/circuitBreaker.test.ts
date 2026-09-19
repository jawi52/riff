import { describe, it, expect, vi } from 'vitest';
import {
  CircuitBreaker,
  CircuitBreakerOpenError,
  CircuitBreakerTimeoutError,
} from '../../src/lib/circuitBreaker';

describe('Distributed Resilience Circuit Breaker Pattern', () => {
  it('should execute successfully and maintain CLOSED state', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 3 });

    const result = await breaker.execute(async () => 'OK');
    expect(result).toBe('OK');
    expect(breaker.state).toBe('CLOSED');
    expect(breaker.failureCount).toBe(0);
  });

  it('should trip to OPEN when failures reach threshold', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      fallback: async () => 'FALLBACK_VALUE',
    });

    const failingAction = async () => {
      throw new Error('API Outage');
    };

    // 1st failure
    const res1 = await breaker.execute(failingAction);
    expect(res1).toBe('FALLBACK_VALUE');
    expect(breaker.state).toBe('CLOSED');
    expect(breaker.failureCount).toBe(1);

    // 2nd failure (reaches threshold of 2)
    const res2 = await breaker.execute(failingAction);
    expect(res2).toBe('FALLBACK_VALUE');
    expect(breaker.state).toBe('OPEN');
  });

  it('should fast-fail immediately in OPEN state without calling action', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      cooldownMs: 5000,
    });

    const actionMock = vi.fn().mockRejectedValue(new Error('Network Down'));

    // Trip circuit to OPEN
    try {
      await breaker.execute(actionMock);
    } catch {}

    expect(breaker.state).toBe('OPEN');
    expect(actionMock).toHaveBeenCalledTimes(1);

    // Next request should fast-fail without calling action
    await expect(breaker.execute(actionMock)).rejects.toThrow(CircuitBreakerOpenError);
    expect(actionMock).toHaveBeenCalledTimes(1); // Action was NOT called again!
  });

  it('should transition to HALF_OPEN after cooldown period', () => {
    vi.useFakeTimers();

    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      cooldownMs: 3000,
    });

    breaker.trip();
    expect(breaker.state).toBe('OPEN');

    // Advance past cooldown time
    vi.advanceTimersByTime(3500);

    expect(breaker.state).toBe('HALF_OPEN');

    vi.useRealTimers();
  });

  it('should reset to CLOSED if canary trial succeeds in HALF_OPEN', async () => {
    vi.useFakeTimers();

    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      cooldownMs: 2000,
    });

    breaker.trip();
    vi.advanceTimersByTime(2500);
    expect(breaker.state).toBe('HALF_OPEN');

    // Canary execution succeeds
    const result = await breaker.execute(async () => 'CANARY_SUCCESS');
    expect(result).toBe('CANARY_SUCCESS');
    expect(breaker.state).toBe('CLOSED');
    expect(breaker.failureCount).toBe(0);

    vi.useRealTimers();
  });

  it('should trip back to OPEN if canary trial fails in HALF_OPEN', async () => {
    vi.useFakeTimers();

    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      cooldownMs: 2000,
      fallback: async () => 'CANARY_FALLBACK',
    });

    breaker.trip();
    vi.advanceTimersByTime(2500);
    expect(breaker.state).toBe('HALF_OPEN');

    // Canary execution fails
    const result = await breaker.execute(async () => {
      throw new Error('Still failing');
    });

    expect(result).toBe('CANARY_FALLBACK');
    expect(breaker.state).toBe('OPEN');

    vi.useRealTimers();
  });

  it('should timeout and abort slow requests exceeding timeoutMs', async () => {
    const breaker = new CircuitBreaker({
      timeoutMs: 50,
      fallback: async (err) => {
        expect(err).toBeInstanceOf(CircuitBreakerTimeoutError);
        return 'TIMEOUT_FALLBACK';
      },
    });

    const slowAction = (signal: AbortSignal) =>
      new Promise<string>((resolve) => {
        const timer = setTimeout(() => resolve('DONE'), 200);
        signal.addEventListener('abort', () => clearTimeout(timer));
      });

    const res = await breaker.execute(slowAction);
    expect(res).toBe('TIMEOUT_FALLBACK');
    expect(breaker.failureCount).toBe(1);
  });

  it('should rethrow user-initiated AbortError without counting as failure or tripping breaker', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      fallback: async () => 'FALLBACK',
    });

    const userAbortedAction = async () => {
      const err = new Error('The user aborted a request.');
      err.name = 'AbortError';
      throw err;
    };

    // Should rethrow AbortError directly instead of returning fallback
    await expect(breaker.execute(userAbortedAction)).rejects.toThrow('The user aborted a request.');

    // Failure count must remain 0 and circuit must remain CLOSED
    expect(breaker.failureCount).toBe(0);
    expect(breaker.state).toBe('CLOSED');
  });
});
