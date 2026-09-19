/**
 * Augmented Indexable Skip List (William Pugh 1990)
 *
 * Implements a multi-level randomized probabilistic data structure where forward links
 * are augmented with link 'spans' (number of base elements skipped).
 *
 * Provides:
 * - O(log N) rank-based random access: getByRank(k)
 * - O(log N) rank-based insertion: insert(id, value, rank)
 * - O(log N) rank-based deletion: deleteByRank(k)
 * - O(log N) drag-and-drop reordering: move(fromRank, toRank) with zero array copying
 * - O(1) bidirectional sequential queue traversal (next/prev via backward pointers)
 */

import { Track } from '../types';

export interface SkipListLevel<T> {
  forward: SkipListNode<T> | null;
  span: number;
}

export class SkipListNode<T> {
  public id: string;
  public value: T;
  public backward: SkipListNode<T> | null = null;
  public levels: SkipListLevel<T>[];

  constructor(id: string, value: T, level: number) {
    this.id = id;
    this.value = value;
    this.levels = new Array(level);
    for (let i = 0; i < level; i++) {
      this.levels[i] = { forward: null, span: 0 };
    }
  }
}

export class IndexableSkipList<T = any> {
  private readonly maxLevel: number;
  private readonly probability: number;
  private head: SkipListNode<T>;
  private tail: SkipListNode<T> | null = null;
  private level = 1;
  private length = 0;

  constructor(maxLevel = 16, probability = 0.5) {
    this.maxLevel = maxLevel;
    this.probability = probability;

    // Head sentinel node
    this.head = new SkipListNode<T>('__HEAD__', null as any, maxLevel);
    for (let i = 0; i < maxLevel; i++) {
      this.head.levels[i] = { forward: null, span: 0 };
    }
  }

  /**
   * Generates a random geometric tower height.
   */
  private randomLevel(): number {
    let lvl = 1;
    while (Math.random() < this.probability && lvl < this.maxLevel) {
      lvl++;
    }
    return lvl;
  }

  /**
   * Inserts an element at a specific 0-based rank in O(log N) time.
   * If rank is omitted or >= length, appends to the end.
   */
  public insert(id: string, value: T, rank?: number): void {
    const targetRank = (rank === undefined || rank >= this.length)
      ? this.length
      : Math.max(0, rank);

    // update[i] will store the last node at level i before the insertion position
    const update: SkipListNode<T>[] = new Array(this.maxLevel);
    // rankAccum[i] stores the accumulated rank of update[i]
    const rankAccum = new Array<number>(this.maxLevel).fill(0);

    let curr = this.head;
    let traversed = 0;

    for (let i = this.level - 1; i >= 0; i--) {
      while (
        curr.levels[i].forward !== null &&
        traversed + curr.levels[i].span <= targetRank
      ) {
        traversed += curr.levels[i].span;
        curr = curr.levels[i].forward!;
      }

      update[i] = curr;
      rankAccum[i] = traversed;
    }

    const newLevel = this.randomLevel();

    // If new node has more levels than current list height, initialize higher levels
    if (newLevel > this.level) {
      for (let i = this.level; i < newLevel; i++) {
        rankAccum[i] = 0;
        update[i] = this.head;
        update[i].levels[i].span = this.length;
      }
      this.level = newLevel;
    }

    const newNode = new SkipListNode<T>(id, value, newLevel);

    // Splice new node into tower levels and adjust spans
    for (let i = 0; i < newLevel; i++) {
      newNode.levels[i].forward = update[i].levels[i].forward;
      update[i].levels[i].forward = newNode;

      // Span adjustment:
      if (newNode.levels[i].forward === null) {
        newNode.levels[i].span = 0;
      } else {
        newNode.levels[i].span = update[i].levels[i].span - (targetRank - rankAccum[i]);
      }
      update[i].levels[i].span = (targetRank - rankAccum[i]) + 1;
    }

    // Increment spans of unaffected higher levels
    for (let i = newLevel; i < this.level; i++) {
      if (update[i].levels[i].forward !== null) {
        update[i].levels[i].span++;
      }
    }

    // Level 0 backward pointer setup
    newNode.backward = update[0] === this.head ? null : update[0];
    if (newNode.levels[0].forward) {
      newNode.levels[0].forward.backward = newNode;
    } else {
      this.tail = newNode;
    }

    this.length++;
  }

