/**
 * High-Performance Generic Memory-Bounded LRU (Least Recently Used) Cache
 * Implemented using a Doubly Linked List + Hash Map for strictly O(1) reads, writes, and evictions.
 */

interface LRUNode<K, V> {
  key: K;
  value: V;
  expiresAt: number | null;
  prev: LRUNode<K, V> | null;
  next: LRUNode<K, V> | null;
}

export interface LRUCacheOptions {
  capacity: number;
  ttlMs?: number; // Optional default Time-To-Live in milliseconds
}

export class LRUCache<K, V> {
  private readonly capacity: number;
  private readonly defaultTtlMs?: number;
  private readonly map: Map<K, LRUNode<K, V>> = new Map();

  // Sentinel nodes to eliminate edge-case null checks on list boundaries
  private readonly head: LRUNode<K, V>;
  private readonly tail: LRUNode<K, V>;

  constructor(options: LRUCacheOptions) {
    if (!options || options.capacity <= 0) {
      throw new Error('LRUCache capacity must be greater than 0');
    }
    this.capacity = options.capacity;
    this.defaultTtlMs = options.ttlMs;

    this.head = {
      key: undefined as any,
      value: undefined as any,
      expiresAt: null,
      prev: null,
      next: null,
    };
    this.tail = {
      key: undefined as any,
      value: undefined as any,
      expiresAt: null,
      prev: null,
      next: null,
    };

    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * Retrieves an item from the cache and promotes it to Most Recently Used (MRU).
   * Returns undefined if item does not exist or has expired.
   * Time Complexity: O(1)
   */
  get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;

    // Check expiration
    if (this.isExpired(node)) {
      this.deleteNode(node);
      return undefined;
    }

    // Promote accessed node to MRU (head)
    this.detach(node);
    this.attachToHead(node);

    return node.value;
  }

  /**
   * Inspects an item without updating its access recency (does not promote).
   * Time Complexity: O(1)
   */
  peek(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;
    if (this.isExpired(node)) {
      this.deleteNode(node);
      return undefined;
    }
    return node.value;
  }

  /**
   * Inserts or updates an item in the cache, promoting it to Most Recently Used.
   * If capacity is exceeded, evicts the Least Recently Used item.
   * Time Complexity: O(1)
   */
  set(key: K, value: V, customTtlMs?: number): void {
    const ttl = customTtlMs !== undefined ? customTtlMs : this.defaultTtlMs;
    const expiresAt = ttl ? Date.now() + ttl : null;

    let node = this.map.get(key);

    if (node) {
      // Update existing node
      node.value = value;
      node.expiresAt = expiresAt;
      this.detach(node);
      this.attachToHead(node);
    } else {
      // Evict LRU node if at capacity
      if (this.map.size >= this.capacity) {
        this.evictLRU();
      }

      node = {
        key,
        value,
        expiresAt,
        prev: null,
        next: null,
      };

      this.map.set(key, node);
      this.attachToHead(node);
    }
  }

  /**
   * Checks if a key exists and has not expired.
   * Time Complexity: O(1)
   */
  has(key: K): boolean {
    const node = this.map.get(key);
    if (!node) return false;
    if (this.isExpired(node)) {
      this.deleteNode(node);
      return false;
    }
    return true;
  }

  /**
   * Deletes an item by key.
   * Time Complexity: O(1)
   */
  delete(key: K): boolean {
    const node = this.map.get(key);
    if (!node) return false;
    this.deleteNode(node);
    return true;
  }

  /**
   * Clears all cached items and resets the linked list.
   * Time Complexity: O(1)
   */
  clear(): void {
    this.map.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * Current number of non-expired cached entries.
   */
  get size(): number {
    return this.map.size;
  }

  /**
   * Returns all active keys in MRU-to-LRU order.
   */
  keys(): K[] {
    const result: K[] = [];
    let curr = this.head.next;
    while (curr && curr !== this.tail) {
      if (!this.isExpired(curr)) {
        result.push(curr.key);
      }
      curr = curr.next;
    }
    return result;
  }

  // --- Private Doubly Linked List Helpers ---

  private isExpired(node: LRUNode<K, V>): boolean {
    return node.expiresAt !== null && Date.now() > node.expiresAt;
  }

  private detach(node: LRUNode<K, V>): void {
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    node.prev = null;
    node.next = null;
  }

  private attachToHead(node: LRUNode<K, V>): void {
    node.prev = this.head;
    node.next = this.head.next;
    if (this.head.next) this.head.next.prev = node;
    this.head.next = node;
  }

  private deleteNode(node: LRUNode<K, V>): void {
    this.detach(node);
    this.map.delete(node.key);
  }

  private evictLRU(): LRUNode<K, V> | null {
    const lruNode = this.tail.prev;
    if (!lruNode || lruNode === this.head) return null;

    this.deleteNode(lruNode);
    return lruNode;
  }
}
