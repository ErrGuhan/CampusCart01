'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Reset/finish progress bar on route change completion
  useEffect(() => {
    setIsLoading(false);
    setProgress(100);
    const timer = setTimeout(() => {
      setProgress(0);
    }, 200);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Intercept link clicks to start progress bar instantly (0ms latency feedback)
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('/#') &&
        !target.hasAttribute('download') &&
        target.getAttribute('target') !== '_blank'
      ) {
        const currentUrl = window.location.pathname + window.location.search;
        if (href !== currentUrl) {
          setIsLoading(true);
          setProgress(25);

          // Animate progress smoothly
          const interval = setInterval(() => {
            setProgress((prev) => {
              if (prev >= 85) {
                clearInterval(interval);
                return 85;
              }
              return prev + (85 - prev) * 0.2;
            });
          }, 100);

          setTimeout(() => clearInterval(interval), 5000);
        }
      }
    };

    document.addEventListener('click', handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true });
    };
  }, []);

  if (!isLoading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-primary via-indigo-500 to-sky-400 shadow-[0_0_12px_rgba(29,91,241,0.8)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
