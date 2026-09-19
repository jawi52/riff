/**
 * Algorithmic DOM Virtualization & Viewport Calculation Engine
 *
 * Implements O(1) mathematical windowing for infinite / large data collections.
 * Restricts mounted DOM elements to strictly the visible viewport slice + buffer.
 */

export interface VirtualRangeOptions {
  totalCount: number;
  itemHeight: number;
  scrollTop: number;
  viewportHeight: number;
  overscan?: number;
}

export interface VirtualRangeResult {
  startIndex: number;
  endIndex: number;
  visibleCount: number;
  offsetY: number;
  totalHeight: number;
}

/**
 * Calculates the exact slice of indices to render in the DOM viewport.
 * Runs in O(1) time complexity with zero memory allocations.
 */
export function calculateVirtualRange(options: VirtualRangeOptions): VirtualRangeResult {
  const { totalCount, itemHeight, scrollTop, viewportHeight, overscan = 3 } = options;

  if (totalCount <= 0 || itemHeight <= 0) {
    return {
      startIndex: 0,
      endIndex: 0,
      visibleCount: 0,
      offsetY: 0,
      totalHeight: 0
    };
  }

  const effectiveViewport = Math.max(1, viewportHeight);
  const totalHeight = totalCount * itemHeight;
  const clampedScrollTop = Math.max(0, scrollTop);

  const rawStart = Math.floor(clampedScrollTop / itemHeight);
  const rawEnd = Math.ceil((clampedScrollTop + effectiveViewport) / itemHeight);

  const startIndex = Math.max(0, rawStart - overscan);
  const endIndex = Math.min(totalCount, rawEnd + overscan);
  const visibleCount = Math.max(0, endIndex - startIndex);
  const offsetY = startIndex * itemHeight;

  return {
    startIndex,
    endIndex,
    visibleCount,
    offsetY,
    totalHeight
  };
}

/**
 * Discovers the nearest scrollable ancestor container in the DOM hierarchy.
 * Traverses upwards inspecting CSS overflow-y properties.
 */
export function findScrollParent(node: HTMLElement | null): HTMLElement | Window {
  if (!node || typeof window === 'undefined') {
    return (typeof window !== 'undefined' ? window : null) as unknown as Window;
  }

  let parent = node.parentElement;
  while (parent && parent !== document.body && parent !== document.documentElement) {
    const { overflowY } = window.getComputedStyle(parent);
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return parent;
    }
    parent = parent.parentElement;
  }
  return window;
}

/**
 * Calculates relative scrollTop and viewportHeight respecting either window or parent container.
 */
export function getScrollOffset(
  container: HTMLElement,
  scrollParent: HTMLElement | Window
): { scrollTop: number; viewportHeight: number } {
  if (typeof window === 'undefined') {
    return { scrollTop: 0, viewportHeight: 800 };
  }

  if (scrollParent === window) {
    const winScrollY = window.scrollY || window.pageYOffset || 0;
    const rect = container.getBoundingClientRect();
    const containerPageTop = rect.top + winScrollY;
    const relativeScrollTop = Math.max(0, winScrollY - containerPageTop);
    return {
      scrollTop: relativeScrollTop,
      viewportHeight: window.innerHeight || 800
    };
  }

  const el = scrollParent as HTMLElement;
  const containerRect = container.getBoundingClientRect();
  const parentRect = el.getBoundingClientRect();
  const relativeScrollTop = Math.max(0, el.scrollTop - (containerRect.top - parentRect.top + el.scrollTop));

  return {
    scrollTop: relativeScrollTop,
    viewportHeight: el.clientHeight || 800
  };
}
