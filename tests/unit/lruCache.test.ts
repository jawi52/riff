import { describe, it, expect, vi } from 'vitest';
import { LRUCache } from '../../src/lib/lruCache';

describe('High-Performance LRU Cache (Doubly Linked List + Hash Map)', () => {
  it('should store and retrieve items in O(1)', () => {
    const cache = new LRUCache<string, number>({ capacity: 3 });

    cache.set('a', 1);
    cache.set('b', 2);

    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBeUndefined();
    expect(cache.size).toBe(2);
  });

  it('should strictly evict the Least Recently Used item when capacity is exceeded', () => {
    const cache = new LRUCache<string, string>({ capacity: 3 });

    cache.set('song1', 'Pasoori');
    cache.set('song2', 'Downers at Dusk');
    cache.set('song3', 'Kahani Suno');

    expect(cache.keys()).toEqual(['song3', 'song2', 'song1']);

    // Inserting 4th item must evict 'song1' (the oldest, least recently used)
    cache.set('song4', 'Bikhra');

    expect(cache.has('song1')).toBe(false);
    expect(cache.get('song1')).toBeUndefined();
    expect(cache.get('song4')).toBe('Bikhra');
    expect(cache.size).toBe(3);
    expect(cache.keys()).toEqual(['song4', 'song3', 'song2']);
  });

  it('should promote an accessed item to MRU and prevent its eviction', () => {
    const cache = new LRUCache<string, string>({ capacity: 3 });

    cache.set('trackA', 'Song A');
    cache.set('trackB', 'Song B');
    cache.set('trackC', 'Song C');

    // Access trackA -> moves trackA to MRU (front)
    expect(cache.get('trackA')).toBe('Song A');
    // Order should now be trackA, trackC, trackB (trackB is now LRU)
    expect(cache.keys()).toEqual(['trackA', 'trackC', 'trackB']);

    // Insert trackD -> trackB must be evicted, trackA must survive
    cache.set('trackD', 'Song D');

    expect(cache.has('trackB')).toBe(false);
    expect(cache.has('trackA')).toBe(true);
    expect(cache.keys()).toEqual(['trackD', 'trackA', 'trackC']);
  });

  it('should update existing keys without increasing cache size', () => {
    const cache = new LRUCache<string, number>({ capacity: 2 });

    cache.set('key', 10);
    expect(cache.size).toBe(1);

    cache.set('key', 20);
    expect(cache.size).toBe(1);
    expect(cache.get('key')).toBe(20);
  });

  it('should allow peek without changing access recency order', () => {
    const cache = new LRUCache<string, number>({ capacity: 3 });

    cache.set('x', 1);
    cache.set('y', 2);
    expect(cache.keys()).toEqual(['y', 'x']);

    // Peek 'x'
    expect(cache.peek('x')).toBe(1);
    // Order must remain unchanged
    expect(cache.keys()).toEqual(['y', 'x']);
  });

  it('should evict items automatically when TTL expires', async () => {
    vi.useFakeTimers();

    const cache = new LRUCache<string, string>({ capacity: 5, ttlMs: 1000 });

    cache.set('query', 'Arijit Singh');
    expect(cache.get('query')).toBe('Arijit Singh');

    // Fast-forward time by 1500ms
    vi.advanceTimersByTime(1500);

    expect(cache.get('query')).toBeUndefined();
    expect(cache.has('query')).toBe(false);

    vi.useRealTimers();
  });

  it('should handle capacity of 1 properly', () => {
    const cache = new LRUCache<string, string>({ capacity: 1 });

    cache.set('first', '1');
    expect(cache.get('first')).toBe('1');

    cache.set('second', '2');
    expect(cache.get('first')).toBeUndefined();
    expect(cache.get('second')).toBe('2');
    expect(cache.size).toBe(1);
  });

  it('should delete and clear items correctly', () => {
    const cache = new LRUCache<string, string>({ capacity: 3 });

    cache.set('a', '1');
    cache.set('b', '2');

    expect(cache.delete('a')).toBe(true);
    expect(cache.has('a')).toBe(false);
    expect(cache.size).toBe(1);

    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get('b')).toBeUndefined();
  });
});
