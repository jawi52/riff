/**
 * Algorithmic Fisher-Yates (Knuth) Shuffle and Permutation Manager
 * Provides O(N) unbiased random ordering and deterministic history navigation.
 */

/**
 * Standard in-place Fisher-Yates algorithm on a copy of an array.
 * Time Complexity: O(N)
 * Space Complexity: O(N)
 */
export function fisherYatesShuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Generates an initial shuffle permutation of queue indices [0 ... queueLength - 1].
 * The current track index is anchored at position 0 so the active song continues uninterrupted,
 * followed by an unbiased Fisher-Yates permutation of all remaining tracks.
 */
export function generateShuffleOrder(queueLength: number, activeQueueIndex: number): number[] {
  if (queueLength <= 0) return [];
  if (queueLength === 1) return [0];

  const clampedActive = Math.max(0, Math.min(activeQueueIndex, queueLength - 1));
  const remainingIndices: number[] = [];

  for (let i = 0; i < queueLength; i++) {
    if (i !== clampedActive) {
      remainingIndices.push(i);
    }
  }

  const shuffledRemaining = fisherYatesShuffle(remainingIndices);
  return [clampedActive, ...shuffledRemaining];
}

/**
 * Inserts a newly added track index into the unplayed portion of the shuffle permutation.
 */
export function insertTrackIntoShuffleOrder(
  shuffledIndices: number[],
  currentShufflePos: number,
  newTrackIndex: number
): number[] {
  if (shuffledIndices.length === 0) return [newTrackIndex];

  const updated = [...shuffledIndices];
  // Insert at a random position in the unplayed slice (after currentShufflePos)
  const unplayedStart = Math.min(currentShufflePos + 1, updated.length);
  const insertIndex = unplayedStart + Math.floor(Math.random() * (updated.length - unplayedStart + 1));
  updated.splice(insertIndex, 0, newTrackIndex);
  return updated;
}

/**
 * Safely updates shuffle order when a track is removed from the queue.
 * Decrements any indices that were shifted down, removes the deleted index,
 * and recalculates the current shuffle position pointer.
 */
export function removeTrackFromShuffleOrder(
  shuffledIndices: number[],
  currentShufflePos: number,
  removedQueueIndex: number
): { updatedIndices: number[]; newShufflePos: number } {
  let newShufflePos = currentShufflePos;
  const targetPos = shuffledIndices.indexOf(removedQueueIndex);

  if (targetPos !== -1 && targetPos < currentShufflePos) {
    newShufflePos = Math.max(0, newShufflePos - 1);
  }

  const updatedIndices: number[] = [];
  for (let i = 0; i < shuffledIndices.length; i++) {
    const idx = shuffledIndices[i];
    if (idx === removedQueueIndex) {
      continue;
    }
    // Shift indices greater than removed down by 1
    updatedIndices.push(idx > removedQueueIndex ? idx - 1 : idx);
  }

  // Bound check position pointer
  if (newShufflePos >= updatedIndices.length) {
    newShufflePos = Math.max(0, updatedIndices.length - 1);
  }

  return { updatedIndices, newShufflePos };
}
