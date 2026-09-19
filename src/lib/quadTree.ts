/**
 * QuadTree 2D Spatial Partitioning Engine (Finkel & Bentley 1974)
 *
 * Implements recursive four-quadrant spatial decomposition for high-performance 2D audio:
 * - O(log N + K) circular shockwave queries for audio bass drops and visualizer particle dynamics.
 * - O(log N + K) rectangular range searches.
 * - O(log N) branch-and-bound nearest neighbor search for 2D binaural soundfield positioning.
 * - Eliminates O(N^2) all-pairs particle bottlenecks, enabling 60 FPS audio visualizer animations.
 */

export class BoundingBox {
  public x: number; // left
  public y: number; // top
  public width: number;
  public height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = Math.max(0, width);
    this.height = Math.max(0, height);
  }

  public get minX(): number {
    return this.x;
  }
  public get maxX(): number {
    return this.x + this.width;
  }
  public get minY(): number {
    return this.y;
  }
  public get maxY(): number {
    return this.y + this.height;
  }

  /**
   * Checks if a 2D coordinate falls within this bounding box.
   */
  public containsPoint(px: number, py: number): boolean {
    return (
      px >= this.x &&
      px <= this.x + this.width &&
      py >= this.y &&
      py <= this.y + this.height
    );
  }

  /**
   * Evaluates axis-aligned bounding box (AABB) intersection.
   */
  public intersectsBox(other: BoundingBox): boolean {
    return !(
      other.x > this.x + this.width ||
      other.x + other.width < this.x ||
      other.y > this.y + this.height ||
      other.y + other.height < this.y
    );
  }

  /**
   * Evaluates exact circle-rectangle intersection.
   */
  public intersectsCircle(cx: number, cy: number, radius: number): boolean {
    const closestX = Math.max(this.x, Math.min(cx, this.x + this.width));
    const closestY = Math.max(this.y, Math.min(cy, this.y + this.height));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy <= radius * radius;
  }

  /**
   * Calculates minimum Euclidean distance from a point to the closest edge of this box.
   */
  public minDistanceToPoint(px: number, py: number): number {
    const closestX = Math.max(this.x, Math.min(px, this.x + this.width));
    const closestY = Math.max(this.y, Math.min(py, this.y + this.height));
    const dx = px - closestX;
    const dy = py - closestY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

export interface SpatialPoint<T = any> {
  x: number;
  y: number;
  data: T;
}

export class QuadTree<T = any> {
  public boundary: BoundingBox;
  public readonly capacity: number;
  public readonly maxDepth: number;
  public readonly depth: number;

  private points: SpatialPoint<T>[] = [];
  private divided = false;

  private northWest: QuadTree<T> | null = null;
  private northEast: QuadTree<T> | null = null;
  private southWest: QuadTree<T> | null = null;
  private southEast: QuadTree<T> | null = null;

  constructor(
    boundary: BoundingBox,
    capacity = 4,
    maxDepth = 8,
    depth = 0
  ) {
    this.boundary = boundary;
    this.capacity = capacity;
    this.maxDepth = maxDepth;
    this.depth = depth;
  }

  /**
   * Subdivides current node into 4 quadrant children.
   */
  private subdivide(): void {
    const hw = this.boundary.width / 2;
    const hh = this.boundary.height / 2;
    const x = this.boundary.x;
    const y = this.boundary.y;

    const nextDepth = this.depth + 1;

    this.northWest = new QuadTree<T>(new BoundingBox(x, y, hw, hh), this.capacity, this.maxDepth, nextDepth);
    this.northEast = new QuadTree<T>(new BoundingBox(x + hw, y, hw, hh), this.capacity, this.maxDepth, nextDepth);
    this.southWest = new QuadTree<T>(new BoundingBox(x, y + hh, hw, hh), this.capacity, this.maxDepth, nextDepth);
    this.southEast = new QuadTree<T>(new BoundingBox(x + hw, y + hh, hw, hh), this.capacity, this.maxDepth, nextDepth);

    this.divided = true;

    // Distribute existing points to children
    const existing = this.points;
    this.points = [];

    for (const p of existing) {
      this.insertIntoChildren(p);
    }
  }

  private insertIntoChildren(point: SpatialPoint<T>): boolean {
    if (this.northWest && this.northWest.insert(point)) return true;
    if (this.northEast && this.northEast.insert(point)) return true;
    if (this.southWest && this.southWest.insert(point)) return true;
    if (this.southEast && this.southEast.insert(point)) return true;

    // Point exactly on boundary intersection lines
    this.points.push(point);
    return true;
  }

  /**
   * Inserts a spatial point into the QuadTree in O(log N) time.
   */
  public insert(point: SpatialPoint<T>): boolean {
    if (!this.boundary.containsPoint(point.x, point.y)) {
      return false;
    }

    if (!this.divided) {
      if (this.points.length < this.capacity || this.depth >= this.maxDepth) {
        this.points.push(point);
        return true;
      }
      this.subdivide();
    }

    return this.insertIntoChildren(point);
  }

  /**
   * Rectangular range query in O(log N + K) time.
   */
  public queryRange(range: BoundingBox, found: SpatialPoint<T>[] = []): SpatialPoint<T>[] {
    if (!this.boundary.intersectsBox(range)) {
      return found;
    }

    for (const p of this.points) {
      if (range.containsPoint(p.x, p.y)) {
        found.push(p);
      }
    }

    if (this.divided) {
      this.northWest?.queryRange(range, found);
      this.northEast?.queryRange(range, found);
      this.southWest?.queryRange(range, found);
      this.southEast?.queryRange(range, found);
    }

    return found;
  }

  /**
   * Circular radial query in O(log N + K) time.
   * Useful for audio shockwave and bass-drop proximity calculations.
   */
  public queryRadius(
    cx: number,
    cy: number,
    radius: number,
    found: SpatialPoint<T>[] = []
  ): SpatialPoint<T>[] {
    if (!this.boundary.intersectsCircle(cx, cy, radius)) {
      return found;
    }

    const radSq = radius * radius;
    for (const p of this.points) {
      const dx = p.x - cx;
      const dy = p.y - cy;
      if (dx * dx + dy * dy <= radSq) {
        found.push(p);
      }
    }

    if (this.divided) {
      this.northWest?.queryRadius(cx, cy, radius, found);
      this.northEast?.queryRadius(cx, cy, radius, found);
      this.southWest?.queryRadius(cx, cy, radius, found);
      this.southEast?.queryRadius(cx, cy, radius, found);
    }

    return found;
  }

  /**
   * Finds the nearest neighbor to (x, y) using branch-and-bound pruning in O(log N) time.
   */
  public findNearestNeighbor(
    x: number,
    y: number
  ): { point: SpatialPoint<T>; distance: number } | null {
    let bestPoint: SpatialPoint<T> | null = null;
    let bestDist = Infinity;

    const search = (node: QuadTree<T>): void => {
      // Prune subtree if minimum possible distance to its bounding box exceeds current best
      if (node.boundary.minDistanceToPoint(x, y) >= bestDist) {
        return;
      }

      // Check current node's points
      for (const p of node.points) {
        const dx = p.x - x;
        const dy = p.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bestDist) {
          bestDist = dist;
          bestPoint = p;
        }
      }

      if (node.divided) {
        const children = [
          node.northWest!,
          node.northEast!,
          node.southWest!,
          node.southEast!,
        ];

        // Sort children by minimum distance to (x, y) to visit the most promising quadrant first
        children.sort(
          (a, b) => a.boundary.minDistanceToPoint(x, y) - b.boundary.minDistanceToPoint(x, y)
        );

        for (const child of children) {
          search(child);
        }
      }
    };

    search(this);

    return bestPoint !== null ? { point: bestPoint, distance: bestDist } : null;
  }

  public count(): number {
    let count = this.points.length;
    if (this.divided) {
      count += (this.northWest?.count() || 0);
      count += (this.northEast?.count() || 0);
      count += (this.southWest?.count() || 0);
      count += (this.southEast?.count() || 0);
    }
    return count;
  }

  public clear(): void {
    this.points = [];
    this.divided = false;
    this.northWest = null;
    this.northEast = null;
    this.southWest = null;
    this.southEast = null;
  }
}

