/**
 * Token Bucket & Leaky Bucket Rate Limiter
 *
 * Implements a high-precision, continuous-refill Token Bucket algorithm to throttle
 * outgoing API calls (Search typeahead, stream pre-buffering, multi-provider queries)
 * and prevent HTTP 429 Too Many Requests errors.
 *
 * Mathematical Invariant:
 * Available Tokens = min(capacity, currentTokens + (elapsedSeconds * refillRate))
 */

export type PriorityLevel = 'high' | 'normal' | 'low';

interface QueuedRequest {
  tokens: number;
  resolve: () => void;
  priority: PriorityLevel;
  timestamp: number;
}

export class TokenBucket {
  private readonly capacity: number;
  private readonly refillRate: number; // Tokens per second
  private tokens: number;
  private lastRefillTimestamp: number;
  private queue: QueuedRequest[] = [];
  private drainTimer: any = null;

  /**
   * @param capacity Maximum burst capacity of the bucket
   * @param refillRate Number of tokens replenished per second
   */
  constructor(capacity = 10, refillRate = 5) {
    this.capacity = Math.max(1, capacity);
    this.refillRate = Math.max(0.1, refillRate);
    this.tokens = this.capacity;
    this.lastRefillTimestamp = Date.now();
  }

  /**
   * Refills the bucket lazily based on elapsed wall-clock time.
   */
  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTimestamp) / 1000;

    if (elapsedSeconds > 0) {
      const addedTokens = elapsedSeconds * this.refillRate;
      this.tokens = Math.min(this.capacity, this.tokens + addedTokens);
      this.lastRefillTimestamp = now;
    }
  }

  /**
   * Non-blocking attempt to consume tokens.
   *
   * @returns true if tokens were consumed immediately, false if bucket is depleted.
   */
  public tryConsume(tokens = 1): boolean {
    if (tokens <= 0) return true;
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  /**
   * Asynchronously consumes tokens, waiting in a priority queue if necessary
   * until enough tokens have refilled.
   *
   * High priority requests (e.g. user-initiated instant playback) are dequeued
   * ahead of normal and low-priority background requests (e.g. predictive pre-buffering).
   */
  public async consume(tokens = 1, priority: PriorityLevel = 'normal'): Promise<void> {
    if (tokens <= 0) return;

    if (this.queue.length === 0 && this.tryConsume(tokens)) {
      return;
    }

    return new Promise<void>((resolve) => {
      const request: QueuedRequest = {
        tokens,
        resolve,
        priority,
        timestamp: Date.now()
      };

      // Insert into queue ordered by priority: high (0) > normal (1) > low (2)
      const priorityOrder: Record<PriorityLevel, number> = { high: 0, normal: 1, low: 2 };
      const reqPriority = priorityOrder[priority];

      let insertIdx = this.queue.length;
      for (let i = 0; i < this.queue.length; i++) {
        if (priorityOrder[this.queue[i].priority] > reqPriority) {
          insertIdx = i;
          break;
        }
      }

      this.queue.splice(insertIdx, 0, request);
      this.scheduleDrain();
    });
  }

  /**
   * Drains waiting requests as tokens replenish.
   */
  private scheduleDrain(): void {
    if (this.drainTimer || this.queue.length === 0) return;

    this.refill();

    while (this.queue.length > 0) {
      const next = this.queue[0];
      if (this.tokens >= next.tokens) {
        this.tokens -= next.tokens;
        this.queue.shift();
        next.resolve();
      } else {
        break;
      }
    }

    if (this.queue.length > 0) {
      const neededTokens = this.queue[0].tokens - this.tokens;
      const waitMs = Math.ceil((neededTokens / this.refillRate) * 1000);
      this.drainTimer = setTimeout(() => {
        this.drainTimer = null;
        this.scheduleDrain();
      }, Math.max(10, waitMs));
    }
  }

  /**
   * Wraps an asynchronous network operation with token bucket rate limiting.
   */
  public async wrap<T>(
    fn: () => Promise<T>,
    tokens = 1,
    priority: PriorityLevel = 'normal'
  ): Promise<T> {
    await this.consume(tokens, priority);
    return await fn();
  }

  /**
   * Returns current available token count (fractional).
   */
  public getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }

  /**
   * Returns the maximum burst capacity.
   */
  public getCapacity(): number {
    return this.capacity;
  }

  /**
   * Returns the refill rate (tokens/sec).
   */
  public getRefillRate(): number {
    return this.refillRate;
  }

  /**
   * Returns the number of currently waiting requests.
   */
  public getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Resets the bucket to full capacity and clears pending timers.
   */
  public reset(): void {
    if (this.drainTimer) {
      clearTimeout(this.drainTimer);
      this.drainTimer = null;
    }
    this.tokens = this.capacity;
    this.lastRefillTimestamp = Date.now();
    // Resolve all waiting requests so no unhandled hanging promises
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      item?.resolve();
    }
  }
}

// Global Singleton Rate Limiters for specialized subsystems:
export const searchRateLimiter = new TokenBucket(8, 4);      // 8 burst, 4 req/sec for search typeahead
export const prebufferRateLimiter = new TokenBucket(4, 2);   // 4 burst, 2 req/sec for background pre-buffering
export const syncRateLimiter = new TokenBucket(10, 5);       // 10 burst, 5 req/sec for offline sync queue replay
