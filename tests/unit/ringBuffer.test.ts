import { describe, it, expect } from 'vitest';
import { CircularBuffer } from '../../src/lib/ringBuffer';

describe('High-Performance Circular Ring Buffer', () => {
  it('should push items to front and maintain MRU order', () => {
    const ring = new CircularBuffer<string>(3);

    ring.pushFront('Song 1');
    ring.pushFront('Song 2');
    ring.pushFront('Song 3');

    expect(ring.size).toBe(3);
    expect(ring.isFull).toBe(true);
    // Song 3 was added last to front, so it should be at index 0
    expect(ring.toArray()).toEqual(['Song 3', 'Song 2', 'Song 1']);
  });

  it('should evict the oldest item at back when pushFront exceeds capacity', () => {
    const ring = new CircularBuffer<string>(3);

    ring.pushFront('Song 1');
    ring.pushFront('Song 2');
    ring.pushFront('Song 3');
    // Adding 4th item to front should drop 'Song 1' (the oldest at back)
    ring.pushFront('Song 4');

    expect(ring.size).toBe(3);
    expect(ring.toArray()).toEqual(['Song 4', 'Song 3', 'Song 2']);
  });

  it('should push items to back and maintain FIFO order', () => {
    const ring = new CircularBuffer<number>(3);

    ring.pushBack(10);
    ring.pushBack(20);
    ring.pushBack(30);

    expect(ring.toArray()).toEqual([10, 20, 30]);

    // Adding 4th item to back should drop 10 (oldest at front)
    ring.pushBack(40);
    expect(ring.toArray()).toEqual([20, 30, 40]);
  });

  it('should support pushFrontUnique to update MRU position without duplicates', () => {
    const ring = new CircularBuffer<{ id: string; title: string }>(4);

    ring.pushFrontUnique({ id: '1', title: 'Pasoori' }, (x) => x.id);
    ring.pushFrontUnique({ id: '2', title: 'Downers at Dusk' }, (x) => x.id);
    ring.pushFrontUnique({ id: '3', title: 'Kahani Suno' }, (x) => x.id);

    expect(ring.toArray().map((x) => x.title)).toEqual(['Kahani Suno', 'Downers at Dusk', 'Pasoori']);

    // Re-adding 'Pasoori' (id: '1') should move it to index 0 without duplicates
    ring.pushFrontUnique({ id: '1', title: 'Pasoori (Remastered)' }, (x) => x.id);

    expect(ring.size).toBe(3);
    expect(ring.toArray().map((x) => x.title)).toEqual(['Pasoori (Remastered)', 'Kahani Suno', 'Downers at Dusk']);
  });

  it('should retrieve items by logical index with pointer wraparound', () => {
    const ring = new CircularBuffer<string>(3);

    ring.pushFront('A');
    ring.pushFront('B');
    ring.pushFront('C');

    expect(ring.get(0)).toBe('C');
    expect(ring.get(1)).toBe('B');
    expect(ring.get(2)).toBe('A');
    expect(ring.get(3)).toBeUndefined();
    expect(ring.get(-1)).toBeUndefined();
  });

  it('should pop from front and back correctly', () => {
    const ring = new CircularBuffer<number>(3);
    ring.pushBack(1);
    ring.pushBack(2);
    ring.pushBack(3);

    expect(ring.popFront()).toBe(1);
    expect(ring.toArray()).toEqual([2, 3]);
    expect(ring.size).toBe(2);

    expect(ring.popBack()).toBe(3);
    expect(ring.toArray()).toEqual([2]);
    expect(ring.size).toBe(1);
  });

  it('should remove items matching predicate and compact buffer', () => {
    const ring = new CircularBuffer<number>(5);
    ring.fromArray([1, 2, 3, 4, 5]);

    const removed = ring.removeWhere((n) => n % 2 === 0);
    expect(removed).toBe(2); // 2 and 4 removed
    expect(ring.toArray()).toEqual([1, 3, 5]);
    expect(ring.size).toBe(3);
  });

  it('should clear buffer completely', () => {
    const ring = new CircularBuffer<string>(3);
    ring.pushBack('X');
    ring.pushBack('Y');

    ring.clear();
    expect(ring.size).toBe(0);
    expect(ring.isEmpty).toBe(true);
    expect(ring.toArray()).toEqual([]);
  });
});
