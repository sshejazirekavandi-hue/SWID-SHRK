import React, { useEffect, useMemo, useRef } from 'react';
import { CelestialStarfieldCanvas } from './CelestialStarfieldCanvas';
import { useCelestial } from '../context/CelestialContext';

interface MultiLayerParallaxStarfieldProps {
  className?: string;
  enabled?: boolean;
}

interface CssStarDot {
  id: string;
  xPct: number;
  yPct: number;
  sizePx: number;
  color: string;
  opacity: number;
  hasFlare?: boolean;
}

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const STAR_PALETTE = ['#ffffff', '#e0f2fe', '#bae6fd', '#fef08a', '#fed7aa', '#ddd6fe'];

function buildStarLayer(count: number, seed: number, minSize: number, maxSize: number, flareChance = 0): CssStarDot[] {
  const rand = seededRandom(seed);
  const stars: CssStarDot[] = [];
  for (let i = 0; i < count; i++) {
    const color = STAR_PALETTE[Math.floor(rand() * STAR_PALETTE.length)];
    const sizePx = minSize + rand() * (maxSize - minSize);
    stars.push({
      id: `star-${seed}-${i}`,
      xPct: rand() * 100,
      yPct: rand() * 100,
      sizePx: Number(sizePx.toFixed(2)),
      color,
      opacity: Number((0.45 + rand() * 0.55).toFixed(2)),
      hasFlare: rand() < flareChance,
    });
  }
  return stars;
}

/**
 * MultiLayerParallaxStarfield
 * Direct-ref GPU transform parallax (zero CSS variable style-recalc cascade across children)
 * and automatic IntersectionObserver suspension when scrolled off-screen.
 */
