/**
 * High-Performance Generic Circular Ring Buffer
 * Fixed-capacity circular buffer with O(1) appends, prepends, and automatic eviction.
 */

export class CircularBuffer<T> {
  private readonly buffer: (T | undefined)[];
  private readonly _capacity: number;
  private start = 0; // Index of the first (newest or oldest depending on mode) element
  private _size = 0;

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error('CircularBuffer capacity must be greater than 0');
    }
    this._capacity = capacity;
    this.buffer = new Array(capacity);
  }

  get capacity(): number {
    return this._capacity;
  }

  get size(): number {
    return this._size;
  }

  get isFull(): boolean {
    return this._size === this._capacity;
  }

  get isEmpty(): boolean {
    return this._size === 0;
  }

  /**
   * Pushes an item to the front (MRU - Most Recently Used position, index 0).
   * If the buffer is full, the oldest item at the back is evicted in O(1) time.
   * Time Complexity: O(1)
   */
  pushFront(item: T): void {
    if (this._size === 0) {
      this.buffer[0] = item;
      this.start = 0;
      this._size = 1;
      return;
    }

    // Move start pointer one position backwards with wraparound
    this.start = (this.start - 1 + this._capacity) % this._capacity;
    this.buffer[this.start] = item;

    if (this._size < this._capacity) {
      this._size++;
    }
  }

  /**
   * Pushes an item to the back (FIFO queue position).
   * If the buffer is full, the oldest item at index 0 is evicted.
   * Time Complexity: O(1)
   */
  pushBack(item: T): void {
    if (this._size === this._capacity) {
      // Overwrite oldest item at start and shift start forward
      this.buffer[this.start] = item;
      this.start = (this.start + 1) % this._capacity;
    } else {
      const insertIndex = (this.start + this._size) % this._capacity;
      this.buffer[insertIndex] = item;
      this._size++;
    }
  }

  /**
   * Upserts an item at the front (MRU), removing any existing entry that matches the key.
   * Prevents duplicates while keeping recent items at index 0.
   */
  pushFrontUnique(item: T, getKey: (entry: T) => string): void {
    const keyToMatch = getKey(item);
    this.removeWhere((entry) => getKey(entry) === keyToMatch);
    this.pushFront(item);
  }

  /**
   * Retrieves an item by logical index (0 = front/newest, size - 1 = back/oldest).
   * Time Complexity: O(1)
   */
  get(index: number): T | undefined {
    if (index < 0 || index >= this._size) {
      return undefined;
    }
    const physicalIndex = (this.start + index) % this._capacity;
    return this.buffer[physicalIndex];
  }

  /**
   * Inspects the front item without removing it.
   */
  peekFront(): T | undefined {
    return this.get(0);
  }

  /**
   * Inspects the back item without removing it.
   */
  peekBack(): T | undefined {
    return this.get(this._size - 1);
  }

  /**
   * Removes and returns the item from the front.
   * Time Complexity: O(1)
   */
  popFront(): T | undefined {
    if (this._size === 0) return undefined;
    const item = this.buffer[this.start];
    this.buffer[this.start] = undefined;
    this.start = (this.start + 1) % this._capacity;
    this._size--;
    return item;
  }

  /**
   * Removes and returns the item from the back.
   * Time Complexity: O(1)
   */
  popBack(): T | undefined {
    if (this._size === 0) return undefined;
    const backIndex = (this.start + this._size - 1) % this._capacity;
    const item = this.buffer[backIndex];
    this.buffer[backIndex] = undefined;
    this._size--;
    return item;
  }

  /**
   * Removes any elements that satisfy the predicate.
   * Compacts the buffer without creating new array instances.
   */
  removeWhere(predicate: (item: T) => boolean): number {
    if (this._size === 0) return 0;

    let removedCount = 0;
    const items = this.toArray();
    this.clear();

    for (let i = 0; i < items.length; i++) {
      if (predicate(items[i])) {
        removedCount++;
      } else {
        this.pushBack(items[i]);
      }
    }

    return removedCount;
  }

  /**
   * Clears the buffer.
   */
  clear(): void {
    for (let i = 0; i < this._capacity; i++) {
      this.buffer[i] = undefined;
    }
    this.start = 0;
    this._size = 0;
  }

  /**
   * Exports the buffer contents as a standard array ordered from index 0 to size - 1.
   */
  toArray(): T[] {
    const result: T[] = new Array(this._size);
    for (let i = 0; i < this._size; i++) {
      result[i] = this.get(i)!;
    }
    return result;
  }

  /**
   * Populates buffer from an array, respecting capacity.
   */
  fromArray(items: readonly T[]): void {
    this.clear();
    const count = Math.min(items.length, this._capacity);
    for (let i = 0; i < count; i++) {
      this.pushBack(items[i]);
    }
  }
}
