import { describe, it, expect } from 'vitest';
import {
  fisherYatesShuffle,
  generateShuffleOrder,
  insertTrackIntoShuffleOrder,
  removeTrackFromShuffleOrder,
} from '../../src/lib/shuffle';

describe('Algorithmic Fisher-Yates Shuffle Engine', () => {
  it('should produce a complete permutation with no missing or duplicate elements', () => {
    const original = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffled = fisherYatesShuffle(original);

    expect(shuffled).toHaveLength(original.length);
    // Same elements present
    expect([...shuffled].sort((a, b) => a - b)).toEqual(original);
  });

  it('should anchor the currently active track at index 0', () => {
    const queueLength = 10;
    const activeIndex = 4;
    const order = generateShuffleOrder(queueLength, activeIndex);

    expect(order).toHaveLength(queueLength);
    // Active track stays first
    expect(order[0]).toBe(activeIndex);

    // All other indices must be present exactly once
    const sorted = [...order].sort((a, b) => a - b);
    const expected = Array.from({ length: queueLength }, (_, i) => i);
    expect(sorted).toEqual(expected);
  });

  it('should handle edge cases like empty and single-element queues', () => {
    expect(generateShuffleOrder(0, 0)).toEqual([]);
    expect(generateShuffleOrder(1, 0)).toEqual([0]);
  });

  it('should insert newly queued track into the unplayed slice of the shuffle order', () => {
    // Current order [3, 0, 1, 4, 2], current position is 1 (track 0 has been played)
    const initialOrder = [3, 0, 1, 4, 2];
    const currentPos = 1;
    const newTrackIndex = 5;

    const updated = insertTrackIntoShuffleOrder(initialOrder, currentPos, newTrackIndex);

    expect(updated).toHaveLength(initialOrder.length + 1);
    expect(updated).toContain(newTrackIndex);

    // Already played tracks [3, 0] must remain undisturbed in their positions
    expect(updated[0]).toBe(3);
    expect(updated[1]).toBe(0);

    // The new index must be placed at index 2 or later
    const newIndexPos = updated.indexOf(newTrackIndex);
    expect(newIndexPos).toBeGreaterThanOrEqual(2);
  });

  it('should remove a track and decrement indices greater than removed', () => {
    // Initial indices: [0, 1, 2, 3, 4]
    // Say shuffle order is [2, 0, 4, 1, 3] and currently playing position is 0 (track 2)
    const order = [2, 0, 4, 1, 3];
    const currentPos = 0;
    const trackToRemove = 1;

    const { updatedIndices, newShufflePos } = removeTrackFromShuffleOrder(order, currentPos, trackToRemove);

    // Track at index 1 was removed, so length is 4 and indices are [0, 1, 2, 3]
    expect(updatedIndices).toHaveLength(4);
    expect([...updatedIndices].sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);

    // Tracks originally > 1 (i.e. 2, 3, 4) should be shifted down by 1:
    // 2 -> 1, 4 -> 3, 3 -> 2
    // 0 stays 0
    // So [2, 0, 4, 1, 3] becomes [1, 0, 3, 2]
    expect(updatedIndices).toEqual([1, 0, 3, 2]);
    expect(newShufflePos).toBe(0);
  });

  it('should adjust currentShufflePos if a track prior to current position was removed', () => {
    const order = [0, 1, 2, 3];
    const currentPos = 2; // currently playing track 2
    const trackToRemove = 0; // remove track 0 which was at position 0 (prior)

    const { updatedIndices, newShufflePos } = removeTrackFromShuffleOrder(order, currentPos, trackToRemove);

    // Position pointer shifts left
    expect(newShufflePos).toBe(1);
    expect(updatedIndices).toEqual([0, 1, 2]); // original 1->0, 2->1, 3->2
  });
});
