import { describe, it, expect } from 'vitest';
import {
  calculateVirtualRange,
  findScrollParent,
  getScrollOffset
} from '../../src/lib/virtualizer';

describe('DOM Virtualization Engine (calculateVirtualRange)', () => {
  it('should return all zeros for empty or invalid inputs', () => {
    const emptyResult = calculateVirtualRange({
      totalCount: 0,
      itemHeight: 64,
      scrollTop: 100,
      viewportHeight: 600
    });
    expect(emptyResult).toEqual({
      startIndex: 0,
      endIndex: 0,
      visibleCount: 0,
      offsetY: 0,
      totalHeight: 0
    });

    const invalidHeightResult = calculateVirtualRange({
      totalCount: 100,
      itemHeight: 0,
      scrollTop: 100,
      viewportHeight: 600
    });
    expect(invalidHeightResult.totalHeight).toBe(0);
  });

  it('should calculate correct initial range at top of scroll (scrollTop = 0)', () => {
    // 1000 items, 64px each, 640px viewport (10 items visible), overscan 3
    const result = calculateVirtualRange({
      totalCount: 1000,
      itemHeight: 64,
      scrollTop: 0,
      viewportHeight: 640,
      overscan: 3
    });

    expect(result.totalHeight).toBe(64000);
    expect(result.startIndex).toBe(0);
    // rawEnd = ceil(640 / 64) = 10; endIndex = 10 + 3 = 13
    expect(result.endIndex).toBe(13);
    expect(result.visibleCount).toBe(13);
    expect(result.offsetY).toBe(0);
  });

  it('should calculate correct window in the middle of a large list', () => {
    // Scroll top at 1280px (20 items scrolled past)
    const result = calculateVirtualRange({
      totalCount: 1000,
      itemHeight: 64,
      scrollTop: 1280,
      viewportHeight: 640, // 10 visible
      overscan: 2
    });

    // rawStart = floor(1280 / 64) = 20; startIndex = 20 - 2 = 18
    expect(result.startIndex).toBe(18);
    // rawEnd = ceil((1280 + 640) / 64) = 30; endIndex = 30 + 2 = 32
    expect(result.endIndex).toBe(32);
    expect(result.visibleCount).toBe(14); // 32 - 18
    expect(result.offsetY).toBe(18 * 64); // 1152px
    expect(result.totalHeight).toBe(64000);
  });

  it('should clamp endIndex to totalCount at the bottom of the list', () => {
    // Total 100 items, scrolled to bottom (scrollTop = 6000px)
    const result = calculateVirtualRange({
      totalCount: 100,
      itemHeight: 64,
      scrollTop: 6000,
      viewportHeight: 800,
      overscan: 5
    });

    expect(result.endIndex).toBe(100);
    expect(result.startIndex).toBeLessThan(100);
    expect(result.startIndex).toBeGreaterThanOrEqual(0);
    expect(result.offsetY).toBe(result.startIndex * 64);
  });

  it('should accurately handle small lists smaller than viewport', () => {
    const result = calculateVirtualRange({
      totalCount: 5,
      itemHeight: 64,
      scrollTop: 0,
      viewportHeight: 800,
      overscan: 3
    });

    expect(result.totalHeight).toBe(320);
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(5);
    expect(result.visibleCount).toBe(5);
    expect(result.offsetY).toBe(0);
  });

  it('should strictly respect overscan buffer sizing', () => {
    const withZeroOverscan = calculateVirtualRange({
      totalCount: 500,
      itemHeight: 50,
      scrollTop: 500, // item 10
      viewportHeight: 500, // 10 items
      overscan: 0
    });

    // rawStart = 10, rawEnd = 20
    expect(withZeroOverscan.startIndex).toBe(10);
    expect(withZeroOverscan.endIndex).toBe(20);
    expect(withZeroOverscan.visibleCount).toBe(10);

    const withFiveOverscan = calculateVirtualRange({
      totalCount: 500,
      itemHeight: 50,
      scrollTop: 500,
      viewportHeight: 500,
      overscan: 5
    });

    expect(withFiveOverscan.startIndex).toBe(5);
    expect(withFiveOverscan.endIndex).toBe(25);
    expect(withFiveOverscan.visibleCount).toBe(20);
  });
});

describe('DOM Scroll Discovery (findScrollParent & getScrollOffset)', () => {
  it('should fallback cleanly to window when node is null', () => {
    const parent = findScrollParent(null);
    expect(parent).toBeDefined();
  });

  it('should calculate scroll offset safely with fallback when window is undefined', () => {
    const mockContainer = {
      getBoundingClientRect: () => ({ top: 100, bottom: 900, left: 0, right: 800, width: 800, height: 800 }),
      offsetTop: 100
    } as unknown as HTMLElement;

    const offset = getScrollOffset(mockContainer, {} as any);
    expect(offset.scrollTop).toBeGreaterThanOrEqual(0);
    expect(offset.viewportHeight).toBeGreaterThan(0);
  });
});
