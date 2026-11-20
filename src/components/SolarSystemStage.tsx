import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CelestialBodyKey, CelestialViewportMetrics } from '../types';
import { getCelestialBodyInfo } from '../utils/celestialBodies';
import { CelestialPlanetView } from './CelestialPlanetView';
import { useCelestial } from '../context/CelestialContext';

interface SolarSystemStageProps {
  activeBodyKey: CelestialBodyKey;
  flareActive?: boolean;
  onSelectBody: (key: CelestialBodyKey) => void;
  onOpenWorkspace: (key: CelestialBodyKey) => void;
}

interface DynamicOrbitBodyConfig {
  key: CelestialBodyKey;
  label: string;
  /** Semi-major axis rx of tilted ellipse around the Sun */
  rx: number;
  /** Semi-minor axis ry of tilted ellipse around the Sun */
  ry: number;
  /** Initial orbital angle in radians */
  initialAngle: number;
  /** Angular velocity in radians per second */
  angularSpeed: number;
  /** Base diameter (px) when orbiting in the 3D Solar System */
  orbitSize: number;
  /** Trail wake color */
  wakeColor: string;
}

const BASE_FRONT_SIZE = 184;
const SUN_CENTER_X = 0;

/**
 * Dynamic 3D Solar System Orbital Configurations:
 * Every body revolves continuously around the tilted Keplerian ellipses
 * via requestAnimationFrame + GPU `will-change: transform` (`translate3d` + `scale3d`).
 * Orbit radii, vertical flattening, planet spacing, and sizes dynamically adapt via
 * CelestialProvider's ResizeObserver (`viewportMetrics`).
 */
const DYNAMIC_SOLAR_BODIES: DynamicOrbitBodyConfig[] = [
  {
    key: 'sun',
    label: 'The Sun',
    rx: 6,
    ry: 3,
    initialAngle: 0,
    angularSpeed: 0.45,
    orbitSize: 82,
    wakeColor: '#fde047',
  },
  {
    key: 'mercury',
    label: 'Mercury',
    rx: 58,
    ry: 29,
    initialAngle: -1.85,
    angularSpeed: 0.85,
    orbitSize: 22,
    wakeColor: '#cbd5e1',
  },
  {
    key: 'venus',
    label: 'Venus',
    rx: 88,
    ry: 44,
    initialAngle: -1.42,
    angularSpeed: 0.62,
    orbitSize: 30,
    wakeColor: '#fbbf24',
  },
  {
    key: 'earth',
    label: 'Earth',
    rx: 124,
    ry: 62,
    initialAngle: 0.35,
    angularSpeed: 0.48,
    orbitSize: 40,
    wakeColor: '#38bdf8',
  },
  {
    key: 'mars',
    label: 'Mars',
    rx: 162,
    ry: 82,
    initialAngle: 0.58,
    angularSpeed: 0.38,
    orbitSize: 30,
    wakeColor: '#f87171',
  },
  {
    key: 'jupiter',
    label: 'Jupiter',
    rx: 205,
    ry: 104,
    initialAngle: -2.25,
    angularSpeed: 0.28,
    orbitSize: 62,
    wakeColor: '#fb923c',
  },
  {
    key: 'saturn',
    label: 'Saturn',
    rx: 248,
    ry: 126,
    initialAngle: -1.62,
    angularSpeed: 0.22,
    orbitSize: 54,
    wakeColor: '#fde68a',
  },
  {
    key: 'uranus',
    label: 'Uranus',
    rx: 282,
    ry: 144,
    initialAngle: -0.68,
    angularSpeed: 0.17,
    orbitSize: 36,
    wakeColor: '#67e8f9',
  },
  {
    key: 'neptune',
    label: 'Neptune',
    rx: 312,
    ry: 160,
    initialAngle: 1.95,
    angularSpeed: 0.13,
    orbitSize: 42,
    wakeColor: '#60a5fa',
  },
];

