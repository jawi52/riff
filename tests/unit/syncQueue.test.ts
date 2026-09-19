import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OfflineSyncQueue } from '../../src/lib/syncQueue';
import { TokenBucket } from '../../src/lib/rateLimiter';

describe('Persistent Offline Sync Queue & Replay Engine', () => {
  let syncQueue: OfflineSyncQueue;
  let testRateLimiter: TokenBucket;

  beforeEach(() => {
    vi.useFakeTimers();
    testRateLimiter = new TokenBucket(10, 10); // fast refill for testing
    syncQueue = new OfflineSyncQueue({
      rateLimiter: testRateLimiter,
      maxAttempts: 3,
      baseBackoffMs: 100,
      maxBackoffMs: 1000
    });
  });

  afterEach(async () => {
    await syncQueue.clear();
    syncQueue.destroy();
    vi.useRealTimers();
  });

  describe('Enqueue & Basic Replay', () => {
    it('enqueues actions with pending status and assigned metadata', async () => {
      syncQueue.pause(); // Pause so it stays in queue
      const action = await syncQueue.enqueue('LIKE_TRACK', { trackId: 'song-1' });

      expect(action).toBeDefined();
      expect(action.id).toBeDefined();
      expect(action.type).toBe('LIKE_TRACK');
      expect(action.payload).toEqual({ trackId: 'song-1' });
      expect(action.status).toBe('pending');
      expect(action.attempts).toBe(0);

      const items = await syncQueue.getAll();
      expect(items.length).toBe(1);
      expect(items[0].id).toBe(action.id);
    });

    it('replays and drains action upon successful handler execution', async () => {
      const executed: any[] = [];
      syncQueue.registerHandler('LIKE_TRACK', async (payload) => {
        executed.push(payload);
      });

      await syncQueue.enqueue('LIKE_TRACK', { trackId: 'song-2' });
      await vi.runAllTimersAsync();

      expect(executed).toEqual([{ trackId: 'song-2' }]);
      const items = await syncQueue.getAll();
      expect(items.length).toBe(0);
    });
  });

  describe('Offline Buffering & Online Resumption', () => {
    it('buffers mutations when offline and does not call handlers', async () => {
      syncQueue.setOnlineStatus(false);
      const handler = vi.fn(async () => {});
      syncQueue.registerHandler('RECORD_HISTORY', handler);

      await syncQueue.enqueue('RECORD_HISTORY', { trackId: 'song-offline' });
      await vi.runAllTimersAsync();

      expect(handler).not.toHaveBeenCalled();
      const counts = await syncQueue.getCounts();
      expect(counts.pending).toBe(1);

      // Go back online
      syncQueue.setOnlineStatus(true);
      await vi.runAllTimersAsync();

      expect(handler).toHaveBeenCalledTimes(1);
      const afterCounts = await syncQueue.getCounts();
      expect(afterCounts.pending).toBe(0);
    });
  });

  describe('Exponential Backoff & Retries', () => {
    it('calculates backoff exponentially with jitter bounds', () => {
      const backoff1 = syncQueue.calculateBackoff(1);
      // baseBackoffMs = 100 * 2^0 = 100 * [0.8, 1.2] -> [80, 120]
      expect(backoff1).toBeGreaterThanOrEqual(80);
      expect(backoff1).toBeLessThanOrEqual(120);

      const backoff2 = syncQueue.calculateBackoff(2);
      // 100 * 2^1 = 200 * [0.8, 1.2] -> [160, 240]
      expect(backoff2).toBeGreaterThanOrEqual(160);
      expect(backoff2).toBeLessThanOrEqual(240);

      const backoffMax = syncQueue.calculateBackoff(10);
      // Max clamped at 1000 * 1.2 = 1200
      expect(backoffMax).toBeLessThanOrEqual(1200);
    });

    it('retries failing handlers with backoff until max attempts', async () => {
      let callCount = 0;
      syncQueue.registerHandler('FAIL_ACTION', async () => {
        callCount++;
        throw new Error('Server 500 internal error');
      });

      await syncQueue.enqueue('FAIL_ACTION', { val: 1 });
      await vi.runAllTimersAsync();

      expect(callCount).toBe(1);
      const items = await syncQueue.getAll();
      expect(items.length).toBe(1);
      expect(items[0].status).toBe('failed');
      expect(items[0].attempts).toBe(1);
      expect(items[0].errorMessage).toContain('Server 500');
    });
  });

  describe('Dead-Letter Quarantine', () => {
    it('quarantines actions that exceed maximum attempts', async () => {
      syncQueue.registerHandler('PERSISTENT_FAIL', async () => {
        throw new Error('Permanent rejection');
      });

      await syncQueue.enqueue('PERSISTENT_FAIL', { val: 'bad' });

      // Run attempts 1, 2, 3
      for (let i = 0; i < 4; i++) {
        vi.advanceTimersByTime(2000);
        await vi.runAllTimersAsync();
        await syncQueue.processQueue();
      }

      const items = await syncQueue.getAll();
      expect(items.length).toBe(1);
      expect(items[0].status).toBe('quarantined');
      expect(items[0].attempts).toBe(3);

      const counts = await syncQueue.getCounts();
      expect(counts.quarantined).toBe(1);
      expect(counts.pending).toBe(0);
    });

    it('resets quarantined actions on retryQuarantined()', async () => {
      let succeed = false;
      syncQueue.registerHandler('RECOVERABLE', async () => {
        if (!succeed) throw new Error('Temporary glitch');
      });

      await syncQueue.enqueue('RECOVERABLE', { ok: true });

      // Force to quarantine
      for (let i = 0; i < 4; i++) {
        vi.advanceTimersByTime(2000);
        await vi.runAllTimersAsync();
        await syncQueue.processQueue();
      }

      let counts = await syncQueue.getCounts();
      expect(counts.quarantined).toBe(1);

      // Now server recovers
      succeed = true;
      const retriedCount = await syncQueue.retryQuarantined();
      expect(retriedCount).toBe(1);

      await vi.runAllTimersAsync();
      counts = await syncQueue.getCounts();
      expect(counts.quarantined).toBe(0);
      expect(counts.pending).toBe(0);
    });
  });

  describe('Rate Limiting & Throttled Replay', () => {
    it('throttles replayed actions using the token bucket', async () => {
      const throttledLimiter = new TokenBucket(2, 1); // 2 burst, 1 req/sec
      const queue = new OfflineSyncQueue({
        rateLimiter: throttledLimiter,
        baseBackoffMs: 1000
      });

      queue.pause();
      const executionTimes: number[] = [];
      queue.registerHandler('THROTTLED_TASK', async (id) => {
        executionTimes.push(id);
      });

      await queue.enqueue('THROTTLED_TASK', 1);
      await queue.enqueue('THROTTLED_TASK', 2);
      await queue.enqueue('THROTTLED_TASK', 3);

      queue.resume();
      // First 2 should drain immediately (capacity = 2)
      await vi.advanceTimersByTimeAsync(10);
      expect(executionTimes.length).toBe(2);

      // 3rd action waits for token refill (1 sec)
      await vi.advanceTimersByTimeAsync(1100);
      expect(executionTimes.length).toBe(3);

      queue.destroy();
    });
  });

  describe('Listeners & Subscriptions', () => {
    it('notifies subscribers on queue status changes', async () => {
      const statuses: any[] = [];
      const unsubscribe = syncQueue.subscribe((status) => {
        statuses.push(status);
      });

      syncQueue.registerHandler('NOTIFIED_TASK', async () => {});
      await syncQueue.enqueue('NOTIFIED_TASK', { data: 123 });
      await vi.runAllTimersAsync();

      expect(statuses.length).toBeGreaterThan(0);
      unsubscribe();
    });
  });
});
