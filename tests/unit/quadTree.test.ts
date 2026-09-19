import { describe, it, expect, beforeEach } from 'vitest';
import {
  BoundingBox,
  QuadTree,
  SpatialPoint,
  VisualizerParticleSystem,
  VisualizerParticle,
} from '../../src/lib/quadTree';

describe('Step 30: QuadTree 2D Spatial Partitioning Engine', () => {
  describe('BoundingBox Geometric Primitives', () => {
    it('correctly evaluates point containment including edges', () => {
      const box = new BoundingBox(10, 10, 100, 50);

      expect(box.containsPoint(10, 10)).toBe(true); // top-left corner
      expect(box.containsPoint(110, 60)).toBe(true); // bottom-right corner
      expect(box.containsPoint(50, 30)).toBe(true); // center
      expect(box.containsPoint(9, 30)).toBe(false); // left outside
      expect(box.containsPoint(111, 30)).toBe(false); // right outside
      expect(box.containsPoint(50, 9)).toBe(false); // above
      expect(box.containsPoint(50, 61)).toBe(false); // below
    });

    it('correctly calculates box-box intersection', () => {
      const boxA = new BoundingBox(0, 0, 100, 100);
      const boxB = new BoundingBox(50, 50, 100, 100);
      const boxC = new BoundingBox(200, 200, 50, 50);
      const boxTouching = new BoundingBox(100, 0, 50, 50);

      expect(boxA.intersectsBox(boxB)).toBe(true);
      expect(boxB.intersectsBox(boxA)).toBe(true);
      expect(boxA.intersectsBox(boxC)).toBe(false);
      expect(boxA.intersectsBox(boxTouching)).toBe(true);
    });

    it('correctly calculates circle-box intersection', () => {
      const box = new BoundingBox(100, 100, 100, 100);

      // Circle center inside box
      expect(box.intersectsCircle(150, 150, 10)).toBe(true);

      // Circle intersecting right edge
      expect(box.intersectsCircle(205, 150, 10)).toBe(true);

      // Circle touching bottom-right corner diagonally
      // Corner is (200, 200), center at (203, 204), dist = sqrt(9 + 16) = 5
      expect(box.intersectsCircle(203, 204, 5)).toBe(true);
      expect(box.intersectsCircle(203, 204, 4.9)).toBe(false);

      // Circle far away
      expect(box.intersectsCircle(500, 500, 20)).toBe(false);
    });

    it('calculates minimum distance from an arbitrary point to box perimeter', () => {
      const box = new BoundingBox(10, 10, 100, 50);

      // Point inside box has distance 0
      expect(box.minDistanceToPoint(20, 20)).toBe(0);

      // Point to the left
      expect(box.minDistanceToPoint(0, 20)).toBe(10);

      // Point to the right
      expect(box.minDistanceToPoint(120, 20)).toBe(10);

      // Point above
      expect(box.minDistanceToPoint(50, 0)).toBe(10);

      // Point below
      expect(box.minDistanceToPoint(50, 70)).toBe(10);

      // Diagonal from top-left (10, 10)
      // dx = 10 - 7 = 3, dy = 10 - 6 = 4 -> dist = 5
      expect(box.minDistanceToPoint(7, 6)).toBeCloseTo(5, 5);
    });
  });

  describe('QuadTree Insertion & Spatial Decomposition', () => {
    let qtree: QuadTree<string>;

    beforeEach(() => {
      qtree = new QuadTree<string>(new BoundingBox(0, 0, 100, 100), 4, 4);
    });

    it('initializes empty and rejects points out of bounds', () => {
      expect(qtree.count()).toBe(0);
      expect(qtree.insert({ x: -10, y: 50, data: 'out' })).toBe(false);
      expect(qtree.insert({ x: 105, y: 50, data: 'out' })).toBe(false);
      expect(qtree.count()).toBe(0);
    });

    it('inserts points up to capacity without subdivision', () => {
      expect(qtree.insert({ x: 10, y: 10, data: 'p1' })).toBe(true);
      expect(qtree.insert({ x: 20, y: 20, data: 'p2' })).toBe(true);
      expect(qtree.insert({ x: 30, y: 30, data: 'p3' })).toBe(true);
      expect(qtree.insert({ x: 40, y: 40, data: 'p4' })).toBe(true);
      expect(qtree.count()).toBe(4);
    });

    it('subdivides into 4 quadrants when capacity is exceeded', () => {
      // Points distributed across quadrants
      qtree.insert({ x: 25, y: 25, data: 'NW' });
      qtree.insert({ x: 75, y: 25, data: 'NE' });
      qtree.insert({ x: 25, y: 75, data: 'SW' });
      qtree.insert({ x: 75, y: 75, data: 'SE' });

      // 5th point triggers subdivision
      expect(qtree.insert({ x: 10, y: 10, data: 'NW2' })).toBe(true);
      expect(qtree.count()).toBe(5);
    });

    it('respects maxDepth when points cluster at identical or close coordinates', () => {
      const shallowTree = new QuadTree<string>(new BoundingBox(0, 0, 100, 100), 2, 2);
      for (let i = 0; i < 10; i++) {
        expect(shallowTree.insert({ x: 50, y: 50, data: `center-${i}` })).toBe(true);
      }
      expect(shallowTree.count()).toBe(10);
    });

    it('clears all points and collapses subdivided child nodes', () => {
      for (let i = 0; i < 20; i++) {
        qtree.insert({ x: i * 4, y: i * 4, data: `item-${i}` });
      }
      expect(qtree.count()).toBe(20);

      qtree.clear();
      expect(qtree.count()).toBe(0);
      expect(qtree.queryRange(new BoundingBox(0, 0, 100, 100))).toEqual([]);
    });
  });

  describe('Range & Radial Queries', () => {
    let qtree: QuadTree<number>;
    const points: SpatialPoint<number>[] = [];

    beforeEach(() => {
      qtree = new QuadTree<number>(new BoundingBox(0, 0, 200, 200), 4, 6);
      points.length = 0;

      // Seed a 10x10 grid of points spaced 20 units apart
      let id = 0;
      for (let x = 10; x < 200; x += 20) {
        for (let y = 10; y < 200; y += 20) {
          const pt = { x, y, data: id++ };
          points.push(pt);
          qtree.insert(pt);
        }
      }
    });

    it('correctly queries rectangular range matching brute-force ground truth', () => {
      const searchBox = new BoundingBox(30, 30, 80, 80);
      const results = qtree.queryRange(searchBox);

      // Brute-force truth
      const expected = points.filter(p => searchBox.containsPoint(p.x, p.y));

      expect(results.length).toBe(expected.length);
      const resultSet = new Set(results.map(r => r.data));
      for (const exp of expected) {
        expect(resultSet.has(exp.data)).toBe(true);
      }
    });

    it('returns empty array when query range is completely disjoint', () => {
      const disjointBox = new BoundingBox(300, 300, 50, 50);
      expect(qtree.queryRange(disjointBox)).toEqual([]);
    });

    it('correctly queries circular radius matching Euclidean distance filter', () => {
      const cx = 100;
      const cy = 100;
      const radius = 45;

      const results = qtree.queryRadius(cx, cy, radius);

      // Brute force truth
      const radSq = radius * radius;
      const expected = points.filter(p => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        return dx * dx + dy * dy <= radSq;
      });

      expect(results.length).toBe(expected.length);
      const resultSet = new Set(results.map(r => r.data));
      for (const exp of expected) {
        expect(resultSet.has(exp.data)).toBe(true);
      }
    });
  });

  describe('Branch-and-Bound Nearest Neighbor Search', () => {
    it('returns null on an empty tree', () => {
      const emptyTree = new QuadTree<string>(new BoundingBox(0, 0, 100, 100));
      expect(emptyTree.findNearestNeighbor(50, 50)).toBeNull();
    });

    it('finds exact nearest point against brute-force linear search over scattered points', () => {
      const tree = new QuadTree<number>(new BoundingBox(0, 0, 1000, 1000), 4, 8);
      const dataset: SpatialPoint<number>[] = [];

      // Pseudo-random deterministic point generation
      for (let i = 0; i < 150; i++) {
        const x = (i * 37) % 1000;
        const y = (i * 67) % 1000;
        const pt = { x, y, data: i };
        dataset.push(pt);
        tree.insert(pt);
      }

      // Test multiple probe points
      const testProbes = [
        { x: 120, y: 340 },
        { x: 500, y: 500 },
        { x: 0, y: 0 },
        { x: 999, y: 999 },
        { x: 42, y: 888 },
      ];

      for (const probe of testProbes) {
        const nnResult = tree.findNearestNeighbor(probe.x, probe.y);
        expect(nnResult).not.toBeNull();

        // Brute force comparison
        let bestDist = Infinity;
        let bestPoint = dataset[0];
        for (const p of dataset) {
          const dx = p.x - probe.x;
          const dy = p.y - probe.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bestDist) {
            bestDist = dist;
            bestPoint = p;
          }
        }

        expect(nnResult!.distance).toBeCloseTo(bestDist, 6);
        expect(nnResult!.point.data).toBe(bestPoint.data);
      }
    });
  });

  describe('VisualizerParticleSystem Audio Dynamics', () => {
    let system: VisualizerParticleSystem;

    beforeEach(() => {
      system = new VisualizerParticleSystem(500, 500);
    });

    it('adds particles and tracks particle count', () => {
      expect(system.getParticleCount()).toBe(0);

      const p1: VisualizerParticle = { id: 'p1', energy: 0.1, frequencyBand: 'subBass', radius: 4 };
      const p2: VisualizerParticle = { id: 'p2', energy: 0.2, frequencyBand: 'highs', radius: 2 };

      expect(system.addParticle(100, 100, p1)).toBe(true);
      expect(system.addParticle(200, 200, p2)).toBe(true);
      expect(system.getParticleCount()).toBe(2);
    });

    it('excites particles in shockwave radius on bass beats', () => {
      const pNear: VisualizerParticle = { id: 'near', energy: 0.2, frequencyBand: 'bass', radius: 5 };
      const pFar: VisualizerParticle = { id: 'far', energy: 0.2, frequencyBand: 'mids', radius: 3 };

      system.addParticle(100, 100, pNear);
      system.addParticle(400, 400, pFar);

      // Emit shockwave at (100, 100) with radius 50
      const excited = system.emitBeatShockwave(100, 100, 50, 0.5);

      expect(excited.length).toBe(1);
      expect(excited[0].data.id).toBe('near');
      expect(pNear.energy).toBeCloseTo(0.7, 5); // 0.2 + 0.5
      expect(pFar.energy).toBe(0.2); // Unaffected

      // Energy clamped to max 1.0
      system.emitBeatShockwave(100, 100, 50, 0.8);
      expect(pNear.energy).toBe(1.0);
    });

    it('locates nearest sound source for binaural listener position', () => {
      system.addParticle(50, 50, { id: 'src-1', energy: 0.5, frequencyBand: 'mids', radius: 4 });
      system.addParticle(400, 400, { id: 'src-2', energy: 0.8, frequencyBand: 'bass', radius: 6 });

      const nearest = system.findNearestSoundSource(60, 50);
      expect(nearest).not.toBeNull();
      expect(nearest!.point.data.id).toBe('src-1');
      expect(nearest!.distance).toBeCloseTo(10, 5);
    });

    it('clears all particles cleanly', () => {
      system.addParticle(100, 100, { id: 'p1', energy: 0.5, frequencyBand: 'mids', radius: 4 });
      expect(system.getParticleCount()).toBe(1);

      system.clear();
      expect(system.getParticleCount()).toBe(0);
    });
  });
});
