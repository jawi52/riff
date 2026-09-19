/**
 * Augmented Self-Balancing Interval Tree (CLRS Chapter 14)
 *
 * Implements an AVL-balanced binary search tree where each node represents a
 * closed time interval [start, end] and is augmented with the subtree maximum end time:
 * node.max = max(node.interval.end, node.left.max, node.right.max)
 *
 * Used for:
 * - Sub-millisecond lyric synchronization and word-level karaoke seeking.
 * - Point stabbing queries in O(log N) time: findActive(timeMs).
 * - Range overlap search in O(log N + K) time: findOverlapping(startMs, endMs).
 */

import { SyncedLyricLine } from '../types';

export interface Interval<T = any> {
  start: number;
  end: number;
  data: T;
}

export class IntervalNode<T = any> {
  public interval: Interval<T>;
  public max: number;
  public height = 1;
  public left: IntervalNode<T> | null = null;
  public right: IntervalNode<T> | null = null;

  constructor(interval: Interval<T>) {
    this.interval = interval;
    this.max = interval.end;
  }
}

export class IntervalTree<T = any> {
  private root: IntervalNode<T> | null = null;
  private nodeCount = 0;

  private getHeight(node: IntervalNode<T> | null): number {
    return node ? node.height : 0;
  }

  private getMax(node: IntervalNode<T> | null): number {
    return node ? node.max : -Infinity;
  }

  private getBalance(node: IntervalNode<T> | null): number {
    return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
  }

  /**
   * Recalculates height and subtree max end time in O(1).
   */
  private updateNode(node: IntervalNode<T>): void {
    node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
    node.max = Math.max(node.interval.end, this.getMax(node.left), this.getMax(node.right));
  }

  private rotateRight(y: IntervalNode<T>): IntervalNode<T> {
    const x = y.left!;
    const t2 = x.right;

    x.right = y;
    y.left = t2;

    this.updateNode(y);
    this.updateNode(x);

    return x;
  }

  private rotateLeft(x: IntervalNode<T>): IntervalNode<T> {
    const y = x.right!;
    const t2 = y.left;

    y.left = x;
    x.right = t2;

    this.updateNode(x);
    this.updateNode(y);

    return y;
  }

  private rebalance(node: IntervalNode<T>): IntervalNode<T> {
    this.updateNode(node);
    const balance = this.getBalance(node);

    // Left Heavy
    if (balance > 1) {
      if (this.getBalance(node.left) < 0) {
        node.left = this.rotateLeft(node.left!);
      }
      return this.rotateRight(node);
    }

    // Right Heavy
    if (balance < -1) {
      if (this.getBalance(node.right) > 0) {
        node.right = this.rotateRight(node.right!);
      }
      return this.rotateLeft(node);
    }

    return node;
  }

  /**
   * Inserts an interval [start, end] into the augmented tree in O(log N) time.
   */
  public insert(start: number, end: number, data: T): void {
    const safeEnd = Math.max(start, end);
    const interval: Interval<T> = { start, end: safeEnd, data };
    this.root = this.insertNode(this.root, interval);
    this.nodeCount++;
  }

  private insertNode(
    current: IntervalNode<T> | null,
    interval: Interval<T>
  ): IntervalNode<T> {
    if (!current) {
      return new IntervalNode<T>(interval);
    }

    if (interval.start < current.interval.start) {
      current.left = this.insertNode(current.left, interval);
    } else {
      current.right = this.insertNode(current.right, interval);
    }

    return this.rebalance(current);
  }

  /**
   * Stabbing query: finds the active interval containing a specific time point in O(log N) time.
   * start <= timeMs <= end
   */
  public findActive(timeMs: number): Interval<T> | null {
    return this.findActiveHelper(this.root, timeMs);
  }

  private findActiveHelper(node: IntervalNode<T> | null, timeMs: number): Interval<T> | null {
    if (!node || node.max < timeMs) {
      return null;
    }

    // If left subtree max >= timeMs, search left first
    if (node.left && node.left.max >= timeMs) {
      const leftResult = this.findActiveHelper(node.left, timeMs);
      if (leftResult) return leftResult;
    }

    // Check current node
    if (node.interval.start <= timeMs && timeMs <= node.interval.end) {
      return node.interval;
    }

    // If target is beyond start, search right
    if (node.right && timeMs >= node.interval.start) {
      return this.findActiveHelper(node.right, timeMs);
    }

    return null;
  }

  /**
   * Range overlap query: finds all intervals overlapping [startMs, endMs] in O(log N + K) time.
   */
  public findOverlapping(startMs: number, endMs: number): Interval<T>[] {
    const results: Interval<T>[] = [];
    const safeStart = Math.min(startMs, endMs);
    const safeEnd = Math.max(startMs, endMs);
    this.findOverlappingHelper(this.root, safeStart, safeEnd, results);
    return results.sort((a, b) => a.start - b.start);
  }

  private findOverlappingHelper(
    node: IntervalNode<T> | null,
    startMs: number,
    endMs: number,
    accumulator: Interval<T>[]
  ): void {
    if (!node) return;

    // Pruning: if max end time in this subtree is less than query start, no intervals can overlap
    if (node.max < startMs) {
      return;
    }

    // Search left subtree
    if (node.left && node.left.max >= startMs) {
      this.findOverlappingHelper(node.left, startMs, endMs, accumulator);
    }

    // Check current node overlap: node.start <= endMs AND node.end >= startMs
    if (node.interval.start <= endMs && node.interval.end >= startMs) {
      accumulator.push(node.interval);
    }

    // Search right subtree if query start could fall within right subtree
    if (node.right && node.interval.start <= endMs) {
      this.findOverlappingHelper(node.right, startMs, endMs, accumulator);
    }
  }

  /**
   * Builds an Augmented Interval Tree from a sorted array of SyncedLyricLine objects.
   * Computes dynamic end times based on the next lyric line's start timestamp.
   */
  public static fromLyrics(
    lyrics: SyncedLyricLine[],
    defaultLineDurationMs = 3500
  ): IntervalTree<string> {
    const tree = new IntervalTree<string>();
    if (!lyrics || lyrics.length === 0) return tree;

    for (let i = 0; i < lyrics.length; i++) {
      const line = lyrics[i];
      let endMs: number;

      if (i < lyrics.length - 1) {
        const nextLine = lyrics[i + 1];
        // Line ends when the next line begins, bounded by a reasonable ceiling
        endMs = nextLine.timeMs > line.timeMs
          ? Math.min(nextLine.timeMs, line.timeMs + defaultLineDurationMs * 2)
          : line.timeMs + defaultLineDurationMs;
      } else {
        endMs = line.timeMs + defaultLineDurationMs;
      }

      tree.insert(line.timeMs, endMs, line.text);
    }

    return tree;
  }

  public size(): number {
    return this.nodeCount;
  }

  public clear(): void {
    this.root = null;
    this.nodeCount = 0;
  }

  public getAll(): Interval<T>[] {
    const list: Interval<T>[] = [];
    this.inOrderTraversal(this.root, list);
    return list;
  }

  private inOrderTraversal(node: IntervalNode<T> | null, list: Interval<T>[]): void {
    if (!node) return;
    this.inOrderTraversal(node.left, list);
    list.push(node.interval);
    this.inOrderTraversal(node.right, list);
  }
}