  /**
   * Retrieves value at 0-based rank in O(log N) time.
   */
  public getByRank(rank: number): T | null {
    if (rank < 0 || rank >= this.length) return null;

    const target = rank + 1; // 1-based target for span accumulation
    let curr = this.head;
    let traversed = 0;

    for (let i = this.level - 1; i >= 0; i--) {
      while (
        curr.levels[i].forward !== null &&
        traversed + curr.levels[i].span <= target
      ) {
        traversed += curr.levels[i].span;
        curr = curr.levels[i].forward!;
      }

      if (traversed === target) {
        return curr.value;
      }
    }

    return null;
  }

  /**
   * Retrieves node and value at 0-based rank in O(log N) time.
   */
  public getNodeByRank(rank: number): SkipListNode<T> | null {
    if (rank < 0 || rank >= this.length) return null;

    const target = rank + 1;
    let curr = this.head;
    let traversed = 0;

    for (let i = this.level - 1; i >= 0; i--) {
      while (
        curr.levels[i].forward !== null &&
        traversed + curr.levels[i].span <= target
      ) {
        traversed += curr.levels[i].span;
        curr = curr.levels[i].forward!;
      }

      if (traversed === target) {
        return curr;
      }
    }

    return null;
  }

  /**
   * Returns 0-based rank of item with given id in O(N) or -1 if not found.
   */
  public getRank(id: string): number {
    let curr = this.head.levels[0].forward;
    let rank = 0;
    while (curr) {
      if (curr.id === id) return rank;
      curr = curr.levels[0].forward;
      rank++;
    }
    return -1;
  }

  /**
   * Deletes element at 0-based rank in O(log N) time.
   */
  public deleteByRank(rank: number): T | null {
    if (rank < 0 || rank >= this.length) return null;

    const target = rank + 1;
    const update: SkipListNode<T>[] = new Array(this.maxLevel);
    let curr = this.head;
    let traversed = 0;

    for (let i = this.level - 1; i >= 0; i--) {
      while (
        curr.levels[i].forward !== null &&
        traversed + curr.levels[i].span < target
      ) {
        traversed += curr.levels[i].span;
        curr = curr.levels[i].forward!;
      }
      update[i] = curr;
    }

    const targetNode = update[0].levels[0].forward;
    if (!targetNode) return null;

    const deletedValue = targetNode.value;

    // Remove node and update spans
    for (let i = 0; i < this.level; i++) {
      if (update[i].levels[i].forward === targetNode) {
        if (targetNode.levels[i].forward === null) {
          update[i].levels[i].span = 0;
        } else {
          update[i].levels[i].span += targetNode.levels[i].span - 1;
        }
        update[i].levels[i].forward = targetNode.levels[i].forward;
      } else {
        if (update[i].levels[i].forward !== null) {
          update[i].levels[i].span -= 1;
        }
      }
    }

    // Update backward pointer
    if (targetNode.levels[0].forward) {
      targetNode.levels[0].forward.backward = targetNode.backward;
    } else {
      this.tail = targetNode.backward;
    }

    // Lower list level if top levels are now empty
    while (this.level > 1 && this.head.levels[this.level - 1].forward === null) {
      this.level--;
    }

    this.length--;
    return deletedValue;
  }

  /**
   * Deletes element by ID.
   */
  public deleteById(id: string): T | null {
    const rank = this.getRank(id);
    if (rank === -1) return null;
    return this.deleteByRank(rank);
  }

