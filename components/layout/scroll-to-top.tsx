'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setVisible(window.scrollY > 350);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      className={cn(
        'fixed z-40 flex h-11 w-11 items-center justify-center rounded-full',
        'bottom-20 md:bottom-6 left-4 sm:left-6',
        'bg-card/90 dark:bg-card/90 text-foreground border border-border/80',
        'backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300',
        'hover:scale-110 active:scale-95 hover:border-primary/40 hover:text-primary',
        'animate-in fade-in zoom-in-75 duration-200'
      )}
    >
      <ArrowUp className="h-5 w-5 stroke-[2.4]" />
    </button>
  );
}
