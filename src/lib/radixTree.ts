/**
 * Compressed Radix Tree (Patricia Trie) with Inverted Metadata Index
 *
 * Implements a compact, space-optimized prefix tree that compresses non-branching
 * character paths into multi-character edge labels.
 *
 * Properties:
 * - Edge Compression: Shared prefixes are grouped, eliminating redundant single-child nodes.
 * - Bounded Node Invariant: Total internal nodes <= 2K - 1 for K stored keys.
 * - Inverted Index Mapping: Associates keys and prefixes with sets of entity IDs (e.g. Track IDs).
 * - Branch Merging: Automatically collapses single-child nodes upon deletion.
 */

export class RadixNode<V = string> {
  public edgeLabel: string;
  public children: Map<string, RadixNode<V>> = new Map();
  public values: Set<V> = new Set();
  public isTerminal = false;

  constructor(edgeLabel = '') {
    this.edgeLabel = edgeLabel;
  }
}

export class RadixTree<V = string> {
  private root: RadixNode<V>;
  private keyCount = 0;
  private nodeCount = 1; // Root node

  constructor() {
    this.root = new RadixNode<V>('');
  }

  /**
   * Computes length of longest common prefix between two strings.
   */
  private commonPrefixLength(a: string, b: string): number {
    const maxLen = Math.min(a.length, b.length);
    let i = 0;
    while (i < maxLen && a[i] === b[i]) {
      i++;
    }
    return i;
  }

  /**
   * Inserts a key and an optional associated entity value into the Radix Tree.
   * If the key already exists, the value is added to its existing value set.
   */
  public insert(key: string, value?: V): void {
    const normalizedKey = key.trim().toLowerCase();
    if (!normalizedKey) return;

    let current = this.root;
    let remaining = normalizedKey;

    while (remaining.length > 0) {
      const firstChar = remaining[0];
      const child = current.children.get(firstChar);

      if (!child) {
        // No matching branch: create new child node
        const newNode = new RadixNode<V>(remaining);
        newNode.isTerminal = true;
        if (value !== undefined) {
          newNode.values.add(value);
        }
        current.children.set(firstChar, newNode);
        this.nodeCount++;
        this.keyCount++;
        return;
      }

      const lcp = this.commonPrefixLength(remaining, child.edgeLabel);

      if (lcp === child.edgeLabel.length) {
        // Exact match with child edge label: continue down
        if (lcp === remaining.length) {
          // Reached the target key
          if (!child.isTerminal) {
            child.isTerminal = true;
            this.keyCount++;
          }
          if (value !== undefined) {
            child.values.add(value);
          }
          return;
        }

        // Remaining key extends past child edge label: traverse deeper
        current = child;
        remaining = remaining.slice(lcp);
      } else {
        // Edge split required at lcp:
        // Existing: child [lcp...]
        // New split node [0..lcp-1] replaces child under current
        const splitNode = new RadixNode<V>(child.edgeLabel.slice(0, lcp));
        this.nodeCount++;

        // Attach split node to current
        current.children.set(firstChar, splitNode);

        // Truncate child edge and attach under splitNode
        child.edgeLabel = child.edgeLabel.slice(lcp);
        splitNode.children.set(child.edgeLabel[0], child);

        if (lcp === remaining.length) {
          // New key terminates at the split node
          splitNode.isTerminal = true;
          this.keyCount++;
          if (value !== undefined) {
            splitNode.values.add(value);
          }
        } else {
          // Create new sibling child under splitNode for the rest of remaining
          const newChild = new RadixNode<V>(remaining.slice(lcp));
          newChild.isTerminal = true;
          this.keyCount++;
          if (value !== undefined) {
            newChild.values.add(value);
          }
          splitNode.children.set(newChild.edgeLabel[0], newChild);
          this.nodeCount++;
        }
        return;
      }
    }
  }

  /**
   * Searches for an exact key match.
   * Returns Set of associated values if found and terminal, or null if not found.
   */
  public search(key: string): Set<V> | null {
    const normalizedKey = key.trim().toLowerCase();
    if (!normalizedKey) return null;

    let current = this.root;
    let remaining = normalizedKey;

    while (remaining.length > 0) {
      const firstChar = remaining[0];
      const child = current.children.get(firstChar);

      if (!child) return null;

      if (!remaining.startsWith(child.edgeLabel)) {
        // Does not match full edge label
        if (child.edgeLabel === remaining && child.isTerminal) {
          return new Set(child.values);
        }
        return null;
      }

      remaining = remaining.slice(child.edgeLabel.length);
      current = child;
    }

    return current.isTerminal ? new Set(current.values) : null;
  }