  /**
   * Drag-and-drop reordering: moves element from fromRank to toRank in O(log N) time.
   */
  public move(fromRank: number, toRank: number): boolean {
    if (
      fromRank < 0 ||
      fromRank >= this.length ||
      toRank < 0 ||
      toRank >= this.length ||
      fromRank === toRank
    ) {
      return false;
    }

    const node = this.getNodeByRank(fromRank);
    if (!node) return false;

    const id = node.id;
    const value = this.deleteByRank(fromRank);
    if (value === null) return false;

    this.insert(id, value, toRank);
    return true;
  }

  /**
   * Exports the skip list contents into an ordered array in O(N) time.
   */
  public toArray(): T[] {
    const result: T[] = [];
    let curr = this.head.levels[0].forward;
    while (curr) {
      result.push(curr.value);
      curr = curr.levels[0].forward;
    }
    return result;
  }

  /**
   * Exports in reverse order via level 0 backward pointers.
   */
  public toArrayReverse(): T[] {
    const result: T[] = [];
    let curr = this.tail;
    while (curr) {
      result.push(curr.value);
      curr = curr.backward;
    }
    return result;
  }

  public size(): number {
    return this.length;
  }

  public clear(): void {
    this.head = new SkipListNode<T>('__HEAD__', null as any, this.maxLevel);
    for (let i = 0; i < this.maxLevel; i++) {
      this.head.levels[i] = { forward: null, span: 0 };
    }
    this.tail = null;
    this.level = 1;
    this.length = 0;
  }
}

/**
 * High-Performance Audio Playback Queue Subsystem
 */
export class AudioPlaylistQueue {
  private skipList = new IndexableSkipList<Track>();
  private currentIndex = 0;

  constructor(initialTracks?: Track[]) {
    if (initialTracks && initialTracks.length > 0) {
      for (const t of initialTracks) {
        this.enqueue(t);
      }
    }
  }

  public enqueue(track: Track): void {
    this.skipList.insert(track.id, track);
  }

  public insertAt(track: Track, index: number): void {
    this.skipList.insert(track.id, track, index);
  }

  /**
   * Queues a track to play immediately after the current playing track.
   */
  public playNext(track: Track): void {
    const nextPos = Math.min(this.currentIndex + 1, this.skipList.size());
    this.skipList.insert(track.id, track, nextPos);
  }

  public removeAt(index: number): Track | null {
    return this.skipList.deleteByRank(index);
  }

  public removeById(id: string): Track | null {
    return this.skipList.deleteById(id);
  }

  public reorder(fromIndex: number, toIndex: number): boolean {
    const ok = this.skipList.move(fromIndex, toIndex);
    if (ok) {
      // Adjust currentIndex if necessary
      if (this.currentIndex === fromIndex) {
        this.currentIndex = toIndex;
      } else if (fromIndex < this.currentIndex && toIndex >= this.currentIndex) {
        this.currentIndex--;
      } else if (fromIndex > this.currentIndex && toIndex <= this.currentIndex) {
        this.currentIndex++;
      }
    }
    return ok;
  }

  public getCurrentTrack(): Track | null {
    return this.skipList.getByRank(this.currentIndex);
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public setCurrentIndex(index: number): void {
    if (index >= 0 && index < this.skipList.size()) {
      this.currentIndex = index;
    }
  }

  public nextTrack(): Track | null {
    if (this.currentIndex + 1 < this.skipList.size()) {
      this.currentIndex++;
      return this.getCurrentTrack();
    }
    return null;
  }

  public previousTrack(): Track | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.getCurrentTrack();
    }
    return null;
  }

  public getTracks(): Track[] {
    return this.skipList.toArray();
  }

  public size(): number {
    return this.skipList.size();
  }

  public clear(): void {
    this.skipList.clear();
    this.currentIndex = 0;
  }
}