export const MultiLayerParallaxStarfield: React.FC<MultiLayerParallaxStarfieldProps> = ({
  className = '',
  enabled = true,
}) => {
  const { lensingVisible } = useCelestial();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<HTMLDivElement | null>(null);
  const nebulaLayerRef = useRef<HTMLDivElement | null>(null);
  const farLayerRef = useRef<HTMLDivElement | null>(null);
  const midLayerRef = useRef<HTMLDivElement | null>(null);
  const nearLayerRef = useRef<HTMLDivElement | null>(null);

  const farStars = useMemo(() => buildStarLayer(32, 101, 1.0, 1.8, 0), []);
  const midStars = useMemo(() => buildStarLayer(18, 202, 1.6, 2.5, 0.08), []);
  const nearStars = useMemo(() => buildStarLayer(10, 303, 2.2, 3.2, 0.3), []);

  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    if (!root) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId: number | null = null;
    let isVisible = true;

    const updateLayers = () => {
      if (!isVisible) {
        rafId = null;
        return;
      }

      currentX += (targetX - currentX) * 0.075;
      currentY += (targetY - currentY) * 0.075;

      // Direct GPU transform writes on the 5 layer containers — zero CSS var recalc cascade!
      if (cameraRef.current) {
        cameraRef.current.style.transform = `rotateX(${(-currentY * 2.2).toFixed(3)}deg) rotateY(${(currentX * 2.6).toFixed(3)}deg)`;
      }
      if (nebulaLayerRef.current) {
        nebulaLayerRef.current.style.transform = `translate3d(${(-currentX * 8).toFixed(2)}px, ${(-currentY * 8).toFixed(2)}px, 0px) scale(1.12)`;
      }
      if (farLayerRef.current) {
        farLayerRef.current.style.transform = `translate3d(${(-currentX * 14).toFixed(2)}px, ${(-currentY * 12).toFixed(2)}px, 0px)`;
      }
      if (midLayerRef.current) {
        midLayerRef.current.style.transform = `translate3d(${(-currentX * 24).toFixed(2)}px, ${(-currentY * 20).toFixed(2)}px, 0px)`;
      }
      if (nearLayerRef.current) {
        nearLayerRef.current.style.transform = `translate3d(${(-currentX * 36).toFixed(2)}px, ${(-currentY * 28).toFixed(2)}px, 0px)`;
      }

      if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
        rafId = requestAnimationFrame(updateLayers);
      } else {
        rafId = null;
      }
    };

    const scheduleFrame = () => {
      if (rafId === null && isVisible) {
        rafId = requestAnimationFrame(updateLayers);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) return;
      const vw = window.innerWidth || 1;
      const vh = window.innerHeight || 1;
      targetX = Math.max(-1, Math.min(1, (e.clientX / vw - 0.5) * 2));
      targetY = Math.max(-1, Math.min(1, (e.clientY / vh - 0.5) * 2));
      scheduleFrame();
    };

    const handleMouseLeave = () => {
      targetX = 0;
      targetY = 0;
      scheduleFrame();
    };

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          isVisible = entries[0]?.isIntersecting ?? true;
          if (!isVisible && rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        },
        { rootMargin: '120px 0px' }
      );
      observer.observe(root);
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [enabled]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{
        perspective: '900px',
        perspectiveOrigin: '50% 42%',
      }}
    >
      {/* Base Deep-Space Void */}
      <div className="absolute inset-0 bg-[#02040a]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(15,23,42,0.95),rgba(2,4,10,1))]" />

      {enabled && (
        <div
          ref={cameraRef}
          className="absolute inset-[-6%] pointer-events-none"
          style={{ willChange: 'transform' }}
        >
          {/* LAYER 1: Deep Cosmic Nebula Clouds */}
          <div
            ref={nebulaLayerRef}
            className="absolute inset-0 pointer-events-none"
            style={{
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              transform: 'translate3d(0px, 0px, 0px) scale(1.12)',
              background: `
                radial-gradient(circle at 28% 32%, rgba(14, 165, 233, 0.20) 0%, transparent 48%),
                radial-gradient(circle at 72% 40%, rgba(99, 102, 241, 0.16) 0%, transparent 50%),
                radial-gradient(circle at 50% 62%, rgba(6, 182, 212, 0.12) 0%, transparent 58%)
              `,
            }}
          />

          {/* LAYER 2: Far-Field Pinpoint Star Stratum */}
          <div
            ref={farLayerRef}
            className="absolute inset-0 pointer-events-none"
            style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
          >
            {farStars.map((star) => (
              <span
                key={star.id}
                className="absolute rounded-full"
                style={{
                  left: `${star.xPct}%`,
                  top: `${star.yPct}%`,
                  width: `${star.sizePx}px`,
                  height: `${star.sizePx}px`,
                  backgroundColor: star.color,
                  opacity: star.opacity * 0.72,
                }}
              />
            ))}
          </div>

          {/* LAYER 3: Mid-Field Spectral Star Clusters */}
          <div
            ref={midLayerRef}
            className="absolute inset-0 pointer-events-none"
            style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
          >
            {midStars.map((star) => (
              <span
                key={star.id}
                className="absolute rounded-full"
                style={{
                  left: `${star.xPct}%`,
                  top: `${star.yPct}%`,
                  width: `${star.sizePx}px`,
                  height: `${star.sizePx}px`,
                  backgroundColor: star.color,
                  opacity: star.opacity * 0.88,
                }}
              />
            ))}
          </div>

          {/* LAYER 4: Near-Field Hero Stars & Dynamic Twinkling Canvas */}
          <div
            ref={nearLayerRef}
            className="absolute inset-0 pointer-events-none"
            style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
          >
            {nearStars.map((star) => (
              <span
                key={star.id}
                className="absolute rounded-full flex items-center justify-center"
                style={{
                  left: `${star.xPct}%`,
                  top: `${star.yPct}%`,
                  width: `${star.sizePx}px`,
                  height: `${star.sizePx}px`,
                  backgroundColor: star.color,
                  opacity: star.opacity,
                }}
              >
                {star.hasFlare && (
                  <>
                    <span
                      className="absolute w-[18px] h-[1px] rounded-full opacity-55"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${star.color}, transparent)`,
                      }}
                    />
                    <span
                      className="absolute w-[1px] h-[18px] rounded-full opacity-55"
                      style={{
                        background: `linear-gradient(180deg, transparent, ${star.color}, transparent)`,
                      }}
                    />
                  </>
                )}
              </span>
            ))}

            <CelestialStarfieldCanvas
              className="absolute inset-0"
              starCount={52}
              interactiveParallax={true}
              showShootingStars={true}
              blackHoleLensing={lensingVisible}
            />
          </div>
        </div>
      )}
    </div>
  );
};
