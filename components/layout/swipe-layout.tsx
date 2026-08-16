'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';

interface SwipeLayoutProps {
  leftPanelContent: React.ReactNode;
  homeCenterContent: React.ReactNode;
  rightPanelContent: React.ReactNode;
}

export function SwipeLayout({
  leftPanelContent,
  homeCenterContent,
  rightPanelContent,
}: SwipeLayoutProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Use useLayoutEffect in browser to position immediately before paint
  const useIsomorphicLayoutEffect =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const setInitialCenterPosition = () => {
      if (window.innerWidth <= 768) {
        // Center panel is at index 1 -> 1 * clientWidth (100vw)
        const panelWidth = container.clientWidth || window.innerWidth;
        container.scrollTo({
          left: panelWidth,
          behavior: 'instant' as ScrollBehavior,
        });
      }
    };

    setInitialCenterPosition();

    // Re-adjust if device orientation or viewport width changes
    window.addEventListener('resize', setInitialCenterPosition);
    return () => window.removeEventListener('resize', setInitialCenterPosition);
  }, []);

  return (
    <div
      ref={containerRef}
      className="swipe-container swipe-scrollbar-hidden"
    >
      {/* LEFT PANEL */}
      <section
        aria-label="Discovery Feed"
        className="swipe-panel swipe-panel-side swipe-scrollbar-hidden"
      >
        {leftPanelContent}
      </section>

      {/* CENTER PANEL (Home - Default Landing Screen) */}
      <section
        aria-label="Home Feed"
        className="swipe-panel swipe-scrollbar-hidden"
      >
        {homeCenterContent}
      </section>

      {/* RIGHT PANEL */}
      <section
        aria-label="Services and Requests Feed"
        className="swipe-panel swipe-panel-side swipe-scrollbar-hidden"
      >
        {rightPanelContent}
      </section>
    </div>
  );
}
