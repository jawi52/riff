import React, { useState, useEffect, useRef, useCallback } from 'react';
import { calculateVirtualRange, findScrollParent, getScrollOffset } from '../../lib/virtualizer';

export interface VirtualTrackListProps<T> {
  items: T[];
  itemHeight?: number;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  className?: string;
  emptyState?: React.ReactNode;
}

const DEFAULT_ITEM_HEIGHT = 64;
const DEFAULT_OVERSCAN = 4;
const DIRECT_RENDER_THRESHOLD = 15;

/**
 * High-Performance DOM-Virtualized List Component
 *
 * Renders only the visible subset of items in the viewport, maintaining 60 FPS
 * smooth scrolling for libraries with thousands of tracks.
 */
export function VirtualTrackList<T>({
  items,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  overscan = DEFAULT_OVERSCAN,
  renderItem,
  keyExtractor,
  className = '',
  emptyState = null
}: VirtualTrackListProps<T>): React.ReactElement | null {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState<{ scrollTop: number; viewportHeight: number }>({
    scrollTop: 0,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  const rafIdRef = useRef<number | null>(null);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const scrollParent = findScrollParent(containerRef.current);
      const offset = getScrollOffset(containerRef.current, scrollParent);
      setScrollState((prev) => {
        if (
          Math.abs(prev.scrollTop - offset.scrollTop) > 2 ||
          prev.viewportHeight !== offset.viewportHeight
        ) {
          return offset;
        }
        return prev;
      });
      rafIdRef.current = null;
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current || items.length <= DIRECT_RENDER_THRESHOLD) return;

    const scrollParent = findScrollParent(containerRef.current);
    handleScroll();

    scrollParent.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      scrollParent.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleScroll, items.length]);

  if (!items || items.length === 0) {
    return <>{emptyState}</>;
  }

  // Small lists: render directly without windowing overhead
  if (items.length <= DIRECT_RENDER_THRESHOLD) {
    return (
      <div ref={containerRef} className={className}>
        {items.map((item, index) => {
          const key = keyExtractor ? keyExtractor(item, index) : (item as any)?.id || index;
          return (
            <React.Fragment key={key}>
              {renderItem(item, index)}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // Large lists: compute algorithmic virtual window
  const virtualRange = calculateVirtualRange({
    totalCount: items.length,
    itemHeight,
    scrollTop: scrollState.scrollTop,
    viewportHeight: scrollState.viewportHeight,
    overscan
  });

  const visibleSlice = items.slice(virtualRange.startIndex, virtualRange.endIndex);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ height: `${virtualRange.totalHeight}px` }}
    >
      <div
        className="w-full will-change-transform"
        style={{
          transform: `translateY(${virtualRange.offsetY}px)`
        }}
      >
        {visibleSlice.map((item, sliceIdx) => {
          const originalIndex = virtualRange.startIndex + sliceIdx;
          const key = keyExtractor ? keyExtractor(item, originalIndex) : (item as any)?.id || originalIndex;
          return (
            <React.Fragment key={key}>
              {renderItem(item, originalIndex)}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
