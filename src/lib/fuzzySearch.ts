/**
 * High-Performance Metric Space Search & Typo Tolerance Engine
 * Implements Levenshtein Edit Distance & Burkhard-Keller (BK) Tree.
 */

/**
 * Computes Levenshtein edit distance between two strings using a memory-efficient
 * two-row sliding dynamic programming buffer.
 * Time Complexity: O(m * n)
 * Space Complexity: O(min(m, n))
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  // Swap to ensure s2 is shorter for minimal space usage
  const [shorter, longer] = s1.length < s2.length ? [s1, s2] : [s2, s1];
  const m = shorter.length;
  const n = longer.length;

  let prevRow = new Array(m + 1);
  let currRow = new Array(m + 1);

  for (let i = 0; i <= m; i++) {
    prevRow[i] = i;
  }

  for (let j = 1; j <= n; j++) {
    currRow[0] = j;
    const char2 = longer.charCodeAt(j - 1);

    for (let i = 1; i <= m; i++) {
      const char1 = shorter.charCodeAt(i - 1);
      const cost = char1 === char2 ? 0 : 1;

      currRow[i] = Math.min(
        prevRow[i] + 1,       // Deletion
        currRow[i - 1] + 1,   // Insertion
        prevRow[i - 1] + cost // Substitution
      );
    }

    // Swap row references
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[m];
}

/**
 * Computes a normalized similarity ratio between 0.0 (completely different) and 1.0 (identical).
 */
export function similarityRatio(s1: string, s2: string): number {
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, 1.0 - dist / maxLen);
}

export interface BKNode<T> {
  term: string;
  payload: T;
  children: Map<number, BKNode<T>>;
}

export interface FuzzySearchResult<T> {
  term: string;
  payload: T;
  distance: number;
  similarity: number;
}

/**
 * Burkhard-Keller (BK) Tree
 * Organizes string metric space into a discrete metric tree.
 * Prunes non-matching branches in sub-linear O(log N) time using the Triangle Inequality:
 * |d(root, query) - d(root, child)| <= maxDistance
 */
export class BKTree<T> {
  private root: BKNode<T> | null = null;
  private _size = 0;

  get size(): number {
    return this._size;
  }

  /**
   * Inserts a term and associated payload into the BK-Tree.
   * Time Complexity: O(log N * L) on average.
   */
  insert(term: string, payload: T): void {
    const clean = term.toLowerCase().trim();
    if (!clean) return;

    if (!this.root) {
      this.root = {
        term: clean,
        payload,
        children: new Map(),
      };
      this._size = 1;
      return;
    }

    let curr = this.root;
    while (true) {
      const d = levenshteinDistance(curr.term, clean);
      if (d === 0) {
        // Exact term match: update payload
        curr.payload = payload;
        return;
      }

      const nextNode = curr.children.get(d);
      if (nextNode) {
        curr = nextNode;
      } else {
        curr.children.set(d, {
          term: clean,
          payload,
          children: new Map(),
        });
        this._size++;
        return;
      }
    }
  }

  /**
   * Inserts an entity by indexing both the full phrase and individual word tokens (>= 3 chars).
   * Allows sub-word typos like "arijt" to match "Arijit Singh" with distance 1.
   */
  insertTokens(phrase: string, payload: T): void {
    const clean = phrase.toLowerCase().trim();
    if (!clean) return;

    this.insert(clean, payload);

    const tokens = clean.split(/[\s\-_]+/);
    if (tokens.length > 1) {
      for (const token of tokens) {
        if (token.length >= 3) {
          this.insert(token, payload);
        }
      }
    }
  }

  /**
   * Searches the BK-Tree for all candidates within edit distance <= maxDistance.
   * Prunes subtrees that violate the metric triangle inequality.
   * Time Complexity: Sub-linear O(log N) average.
   */
  search(query: string, maxDistance = 2, limit = 5): FuzzySearchResult<T>[] {
    const clean = query.toLowerCase().trim();
    if (!clean || !this.root) return [];

    const matches: FuzzySearchResult<T>[] = [];
    const seenPayloads = new Set<T>();
    const stack: BKNode<T>[] = [this.root];

    while (stack.length > 0) {
      const node = stack.pop()!;
      const d = levenshteinDistance(node.term, clean);

      if (d <= maxDistance) {
        if (!seenPayloads.has(node.payload)) {
          seenPayloads.add(node.payload);
          const maxLen = Math.max(node.term.length, clean.length);
          matches.push({
            term: node.term,
            payload: node.payload,
            distance: d,
            similarity: maxLen > 0 ? (maxLen - d) / maxLen : 1,
          });
        }
      }

      // Triangle inequality pruning:
      // Only traverse children where edge weight d_child satisfies |d - d_child| <= maxDistance
      const low = Math.max(1, d - maxDistance);
      const high = d + maxDistance;

      for (const [edgeWeight, childNode] of node.children) {
        if (edgeWeight >= low && edgeWeight <= high) {
          stack.push(childNode);
        }
      }
    }

    // Sort by smallest distance first, then highest similarity
    matches.sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return b.similarity - a.similarity;
    });

    return matches.slice(0, limit);
  }

  /**
   * Clears the tree.
   */
  clear(): void {
    this.root = null;
    this._size = 0;
  }
}
