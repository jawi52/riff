import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  TokenBucket,
  searchRateLimiter,
  prebufferRateLimiter,
  syncRateLimiter
} from '../../src/lib/rateLimiter';

describe('Token Bucket Client Rate Limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Capacity and Immediate Consumption (tryConsume)', () => {
    it('initializes with full burst capacity', () => {
      const bucket = new TokenBucket(5, 1);
      expect(bucket.getCapacity()).toBe(5);
      expect(bucket.getRefillRate()).toBe(1);
      expect(bucket.getAvailableTokens()).toBe(5);
    });

    it('allows consuming tokens up to burst capacity immediately', () => {
      const bucket = new TokenBucket(3, 1);
      expect(bucket.tryConsume(1)).toBe(true);
      expect(bucket.tryConsume(1)).toBe(true);
      expect(bucket.tryConsume(1)).toBe(true);
      // Depleted
      expect(bucket.tryConsume(1)).toBe(false);
      expect(bucket.getAvailableTokens()).toBe(0);
    });

    it('handles requests for 0 or negative tokens gracefully', () => {
      const bucket = new TokenBucket(2, 1);
      expect(bucket.tryConsume(0)).toBe(true);
      expect(bucket.tryConsume(-2)).toBe(true);
      expect(bucket.getAvailableTokens()).toBe(2);
    });

    it('rejects single consume requests larger than available tokens', () => {
      const bucket = new TokenBucket(5, 1);
      expect(bucket.tryConsume(6)).toBe(false);
      expect(bucket.getAvailableTokens()).toBe(5);
    });
  });

  describe('Lazy Fractional Replenishment', () => {
    it('replenishes tokens proportionally to elapsed wall-clock time', () => {
      const bucket = new TokenBucket(10, 2); // 2 tokens/sec
      expect(bucket.tryConsume(10)).toBe(true);
      expect(bucket.getAvailableTokens()).toBe(0);

      // Advance by 1 second -> should have 2 tokens
      vi.advanceTimersByTime(1000);
      expect(bucket.getAvailableTokens()).toBe(2);

      // Advance by 1.5 seconds -> should have 5 tokens
      vi.advanceTimersByTime(1500);
      expect(bucket.getAvailableTokens()).toBe(5);
    });

    it('clamps available tokens at maximum burst capacity', () => {
      const bucket = new TokenBucket(4, 5); // 5 tokens/sec, capacity 4
      bucket.tryConsume(2);
      expect(bucket.getAvailableTokens()).toBe(2);

      // Advance 10 seconds -> capped at 4
      vi.advanceTimersByTime(10000);
      expect(bucket.getAvailableTokens()).toBe(4);
    });
  });

  describe('Asynchronous Queuing & Priority Scheduling (consume)', () => {
    it('resolves immediately if sufficient tokens are available', async () => {
      const bucket = new TokenBucket(5, 1);
      await bucket.consume(2);
      expect(bucket.getAvailableTokens()).toBe(3);
    });

    it('waits in queue and resolves when tokens refill', async () => {
      const bucket = new TokenBucket(2, 2); // 2 tokens/sec
      await bucket.consume(2); // Depleted
      expect(bucket.getAvailableTokens()).toBe(0);

      let resolved = false;
      const promise = bucket.consume(2).then(() => {
        resolved = true;
      });

      expect(bucket.getQueueLength()).toBe(1);
      expect(resolved).toBe(false);

      // 1000 ms needed for 2 tokens at 2 tokens/sec
      vi.advanceTimersByTime(500);
      expect(resolved).toBe(false);

      vi.advanceTimersByTime(550);
      await vi.runAllTimersAsync();
      await promise;
      expect(resolved).toBe(true);
      expect(bucket.getQueueLength()).toBe(0);
    });

    it('processes high priority requests before lower priority requests', async () => {
      const bucket = new TokenBucket(1, 1); // 1 token/sec
      await bucket.consume(1); // empty

      const order: string[] = [];

      // Queue low priority first
      const pLow = bucket.consume(1, 'low').then(() => order.push('low'));
      // Queue normal priority second
      const pNormal = bucket.consume(1, 'normal').then(() => order.push('normal'));
      // Queue high priority last
      const pHigh = bucket.consume(1, 'high').then(() => order.push('high'));

      expect(bucket.getQueueLength()).toBe(3);

      // Advance 1s -> high should resolve
      await vi.advanceTimersByTimeAsync(1100);
      expect(order).toEqual(['high']);

      // Advance 1s -> normal should resolve
      await vi.advanceTimersByTimeAsync(1100);
      expect(order).toEqual(['high', 'normal']);

      // Advance 1s -> low should resolve
      await vi.advanceTimersByTimeAsync(1100);
      expect(order).toEqual(['high', 'normal', 'low']);

      await Promise.all([pLow, pNormal, pHigh]);
    });
  });

  describe('wrap Helper', () => {
    it('executes wrapped async function subject to rate limits', async () => {
      const bucket = new TokenBucket(3, 1);
      const fn = vi.fn(async (x: number) => x * 2);

      const result = await bucket.wrap(() => fn(21));
      expect(result).toBe(42);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(bucket.getAvailableTokens()).toBe(2);
    });
  });

  describe('reset & Cleanup', () => {
    it('resets tokens to capacity and drains waiting queue', async () => {
      const bucket = new TokenBucket(5, 1);
      bucket.tryConsume(5);
      expect(bucket.getAvailableTokens()).toBe(0);

      let resolved = false;
      const promise = bucket.consume(2).then(() => {
        resolved = true;
      });

      bucket.reset();
      expect(bucket.getAvailableTokens()).toBe(5);
      await promise;
      expect(resolved).toBe(true);
      expect(bucket.getQueueLength()).toBe(0);
    });
  });

  describe('Singleton Limiters', () => {
    it('exports correctly configured singletons for search, prebuffering, and sync', () => {
      expect(searchRateLimiter.getCapacity()).toBe(8);
      expect(searchRateLimiter.getRefillRate()).toBe(4);

      expect(prebufferRateLimiter.getCapacity()).toBe(4);
      expect(prebufferRateLimiter.getRefillRate()).toBe(2);

      expect(syncRateLimiter.getCapacity()).toBe(10);
      expect(syncRateLimiter.getRefillRate()).toBe(5);
    });
  });
});
