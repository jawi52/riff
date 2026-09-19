/**
 * High-Performance Generic Binary Heap / Priority Queue
 *
 * Implements an array-backed binary tree with O(log N) insertion and deletion,
 * O(1) peek, and O(N log K) Top-K selection with O(K) memory overhead.
 */

export type Comparator<T> = (a: T, b: T) => number;

export class PriorityQueue<T> {
  private heap: T[] = [];
  private compare: Comparator<T>;

  constructor(comparator: Comparator<T>) {
    this.compare = comparator;
  }

  public size(): number {
    return this.heap.length;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public peek(): T | undefined {
    return this.heap[0];
  }

  public push(item: T): void {
    this.heap.push(item);
    this.siftUp(this.heap.length - 1);
  }

  public pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.siftDown(0);
    }
    return top;
  }

  public replaceRoot(item: T): T | undefined {
    if (this.heap.length === 0) {
      this.push(item);
      return undefined;
    }
    const oldRoot = this.heap[0];
    this.heap[0] = item;
    this.siftDown(0);
    return oldRoot;
  }

  public clear(): void {
    this.heap = [];
  }

  public toArray(): T[] {
    return [...this.heap];
  }

  private siftUp(index: number): void {
    let curr = index;
    while (curr > 0) {
      const parent = (curr - 1) >> 1;
      if (this.compare(this.heap[curr], this.heap[parent]) < 0) {
        const tmp = this.heap[curr];
        this.heap[curr] = this.heap[parent];
        this.heap[parent] = tmp;
        curr = parent;
      } else {
        break;
      }
    }
  }

  private siftDown(index: number): void {
    let curr = index;
    const len = this.heap.length;
    const half = len >> 1;

    while (curr < half) {
      const left = (curr << 1) + 1;
      const right = left + 1;
      let best = curr;

      if (left < len && this.compare(this.heap[left], this.heap[best]) < 0) {
        best = left;
      }
      if (right < len && this.compare(this.heap[right], this.heap[best]) < 0) {
        best = right;
      }

      if (best !== curr) {
        const tmp = this.heap[curr];
        this.heap[curr] = this.heap[best];
        this.heap[best] = tmp;
        curr = best;
      } else {
        break;
      }
    }
  }
}

/**
 * Extracts the Top-K highest-ranked elements from any collection in O(N log K) time.
 * Uses an auxiliary Min-Heap of size K, guaranteeing O(K) space complexity.
 *
 * @param items Collection of items
 * @param k Number of top elements to retrieve
 * @param comparator Function returning > 0 if a > b, < 0 if a < b, 0 if equal
 * @returns Array of Top-K items sorted in descending order (highest first)
 */
export function findTopK<T>(
  items: Iterable<T>,
  k: number,
  comparator: (a: T, b: T) => number
): T[] {
  if (k <= 0) return [];

  // Min-Heap of size K: root is always the minimum of the top-K candidates
  const minHeap = new PriorityQueue<T>(comparator);

  for (const item of items) {
    if (minHeap.size() < k) {
      minHeap.push(item);
    } else {
      const root = minHeap.peek()!;
      if (comparator(item, root) > 0) {
        minHeap.replaceRoot(item);
      }
    }
  }

  // Drain heap in ascending order, then reverse to return descending
  const result: T[] = [];
  while (!minHeap.isEmpty()) {
    result.push(minHeap.pop()!);
  }

  return result.reverse();
}
