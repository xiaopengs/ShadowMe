/**
 * useKeyboardNavigation Hook - Keyboard Navigation for Interactive Lists
 * Provides keyboard navigation (Arrow keys, Enter, Space) for list items
 */
'use client';

import { useCallback, useRef } from 'react';

interface UseKeyboardNavigationOptions<T> {
  items: T[];
  onSelect: (item: T, index: number) => void;
  orientation?: 'horizontal' | 'vertical' | 'grid';
  loop?: boolean;
  focusOnMount?: boolean;
}

export function useKeyboardNavigation<T>({
  items,
  onSelect,
  orientation = 'vertical',
  loop = true,
  focusOnMount = false,
}: UseKeyboardNavigationOptions<T>) {
  const currentIndexRef = useRef<number>(focusOnMount && items.length > 0 ? 0 : -1);

  const focusItem = useCallback(
    (index: number) => {
      if (items.length === 0) return;

      let targetIndex = index;

      // Handle bounds
      if (loop) {
        if (targetIndex < 0) targetIndex = items.length - 1;
        if (targetIndex >= items.length) targetIndex = 0;
      } else {
        if (targetIndex < 0) targetIndex = 0;
        if (targetIndex >= items.length) targetIndex = items.length - 1;
      }

      currentIndexRef.current = targetIndex;

      // Find the DOM element and focus it
      const selector = '[data-listbox-item]';
      const elements = document.querySelectorAll<HTMLElement>(selector);
      if (elements[targetIndex]) {
        elements[targetIndex].focus();
      }
    },
    [items.length, loop]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const isVertical = orientation === 'vertical';
      const isHorizontal = orientation === 'horizontal';

      switch (e.key) {
        case 'ArrowDown':
          if (isVertical || orientation === 'grid') {
            e.preventDefault();
            focusItem(index + (orientation === 'grid' ? 1 : 1));
          }
          break;

        case 'ArrowUp':
          if (isVertical || orientation === 'grid') {
            e.preventDefault();
            focusItem(index - (orientation === 'grid' ? 1 : 1));
          }
          break;

        case 'ArrowRight':
          if (isHorizontal || orientation === 'grid') {
            e.preventDefault();
            focusItem(index + (orientation === 'grid' ? 1 : 1));
          }
          break;

        case 'ArrowLeft':
          if (isHorizontal || orientation === 'grid') {
            e.preventDefault();
            focusItem(index - (orientation === 'grid' ? 1 : 1));
          }
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect(items[index], index);
          break;

        case 'Home':
          e.preventDefault();
          focusItem(0);
          break;

        case 'End':
          e.preventDefault();
          focusItem(items.length - 1);
          break;
      }
    },
    [orientation, focusItem, onSelect, items]
  );

  const getItemProps = useCallback(
    (item: T, index: number) => ({
      'data-listbox-item': true,
      'data-index': index,
      tabIndex: index === 0 ? 0 : -1,
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, index),
    }),
    [handleKeyDown]
  );

  return {
    getItemProps,
    focusItem,
    currentIndex: currentIndexRef.current,
  };
}
