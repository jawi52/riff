/**
 * High-Performance Circuit Breaker Pattern for Distributed Resilience
 * States:
 * - CLOSED: Normal operations. Failures are counted.
 * - OPEN: Fast-fails immediately without calling backend; invokes fallback.
 * - HALF_OPEN: Trial period after cooldown; single probe checks if service has recovered.
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions<T = any> {
  name?: string;
  failureThreshold?: number; // Number of consecutive failures before tripping to OPEN (default: 3)
  cooldownMs?: number;       // Time in OPEN state before trying HALF_OPEN (default: 20000ms)
  timeoutMs?: number;        // Max request duration before timing out (default: 5000ms)
  fallback?: (error: Error) => Promise<T> | T;
}

export class CircuitBreakerOpenError extends Error {
  constructor(breakerName = 'CircuitBreaker') {
    super(`[${breakerName}] Circuit is OPEN. Request rejected to prevent cascading failure.`);
    this.name = 'CircuitBreakerOpenError';
  }
}

export class CircuitBreakerTimeoutError extends Error {
  constructor(breakerName = 'CircuitBreaker', timeoutMs: number) {
    super(`[${breakerName}] Request timed out after ${timeoutMs}ms`);
    this.name = 'CircuitBreakerTimeoutError';
  }
}

export class CircuitBreaker<T = any> {
  public readonly name: string;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly timeoutMs: number;
  private readonly fallback?: (error: Error) => Promise<T> | T;

  private _state: CircuitState = 'CLOSED';
  private _failureCount = 0;
  private _lastFailureTime = 0;
  private _successCount = 0;

  constructor(options: CircuitBreakerOptions<T> = {}) {
    this.name = options.name || 'CircuitBreaker';
    this.failureThreshold = options.failureThreshold ?? 3;
    this.cooldownMs = options.cooldownMs ?? 20000;
    this.timeoutMs = options.timeoutMs ?? 5000;
    this.fallback = options.fallback;
  }

  get state(): CircuitState {
    this.checkCooldown();
    return this._state;
  }

  get failureCount(): number {
    return this._failureCount;
  }

  get lastFailureTime(): number {
    return this._lastFailureTime;
  }

  /**
   * Executes a protected action with timeout, fail-fast guards, and automated fallback.
   */
  async execute<R = T>(
    action: (signal: AbortSignal) => Promise<R>,
    customFallback?: (err: Error) => Promise<R> | R
  ): Promise<R> {
    this.checkCooldown();

    // 1. If circuit is OPEN, fast-fail without calling remote network
    if (this._state === 'OPEN') {
      const openErr = new CircuitBreakerOpenError(this.name);
      const fallbackFn = customFallback || (this.fallback as any);
      if (fallbackFn) {
        return await fallbackFn(openErr);
      }
      throw openErr;
    }

    // 2. Prepare request with timeout and abort signal
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(new CircuitBreakerTimeoutError(this.name, this.timeoutMs));
      }, this.timeoutMs);
    });

    try {
      // Race between action execution and timeout
      const result = await Promise.race([action(controller.signal), timeoutPromise]);
      this.onSuccess();
      return result;
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err));

      // User-initiated external aborts should NOT count as server failures or trip the circuit breaker
      if (error.name === 'AbortError') {
        throw error;
      }

      this.onFailure();

      const fallbackFn = customFallback || (this.fallback as any);
      if (fallbackFn) {
        return await fallbackFn(error);
      }
      throw error;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  /**
   * Records a successful execution.
   */
  private onSuccess(): void {
    if (this._state === 'HALF_OPEN') {
      // Canary trial succeeded: reset circuit back to CLOSED
      this._state = 'CLOSED';
      this._failureCount = 0;
    }
    this._failureCount = 0;
    this._successCount++;
  }

  /**
   * Records a failed execution.
   */
  private onFailure(): void {
    this._failureCount++;
    this._lastFailureTime = Date.now();

    if (this._state === 'HALF_OPEN') {
      // Canary failed: trip immediately back to OPEN
      this._state = 'OPEN';
    } else if (this._failureCount >= this.failureThreshold) {
      this._state = 'OPEN';
    }
  }

  /**
   * Checks if cooldown period has elapsed to transition from OPEN to HALF_OPEN.
   */
  private checkCooldown(): void {
    if (this._state === 'OPEN') {
      if (Date.now() - this._lastFailureTime >= this.cooldownMs) {
        this._state = 'HALF_OPEN';
      }
    }
  }

  /**
   * Manually resets circuit breaker to CLOSED.
   */
  reset(): void {
    this._state = 'CLOSED';
    this._failureCount = 0;
    this._lastFailureTime = 0;
  }

  /**
   * Manually trips circuit breaker to OPEN.
   */
  trip(): void {
    this._state = 'OPEN';
    this._lastFailureTime = Date.now();
  }
}
