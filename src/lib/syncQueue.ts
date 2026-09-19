import { db, DBSyncAction } from './db';
import { TokenBucket, syncRateLimiter } from './rateLimiter';

export type SyncHandler = (payload: any) => Promise<void>;

export interface SyncQueueStatus {
  isOnline: boolean;
  isProcessing: boolean;
  pendingCount: number;
  quarantinedCount: number;
}

export type SyncQueueListener = (status: SyncQueueStatus) => void;

export interface SyncQueueOptions {
  rateLimiter?: TokenBucket;
  maxAttempts?: number;
  baseBackoffMs?: number;
  maxBackoffMs?: number;
}

export class OfflineSyncQueue {
  private rateLimiter: TokenBucket;
  private maxAttempts: number;
  private baseBackoffMs: number;
  private maxBackoffMs: number;
  private isProcessing = false;
  private isPaused = false;
  private isOnline = true;
  private handlers = new Map<string, SyncHandler>();
  private listeners = new Set<SyncQueueListener>();
  private inMemoryQueue: DBSyncAction[] = [];
  private useInMemory = false;
  private idCounter = 1;
  private boundOnlineHandler: () => void;
  private boundOfflineHandler: () => void;

  constructor(options: SyncQueueOptions = {}) {
    this.rateLimiter = options.rateLimiter || syncRateLimiter;
    this.maxAttempts = options.maxAttempts || 5;
    this.baseBackoffMs = options.baseBackoffMs || 1000;
    this.maxBackoffMs = options.maxBackoffMs || 30000;

    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      this.isOnline = navigator.onLine;
    }

    if (typeof indexedDB === 'undefined') {
      this.useInMemory = true;
    }

    this.boundOnlineHandler = () => {
      this.isOnline = true;
      this.notifyListeners();
      this.processQueue().catch((err) => {
        console.error('[OfflineSyncQueue] Error processing queue on reconnect:', err);
      });
    };

