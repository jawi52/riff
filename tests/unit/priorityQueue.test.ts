import { describe, it, expect } from 'vitest';
import { PriorityQueue, findTopK } from '../../src/lib/priorityQueue';
import {
  recordPlayInteraction,
  recordCompletionInteraction,
  recordLikeInteraction,
  getTopAffinityArtist,
  getTopAffinityArtists,
  getTopAffinityGenres
} from '../../src/lib/affinityEngine';
import { Track } from '../../src/types';

describe('Binary Heap & PriorityQueue Engine', () => {
  it('should initialize empty and report correct size', () => {
    const pq = new PriorityQueue<number>((a, b) => a - b);
    expect(pq.isEmpty()).toBe(true);
    expect(pq.size()).toBe(0);
    expect(pq.peek()).toBeUndefined();
    expect(pq.pop()).toBeUndefined();
  });

  it('should maintain Min-Heap property and pop items in ascending order', () => {
    const pq = new PriorityQueue<number>((a, b) => a - b);
    const numbers = [45, 12, 89, 3, 27, 64, 1, 99, 15];
    numbers.forEach((n) => pq.push(n));

    expect(pq.size()).toBe(numbers.length);
    expect(pq.peek()).toBe(1);

    const extracted: number[] = [];
    while (!pq.isEmpty()) {
      extracted.push(pq.pop()!);
    }

    expect(extracted).toEqual([1, 3, 12, 15, 27, 45, 64, 89, 99]);
  });

  it('should maintain Max-Heap property with inverted comparator', () => {
    const maxPq = new PriorityQueue<number>((a, b) => b - a);
    const numbers = [45, 12, 89, 3, 27, 64, 1, 99, 15];
    numbers.forEach((n) => maxPq.push(n));

    expect(maxPq.peek()).toBe(99);

    const extracted: number[] = [];
    while (!maxPq.isEmpty()) {
      extracted.push(maxPq.pop()!);
    }

    expect(extracted).toEqual([99, 89, 64, 45, 27, 15, 12, 3, 1]);
  });

  it('should support replaceRoot operation with proper sift-down', () => {
    const pq = new PriorityQueue<number>((a, b) => a - b);
    [10, 20, 30, 40].forEach((n) => pq.push(n));

    expect(pq.peek()).toBe(10);
    const oldRoot = pq.replaceRoot(25);
    expect(oldRoot).toBe(10);
    expect(pq.peek()).toBe(20); // 20 is now minimum
    expect(pq.size()).toBe(4);
  });

  it('should clear all items cleanly', () => {
    const pq = new PriorityQueue<number>((a, b) => a - b);
    [1, 2, 3, 4].forEach((n) => pq.push(n));
    pq.clear();
    expect(pq.size()).toBe(0);
    expect(pq.isEmpty()).toBe(true);
    expect(pq.peek()).toBeUndefined();
  });
});

describe('Top-K Selection Engine (findTopK)', () => {
  it('should return empty array for empty inputs or k <= 0', () => {
    expect(findTopK([], 5, (a: number, b: number) => a - b)).toEqual([]);
    expect(findTopK([1, 2, 3], 0, (a, b) => a - b)).toEqual([]);
    expect(findTopK([1, 2, 3], -2, (a, b) => a - b)).toEqual([]);
  });

  it('should extract exact Top-K elements in descending order', () => {
    const items = [14, 82, 3, 91, 55, 27, 78, 62, 40];
    const top3 = findTopK(items, 3, (a, b) => a - b);
    expect(top3).toEqual([91, 82, 78]);

    const top5 = findTopK(items, 5, (a, b) => a - b);
    expect(top5).toEqual([91, 82, 78, 62, 55]);
  });

  it('should return all elements sorted descending when k >= total items', () => {
    const items = [5, 2, 8, 1];
    const top10 = findTopK(items, 10, (a, b) => a - b);
    expect(top10).toEqual([8, 5, 2, 1]);
  });

  it('should produce identical results to full O(N log N) sort across large randomized dataset', () => {
    const largeDataset: { id: number; score: number }[] = [];
    for (let i = 0; i < 1000; i++) {
      largeDataset.push({ id: i, score: Math.floor(Math.random() * 50000) });
    }

    const K = 10;
    const groundTruth = [...largeDataset]
      .sort((a, b) => b.score - a.score)
      .slice(0, K);

    const heapResult = findTopK(largeDataset, K, (a, b) => a.score - b.score);

    expect(heapResult.map((x) => x.score)).toEqual(groundTruth.map((x) => x.score));
  });

  it('should handle duplicate scores gracefully', () => {
    const items = [
      { name: 'A', score: 10 },
      { name: 'B', score: 30 },
      { name: 'C', score: 30 },
      { name: 'D', score: 20 }
    ];

    const top2 = findTopK(items, 2, (a, b) => a.score - b.score);
    expect(top2.length).toBe(2);
    expect(top2[0].score).toBe(30);
    expect(top2[1].score).toBe(30);
  });
});

describe('Affinity Engine Priority Queue Integration', () => {
  const sampleTrackA: Track = {
    id: 't-1',
    title: 'Song A',
    artist: 'Atif Aslam',
    duration: 200,
    coverUrl: '',
    sourceType: 'saavn',
    genre: 'Pakistani Pop'
  };

  const sampleTrackB: Track = {
    id: 't-2',
    title: 'Song B',
    artist: 'Arijit Singh',
    duration: 220,
    coverUrl: '',
    sourceType: 'saavn',
    genre: 'Bollywood Romance'
  };

  const sampleTrackC: Track = {
    id: 't-3',
    title: 'Song C',
    artist: 'Talwiinder',
    duration: 180,
    coverUrl: '',
    sourceType: 'saavn',
    genre: 'Punjabi Wave'
  };

  it('should calculate top affinity artist and genres accurately', () => {
    // Record multiple interactions
    recordPlayInteraction(sampleTrackA); // +2 Atif
    recordCompletionInteraction(sampleTrackA); // +5 Atif (Total 7)

    recordPlayInteraction(sampleTrackB); // +2 Arijit
    recordLikeInteraction(sampleTrackB, true); // +10 Arijit (Total 12)

    recordPlayInteraction(sampleTrackC); // +2 Talwiinder (Total 2)

    // Top single artist
    const topArtist = getTopAffinityArtist();
    expect(topArtist).not.toBeNull();
    expect(topArtist?.name).toBe('Arijit Singh');
    expect(topArtist?.score).toBeGreaterThanOrEqual(12);

    // Top multiple artists via Min-Heap findTopK
    const topArtists = getTopAffinityArtists(3);
    expect(topArtists.length).toBe(3);
    expect(topArtists[0].name).toBe('Arijit Singh');
    expect(topArtists[1].name).toBe('Atif Aslam');
    expect(topArtists[2].name).toBe('Talwiinder');

    // Top genres via Min-Heap findTopK
    const topGenres = getTopAffinityGenres(2);
    expect(topGenres.length).toBe(2);
    expect(topGenres[0]).toBe('Bollywood Romance');
    expect(topGenres[1]).toBe('Pakistani Pop');
  });
});