  /**
   * Searches for all values associated with keys having the given prefix.
   * Traverses the subtree from the prefix match and aggregates all terminal values.
   */
  public searchPrefix(prefix: string): Set<V> {
    const normalizedPrefix = prefix.trim().toLowerCase();
    const results = new Set<V>();
    if (!normalizedPrefix) return results;

    let current = this.root;
    let remaining = normalizedPrefix;

    while (remaining.length > 0) {
      const firstChar = remaining[0];
      const child = current.children.get(firstChar);

      if (!child) {
        return results;
      }

      const lcp = this.commonPrefixLength(remaining, child.edgeLabel);

      if (lcp === remaining.length) {
        // The prefix matched up to or inside child.edgeLabel!
        // All descendants of child match the prefix
        this.collectValues(child, results);
        return results;
      }

      if (lcp === child.edgeLabel.length) {
        remaining = remaining.slice(lcp);
        current = child;
      } else {
        // Mismatch before end of remaining prefix
        return results;
      }
    }

    this.collectValues(current, results);
    return results;
  }

  /**
   * Retrieves all full string keys in the tree that match the given prefix.
   */
  public findKeysWithPrefix(prefix: string, limit = 50): string[] {
    const normalizedPrefix = prefix.trim().toLowerCase();
    if (!normalizedPrefix) return [];

    let current = this.root;
    let remaining = normalizedPrefix;
    let matchedPrefix = '';

    while (remaining.length > 0) {
      const firstChar = remaining[0];
      const child = current.children.get(firstChar);
      if (!child) return [];

      const lcp = this.commonPrefixLength(remaining, child.edgeLabel);

      if (lcp === remaining.length) {
        matchedPrefix += child.edgeLabel;
        const keys: string[] = [];
        this.collectKeys(child, matchedPrefix, keys, limit);
        return keys;
      }

      if (lcp === child.edgeLabel.length) {
        matchedPrefix += child.edgeLabel;
        remaining = remaining.slice(lcp);
        current = child;
      } else {
        return [];
      }
    }

    const keys: string[] = [];
    this.collectKeys(current, matchedPrefix, keys, limit);
    return keys;
  }

  private collectValues(node: RadixNode<V>, accumulator: Set<V>): void {
    if (node.isTerminal) {
      node.values.forEach((v) => accumulator.add(v));
    }
    for (const child of node.children.values()) {
      this.collectValues(child, accumulator);
    }
  }

  private collectKeys(node: RadixNode<V>, currentPath: string, accumulator: string[], limit: number): void {
    if (accumulator.length >= limit) return;

    if (node.isTerminal) {
      accumulator.push(currentPath);
    }

    for (const child of node.children.values()) {
      if (accumulator.length >= limit) return;
      this.collectKeys(child, currentPath + child.edgeLabel, accumulator, limit);
    }
  }

  /**
   * Deletes a key (or specific value under a key) and re-compacts single-child branches.
   */
  public delete(key: string, value?: V): boolean {
    const normalizedKey = key.trim().toLowerCase();
    if (!normalizedKey) return false;

    return this.deleteHelper(this.root, normalizedKey, value);
  }

  private deleteHelper(current: RadixNode<V>, remaining: string, value?: V): boolean {
    if (remaining.length === 0) {
      if (!current.isTerminal) return false;

      if (value !== undefined) {
        const deleted = current.values.delete(value);
        if (current.values.size === 0) {
          current.isTerminal = false;
          this.keyCount--;
        }
        return deleted;
      }

      current.isTerminal = false;
      current.values.clear();
      this.keyCount--;
      return true;
    }

    const firstChar = remaining[0];
    const child = current.children.get(firstChar);
    if (!child) return false;

    if (!remaining.startsWith(child.edgeLabel)) return false;

    const deleted = this.deleteHelper(child, remaining.slice(child.edgeLabel.length), value);

    if (deleted) {
      // Branch compaction and cleanup:
      if (!child.isTerminal && child.children.size === 0) {
        // Child is empty and has no subtrees: remove child
        current.children.delete(firstChar);
        this.nodeCount--;
      } else if (!child.isTerminal && child.children.size === 1) {
        // Child is internal non-terminal with exactly 1 grandchild: merge child with grandchild
        const grandchild = Array.from(child.children.values())[0];
        child.edgeLabel += grandchild.edgeLabel;
        child.children = grandchild.children;
        child.isTerminal = grandchild.isTerminal;
        child.values = grandchild.values;
        this.nodeCount--;
      }
    }

    return deleted;
  }

  public getKeyCount(): number {
    return this.keyCount;
  }

  public getNodeCount(): number {
    return this.nodeCount;
  }

  public clear(): void {
    this.root = new RadixNode<V>('');
    this.keyCount = 0;
    this.nodeCount = 1;
  }
}

// Global Inverted Metadata Search Index Singleton
export const metadataRadixIndex = new RadixTree<string>();