    this.boundOfflineHandler = () => {
      this.isOnline = false;
      this.notifyListeners();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.boundOnlineHandler);
      window.addEventListener('offline', this.boundOfflineHandler);
    }
  }

  /**
   * Register an action executor for a specific action type.
   */
  public registerHandler(type: string, handler: SyncHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * Enqueues a mutation action to be synced when online.
   */
  public async enqueue(type: string, payload: any): Promise<DBSyncAction> {
    const action: DBSyncAction = {
      id: this.idCounter++,
      type,
      payload,
      createdAt: Date.now(),
      attempts: 0,
      status: 'pending'
    };

    if (!this.useInMemory) {
      try {
        const id = await db.syncQueue.add(action);
        action.id = id as number;
      } catch (e) {
        // Fallback to in-memory if Dexie is unavailable or errors
        this.useInMemory = true;
        this.inMemoryQueue.push(action);
      }
    } else {
      this.inMemoryQueue.push(action);
    }

    this.notifyListeners();

    if (this.isOnline && !this.isPaused) {
      // Non-blocking trigger of the queue
      this.processQueue().catch((err) => {
        console.error('[OfflineSyncQueue] Processing error:', err);
      });
    }

    return action;
  }

  /**
   * Processes pending and eligible retry items in the queue with rate-limiting.
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessing || this.isPaused || !this.isOnline) {
      return;
    }

    this.isProcessing = true;
    this.notifyListeners();

    try {
      while (this.isOnline && !this.isPaused) {
        const action = await this.getNextEligibleAction();
        if (!action) {
          break; // Nothing eligible to process right now
        }

        // Apply Token Bucket rate limiting before calling the server/handler
        await this.rateLimiter.consume(1);

        // Mark as processing
        await this.updateActionStatus(action.id!, 'processing');

        const handler = this.handlers.get(action.type);
        if (!handler) {
          // No handler registered -> quarantine immediately
          await this.updateActionFailure(
            action,
            new Error(`No handler registered for action type: ${action.type}`),
            true
          );
          continue;
        }

        try {
          await handler(action.payload);
          // Handler succeeded: remove action from queue
          await this.removeAction(action.id!);
          this.notifyListeners();
        } catch (err: any) {
          const attempts = action.attempts + 1;
          const shouldQuarantine = attempts >= this.maxAttempts;
          await this.updateActionFailure(action, err, shouldQuarantine);
          this.notifyListeners();
        }
      }
    } finally {
      this.isProcessing = false;
      this.notifyListeners();
    }
  }

  /**
   * Retrieves the next pending or failed action whose exponential backoff has elapsed.
   */
  private async getNextEligibleAction(): Promise<DBSyncAction | null> {
    const now = Date.now();

    if (this.useInMemory) {
      for (const action of this.inMemoryQueue) {
        if (action.status === 'pending') {
          return action;
        }
        if (action.status === 'failed' && action.lastAttemptAt) {
          const backoff = this.calculateBackoff(action.attempts);
          if (now >= action.lastAttemptAt + backoff) {
            return action;
          }
        }
      }
      return null;
    }

    try {
      const items = await db.syncQueue.toArray();
      items.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

      for (const action of items) {
        if (action.status === 'pending') {
          return action;
        }
        if (action.status === 'failed' && action.lastAttemptAt) {
          const backoff = this.calculateBackoff(action.attempts);
          if (now >= action.lastAttemptAt + backoff) {
            return action;
          }
        }
      }
      return null;
    } catch {
      this.useInMemory = true;
      return this.getNextEligibleAction();
    }
  }

  /**
   * Computes Exponential Backoff with Jitter:
   * backoff = min(maxBackoff, baseBackoff * 2^(attempts-1)) * (0.8 + 0.4 * random)
   */
  public calculateBackoff(attempts: number): number {
    const expBackoff = Math.min(
      this.maxBackoffMs,
      this.baseBackoffMs * Math.pow(2, Math.max(0, attempts - 1))
    );
    // Add ±20% jitter
    const jitter = 0.8 + Math.random() * 0.4;
    return Math.floor(expBackoff * jitter);
  }

  private async updateActionStatus(
    id: number,
    status: DBSyncAction['status']
  ): Promise<void> {
    if (this.useInMemory) {
      const item = this.inMemoryQueue.find((a) => a.id === id);
      if (item) item.status = status;
      return;
    }

    try {
      await db.syncQueue.update(id, { status });
    } catch {
      const item = this.inMemoryQueue.find((a) => a.id === id);
      if (item) item.status = status;
    }
  }

  private async updateActionFailure(
    action: DBSyncAction,
    err: any,
    quarantine: boolean
  ): Promise<void> {
    const updates = {
      attempts: action.attempts + 1,
      lastAttemptAt: Date.now(),
      status: (quarantine ? 'quarantined' : 'failed') as DBSyncAction['status'],
      errorMessage: err?.message || String(err)
    };

    if (this.useInMemory) {
      const item = this.inMemoryQueue.find((a) => a.id === action.id);
      if (item) Object.assign(item, updates);
      return;
    }

    try {
      await db.syncQueue.update(action.id!, updates);
    } catch {
      const item = this.inMemoryQueue.find((a) => a.id === action.id);
      if (item) Object.assign(item, updates);
    }
  }

  private async removeAction(id: number): Promise<void> {
    if (this.useInMemory) {
      this.inMemoryQueue = this.inMemoryQueue.filter((a) => a.id !== id);
      return;
    }

    try {
      await db.syncQueue.delete(id);
    } catch {
      this.inMemoryQueue = this.inMemoryQueue.filter((a) => a.id !== id);
    }
  }

  /**
   * Resets all quarantined actions back to pending status with attempts reset to 0.
   */
  public async retryQuarantined(): Promise<number> {
    let count = 0;
    if (this.useInMemory) {
      for (const item of this.inMemoryQueue) {
        if (item.status === 'quarantined') {
          item.status = 'pending';
          item.attempts = 0;
          count++;
        }
      }
    } else {
      try {
        const quarantined = await db.syncQueue
          .where('status')
          .equals('quarantined')
          .toArray();
        count = quarantined.length;
        for (const item of quarantined) {
          await db.syncQueue.update(item.id!, {
            status: 'pending',
            attempts: 0
          });
        }
      } catch {
        // Fallback in memory
        for (const item of this.inMemoryQueue) {
          if (item.status === 'quarantined') {
            item.status = 'pending';
            item.attempts = 0;
            count++;
          }
        }
      }
    }

    this.notifyListeners();
    if (this.isOnline && !this.isPaused) {
      this.processQueue().catch((err) => {
        console.error('[OfflineSyncQueue] Re-processing quarantined error:', err);
      });
    }

    return count;
  }

  /**
   * Clears all actions from the sync queue.
   */
  public async clear(): Promise<void> {
    this.inMemoryQueue = [];
    if (!this.useInMemory) {
      try {
        await db.syncQueue.clear();
      } catch {
        // ignore
      }
    }
    this.notifyListeners();
  }

  /**
   * Retrieves all items currently in the sync queue.
   */
  public async getAll(): Promise<DBSyncAction[]> {
    if (this.useInMemory) {
      return [...this.inMemoryQueue];
    }
    try {
      return await db.syncQueue.toArray();
    } catch {
      return [...this.inMemoryQueue];
    }
  }

  /**
   * Returns counts of pending and quarantined actions.
   */
  public async getCounts(): Promise<{ pending: number; quarantined: number }> {
    const items = await this.getAll();
    let pending = 0;
    let quarantined = 0;
    for (const item of items) {
      if (item.status === 'pending' || item.status === 'failed' || item.status === 'processing') {
        pending++;
      } else if (item.status === 'quarantined') {
        quarantined++;
      }
    }
    return { pending, quarantined };
  }

  /**
   * Subscribes a listener to queue status updates.
   */
  public subscribe(listener: SyncQueueListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.getCounts().then(({ pending, quarantined }) => {
      const status: SyncQueueStatus = {
        isOnline: this.isOnline,
        isProcessing: this.isProcessing,
        pendingCount: pending,
        quarantinedCount: quarantined
      };
      this.listeners.forEach((l) => l(status));
    }).catch(() => {
      // ignore
    });
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
    if (this.isOnline) {
      this.processQueue().catch(() => {});
    }
  }

  public setOnlineStatus(online: boolean): void {
    this.isOnline = online;
    this.notifyListeners();
    if (this.isOnline && !this.isPaused) {
      this.processQueue().catch(() => {});
    }
  }

  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.boundOnlineHandler);
      window.removeEventListener('offline', this.boundOfflineHandler);
    }
    this.listeners.clear();
    this.handlers.clear();
  }
}

export const offlineSyncQueue = new OfflineSyncQueue();
