'use client';

import React, { useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useSwipe } from './swipe-context';

export interface SwipePanelConfig {
  id: string;
  label: string;
  isHome?: boolean;
  content: React.ReactNode;
}

interface SwipeLayoutProps {
  panels: SwipePanelConfig[];
  initialIndex?: number; // Defaults to 2 (Home in 5-panel layout)
}

export function SwipeLayout({
  panels,
  initialIndex = 2,
}: SwipeLayoutProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const swipe = useSwipe();
  const isScrollingProgrammatically = useRef(false);

  const useIsomorphicLayoutEffect =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  // 1. Initialize container registration and instant default Home (index 2) scroll
  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (swipe?.registerContainer) {
      swipe.registerContainer(container);
    }

    const setInitialCenterPosition = () => {
      if (window.innerWidth <= 768) {
        const panelWidth = container.clientWidth || window.innerWidth;
        container.scrollTo({
          left: initialIndex * panelWidth,
          behavior: 'instant' as ScrollBehavior,
        });
        swipe?.setActiveIndex(initialIndex);
      }
    };

    setInitialCenterPosition();

    const handleResize = () => {
      if (window.innerWidth <= 768) {
        const panelWidth = container.clientWidth || window.innerWidth;
        const currentIdx = swipe?.activeIndex ?? initialIndex;
        container.scrollTo({
          left: currentIdx * panelWidth,
          behavior: 'instant' as ScrollBehavior,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (swipe?.registerContainer) {
        swipe.registerContainer(null);
      }
    };
  }, [initialIndex]);

  // 2. Throttled scroll listener with requestAnimationFrame calculating Math.round(scrollLeft / clientWidth)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (container && window.innerWidth <= 768) {
            const panelWidth = container.clientWidth || window.innerWidth;
            if (panelWidth > 0) {
              const currentPos = container.scrollLeft;
              const computedIndex = Math.round(currentPos / panelWidth);
              if (
                computedIndex >= 0 &&
                computedIndex < panels.length &&
                computedIndex !== swipe?.activeIndex
              ) {
                swipe?.setActiveIndex(computedIndex);
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [panels.length, swipe]);

  // 3. IntersectionObserver for exact snap synchronization
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const indexAttr = entry.target.getAttribute('data-panel-index');
            if (indexAttr !== null) {
              const index = parseInt(indexAttr, 10);
              if (!isNaN(index) && index !== swipe?.activeIndex) {
                swipe?.setActiveIndex(index);
              }
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    const panelElements = container.querySelectorAll('.swipe-panel');
    panelElements.forEach((panel) => observer.observe(panel));

    return () => observer.disconnect();
  }, [panels.length, swipe]);

  return (
    <div
      ref={containerRef}
      className="swipe-container swipe-scrollbar-hidden"
    >
      {panels.map((panel, idx) => (
        <section
          key={panel.id}
          data-panel-index={idx}
          aria-label={panel.label}
          className={`swipe-panel swipe-scrollbar-hidden ${
            panel.isHome ? 'swipe-panel-home' : 'swipe-panel-side'
          }`}
        >
          {panel.content}
        </section>
      ))}
    </div>
  );
}
