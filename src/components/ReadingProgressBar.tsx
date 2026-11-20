import React, { useEffect, useRef } from 'react';

/**
 * ReadingProgressBar
 * Uses direct DOM ref + GPU `transform: scaleX(...)` so scrolling triggers
 * ZERO React re-renders and ZERO layout recalculations.
 */
export const ReadingProgressBar: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      const container = containerRef.current;
      const fill = fillRef.current;
      if (!container || !fill) {
        ticking = false;
        return;
      }

      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 100 && window.scrollY > 10) {
        const ratio = Math.min(Math.max(window.scrollY / totalHeight, 0), 1);
        container.style.opacity = '1';
        fill.style.transform = `scaleX(${ratio.toFixed(4)})`;
      } else {
        container.style.opacity = '0';
        fill.style.transform = 'scaleX(0)';
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateProgress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ opacity: 0 }}
      className="fixed top-0 left-0 right-0 h-[3px] sm:h-[4px] z-[100] bg-transparent pointer-events-none transition-opacity duration-200"
    >
      <div className="absolute inset-0 dark:bg-zinc-900/35 bg-slate-200/40" />
      <div
        ref={fillRef}
        style={{
          transform: 'scaleX(0)',
          transformOrigin: '0% 50%',
          willChange: 'transform',
        }}
        className="h-full w-full dark:bg-gradient-to-r dark:from-[#00b8ff] dark:via-[#00e676] dark:to-[#00ff41] bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600"
      />
    </div>
  );
};
