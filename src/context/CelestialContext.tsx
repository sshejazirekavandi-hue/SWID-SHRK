import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  CelestialBodyKey,
  CelestialBodyInfo,
  PlanetaryOrbitTrailConfig,
  OrbitTrailSegment,
  CelestialMoonConfig,
  CelestialViewportMetrics,
  TabKey,
} from '../types';
import {
  CELESTIAL_ORDER,
  CELESTIAL_BODIES,
  PLANETARY_ORBIT_TRAILS,
  PLANETARY_MOONS,
  calculateOrbitPosition,
  calculateFadingTrailSegments,
  generateFadingTrailSvgPath,
  getMoonsForPlanet,
  calculateMoonPosition,
  getNextCelestialBody,
  getPrevCelestialBody,
  getCelestialBodyInfo,
} from '../utils/celestialBodies';
import { playWorkspaceTerminalSound } from '../utils/celestialAudio';

interface CelestialContextType {
  activeBodyKey: CelestialBodyKey;
  activeInfo: CelestialBodyInfo;
  isTransitioning: boolean;
  flareActive: boolean;
  notification: string | null;
  genesisCount: number;
  orbitTrailsVisible: boolean;
  fadingTrailsVisible: boolean;
  moonsVisible: boolean;
  orbitAnimationSpeed: number;
  trailLengthMultiplier: number;
  focusedOrbitOnly: boolean;
  elapsedOrbitalTime: number;
  orbitalTrails: PlanetaryOrbitTrailConfig[];
  setCelestialBody: (key: CelestialBodyKey) => void;
  advanceToNextBody: () => CelestialBodyKey;
  stepToPrevBody: () => CelestialBodyKey;
  triggerSingularityGenesis: () => void;
  setNotification: (msg: string | null) => void;
  handleEarthClick: (onSelectTab?: (tab: TabKey) => void) => void;
  executeCapability: (onSelectTab?: (tab: TabKey) => void, targetKey?: CelestialBodyKey) => void;
  toggleOrbitTrails: () => void;
  setOrbitTrailsVisible: (visible: boolean) => void;
  toggleFadingTrails: () => void;
  setFadingTrailsVisible: (visible: boolean) => void;
  toggleMoons: () => void;
  setMoonsVisible: (visible: boolean) => void;
  starfieldVisible: boolean;
  lensingVisible: boolean;
  graphicsMode: 'high' | 'eco';
  toggleStarfield: () => void;
  setStarfieldVisible: (visible: boolean) => void;
  toggleLensing: () => void;
  setLensingVisible: (visible: boolean) => void;
  toggleMasterGraphics: () => void;
  setGraphicsMode: (mode: 'high' | 'eco') => void;
  setOrbitAnimationSpeed: (speed: number) => void;
  setTrailLengthMultiplier: (multiplier: number) => void;
  toggleFocusedOrbitOnly: () => void;
  getPlanetPosition: (key: CelestialBodyKey, customTime?: number) => { x: number; y: number; angleRad: number };
  getPlanetTrailSegments: (key: CelestialBodyKey, customTime?: number, customTrailLengthDeg?: number) => OrbitTrailSegment[];
  getPlanetTrailPath: (key: CelestialBodyKey, customTime?: number, customTrailLengthDeg?: number) => string;
  getPlanetMoons: (planetKey: CelestialBodyKey) => CelestialMoonConfig[];
  viewportMetrics: CelestialViewportMetrics;
  registerStageElement: (el: HTMLElement | null) => void;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function computeViewportMetrics(width: number, height: number): CelestialViewportMetrics {
  const safeW = Math.max(300, width || 1280);
  const safeH = Math.max(300, height || 720);
  const aspectRatio = Number((safeW / safeH).toFixed(3));

  if (safeW < 640 || aspectRatio < 0.95) {
    const rxScale = Number(clamp(safeW / 680, 0.48, 0.72).toFixed(3));
    const ryScale = Number((rxScale * 1.18).toFixed(3));
    return {
      width: Math.round(safeW),
      height: Math.round(safeH),
      aspectRatio,
      orbitRxScale: rxScale,
      orbitRyScale: ryScale,
      planetSizeScale: Number(clamp(safeW / 640, 0.68, 0.86).toFixed(3)),
      frontShowcaseSize: Math.round(clamp(safeW * 0.36, 134, 164)),
      sunCenterY: -36,
      orbitTiltDeg: -18,
      layoutProfile: 'mobile-portrait',
    };
  }

  if (safeW < 960 || aspectRatio < 1.35) {
    const rxScale = Number(clamp(safeW / 840, 0.72, 0.94).toFixed(3));
    const ryScale = Number((rxScale * 1.06).toFixed(3));
    return {
      width: Math.round(safeW),
      height: Math.round(safeH),
      aspectRatio,
      orbitRxScale: rxScale,
      orbitRyScale: ryScale,
      planetSizeScale: 0.88,
      frontShowcaseSize: 172,
      sunCenterY: -40,
      orbitTiltDeg: -20,
      layoutProfile: 'tablet',
    };
  }

  if (aspectRatio > 2.1 || safeW >= 1536) {
    const rxScale = Number(clamp(safeW / 1280, 1.06, 1.24).toFixed(3));
    return {
      width: Math.round(safeW),
      height: Math.round(safeH),
      aspectRatio,
      orbitRxScale: rxScale,
      orbitRyScale: 0.96,
      planetSizeScale: 1.06,
      frontShowcaseSize: 196,
      sunCenterY: -44,
      orbitTiltDeg: -23,
      layoutProfile: 'ultrawide',
    };
  }

  const rxScale = Number(clamp(safeW / 1100, 0.94, 1.06).toFixed(3));
  return {
    width: Math.round(safeW),
    height: Math.round(safeH),
    aspectRatio,
    orbitRxScale: rxScale,
    orbitRyScale: rxScale,
    planetSizeScale: 1.0,
    frontShowcaseSize: 184,
    sunCenterY: -42,
    orbitTiltDeg: -22,
    layoutProfile: 'desktop',
  };
}

const CelestialContext = createContext<CelestialContextType | undefined>(undefined);

export const CelestialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeBodyKey, setActiveBodyKeyState] = useState<CelestialBodyKey>(() => {
    if (typeof window !== 'undefined') {
      try {
        // First check URL query parameter ?celestial=
        const params = new URLSearchParams(window.location.search);
        const queryKey = params.get('celestial') as CelestialBodyKey;
        if (queryKey && CELESTIAL_ORDER.includes(queryKey)) {
          return queryKey;
        }
        // Then check localStorage
        const saved = localStorage.getItem('swid_celestial_active_body') as CelestialBodyKey;
        if (saved && CELESTIAL_ORDER.includes(saved)) {
          return saved;
        }
      } catch {
        // ignore
      }
    }
    return 'blackhole';
  });

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [flareActive, setFlareActive] = useState(false);
  const [genesisCount, setGenesisCount] = useState(0);
  const [notification, setNotificationState] = useState<string | null>(null);

  // Persistent Glowing Elliptical Trails state
  const [orbitTrailsVisible, setOrbitTrailsVisibleState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('swid_orbit_trails_visible');
        return saved !== null ? saved === 'true' : true;
      } catch {
        return true;
      }
    }
    return true;
  });

  // Faint Fading Orbital Trail behind Moving Planets
  const [fadingTrailsVisible, setFadingTrailsVisibleState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('swid_fading_trails_visible');
        return saved !== null ? saved === 'true' : true;
      } catch {
        return true;
      }
    }
    return true;
  });

  // Dynamic Orbiting Moons / Satellites state
  const [moonsVisible, setMoonsVisibleState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('swid_moons_visible');
        return saved !== null ? saved === 'true' : true;
      } catch {
        return true;
      }
    }
    return true;
  });

  const [trailLengthMultiplier, setTrailLengthMultiplierState] = useState<number>(1.0);
  const [orbitAnimationSpeed, setOrbitAnimationSpeedState] = useState<number>(1.0);
  const [focusedOrbitOnly, setFocusedOrbitOnly] = useState<boolean>(false);
  const [elapsedOrbitalTime, setElapsedOrbitalTime] = useState<number>(0);

  // Responsive ResizeObserver metrics for dynamically adjusting orbit sizes & planet spacing
  const [viewportMetrics, setViewportMetrics] = useState<CelestialViewportMetrics>(() => {
    if (typeof window !== 'undefined') {
      return computeViewportMetrics(window.innerWidth, window.innerHeight);
    }
    return computeViewportMetrics(1280, 720);
  });
  const [stageElement, setStageElement] = useState<HTMLElement | null>(null);
  const registerStageElement = useCallback((el: HTMLElement | null) => {
    setStageElement((prev) => (prev === el ? prev : el));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let rafId: number | null = null;

    const measureAndSync = () => {
      const targetRect = stageElement?.getBoundingClientRect();
      const width =
        targetRect && targetRect.width > 0 ? targetRect.width : window.innerWidth;
      // Preserve window aspect ratio awareness alongside stage width
      const height = window.innerHeight;
      const next = computeViewportMetrics(width, height);

      setViewportMetrics((prev) => {
        if (
          prev.layoutProfile === next.layoutProfile &&
          Math.abs(prev.orbitRxScale - next.orbitRxScale) < 0.01 &&
          Math.abs(prev.orbitRyScale - next.orbitRyScale) < 0.01 &&
          prev.frontShowcaseSize === next.frontShowcaseSize
        ) {
          return prev;
        }
        return next;
      });
    };

    const scheduleMeasure = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measureAndSync);
    };

    measureAndSync();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleMeasure);
      resizeObserver.observe(document.documentElement);
      if (stageElement) {
        resizeObserver.observe(stageElement);
      }
    }
    window.addEventListener('resize', scheduleMeasure, { passive: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, [stageElement]);

  const activeInfo = getCelestialBodyInfo(activeBodyKey);

  const orbitalTrails = useMemo<PlanetaryOrbitTrailConfig[]>(() => {
    return CELESTIAL_ORDER.map((k) => {
      const base = PLANETARY_ORBIT_TRAILS[k];
      return {
        ...base,
        semiMajorAxis: Number((base.semiMajorAxis * viewportMetrics.orbitRxScale).toFixed(2)),
        semiMinorAxis: Number((base.semiMinorAxis * viewportMetrics.orbitRyScale).toFixed(2)),
        focalDistance: Number((base.focalDistance * viewportMetrics.orbitRxScale).toFixed(2)),
      };
    });
  }, [viewportMetrics.orbitRxScale, viewportMetrics.orbitRyScale]);

  const scaledTrailsByKey = useMemo(() => {
    const map = {} as Record<CelestialBodyKey, PlanetaryOrbitTrailConfig>;
    for (const trail of orbitalTrails) {
      map[trail.key] = trail;
    }
    return map;
  }, [orbitalTrails]);

  // Sync activeBodyKey with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('swid_celestial_active_body', activeBodyKey);
    } catch {
      // ignore
    }
  }, [activeBodyKey]);

  // Sync orbitTrailsVisible with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('swid_orbit_trails_visible', String(orbitTrailsVisible));
    } catch {
      // ignore
    }
  }, [orbitTrailsVisible]);

  // Sync fadingTrailsVisible with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('swid_fading_trails_visible', String(fadingTrailsVisible));
    } catch {
      // ignore
    }
  }, [fadingTrailsVisible]);

  // Sync moonsVisible with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('swid_moons_visible', String(moonsVisible));
    } catch {
      // ignore
    }
  }, [moonsVisible]);

  // Starfield Canvas Particles State
  const [starfieldVisible, setStarfieldVisibleState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('swid_starfield_visible');
        return saved !== null ? saved === 'true' : true;
      } catch {
        return true;
      }
    }
    return true;
  });

  // Gravitational Lensing Distortion Filter State
  const [lensingVisible, setLensingVisibleState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('swid_lensing_visible');
        return saved !== null ? saved === 'true' : true;
      } catch {
        return true;
      }
    }
    return true;
  });

  // Master Graphics Performance Mode: 'high' (all effects active) vs 'eco' (lightweight)
  const [graphicsMode, setGraphicsModeState] = useState<'high' | 'eco'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('swid_graphics_mode') as 'high' | 'eco';
        return saved === 'eco' ? 'eco' : 'high';
      } catch {
        return 'high';
      }
    }
    return 'high';
  });

  useEffect(() => {
    try {
      localStorage.setItem('swid_starfield_visible', String(starfieldVisible));
    } catch {
      // ignore
    }
  }, [starfieldVisible]);

  useEffect(() => {
    try {
      localStorage.setItem('swid_lensing_visible', String(lensingVisible));
    } catch {
      // ignore
    }
  }, [lensingVisible]);

  useEffect(() => {
    try {
      localStorage.setItem('swid_graphics_mode', graphicsMode);
    } catch {
      // ignore
    }
  }, [graphicsMode]);

  // Keep elapsedOrbitalTime static in React state to avoid 60fps global context re-renders;
  // all planetary and black hole motions use lightweight hardware-accelerated CSS animations.
  useEffect(() => {
    setElapsedOrbitalTime(12);
  }, [orbitAnimationSpeed]);

  const toggleOrbitTrails = useCallback(() => {
    setOrbitTrailsVisibleState((prev) => {
      const next = !prev;
      setNotificationState(next ? '🌌 Elliptical Orbit Paths Illuminated' : 'Orbit Paths Minimized');
      return next;
    });
  }, []);

  const setOrbitTrailsVisible = useCallback((visible: boolean) => {
    setOrbitTrailsVisibleState(visible);
  }, []);

  const toggleFadingTrails = useCallback(() => {
    setFadingTrailsVisibleState((prev) => {
      const next = !prev;
      setNotificationState(next ? '✨ Fading Planetary Motion Trails Active' : 'Fading Motion Trails Hidden');
      return next;
    });
  }, []);

  const setFadingTrailsVisible = useCallback((visible: boolean) => {
    setFadingTrailsVisibleState(visible);
  }, []);

  const toggleMoons = useCallback(() => {
    setMoonsVisibleState((prev) => {
      const next = !prev;
      setNotificationState(next ? '🛰️ Orbiting Planetary Moons & Satellites Active' : 'Orbiting Moons Hidden');
      return next;
    });
  }, []);

  const setMoonsVisible = useCallback((visible: boolean) => {
    setMoonsVisibleState(visible);
  }, []);

  const toggleStarfield = useCallback(() => {
    setStarfieldVisibleState((prev) => {
      const next = !prev;
      setNotificationState(next ? '⭐ Twinkling Starfield Active' : 'Starfield Canvas Suspended (Eco)');
      return next;
    });
  }, []);

  const setStarfieldVisible = useCallback((visible: boolean) => {
    setStarfieldVisibleState(visible);
  }, []);

  const toggleLensing = useCallback(() => {
    setLensingVisibleState((prev) => {
      const next = !prev;
      setNotificationState(next ? '🌀 Gravitational Lensing Shader Active' : 'Lensing Shader Suspended');
      return next;
    });
  }, []);

  const setLensingVisible = useCallback((visible: boolean) => {
    setLensingVisibleState(visible);
  }, []);

  const setGraphicsMode = useCallback((mode: 'high' | 'eco') => {
    setGraphicsModeState(mode);
    if (mode === 'eco') {
      setOrbitTrailsVisibleState(false);
      setFadingTrailsVisibleState(false);
      setMoonsVisibleState(false);
      setStarfieldVisibleState(false);
      setLensingVisibleState(false);
      setNotificationState('🌱 Graphics Eco Mode Engaged: High-FPS Minimal GPU load');
    } else {
      setOrbitTrailsVisibleState(true);
      setFadingTrailsVisibleState(true);
      setMoonsVisibleState(true);
      setStarfieldVisibleState(true);
      setLensingVisibleState(true);
      setNotificationState('🚀 Graphics Ultra Mode Active: Full Cosmic VFX & Canvas Shaders');
    }
  }, []);

  const toggleMasterGraphics = useCallback(() => {
    setGraphicsModeState((prev) => {
      const next = prev === 'high' ? 'eco' : 'high';
      if (next === 'eco') {
        setOrbitTrailsVisibleState(false);
        setFadingTrailsVisibleState(false);
        setMoonsVisibleState(false);
        setStarfieldVisibleState(false);
        setLensingVisibleState(false);
        setNotificationState('🌱 Graphics Eco Mode Engaged (Minimal GPU Load)');
      } else {
        setOrbitTrailsVisibleState(true);
        setFadingTrailsVisibleState(true);
        setMoonsVisibleState(true);
        setStarfieldVisibleState(true);
        setLensingVisibleState(true);
        setNotificationState('🚀 Graphics Ultra Mode: All Celestial VFX Active');
      }
      return next;
    });
  }, []);

  const getPlanetMoons = useCallback((planetKey: CelestialBodyKey) => {
    return getMoonsForPlanet(planetKey);
  }, []);

  const setTrailLengthMultiplier = useCallback((multiplier: number) => {
    setTrailLengthMultiplierState(multiplier);
    setNotificationState(`Planetary Motion Trail Length: ${multiplier}x`);
  }, []);

  const setOrbitAnimationSpeed = useCallback((speed: number) => {
    setOrbitAnimationSpeedState(speed);
    setNotificationState(`Orbital Clock Adjusted: ${speed}x Speed`);
  }, []);

  const toggleFocusedOrbitOnly = useCallback(() => {
    setFocusedOrbitOnly((prev) => {
      const next = !prev;
      setNotificationState(next ? 'Focused on Active Planet Orbit Trail' : 'All Solar System Orbit Trails Active');
      return next;
    });
  }, []);

  const getPlanetPosition = useCallback(
    (key: CelestialBodyKey, customTime?: number) => {
      const orbit = scaledTrailsByKey[key] || PLANETARY_ORBIT_TRAILS[key];
      const timeToUse = customTime !== undefined ? customTime : elapsedOrbitalTime;
      return calculateOrbitPosition(orbit, timeToUse, orbitAnimationSpeed);
    },
    [scaledTrailsByKey, elapsedOrbitalTime, orbitAnimationSpeed]
  );

  /**
   * Calculates dynamic fading path segments trailing behind the moving planet
   */
  const getPlanetTrailSegments = useCallback(
    (key: CelestialBodyKey, customTime?: number, customTrailLengthDeg?: number) => {
      const orbit = scaledTrailsByKey[key] || PLANETARY_ORBIT_TRAILS[key];
      const timeToUse = customTime !== undefined ? customTime : elapsedOrbitalTime;
      const { angleRad } = calculateOrbitPosition(orbit, timeToUse, orbitAnimationSpeed);
      const effectiveLength = (customTrailLengthDeg || orbit.trailLengthDeg || 75) * trailLengthMultiplier;
      return calculateFadingTrailSegments(orbit, angleRad, effectiveLength);
    },
    [scaledTrailsByKey, elapsedOrbitalTime, orbitAnimationSpeed, trailLengthMultiplier]
  );

  /**
   * Generates a continuous SVG path string for the fading trailing arc
   */
  const getPlanetTrailPath = useCallback(
    (key: CelestialBodyKey, customTime?: number, customTrailLengthDeg?: number) => {
      const orbit = scaledTrailsByKey[key] || PLANETARY_ORBIT_TRAILS[key];
      const timeToUse = customTime !== undefined ? customTime : elapsedOrbitalTime;
      const { angleRad } = calculateOrbitPosition(orbit, timeToUse, orbitAnimationSpeed);
      const effectiveLength = (customTrailLengthDeg || orbit.trailLengthDeg || 75) * trailLengthMultiplier;
      return generateFadingTrailSvgPath(orbit, angleRad, effectiveLength);
    },
    [scaledTrailsByKey, elapsedOrbitalTime, orbitAnimationSpeed, trailLengthMultiplier]
  );

  const setNotification = useCallback((msg: string | null) => {
    setNotificationState(msg);
    if (msg) {
      setTimeout(() => {
        setNotificationState((curr) => (curr === msg ? null : curr));
      }, 4200);
    }
  }, []);

  const transitionTimerRef = useRef<number | null>(null);

  const triggerSmoothTransition = useCallback(() => {
    setIsTransitioning(true);
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }
    transitionTimerRef.current = window.setTimeout(() => {
      setIsTransitioning(false);
    }, 240);
  }, []);

  const setCelestialBody = useCallback(
    (key: CelestialBodyKey) => {
      setActiveBodyKeyState((curr) => {
        if (curr === key) return curr;
        triggerSmoothTransition();
        setNotification(`Orbit aligned with: ${getCelestialBodyInfo(key).name}`);
        return key;
      });
    },
    [setNotification, triggerSmoothTransition]
  );

  const advanceToNextBody = useCallback((): CelestialBodyKey => {
    let computedNext: CelestialBodyKey = 'sun';
    setActiveBodyKeyState((curr) => {
      computedNext = getNextCelestialBody(curr);
      triggerSmoothTransition();
      setNotification(`Transitioned orbit to: ${getCelestialBodyInfo(computedNext).name}`);
      return computedNext;
    });
    return computedNext;
  }, [setNotification, triggerSmoothTransition]);

  const stepToPrevBody = useCallback((): CelestialBodyKey => {
    let computedPrev: CelestialBodyKey = 'blackhole';
    setActiveBodyKeyState((curr) => {
      computedPrev = getPrevCelestialBody(curr);
      triggerSmoothTransition();
      setNotification(`Transitioned orbit to: ${getCelestialBodyInfo(computedPrev).name}`);
      return computedPrev;
    });
    return computedPrev;
  }, [setNotification, triggerSmoothTransition]);

  const triggerSingularityGenesis = useCallback(() => {
    setGenesisCount((prev) => prev + 1);
    setNotification('⚡ Singularity Re-Forged: Spacetime particles collapsed & re-materialized!');
  }, [setNotification]);

  /**
   * Dedicated Earth Click Handler:
   * Navigates to Earth's mapped workspace ('team') and opens in a new tab if requested.
   */
  const handleEarthClick = useCallback(
    (onSelectTab?: (tab: TabKey) => void) => {
      const earthInfo = getCelestialBodyInfo('earth');
      const targetTab = earthInfo.capability.targetTab || 'team';
      playWorkspaceTerminalSound('earth');
      setNotification(`🌍 ${earthInfo.name}: Opening ${earthInfo.capability.title}`);

      if (typeof onSelectTab === 'function') {
        try {
          onSelectTab(targetTab);
        } catch (err) {
          console.warn('onSelectTab error:', err);
        }
      }
    },
    [setNotification]
  );

  /**
   * Executes the specified (or currently focused) celestial body's mapped workspace portal.
   */
  const executeCapability = useCallback(
    (onSelectTab?: (tab: TabKey) => void, targetKey?: CelestialBodyKey) => {
      const info = targetKey ? getCelestialBodyInfo(targetKey) : activeInfo;

      if (info.key === 'sun') {
        setFlareActive(true);
        setTimeout(() => setFlareActive(false), 1600);
      }

      if (info.capability.targetTab && onSelectTab) {
        playWorkspaceTerminalSound(info.key);
        onSelectTab(info.capability.targetTab);
        setNotification(`${info.astronomicalSymbol} ${info.name}: Opening ${info.capability.title}`);
        return;
      }

      if (info.key === 'blackhole') {
        triggerSingularityGenesis();
        return;
      }

      setNotification(`Activated ${info.name}: ${info.capability.title}`);
    },
    [activeInfo, triggerSingularityGenesis, setNotification]
  );

  return (
    <CelestialContext.Provider
      value={{
        activeBodyKey,
        activeInfo,
        isTransitioning,
        flareActive,
        notification,
        genesisCount,
        orbitTrailsVisible,
        fadingTrailsVisible,
        moonsVisible,
        orbitAnimationSpeed,
        trailLengthMultiplier,
        focusedOrbitOnly,
        elapsedOrbitalTime,
        orbitalTrails,
        setCelestialBody,
        advanceToNextBody,
        stepToPrevBody,
        triggerSingularityGenesis,
        setNotification,
        handleEarthClick,
        executeCapability,
        toggleOrbitTrails,
        setOrbitTrailsVisible,
        toggleFadingTrails,
        setFadingTrailsVisible,
        toggleMoons,
        setMoonsVisible,
        starfieldVisible,
        lensingVisible,
        graphicsMode,
        toggleStarfield,
        setStarfieldVisible,
        toggleLensing,
        setLensingVisible,
        toggleMasterGraphics,
        setGraphicsMode,
        setOrbitAnimationSpeed,
        setTrailLengthMultiplier,
        toggleFocusedOrbitOnly,
        getPlanetPosition,
        getPlanetTrailSegments,
        getPlanetTrailPath,
        getPlanetMoons,
        viewportMetrics,
        registerStageElement,
      }}
    >
      {children}
    </CelestialContext.Provider>
  );
};

export const useCelestial = (): CelestialContextType => {
  const context = useContext(CelestialContext);
  if (!context) {
    throw new Error('useCelestial must be used within a CelestialProvider');
  }
  return context;
};