/**
 * 2D Audio Visualizer Particle & Soundfield Subsystem
 */
export interface VisualizerParticle {
  id: string;
  energy: number;
  frequencyBand: 'subBass' | 'bass' | 'mids' | 'highs';
  radius: number;
}

export class VisualizerParticleSystem {
  private tree: QuadTree<VisualizerParticle>;
  private bounds: BoundingBox;

  constructor(width = 1000, height = 1000) {
    this.bounds = new BoundingBox(0, 0, width, height);
    this.tree = new QuadTree<VisualizerParticle>(this.bounds, 6, 8);
  }

  public addParticle(x: number, y: number, particle: VisualizerParticle): boolean {
    return this.tree.insert({ x, y, data: particle });
  }

  /**
   * Emits a radial shockwave on bass beats, exciting particles within radius in O(log N + K).
   */
  public emitBeatShockwave(
    cx: number,
    cy: number,
    radius: number,
    intensity = 1.0
  ): SpatialPoint<VisualizerParticle>[] {
    const excited = this.tree.queryRadius(cx, cy, radius);
    for (const p of excited) {
      p.data.energy = Math.min(1.0, p.data.energy + intensity);
    }
    return excited;
  }

  public findNearestSoundSource(
    listenerX: number,
    listenerY: number
  ): { point: SpatialPoint<VisualizerParticle>; distance: number } | null {
    return this.tree.findNearestNeighbor(listenerX, listenerY);
  }

  public getParticleCount(): number {
    return this.tree.count();
  }

  public clear(): void {
    this.tree.clear();
  }
}
