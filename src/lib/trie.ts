/**
 * High-Performance Generic Prefix Tree (Trie)
 * Provides O(K) prefix search, autocomplete, and multi-word token indexing.
 */

export class TrieNode<T> {
  children: Map<string, TrieNode<T>> = new Map();
  isEndOfWord = false;
  values: T[] = [];
}

export class PrefixTrie<T> {
  private readonly root = new TrieNode<T>();
  private _size = 0;

  get size(): number {
    return this._size;
  }

  /**
   * Normalizes a search term (lowercased, trimmed, collapsed whitespace).
   */
  public normalize(str: string): string {
    return str.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * Inserts a key-value pair into the trie.
   * Time Complexity: O(L) where L is the key length.
   */
  insert(key: string, value: T): void {
    const clean = this.normalize(key);
    if (!clean) return;

    let curr = this.root;
    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      let nextNode = curr.children.get(char);
      if (!nextNode) {
        nextNode = new TrieNode<T>();
        curr.children.set(char, nextNode);
      }
      curr = nextNode;
    }

    if (!curr.isEndOfWord) {
      curr.isEndOfWord = true;
      this._size++;
    }

    // Avoid pushing duplicate identical values
    if (!curr.values.includes(value)) {
      curr.values.push(value);
    }
  }

  /**
   * Inserts a multi-word phrase into the trie by indexing both the full phrase
   * and each individual word token (e.g., "Guru Randhawa" is indexed as "guru randhawa"
   * and as "randhawa").
   */
  insertTokens(phrase: string, value: T): void {
    const clean = this.normalize(phrase);
    if (!clean) return;

    // 1. Insert full phrase
    this.insert(clean, value);

    // 2. Insert sub-word tokens
    const tokens = clean.split(/[\s\-_]+/);
    if (tokens.length > 1) {
      for (const token of tokens) {
        if (token.length >= 2) {
          this.insert(token, value);
        }
      }
    }
  }

  /**
   * Finds all values that match the given prefix.
   * Time Complexity: O(K + M) where K is prefix length and M is number of collected matches.
   */
  searchPrefix(prefix: string, limit = 10): T[] {
    const clean = this.normalize(prefix);
    if (!clean) return [];

    let curr = this.root;
    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      const nextNode = curr.children.get(char);
      if (!nextNode) {
        return []; // Prefix not found
      }
      curr = nextNode;
    }

    // BFS collection from the matched prefix node to prioritize shallower/closer matches
    const results: T[] = [];
    const seen = new Set<T>();
    const queue: TrieNode<T>[] = [curr];

    while (queue.length > 0 && results.length < limit) {
      const node = queue.shift()!;

      if (node.isEndOfWord) {
        for (const val of node.values) {
          if (!seen.has(val)) {
            seen.add(val);
            results.push(val);
            if (results.length >= limit) break;
          }
        }
      }

      for (const child of node.children.values()) {
        queue.push(child);
      }
    }

    return results;
  }

  /**
   * Checks if any word in the trie starts with the given prefix.
   * Time Complexity: O(K)
   */
  hasPrefix(prefix: string): boolean {
    const clean = this.normalize(prefix);
    if (!clean) return false;

    let curr = this.root;
    for (let i = 0; i < clean.length; i++) {
      const nextNode = curr.children.get(clean[i]);
      if (!nextNode) return false;
      curr = nextNode;
    }
    return true;
  }

  /**
   * Clears the entire trie.
   */
  clear(): void {
    this.root.children.clear();
    this.root.values = [];
    this.root.isEndOfWord = false;
    this._size = 0;
  }
}
