'use client';

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

interface SwipeContextType {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  registerContainer: (element: HTMLDivElement | null) => void;
  scrollToPanel: (index: number, smooth?: boolean) => void;
  isSwipeActive: boolean;
  setIsSwipeActive: (active: boolean) => void;
}

const SwipeContext = createContext<SwipeContextType | undefined>(undefined);

export function SwipeProvider({ children }: { children: React.ReactNode }) {
  // Default activeIndex = 2 (Home in [Market, Freelance, Home, Requests, Studio])
  const [activeIndex, setActiveIndex] = useState<number>(2);
  const [isSwipeActive, setIsSwipeActive] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const registerContainer = useCallback((element: HTMLDivElement | null) => {
    containerRef.current = element;
    setIsSwipeActive(!!element);
  }, []);

  const scrollToPanel = useCallback((index: number, smooth: boolean = true) => {
    const container = containerRef.current;
    if (!container) return;
    const panelWidth = container.clientWidth || window.innerWidth;
    container.scrollTo({
      left: index * panelWidth,
      behavior: smooth ? 'smooth' : ('instant' as ScrollBehavior),
    });
    setActiveIndex(index);
  }, []);

  return (
    <SwipeContext.Provider
      value={{
        activeIndex,
        setActiveIndex,
        registerContainer,
        scrollToPanel,
        isSwipeActive,
        setIsSwipeActive,
      }}
    >
      {children}
    </SwipeContext.Provider>
  );
}

export function useSwipe() {
  return useContext(SwipeContext);
}