export const SolarSystemStage: React.FC<SolarSystemStageProps> = ({
  activeBodyKey,
  flareActive = false,
  onSelectBody,
  onOpenWorkspace,
}) => {
  const {
    orbitAnimationSpeed,
    orbitTrailsVisible,
    fadingTrailsVisible,
    trailLengthMultiplier,
    viewportMetrics,
    registerStageElement,
  } = useCelestial();
  const [hoveredKey, setHoveredKey] = useState<CelestialBodyKey | null>(null);

  // Stage container ref for ResizeObserver registration + shared rAF CSS custom properties
  const stageRootRef = useRef<HTMLDivElement | null>(null);
  const attachStageRef = useCallback(
    (el: HTMLDivElement | null) => {
      stageRootRef.current = el;
      registerStageElement(el);
    },
    [registerStageElement]
  );

  // Direct DOM refs for 60fps zero-reflow orbital motion + smooth Front-of-View interpolation
  const bodyNodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // Direct SVG path refs for fading orbital wakes behind each moving planet
  const wakePathRefs = useRef<Record<string, SVGPathElement | null>>({});

  const focusProgressRef = useRef<Record<string, number>>({
    sun: activeBodyKey === 'sun' ? 1 : 0,
    mercury: activeBodyKey === 'mercury' ? 1 : 0,
    venus: activeBodyKey === 'venus' ? 1 : 0,
    earth: activeBodyKey === 'earth' ? 1 : 0,
    mars: activeBodyKey === 'mars' ? 1 : 0,
    jupiter: activeBodyKey === 'jupiter' ? 1 : 0,
    saturn: activeBodyKey === 'saturn' ? 1 : 0,
    uranus: activeBodyKey === 'uranus' ? 1 : 0,
    neptune: activeBodyKey === 'neptune' ? 1 : 0,
  });

  const activeKeyRef = useRef<CelestialBodyKey>(activeBodyKey);
  activeKeyRef.current = activeBodyKey;

  const hoveredKeyRef = useRef<CelestialBodyKey | null>(hoveredKey);
  hoveredKeyRef.current = hoveredKey;

  const speedRef = useRef<number>(orbitAnimationSpeed);
  speedRef.current = orbitAnimationSpeed;

  const fadingVisibleRef = useRef<boolean>(fadingTrailsVisible);
  fadingVisibleRef.current = fadingTrailsVisible;

  const trailMultRef = useRef<number>(trailLengthMultiplier);
  trailMultRef.current = trailLengthMultiplier;

  const viewportRef = useRef<CelestialViewportMetrics>(viewportMetrics);
  viewportRef.current = viewportMetrics;

  const [isInView, setIsInView] = useState(true);
  const isInViewRef = useRef(true);
  const lastZRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const el = stageRootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? true;
        isInViewRef.current = visible;
        setIsInView(visible);
      },
      { rootMargin: '140px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let animId: number | null = null;
    let lastTime = performance.now();
    let elapsedSec = 0;
    let frameCount = 0;

    const animate = (now: number) => {
      if (!isInViewRef.current || document.hidden) {
        animId = null;
        return;
      }

      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const speed = speedRef.current || 1.0;
      elapsedSec += dt * speed;
      frameCount++;

      const metrics = viewportRef.current;
      const tiltRad = (metrics.orbitTiltDeg * Math.PI) / 180;
      const cosTilt = Math.cos(tiltRad);
      const sinTilt = Math.sin(tiltRad);
      const frontYBase = metrics.layoutProfile === 'mobile-portrait' ? 50 : 58;
      const updateWakes = frameCount % 2 === 0;

      // Update all 9 Solar System bodies (Sun + 8 Planets) via pure GPU `translate3d` + `scale3d`
      // (Axial spins & cloud drift run off-main-thread via pure GPU CSS keyframes)
      for (const cfg of DYNAMIC_SOLAR_BODIES) {
        const el = bodyNodeRefs.current[cfg.key];
        if (!el) continue;

        const isSelected = cfg.key === activeKeyRef.current;
        const isHovered = cfg.key === hoveredKeyRef.current;

        // Smoothly interpolate focusProgress toward 1 (Front of View) or 0 (Moving Orbit)
        const targetFocus = isSelected ? 1 : 0;
        const currFocus = focusProgressRef.current[cfg.key] ?? (isSelected ? 1 : 0);
        const nextFocus = currFocus + (targetFocus - currFocus) * Math.min(1, dt * 6.5);
        focusProgressRef.current[cfg.key] = nextFocus;

        // Responsive semi-axes scaled by ResizeObserver viewport metrics
        const rx = cfg.rx * metrics.orbitRxScale;
        const ry = cfg.ry * metrics.orbitRyScale;

        // Compute live 3D orbital coordinates along the tilted Keplerian ellipse
        const theta = cfg.initialAngle + elapsedSec * cfg.angularSpeed;
        const localX = rx * Math.cos(theta);
        const localY = ry * Math.sin(theta);

        // Rotate by responsive tiltDeg around (SUN_CENTER_X, metrics.sunCenterY)
        const orbX = SUN_CENTER_X + (localX * cosTilt - localY * sinTilt);
        const orbY = metrics.sunCenterY + (localX * sinTilt + localY * cosTilt);

        // 3D depth factor: sin(theta) in [-1 (behind Sun), +1 (in front of Sun)]
        const depthSin = cfg.key === 'sun' ? 0 : Math.sin(theta);
        const depthScale = cfg.key === 'sun' ? 1.0 : 0.86 + 0.24 * ((depthSin + 1) * 0.5);
        const effectiveOrbitSize = cfg.orbitSize * metrics.planetSizeScale * depthScale;

        // Front-of-View showcase target position (gentle breathing motion when in Front of View)
        const frontX = Math.sin(elapsedSec * 1.4) * 3.5;
        const frontY = frontYBase + Math.cos(elapsedSec * 1.1) * 3.0;

        // Interpolate position and target diameter between moving orbit and Front of View
        const x = orbX + (frontX - orbX) * nextFocus;
        const y = orbY + (frontY - orbY) * nextFocus;
        const targetDiameter =
          effectiveOrbitSize + (metrics.frontShowcaseSize - effectiveOrbitSize) * nextFocus;

        // Hover scale boost for orbiting planets
        const hoverScale = isHovered && !isSelected ? 1.22 : 1.0;
        const finalScale = (targetDiameter / BASE_FRONT_SIZE) * hoverScale;

        // Dynamic Z-index based on 3D depth and selection state
        const orbitZ =
          cfg.key === 'sun'
            ? 15
            : depthSin >= 0
            ? 16 + Math.round(depthSin * 8)
            : 6 + Math.round((depthSin + 1) * 8);
        const finalZ = isSelected ? 45 : isHovered ? 38 : orbitZ;

        // Pure GPU compositor update: only touch zIndex when changed and --inv-scale when tag is shown
        if (lastZRef.current[cfg.key] !== finalZ) {
          lastZRef.current[cfg.key] = finalZ;
          el.style.zIndex = String(finalZ);
        }
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(
          1
        )}px, 0px) scale3d(${finalScale.toFixed(4)}, ${finalScale.toFixed(4)}, 1)`;
        if (isSelected || isHovered) {
          el.style.setProperty('--inv-scale', (1 / Math.max(0.12, finalScale)).toFixed(3));
        }

        // Update faint fading SVG motion wake arc at 30fps (6 steps — smooth with half the DOM mutations)
        if (updateWakes && cfg.key !== 'sun') {
          const wakeEl = wakePathRefs.current[cfg.key];
          if (wakeEl) {
            if (fadingVisibleRef.current) {
              const wakeSpanRad = 0.65 * (trailMultRef.current || 1.0);
              const steps = 6;
              let d = '';
              for (let s = 0; s <= steps; s++) {
                const a = theta - (s / steps) * wakeSpanRad;
                const wx = rx * Math.cos(a);
                const wy = ry * Math.sin(a);
                d += `${s === 0 ? 'M' : 'L'}${wx.toFixed(1)} ${wy.toFixed(1)} `;
              }
              wakeEl.setAttribute('d', d);
            } else if (wakeEl.getAttribute('d')) {
              wakeEl.setAttribute('d', '');
            }
          }
        }
      }

      animId = requestAnimationFrame(animate);
    };

    const startLoop = () => {
      if (animId === null && isInViewRef.current && !document.hidden) {
        lastTime = performance.now();
        animId = requestAnimationFrame(animate);
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        if (animId !== null) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      } else {
        startLoop();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    startLoop();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (animId !== null) cancelAnimationFrame(animId);
    };
  }, [isInView]);

  // Match SVG viewBox pixel dimensions 1:1 with the rendered container for seamless responsive orbit alignment
  const stageWidthPx = Math.max(300, stageRootRef.current?.clientWidth || viewportMetrics.width || 720);
  const stageHeightPx =
    viewportMetrics.layoutProfile === 'mobile-portrait'
      ? 350
      : viewportMetrics.layoutProfile === 'tablet'
      ? 400
      : 440;

  return (
    <div
      ref={attachStageRef}
      style={{
        height: `${stageHeightPx}px`,
        perspective: '1200px',
      }}
      className={`relative w-full flex items-center justify-center overflow-visible select-none ${
        !isInView ? 'anim-paused' : ''
      }`}
    >
      {/* ===================================================================== */}
      {/* 1. MILKY WAY DIAGONAL GALACTIC DUST BAND & SOLAR AMBIENT GLOW         */}
      {/* ===================================================================== */}
      <div
        aria-hidden="true"
        className="absolute w-[125%] h-[85%] pointer-events-none z-0 opacity-80"
        style={{
          transform: 'translate3d(0px, 0px, 0px) rotate(-32deg)',
          background: `
            radial-gradient(ellipse at 50% 45%,
              rgba(255, 193, 7, 0.22) 0%,
              rgba(217, 119, 6, 0.12) 34%,
              rgba(56, 189, 248, 0.06) 60%,
              transparent 80%
            )
          `,
        }}
      />

      {/* ===================================================================== */}
      {/* 2. TILTED 3D KEPLERIAN ORBITAL TRACKS & FADING MOTION WAKES (SVG)     */}
      {/* Synchronized 1:1 with ResizeObserver viewportMetrics!                 */}
      {/* ===================================================================== */}
      <svg
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full pointer-events-none overflow-visible z-5 transition-opacity duration-500 ${
          orbitTrailsVisible ? 'opacity-100' : 'opacity-25'
        }`}
        viewBox={`${-stageWidthPx / 2} ${-stageHeightPx / 2} ${stageWidthPx} ${stageHeightPx}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="solarOrbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 224, 130, 0.52)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.24)" />
            <stop offset="100%" stopColor="rgba(148, 163, 184, 0.12)" />
          </linearGradient>
        </defs>

        <g
          transform={`translate(${SUN_CENTER_X}, ${viewportMetrics.sunCenterY}) rotate(${viewportMetrics.orbitTiltDeg})`}
        >
          {DYNAMIC_SOLAR_BODIES.filter((b) => b.key !== 'sun').map((planet, idx) => {
            const isSelected = planet.key === activeBodyKey;
            const isHovered = planet.key === hoveredKey;
            const scaledRx = planet.rx * viewportMetrics.orbitRxScale;
            const scaledRy = planet.ry * viewportMetrics.orbitRyScale;

            return (
              <g key={`stage-orbit-group-${planet.key}`}>
                <ellipse
                  cx="0"
                  cy="0"
                  rx={scaledRx}
                  ry={scaledRy}
                  fill="none"
                  stroke={isSelected || isHovered ? '#fde047' : 'url(#solarOrbitGrad)'}
                  strokeWidth={isSelected || isHovered ? 1.5 : 0.9}
                  opacity={isSelected || isHovered ? 0.85 : 0.68 - idx * 0.05}
                />
                {/* rAF-driven Fading SVG Wake Path behind each moving planet */}
                <path
                  ref={(el) => {
                    wakePathRefs.current[planet.key] = el;
                  }}
                  fill="none"
                  stroke={planet.wakeColor}
                  strokeWidth={isSelected || isHovered ? 2.4 : 1.5}
                  strokeLinecap="round"
                  opacity={isSelected || isHovered ? 0.85 : 0.5}
                />
              </g>
            );
          })}
        </g>
      </svg>

      {/* ===================================================================== */}
      {/* 3. DYNAMICALLY ORBITING 3D SUN & PLANETS (rAF + will-change:transform)*/}
      {/* All bodies move continuously; chosen one glides to Front of View!     */}
      {/* ===================================================================== */}
      {DYNAMIC_SOLAR_BODIES.map((item) => {
        const isSelected = item.key === activeBodyKey;
        const isHovered = item.key === hoveredKey;
        const info = getCelestialBodyInfo(item.key);

        return (
          <div
            key={item.key}
            ref={(el) => {
              bodyNodeRefs.current[item.key] = el;
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectBody(item.key);
              onOpenWorkspace(item.key);
            }}
            onMouseEnter={() => setHoveredKey(item.key)}
            onMouseLeave={() => setHoveredKey(null)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectBody(item.key);
                onOpenWorkspace(item.key);
              }
            }}
            title={`${info.name} — Click to open ${info.capability.title}`}
            aria-label={`${info.name} — Open ${info.capability.title}`}
            style={{
              width: `${BASE_FRONT_SIZE}px`,
              height: `${BASE_FRONT_SIZE}px`,
              willChange: 'transform',
              backfaceVisibility: 'hidden',
            }}
            className="absolute rounded-full flex items-center justify-center cursor-pointer group celestial-gpu-layer"
          >
            {/* Foreground Focus Aura when Chosen in Front of View (smooth radial gradient, zero blur pass) */}
            {isSelected && (
              <div
                aria-hidden="true"
                className="absolute -inset-6 rounded-full pointer-events-none opacity-80 transition-opacity duration-500"
                style={{
                  background:
                    item.key === 'sun'
                      ? 'radial-gradient(circle, rgba(255,214,0,0.48) 0%, rgba(255,109,0,0.2) 50%, transparent 74%)'
                      : 'radial-gradient(circle, rgba(56,189,248,0.28) 0%, rgba(0,255,65,0.12) 50%, transparent 74%)',
                }}
              />
            )}

            {/* 3D Spinning Planet / Sun Surface with Embedded SWID-SHRK Crest */}
            <CelestialPlanetView
              bodyKey={item.key}
              isHovered={isHovered || isSelected}
              flareActive={item.key === 'sun' && flareActive}
              sharedRafDriven={true}
            />

            {/* Hover / Active Label Tag (Counter-scaled so text is always crisp) */}
            {(isHovered || isSelected) && (
              <div
                style={{
                  transform: 'translate3d(-50%, 0, 0) scale(var(--inv-scale, 1))',
                }}
                className={`pointer-events-none absolute ${
                  isSelected ? '-top-7' : '-bottom-7'
                } left-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-colors ${
                  isSelected
                    ? 'bg-black/92 text-[#00ff41] border-[#00ff41]/60 shadow-[0_0_12px_rgba(0,255,65,0.4)]'
                    : 'bg-black/90 text-zinc-200 border-zinc-700'
                }`}
              >
                {`${item.label} · Open ${info.capability.badge}`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
