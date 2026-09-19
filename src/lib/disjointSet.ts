/**
 * Disjoint-Set Union (DSU / Union-Find) Data Structure
 *
 * Implements an optimal Disjoint-Set Union with:
 * 1. Path Compression: Flattens the tree during find operations to point nodes directly to root.
 * 2. Union by Rank: Always attaches the shallower tree under the root of the deeper tree.
 *
 * Time Complexity: Nearly constant O(alpha(N)) amortized time per operation,
 * where alpha is the Inverse Ackermann function (alpha(N) < 5 for all practical N).
 */
export class DisjointSet<T = string> {
  private parent = new Map<T, T>();
  private rank = new Map<T, number>();
  private clusterSizes = new Map<T, number>();
  private elementCount = 0;
  private clusterCount = 0;

  constructor(elements?: Iterable<T>) {
    if (elements) {
      for (const el of elements) {
        this.makeSet(el);
      }
    }
  }

  /**
   * Initializes an element into its own singleton set.
   * If the element already exists, this is a no-op.
   */
  public makeSet(element: T): void {
    if (!this.parent.has(element)) {
      this.parent.set(element, element);
      this.rank.set(element, 0);
      this.clusterSizes.set(element, 1);
      this.elementCount++;
      this.clusterCount++;
    }
  }

  /**
   * Finds the canonical representative of the set containing `element`.
   * Applies Path Compression to flatten the traversal tree in O(alpha(N)).
   */
  public find(element: T): T {
    if (!this.parent.has(element)) {
      this.makeSet(element);
      return element;
    }

    const currentParent = this.parent.get(element)!;
    if (currentParent !== element) {
      // Path compression: recursively find root and update direct parent pointer
      const root = this.find(currentParent);
      this.parent.set(element, root);
      return root;
    }

    return currentParent;
  }

  /**
   * Merges the sets containing elements `a` and `b`.
   * Applies Union by Rank to maintain logarithmic tree height.
   *
   * @returns true if two previously disjoint sets were merged, false if already in the same set.
   */
  public union(a: T, b: T): boolean {
    const rootA = this.find(a);
    const rootB = this.find(b);

    // Already in the same disjoint set
    if (rootA === rootB) {
      return false;
    }

    const rankA = this.rank.get(rootA) || 0;
    const rankB = this.rank.get(rootB) || 0;
    const sizeA = this.clusterSizes.get(rootA) || 1;
    const sizeB = this.clusterSizes.get(rootB) || 1;

    // Union by rank: attach smaller rank tree under larger rank tree
    if (rankA < rankB) {
      this.parent.set(rootA, rootB);
      this.clusterSizes.set(rootB, sizeA + sizeB);
      this.clusterSizes.delete(rootA);
    } else if (rankA > rankB) {
      this.parent.set(rootB, rootA);
      this.clusterSizes.set(rootA, sizeA + sizeB);
      this.clusterSizes.delete(rootB);
    } else {
      // Same rank: attach rootB under rootA and increment rootA's rank
      this.parent.set(rootB, rootA);
      this.rank.set(rootA, rankA + 1);
      this.clusterSizes.set(rootA, sizeA + sizeB);
      this.clusterSizes.delete(rootB);
    }

    this.clusterCount--;
    return true;
  }

  /**
   * Checks whether elements `a` and `b` belong to the same connected component.
   */
  public connected(a: T, b: T): boolean {
    if (!this.parent.has(a) || !this.parent.has(b)) {
      return false;
    }
    return this.find(a) === this.find(b);
  }

  /**
   * Returns the size of the cluster containing `element`.
   */
  public getClusterSize(element: T): number {
    if (!this.parent.has(element)) {
      return 0;
    }
    const root = this.find(element);
    return this.clusterSizes.get(root) || 1;
  }

  /**
   * Returns all clusters (connected components) as a map from
   * canonical root representative to array of member elements.
   */
  public getClusters(): Map<T, T[]> {
    const clusters = new Map<T, T[]>();

    for (const element of this.parent.keys()) {
      const root = this.find(element);
      let group = clusters.get(root);
      if (!group) {
        group = [];
        clusters.set(root, group);
      }
      group.push(element);
    }

    return clusters;
  }

  /**
   * Returns the total number of distinct elements tracked.
   */
  public get size(): number {
    return this.elementCount;
  }

  /**
   * Returns the total number of disjoint clusters (connected components).
   */
  public get numClusters(): number {
    return this.clusterCount;
  }

  /**
   * Clears the data structure.
   */
  public clear(): void {
    this.parent.clear();
    this.rank.clear();
    this.clusterSizes.clear();
    this.elementCount = 0;
    this.clusterCount = 0;
  }
}
