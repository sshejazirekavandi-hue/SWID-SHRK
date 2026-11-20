import React, { useEffect, useRef, useState } from 'react';
import logoLuminous from '../assets/logo_luminous.png';
import logoTransparent from '../assets/logo_transparent.png';

interface BlackHoleStarSwallowProps {
  isHovered?: boolean;
  isMaterializing?: boolean;
  genesisCount?: number;
}

interface PlasmaParticle {
  t: number;
  speed: number;
  offsetNormal: number;
  turbulencePhase: number;
  turbulenceFreq: number;
  size: number;
  colorType: 'core' | 'gold' | 'magma' | 'crimson';
  alpha: number;
}

function evalCubicBezier(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
) {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  const x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
  const y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;

  const dx =
    3 * uu * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * tt * (p3.x - p2.x);
  const dy =
    3 * uu * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * tt * (p3.y - p2.y);

  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  return { x, y, nx, ny, dx: dx / len, dy: dy / len };
}

interface JetFilamentSpec {
  // Cubic bezier segments from launch core (y=340) outward (y=8) in 220x360 half-jet space
  pts: [number, number, number, number, number, number, number, number][];
  grad: 'spine' | 'primary' | 'sheath' | 'pulse';
  width: number;
  glowWidth: number;
  alpha: number;
  dash: number[];
  speed: number;
  phase: number;
}

// High-density multi-strand helical magnetic plasma filaments for a single pole (mirrored for South)
const JET_FILAMENTS: JetFilamentSpec[] = [
  // Axial spine
  {
    pts: [
      [110, 340, 107, 284, 113, 226, 108, 168],
      [108, 168, 104, 112, 114, 58, 109, 8],
    ],
    grad: 'spine',
    width: 2.3,
    glowWidth: 7.5,
    alpha: 0.92,
    dash: [64, 16, 110, 22],
    speed: 88,
    phase: 0,
  },
  {
    pts: [
      [110, 340, 112, 290, 108, 232, 111, 174],
      [111, 174, 114, 118, 107, 62, 111, 10],
    ],
    grad: 'spine',
    width: 1.3,
    glowWidth: 4.2,
    alpha: 0.88,
    dash: [18, 62, 28, 92],
    speed: 124,
    phase: 40,
  },
  // Intertwined helical magnetic filaments
  {
    pts: [
      [110, 338, 100, 304, 120, 272, 102, 232],
      [102, 232, 88, 196, 126, 154, 96, 106],
      [96, 106, 76, 72, 124, 38, 86, 8],
    ],
    grad: 'primary',
    width: 2.4,
    glowWidth: 7.2,
    alpha: 0.88,
    dash: [44, 14, 86, 18],
    speed: 56,
    phase: 12,
  },
  {
    pts: [
      [110, 338, 120, 302, 100, 268, 118, 228],
      [118, 228, 132, 192, 94, 150, 124, 102],
      [124, 102, 144, 68, 96, 36, 134, 8],
    ],
    grad: 'primary',
    width: 2.1,
    glowWidth: 6.2,
    alpha: 0.84,
    dash: [42, 14, 84, 20],
    speed: 48,
    phase: 78,
  },
  {
    pts: [
      [108, 336, 96, 294, 117, 254, 96, 206],
      [96, 206, 82, 168, 118, 124, 88, 74],
      [88, 74, 72, 46, 106, 24, 74, 6],
    ],
    grad: 'primary',
    width: 1.5,
    glowWidth: 4.4,
    alpha: 0.72,
    dash: [38, 16, 78, 22],
    speed: 40,
    phase: 120,
  },
  {
    pts: [
      [112, 336, 124, 294, 103, 254, 124, 206],
      [124, 206, 138, 168, 102, 124, 132, 74],
      [132, 74, 148, 46, 114, 24, 146, 6],
    ],
    grad: 'primary',
    width: 1.45,
    glowWidth: 4.2,
    alpha: 0.68,
    dash: [36, 18, 74, 24],
    speed: 44,
    phase: 155,
  },
  // Outer collimated sheath edge filaments
  {
    pts: [
      [104, 334, 94, 278, 88, 214, 78, 144],
      [78, 144, 70, 94, 62, 48, 52, 8],
    ],
    grad: 'sheath',
    width: 1.2,
    glowWidth: 3.8,
    alpha: 0.6,
    dash: [46, 18, 80, 26],
    speed: 35,
    phase: 22,
  },
  {
    pts: [
      [116, 334, 126, 278, 132, 214, 142, 144],
      [142, 144, 150, 94, 158, 48, 168, 8],
    ],
    grad: 'sheath',
    width: 1.2,
    glowWidth: 3.8,
    alpha: 0.6,
    dash: [46, 18, 80, 26],
    speed: 38,
    phase: 92,
  },
  // High-velocity synchrotron plasma pulses
  {
    pts: [
      [110, 338, 103, 292, 116, 242, 104, 188],
      [104, 188, 95, 142, 116, 90, 98, 14],
    ],
    grad: 'pulse',
    width: 1.9,
    glowWidth: 5.2,
    alpha: 0.9,
    dash: [14, 78, 24, 104],
    speed: 132,
    phase: 15,
  },
  {
    pts: [
      [110, 338, 117, 290, 104, 238, 116, 184],
      [116, 184, 125, 138, 104, 86, 122, 14],
    ],
    grad: 'pulse',
    width: 1.65,
    glowWidth: 4.8,
    alpha: 0.85,
    dash: [14, 78, 24, 104],
    speed: 112,
    phase: 110,
  },
];

interface LensingArcSpec {
  type: 'cubic2' | 'cubic1' | 'quad2';
  // Coordinates in 640x360 Gargantua lensing space
  coords: number[];
  grad: 'doppler' | 'gold' | 'crimson' | 'knot';
  width: number;
  glowWidth: number;
  alpha: number;
  dash: number[];
  speed: number;
  phase: number;
}

const LENSING_ARCS: LensingArcSpec[] = [
  // Upper gravitational lensing arch (6 concentric multi-velocity streams)
  {
    type: 'cubic2',
    coords: [164, 197, 228, 190, 240, 116, 322, 116, 404, 116, 416, 190, 480, 197],
    grad: 'knot',
    width: 1.45,
    glowWidth: 4.2,
    alpha: 0.92,
    dash: [44, 26, 92, 38],
    speed: 88,
    phase: 0,
  },
  {
    type: 'cubic2',
    coords: [142, 198, 216, 190, 232, 108, 322, 108, 412, 108, 428, 190, 502, 198],
    grad: 'doppler',
    width: 2.3,
    glowWidth: 6.4,
    alpha: 0.9,
    dash: [58, 28, 112, 42],
    speed: 78,
    phase: 45,
  },
  {
    type: 'cubic2',
    coords: [122, 198.5, 204, 191, 222, 100, 322, 100, 422, 100, 440, 191, 522, 198.5],
    grad: 'gold',
    width: 1.55,
    glowWidth: 4.6,
    alpha: 0.84,
    dash: [34, 22, 76, 32],
    speed: 64,
    phase: 95,
  },
  {
    type: 'cubic2',
    coords: [100, 199, 192, 192, 212, 91, 322, 91, 432, 91, 452, 192, 544, 199],
    grad: 'crimson',
    width: 1.9,
    glowWidth: 5.6,
    alpha: 0.78,
    dash: [58, 28, 112, 42],
    speed: 52,
    phase: 140,
  },
  {
    type: 'cubic2',
    coords: [80, 200, 180, 194, 202, 82, 322, 82, 442, 82, 464, 194, 564, 200],
    grad: 'crimson',
    width: 1.3,
    glowWidth: 3.8,
    alpha: 0.62,
    dash: [44, 24, 88, 36],
    speed: 42,
    phase: 185,
  },
  {
    type: 'cubic2',
    coords: [62, 201, 168, 196, 192, 74, 322, 74, 452, 74, 476, 196, 582, 201],
    grad: 'crimson',
    width: 1.0,
    glowWidth: 3.2,
    alpha: 0.44,
    dash: [84, 44, 132, 60],
    speed: 34,
    phase: 220,
  },
  // Lower gravitational lensing undertow (4 concentric streams)
  {
    type: 'cubic1',
    coords: [252, 218, 260, 268, 384, 268, 392, 218],
    grad: 'knot',
    width: 1.35,
    glowWidth: 4.0,
    alpha: 0.84,
    dash: [44, 26, 92, 38],
    speed: 86,
    phase: 18,
  },
  {
    type: 'cubic1',
    coords: [244, 218, 254, 277, 390, 277, 400, 218],
    grad: 'doppler',
    width: 2.1,
    glowWidth: 6.0,
    alpha: 0.8,
    dash: [58, 28, 112, 42],
    speed: 74,
    phase: 66,
  },
  {
    type: 'cubic1',
    coords: [235, 218, 246, 286, 398, 286, 409, 218],
    grad: 'crimson',
    width: 1.55,
    glowWidth: 4.5,
    alpha: 0.68,
    dash: [34, 22, 76, 32],
    speed: 58,
    phase: 112,
  },
  {
    type: 'cubic1',
    coords: [226, 218, 238, 296, 406, 296, 418, 218],
    grad: 'crimson',
    width: 1.1,
    glowWidth: 3.2,
    alpha: 0.48,
    dash: [84, 44, 132, 60],
    speed: 40,
    phase: 170,
  },
  // Equatorial Doppler-beamed accretion plane (6 high-energy streams)
  {
    type: 'quad2',
    coords: [46, 199, 184, 210, 322, 209, 460, 208, 598, 199],
    grad: 'doppler',
    width: 2.0,
    glowWidth: 5.8,
    alpha: 0.8,
    dash: [58, 28, 112, 42],
    speed: 82,
    phase: 30,
  },
  {
    type: 'quad2',
    coords: [64, 203, 192, 214, 322, 213, 452, 212, 580, 203],
    grad: 'gold',
    width: 1.6,
    glowWidth: 4.5,
    alpha: 0.74,
    dash: [34, 22, 76, 32],
    speed: 68,
    phase: 90,
  },
  {
    type: 'quad2',
    coords: [86, 207, 204, 219, 322, 217, 440, 215, 558, 207],
    grad: 'crimson',
    width: 1.4,
    glowWidth: 4.0,
    alpha: 0.62,
    dash: [58, 28, 112, 42],
    speed: 54,
    phase: 150,
  },
  {
    type: 'quad2',
    coords: [38, 202, 178, 216, 322, 215, 466, 214, 606, 202],
    grad: 'crimson',
    width: 1.05,
    glowWidth: 3.0,
    alpha: 0.46,
    dash: [84, 44, 132, 60],
    speed: 38,
    phase: 210,
  },
  // Fast streaking synchrotron knots across equatorial disk & upper arch
  {
    type: 'quad2',
    coords: [76, 200, 198, 212, 322, 211, 446, 210, 566, 200],
    grad: 'knot',
    width: 1.9,
    glowWidth: 5.0,
    alpha: 0.92,
    dash: [14, 118, 22, 146],
    speed: 145,
    phase: 25,
  },
  {
    type: 'cubic2',
    coords: [132, 198, 210, 191, 228, 104, 322, 104, 416, 104, 434, 191, 512, 198],
    grad: 'knot',
    width: 1.75,
    glowWidth: 4.6,
    alpha: 0.88,
    dash: [14, 118, 22, 146],
    speed: 122,
    phase: 135,
  },
];

function drawJetPole(
  ctx: CanvasRenderingContext2D,
  grads: {
    spine: CanvasGradient;
    primary: CanvasGradient;
    sheath: CanvasGradient;
    pulse: CanvasGradient;
    knot: CanvasGradient;
    cone: CanvasGradient;
  },
  elapsedSec: number,
  phaseOffset: number,
  poleAlpha: number
) {
  ctx.save();
  ctx.globalAlpha = poleAlpha;

  // Parabolic outer ionized plasma sheath (smooth gradient fill — zero blur filter!)
  const breathe = 0.9 + 0.1 * Math.sin(elapsedSec * 1.75 + phaseOffset);
  ctx.save();
  ctx.globalAlpha = poleAlpha * 0.28 * breathe;
  ctx.fillStyle = grads.cone;
  ctx.beginPath();
  ctx.moveTo(102, 336);
  ctx.quadraticCurveTo(94, 246, 80, 146);
  ctx.quadraticCurveTo(68, 76, 52, 6);
  ctx.lineTo(168, 6);
  ctx.quadraticCurveTo(152, 76, 140, 146);
  ctx.quadraticCurveTo(126, 246, 118, 336);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Inner collimated sheath core
  ctx.save();
  ctx.globalAlpha = poleAlpha * 0.22 * breathe;
  ctx.fillStyle = grads.primary;
  ctx.beginPath();
  ctx.moveTo(106, 338);
  ctx.quadraticCurveTo(100, 248, 94, 148);
  ctx.quadraticCurveTo(86, 78, 76, 10);
  ctx.lineTo(144, 10);
  ctx.quadraticCurveTo(134, 78, 126, 148);
  ctx.quadraticCurveTo(120, 248, 114, 338);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Multi-strand helical relativistic filaments (double-pass soft glow + crisp core)
  for (let i = 0; i < JET_FILAMENTS.length; i++) {
    const f = JET_FILAMENTS[i];
    const grad = grads[f.grad];
    const wave = 0.8 + 0.2 * Math.sin(elapsedSec * 2.1 + f.phase * 0.05 + phaseOffset);
    const dashOffset = -(elapsedSec * f.speed + f.phase + phaseOffset * 48);

    ctx.beginPath();
    ctx.moveTo(f.pts[0][0], f.pts[0][1]);
    for (let s = 0; s < f.pts.length; s++) {
      const p = f.pts[s];
      ctx.bezierCurveTo(p[2], p[3], p[4], p[5], p[6], p[7]);
    }

    ctx.setLineDash(f.dash);
    ctx.lineDashOffset = dashOffset;
    ctx.strokeStyle = grad;

    // Pass 1: Soft wide ionized halo (replaces expensive SVG feGaussianBlur)
    ctx.globalAlpha = poleAlpha * f.alpha * 0.26 * wave;
    ctx.lineWidth = f.glowWidth;
    ctx.stroke();

    // Pass 2: Crisp high-energy filament core
    ctx.globalAlpha = poleAlpha * f.alpha * wave;
    ctx.lineWidth = f.width;
    ctx.stroke();
  }

  ctx.setLineDash([]);

  // Compact blazing white-blue polar pinch core
  const knotScale = 0.94 + 0.08 * Math.sin(elapsedSec * 1.85 + phaseOffset);
  ctx.save();
  ctx.translate(110, 333);
  ctx.scale(knotScale, knotScale);
  ctx.globalAlpha = poleAlpha * 0.95;
  ctx.fillStyle = grads.knot;
  ctx.beginPath();
  ctx.ellipse(0, 0, 19, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -2, 8.5, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * BlackHoleStarSwallow
 * 1. INTRO FADE-IN (0s -> 6.8s): Plays the Cygnus X-1 star-feeding sequence while keeping
 *    Phase 2 unmounted so hardware video decoding runs smoothly at 60fps.
 * 2. SETTLED BLACK HOLE: Renders bipolar relativistic plasma jets + GRMHD gravitational
 *    lensing streams via two ultra-fast DPR-capped 2D canvases (zero SVG feGaussianBlur or
 *    stroke-dashoffset repaints!) combined with pure GPU-composited accretion & whirlpool layers,
 *    automatically pausing whenever scrolled off-screen or in a hidden tab.
 */
export const BlackHoleStarSwallow: React.FC<BlackHoleStarSwallowProps> = ({
  isHovered = false,
  genesisCount = 0,
}) => {
  const [isSwallowing, setIsSwallowing] = useState(true);
  const [settledBlackHoleOpacity, setSettledBlackHoleOpacity] = useState(0);
  const [swallowLayerOpacity, setSwallowLayerOpacity] = useState(0);
  const [jetBurstActive, setJetBurstActive] = useState(false);
  const [logoRevealed, setLogoRevealed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [isInView, setIsInView] = useState(true);

  const rootContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const jetCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lensingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const jetBurstRef = useRef<HTMLDivElement | null>(null);
  const diskBackRef = useRef<HTMLDivElement | null>(null);
  const diskFrontRef = useRef<HTMLDivElement | null>(null);
  const outerDiskRef = useRef<HTMLDivElement | null>(null);
  const photonRingRef = useRef<HTMLDivElement | null>(null);
  const isHoveredRef = useRef(isHovered);
  const isInViewRef = useRef(true);
  const swallowCompletedRef = useRef(false);
  const videoReadyRef = useRef(false);

  useEffect(() => {
    videoReadyRef.current = videoReady;
  }, [videoReady]);

  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  // Pause all off-screen or hidden-tab animations so lower page scrolling stays locked at 60fps
  useEffect(() => {
    const el = rootContainerRef.current;
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

  // Sequence coordinator: swallowing completion -> jet burst -> logo entrance
  const triggerJetAfterSwallow = React.useCallback(() => {
    if (swallowCompletedRef.current) return;
    swallowCompletedRef.current = true;
    setSwallowLayerOpacity(0);
    setSettledBlackHoleOpacity(1);
    setJetBurstActive(true);
  }, []);

  const handleJetBurstAnimationEnd = React.useCallback(() => {
    setJetBurstActive(false);
    setIsSwallowing(false);
    setLogoRevealed(true);
  }, []);

  useEffect(() => {
    swallowCompletedRef.current = false;
    setIsSwallowing(true);
    setSettledBlackHoleOpacity(0);
    setSwallowLayerOpacity(0);
    setJetBurstActive(false);
    setLogoRevealed(false);
    setVideoFailed(false);

    const fadeInTimer = window.setTimeout(() => {
      setSwallowLayerOpacity(1);
    }, 60);

    const swallowSafetyTimer = window.setTimeout(() => {
      triggerJetAfterSwallow();
    }, 7800);

    return () => {
      window.clearTimeout(fadeInTimer);
      window.clearTimeout(swallowSafetyTimer);
    };
  }, [genesisCount, triggerJetAfterSwallow]);

  // Listen for jet burst CSS animationend so the SWID-SHRK crest enters right after the jet burst ends
  useEffect(() => {
    if (!jetBurstActive) return;
    const jetEl = jetBurstRef.current;
    const onAnimationEnd = (e: AnimationEvent) => {
      if (e.target === jetEl) {
        handleJetBurstAnimationEnd();
      }
    };

    if (jetEl) {
      jetEl.addEventListener('animationend', onAnimationEnd);
    }

    const jetFallbackTimer = window.setTimeout(() => {
      handleJetBurstAnimationEnd();
    }, 1750);

    return () => {
      if (jetEl) {
        jetEl.removeEventListener('animationend', onAnimationEnd);
      }
      window.clearTimeout(jetFallbackTimer);
    };
  }, [jetBurstActive, handleJetBurstAnimationEnd]);

  // Single Unified 60fps Engine for Settled Black Hole:
  // Drives differential Keplerian disk rotation + Bipolar Relativistic Jet Canvas + GRMHD Lensing Canvas
  // Automatically suspends when scrolled off-screen or when tab is backgrounded.
  useEffect(() => {
    if (settledBlackHoleOpacity === 0) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    // Setup Bipolar Jet Canvas (220 x 700 logical coords; North = 0..350, South = 350..700)
    const jetCanvas = jetCanvasRef.current;
    const jetCtx = jetCanvas ? jetCanvas.getContext('2d') : null;
    if (jetCanvas && jetCtx) {
      jetCanvas.width = Math.round(220 * dpr);
      jetCanvas.height = Math.round(700 * dpr);
      jetCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Setup GRMHD Lensing Canvas (640 x 360 logical coords)
    const lensCanvas = lensingCanvasRef.current;
    const lensCtx = lensCanvas ? lensCanvas.getContext('2d') : null;
    if (lensCanvas && lensCtx) {
      lensCanvas.width = Math.round(640 * dpr);
      lensCanvas.height = Math.round(360 * dpr);
      lensCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Pre-cache all gradients ONCE outside the animation loop (zero per-frame allocations)
    const jetGrads = jetCtx
      ? (() => {
          const spine = jetCtx.createLinearGradient(110, 342, 110, 8);
          spine.addColorStop(0, 'rgba(255, 255, 255, 1)');
          spine.addColorStop(0.14, 'rgba(240, 249, 255, 0.92)');
          spine.addColorStop(0.38, 'rgba(125, 211, 252, 0.62)');
          spine.addColorStop(0.72, 'rgba(37, 99, 235, 0.22)');
          spine.addColorStop(1, 'rgba(29, 78, 216, 0)');

          const primary = jetCtx.createLinearGradient(110, 340, 110, 6);
          primary.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          primary.addColorStop(0.18, 'rgba(186, 230, 253, 0.78)');
          primary.addColorStop(0.5, 'rgba(56, 189, 248, 0.46)');
          primary.addColorStop(0.8, 'rgba(29, 78, 216, 0.18)');
          primary.addColorStop(1, 'rgba(14, 165, 233, 0)');

          const sheath = jetCtx.createLinearGradient(110, 336, 110, 10);
          sheath.addColorStop(0, 'rgba(224, 242, 254, 0.72)');
          sheath.addColorStop(0.3, 'rgba(56, 189, 248, 0.42)');
          sheath.addColorStop(0.68, 'rgba(29, 78, 216, 0.18)');
          sheath.addColorStop(1, 'rgba(30, 58, 138, 0)');

          const pulse = jetCtx.createLinearGradient(110, 342, 110, 14);
          pulse.addColorStop(0, 'rgba(255, 255, 255, 1)');
          pulse.addColorStop(0.28, 'rgba(224, 242, 254, 0.9)');
          pulse.addColorStop(0.65, 'rgba(56, 189, 248, 0.52)');
          pulse.addColorStop(1, 'rgba(56, 189, 248, 0)');

          const cone = jetCtx.createLinearGradient(110, 336, 110, 8);
          cone.addColorStop(0, 'rgba(224, 242, 254, 0.85)');
          cone.addColorStop(0.26, 'rgba(56, 189, 248, 0.52)');
          cone.addColorStop(0.62, 'rgba(37, 99, 235, 0.2)');
          cone.addColorStop(1, 'rgba(29, 78, 216, 0)');

          const knot = jetCtx.createRadialGradient(0, 0, 1, 0, 0, 18);
          knot.addColorStop(0, 'rgba(255, 255, 255, 1)');
          knot.addColorStop(0.28, 'rgba(240, 249, 255, 0.9)');
          knot.addColorStop(0.6, 'rgba(56, 189, 248, 0.42)');
          knot.addColorStop(1, 'rgba(2, 132, 199, 0)');

          return { spine, primary, sheath, pulse, cone, knot };
        })()
      : null;

    const lensGrads = lensCtx
      ? (() => {
          const doppler = lensCtx.createLinearGradient(48, 195, 592, 195);
          doppler.addColorStop(0, 'rgba(153, 27, 27, 0)');
          doppler.addColorStop(0.16, 'rgba(251, 146, 60, 0.82)');
          doppler.addColorStop(0.34, 'rgba(255, 247, 237, 0.98)');
          doppler.addColorStop(0.52, 'rgba(254, 215, 170, 0.9)');
          doppler.addColorStop(0.72, 'rgba(234, 88, 12, 0.62)');
          doppler.addColorStop(0.88, 'rgba(153, 27, 27, 0.28)');
          doppler.addColorStop(1, 'rgba(127, 29, 29, 0)');

          const gold = lensCtx.createLinearGradient(80, 190, 560, 190);
          gold.addColorStop(0, 'rgba(153, 27, 27, 0)');
          gold.addColorStop(0.22, 'rgba(251, 146, 60, 0.88)');
          gold.addColorStop(0.44, 'rgba(255, 237, 213, 0.96)');
          gold.addColorStop(0.68, 'rgba(249, 115, 22, 0.72)');
          gold.addColorStop(1, 'rgba(127, 29, 29, 0)');

          const crimson = lensCtx.createLinearGradient(100, 180, 540, 180);
          crimson.addColorStop(0, 'rgba(127, 29, 29, 0)');
          crimson.addColorStop(0.26, 'rgba(234, 88, 12, 0.72)');
          crimson.addColorStop(0.5, 'rgba(253, 186, 116, 0.84)');
          crimson.addColorStop(0.76, 'rgba(220, 38, 38, 0.54)');
          crimson.addColorStop(1, 'rgba(127, 29, 29, 0)');

          const knot = lensCtx.createLinearGradient(110, 185, 530, 185);
          knot.addColorStop(0, 'rgba(251, 146, 60, 0)');
          knot.addColorStop(0.28, 'rgba(255, 255, 255, 1)');
          knot.addColorStop(0.55, 'rgba(255, 237, 213, 0.94)');
          knot.addColorStop(0.82, 'rgba(249, 115, 22, 0.55)');
          knot.addColorStop(1, 'rgba(220, 38, 38, 0)');

          return { doppler, gold, crimson, knot };
        })()
      : null;

    let rafId: number | null = null;
    let lastTime = performance.now();
    let elapsedSec = 0;
    let innerDiskDeg = 0;
    let outerDiskDeg = 0;
    let photonRingDeg = 0;
    let speedMultiplier = 1;

    const renderFrame = (now: number, singleStatic = false) => {
      if (!singleStatic && (!isInViewRef.current || document.hidden)) {
        rafId = null;
        return;
      }

      const dt = singleStatic ? 0 : Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const targetSpeed = isHoveredRef.current ? 1.65 : 1.0;
      speedMultiplier += (targetSpeed - speedMultiplier) * Math.min(1, dt * 4.5);
      elapsedSec += dt * speedMultiplier;

      // 1. Differential Keplerian GPU Disk Rotations (pure transform, zero filter)
      innerDiskDeg = (innerDiskDeg + dt * 38 * speedMultiplier) % 360;
      outerDiskDeg = (outerDiskDeg + dt * 21 * speedMultiplier) % 360;
      photonRingDeg = (photonRingDeg + dt * 66 * speedMultiplier) % 360;

      const innerTransform = `translate3d(0px, 0px, 0px) rotateZ(${innerDiskDeg.toFixed(2)}deg)`;
      const outerTransform = `translate3d(0px, 0px, 0px) rotateZ(${outerDiskDeg.toFixed(2)}deg)`;
      const photonTransform = `translate3d(0px, 0px, 0px) rotateZ(${photonRingDeg.toFixed(2)}deg)`;

      if (diskBackRef.current) diskBackRef.current.style.transform = innerTransform;
      if (diskFrontRef.current) diskFrontRef.current.style.transform = innerTransform;
      if (outerDiskRef.current) outerDiskRef.current.style.transform = outerTransform;
      if (photonRingRef.current) photonRingRef.current.style.transform = photonTransform;

      // 2. Render Bipolar Relativistic Plasma Jets (North + Antipodal South)
      if (jetCtx && jetGrads) {
        jetCtx.clearRect(0, 0, 220, 700);
        jetCtx.save();
        jetCtx.globalCompositeOperation = 'lighter';

        // North (Approaching) Jet: y = 0..350 (launch core at y = 333)
        drawJetPole(jetCtx, jetGrads, elapsedSec, 0, 1.0);

        // South (Antipodal Counter-Jet): mirrored around y = 350 with subtle Doppler dimming (0.84)
        jetCtx.save();
        jetCtx.translate(220, 700);
        jetCtx.rotate(Math.PI);
        drawJetPole(jetCtx, jetGrads, elapsedSec, 2.35, 0.84);
        jetCtx.restore();

        jetCtx.restore();
      }

      // 3. Render GRMHD Gravitational Lensing & Accretion Plane Plasma Streams
      if (lensCtx && lensGrads) {
        lensCtx.clearRect(0, 0, 640, 360);
        lensCtx.save();
        lensCtx.globalCompositeOperation = 'lighter';
        lensCtx.lineCap = 'round';
        lensCtx.lineJoin = 'round';

        for (let i = 0; i < LENSING_ARCS.length; i++) {
          const arc = LENSING_ARCS[i];
          const grad = lensGrads[arc.grad];
          const c = arc.coords;
          const wave = 0.78 + 0.22 * Math.sin(elapsedSec * 1.9 + arc.phase * 0.04);
          const dashOffset = -(elapsedSec * arc.speed + arc.phase);

          lensCtx.beginPath();
          if (arc.type === 'cubic2') {
            lensCtx.moveTo(c[0], c[1]);
            lensCtx.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]);
            lensCtx.bezierCurveTo(c[8], c[9], c[10], c[11], c[12], c[13]);
          } else if (arc.type === 'cubic1') {
            lensCtx.moveTo(c[0], c[1]);
            lensCtx.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]);
          } else {
            lensCtx.moveTo(c[0], c[1]);
            lensCtx.quadraticCurveTo(c[2], c[3], c[4], c[5]);
            lensCtx.quadraticCurveTo(c[6], c[7], c[8], c[9]);
          }

          lensCtx.setLineDash(arc.dash);
          lensCtx.lineDashOffset = dashOffset;
          lensCtx.strokeStyle = grad;

          // Soft wide glow stroke (replaces SVG feGaussianBlur)
          lensCtx.globalAlpha = arc.alpha * 0.24 * wave;
          lensCtx.lineWidth = arc.glowWidth;
          lensCtx.stroke();

          // Crisp core plasma filament
          lensCtx.globalAlpha = arc.alpha * wave;
          lensCtx.lineWidth = arc.width;
          lensCtx.stroke();
        }

        lensCtx.setLineDash([]);
        lensCtx.restore();
      }

      if (!singleStatic) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const tick = (now: number) => renderFrame(now, false);

    if (prefersReducedMotion) {
      renderFrame(performance.now(), true);
      return;
    }

    const startLoop = () => {
      if (rafId === null && isInViewRef.current && !document.hidden) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      } else {
        startLoop();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    startLoop();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [settledBlackHoleOpacity, isInView]);

  // Play attached Cygnus X-1 star-feeding video and attach swallowing completion ('ended') listener
  useEffect(() => {
    if (!isSwallowing) return;
    const vid = videoRef.current;
    if (!vid) return;

    const handleVideoEnded = () => {
      triggerJetAfterSwallow();
    };

    vid.addEventListener('ended', handleVideoEnded);
    vid.currentTime = 0;
    vid.muted = true;
    vid.playsInline = true;
    vid.playbackRate = 1.45;

    const rafId = requestAnimationFrame(() => {
      vid.play().catch(() => {
        setVideoFailed(true);
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
      vid.removeEventListener('ended', handleVideoEnded);
    };
  }, [isSwallowing, genesisCount, triggerJetAfterSwallow]);

  // Procedural Canvas Fallback: ONLY runs if the MP4 video fails to load/autoplay
  useEffect(() => {
    if (!isSwallowing || !videoFailed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 760;
    const height = 620;
    canvas.width = width;
    canvas.height = height;

    const bhX = width * 0.56;
    const bhY = height * 0.54;
    const horizonRadius = 62;

    const streamP0 = { x: bhX - 330, y: bhY - 75 };
    const streamP1 = { x: bhX - 180, y: bhY - 125 };
    const streamP2 = { x: bhX - 85, y: bhY - 30 };
    const streamP3 = { x: bhX - horizonRadius * 0.85, y: bhY + 4 };

    const flareP0 = { x: bhX - 6, y: bhY - horizonRadius * 0.72 };
    const flareP1 = { x: bhX - 42, y: bhY - 95 };
    const flareP2 = { x: bhX - 115, y: bhY - 118 };
    const flareP3 = { x: bhX - 178, y: bhY - 92 };

    const numParticles = 72;
    const particles: PlasmaParticle[] = Array.from({ length: numParticles }, () => {
      const rand = Math.random();
      const colorType: PlasmaParticle['colorType'] =
        rand > 0.72 ? 'core' : rand > 0.35 ? 'gold' : 'magma';

      return {
        t: Math.random() * 0.9,
        speed: 0.0045 + Math.random() * 0.005,
        offsetNormal: (Math.random() - 0.5) * 2.0,
        turbulencePhase: Math.random() * Math.PI * 2,
        turbulenceFreq: 2.2 + Math.random() * 3.5,
        size: colorType === 'core' ? 1.8 + Math.random() * 2.4 : 2.8 + Math.random() * 4.2,
        colorType,
        alpha: 0.35 + Math.random() * 0.45,
      };
    });

    let animId: number;
    const startTime = performance.now();
    const totalDurationMs = 5800;

    const handleCanvasSwallowComplete = () => {
      triggerJetAfterSwallow();
    };
    canvas.addEventListener('swallowcomplete', handleCanvasSwallowComplete);

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / totalDurationMs);
      const time = elapsed * 0.0018;
      const isVidReady = videoReadyRef.current;

      ctx.clearRect(0, 0, width, height);

      const tailCutoffT = progress < 0.65 ? 0 : Math.min(1, (progress - 0.65) / 0.35);
      const flareIntensity =
        progress < 0.48
          ? 0
          : progress < 0.78
          ? (progress - 0.48) / 0.3
          : Math.max(0, 1 - (progress - 0.78) / 0.22);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      if (!isVidReady && tailCutoffT < 0.95) {
        const starGlow = ctx.createRadialGradient(
          bhX - 350,
          bhY + 10,
          20,
          bhX - 350,
          bhY + 10,
          240
        );
        starGlow.addColorStop(0, 'rgba(186, 230, 253, 0.75)');
        starGlow.addColorStop(0.45, 'rgba(56, 189, 248, 0.38)');
        starGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = starGlow;
        ctx.beginPath();
        ctx.arc(bhX - 350, bhY + 10, 240, 0, Math.PI * 2);
        ctx.fill();
      }

      const ribbonCount = isVidReady ? 2 : 5;
      for (let r = 0; r < ribbonCount; r++) {
        const ribbonNorm = (r / Math.max(1, ribbonCount - 1) - 0.5) * 2;
        const steps = 32;
        ctx.beginPath();
        let started = false;
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          if (t < tailCutoffT) continue;
          const pt = evalCubicBezier(t, streamP0, streamP1, streamP2, streamP3);
          const spread = (1 - t * 0.75) * 26 + 4;
          const wave = Math.sin(t * 10 - time * 4.2 + r * 1.3) * (1 - t * 0.6) * 7;
          const offset = ribbonNorm * spread + wave;
          const px = pt.x + pt.nx * offset;
          const py = pt.y + pt.ny * offset;
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        const streamGrad = ctx.createLinearGradient(streamP0.x, streamP0.y, streamP3.x, streamP3.y);
        streamGrad.addColorStop(0, isVidReady ? 'rgba(56, 189, 248, 0.14)' : 'rgba(125, 211, 252, 0.55)');
        streamGrad.addColorStop(0.7, isVidReady ? 'rgba(186, 230, 253, 0.2)' : 'rgba(224, 242, 254, 0.72)');
        streamGrad.addColorStop(1, 'rgba(255, 193, 7, 0.42)');
        ctx.strokeStyle = streamGrad;
        ctx.lineWidth = isVidReady ? 3 : 6;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      for (const p of particles) {
        const relAccel = 1 + p.t * p.t * 2.2;
        p.t += p.speed * relAccel;
        if (p.t >= 1) {
          if (progress < 0.65) {
            p.t = Math.random() * 0.12;
          } else {
            continue;
          }
        }
        if (p.t < tailCutoffT) continue;

        const pt = evalCubicBezier(p.t, streamP0, streamP1, streamP2, streamP3);
        const funnelEnvelope = (1 - p.t * 0.78) * 24 + 3;
        const normalDist =
          p.offsetNormal * funnelEnvelope +
          Math.sin(p.t * p.turbulenceFreq * 3.5 - time * 4.5 + p.turbulencePhase) *
            funnelEnvelope *
            0.45;
        const px = pt.x + pt.nx * normalDist;
        const py = pt.y + pt.ny * normalDist;
        const angle = Math.atan2(pt.dy, pt.dx);
        const stretch = 1.5 + p.t * 2.6;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * stretch, p.size * 0.45, 0, 0, Math.PI * 2);
        const alphaScale = isVidReady ? 0.35 : 0.85;
        ctx.fillStyle =
          p.t > 0.78
            ? `rgba(255, 200, 80, ${p.alpha * alphaScale})`
            : p.colorType === 'core'
            ? `rgba(224, 242, 254, ${p.alpha * alphaScale})`
            : `rgba(56, 189, 248, ${p.alpha * alphaScale})`;
        ctx.fill();
        ctx.restore();
      }

      if (flareIntensity > 0.02) {
        const torusGrad = ctx.createRadialGradient(
          bhX,
          bhY,
          horizonRadius * 0.88,
          bhX,
          bhY,
          horizonRadius * 1.9
        );
        torusGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        torusGrad.addColorStop(0.16, `rgba(255, 243, 196, ${0.72 * flareIntensity})`);
        torusGrad.addColorStop(0.38, `rgba(255, 167, 38, ${0.62 * flareIntensity})`);
        torusGrad.addColorStop(0.7, `rgba(255, 87, 34, ${0.32 * flareIntensity})`);
        torusGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = torusGrad;
        ctx.beginPath();
        ctx.arc(bhX, bhY, horizonRadius * 1.9, 0, Math.PI * 2);
        ctx.fill();

        if (!isVidReady) {
          ctx.beginPath();
          for (let s = 0; s <= 24; s++) {
            const t = s / 24;
            const pt = evalCubicBezier(t, flareP0, flareP1, flareP2, flareP3);
            if (s === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          const flareGrad = ctx.createLinearGradient(flareP0.x, flareP0.y, flareP3.x, flareP3.y);
          flareGrad.addColorStop(0, `rgba(255, 248, 225, ${0.9 * flareIntensity})`);
          flareGrad.addColorStop(0.45, `rgba(255, 152, 0, ${0.75 * flareIntensity})`);
          flareGrad.addColorStop(1, 'rgba(255, 87, 34, 0)');
          ctx.strokeStyle = flareGrad;
          ctx.lineWidth = 10 * flareIntensity;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      ctx.restore();

      if (progress < 1) {
        animId = requestAnimationFrame(render);
      } else if (!isVidReady || !videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        canvas.dispatchEvent(new CustomEvent('swallowcomplete'));
      }
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('swallowcomplete', handleCanvasSwallowComplete);
    };
  }, [isSwallowing, videoFailed, genesisCount, triggerJetAfterSwallow]);

  const showSettled = settledBlackHoleOpacity > 0;

  return (
    <div
      ref={rootContainerRef}
      className={`relative w-full h-full flex items-center justify-center overflow-visible select-none pointer-events-none fade-in ${
        !isInView ? 'anim-paused' : ''
      }`}
      aria-hidden="true"
      style={{ backfaceVisibility: 'hidden' }}
    >
      {/* ===================================================================== */}
      {/* PHASE 1 (INTRO ONLY): CYGNUS X-1 BLUE STAR FEEDING BLACK HOLE         */}
      {/* Plays cleanly without Phase 2 mounted underneath, then unmounts!      */}
      {/* ===================================================================== */}
      {isSwallowing && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-1000 ease-out"
          style={{ opacity: swallowLayerOpacity, willChange: 'opacity' }}
        >
          <div
            className="absolute pointer-events-none overflow-hidden"
            style={{
              width: '255%',
              aspectRatio: '720 / 1276',
              left: '50%',
              top: '50%',
              transform: 'translate3d(-66%, -49%, 0px)',
              mixBlendMode: 'screen',
              opacity: videoReady ? 0.96 : 0,
              transition: 'opacity 0.6s ease-in-out',
              WebkitMaskImage: `
                radial-gradient(ellipse 56% 36% at 50% 50%,
                  rgba(0,0,0,1) 0%,
                  rgba(0,0,0,0.92) 45%,
                  rgba(0,0,0,0.4) 72%,
                  transparent 96%
                )
              `,
              maskImage: `
                radial-gradient(ellipse 56% 36% at 50% 50%,
                  rgba(0,0,0,1) 0%,
                  rgba(0,0,0,0.92) 45%,
                  rgba(0,0,0,0.4) 72%,
                  transparent 96%
                )
              `,
            }}
          >
            <video
              ref={videoRef}
              src={`${import.meta.env.BASE_URL}assets/aistudio/document_6044169521311260964_c2f617b6.mp4`}
              autoPlay
              muted
              playsInline
              preload="auto"
              onLoadedData={() => setVideoReady(true)}
              onCanPlay={() => setVideoReady(true)}
              onError={() => setVideoFailed(true)}
              className="w-full h-full object-fill pointer-events-none"
            />
          </div>

          {videoFailed && (
            <canvas
              ref={canvasRef}
              className="absolute pointer-events-none"
              style={{
                width: '275%',
                aspectRatio: '760 / 620',
                left: '50%',
                top: '50%',
                transform: 'translate3d(-56%, -54%, 0px)',
                mixBlendMode: 'screen',
              }}
            />
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* PHASE 2 (SETTLED): FIERY EVENT HORIZON + BIPOLAR RELATIVISTIC JETS    */}
      {/* Mounted only once active; zero SVG feGaussianBlur or CSS filter lag   */}
      {/* ===================================================================== */}
      {showSettled && (
        <>
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-1000"
            style={{ opacity: settledBlackHoleOpacity }}
          >
            {/* 1. Symmetric Bipolar High-Energy Relativistic Plasma Jets (Single GPU-Friendly Canvas) */}
            <div
              className="absolute pointer-events-none z-5 overflow-visible"
              style={{
                width: '108%',
                height: '360%',
                left: '50%',
                top: '50%',
                transform: 'translate3d(-50%, -50%, 0px) rotate(-18deg)',
                mixBlendMode: 'screen',
              }}
            >
              <canvas
                ref={jetCanvasRef}
                className="w-full h-full block pointer-events-none"
              />
            </div>

            {/* 2. Fiery Relativistic Accretion Disk & Gravitational Lensing Artwork (GPU Breathing) */}
            <div
              className={`absolute pointer-events-none z-10 transition-transform duration-500 ${
                isHovered ? 'scale-[1.04]' : 'scale-100'
              }`}
              style={{
                width: '266%',
                aspectRatio: '16 / 9',
                left: '50%',
                top: '50%',
                transform: 'translate3d(-50.4%, -52.5%, 0px)',
                mixBlendMode: 'screen',
                WebkitMaskImage:
                  'radial-gradient(ellipse 49% 47% at 50% 50%, rgba(0,0,0,1) 58%, rgba(0,0,0,0.8) 76%, transparent 98%)',
                maskImage:
                  'radial-gradient(ellipse 49% 47% at 50% 50%, rgba(0,0,0,1) 58%, rgba(0,0,0,0.8) 76%, transparent 98%)',
              }}
            >
              <img
                src={`${import.meta.env.BASE_URL}assets/aistudio/image_e5bd0a4d.png`}
                alt=""
                loading="eager"
                className="w-full h-full object-contain select-none animate-horizon-lensing-breathe"
              />
            </div>

            {/* 2b. Live High-Density GRMHD Gravitational Lensing & Accretion Plane Streams (Single Canvas) */}
            <div
              className={`absolute pointer-events-none z-11 transition-transform duration-500 ${
                isHovered ? 'scale-[1.04]' : 'scale-100'
              }`}
              style={{
                width: '266%',
                aspectRatio: '16 / 9',
                left: '50%',
                top: '50%',
                transform: 'translate3d(-50.4%, -52.5%, 0px)',
                mixBlendMode: 'screen',
              }}
            >
              <canvas
                ref={lensingCanvasRef}
                className="w-full h-full block pointer-events-none"
              />
            </div>

            {/* 3. Outer Keplerian Spinning Fiery Accretion Halo + GPU Whirlpool Spiral Drift */}
            <div
              className="absolute w-[264%] h-[264%] pointer-events-none z-11 flex items-center justify-center"
              style={{
                transform: 'rotateX(78.5deg) rotateZ(-0.6deg)',
                mixBlendMode: 'screen',
                opacity: 0.44,
              }}
            >
              {/* Base Keplerian outer accretion halo (pure transform, zero filter) */}
              <div
                ref={outerDiskRef}
                className="w-full h-full rounded-full celestial-gpu-layer"
                style={{
                  background: `
                    radial-gradient(circle at center,
                      transparent 32%,
                      rgba(251, 146, 60, 0.46) 40%,
                      rgba(234, 88, 12, 0.4) 50%,
                      rgba(185, 28, 28, 0.26) 62%,
                      transparent 76%
                    ),
                    conic-gradient(
                      from 35deg,
                      rgba(255, 237, 213, 0.48) 0deg,
                      rgba(127, 29, 29, 0.08) 60deg,
                      rgba(251, 146, 60, 0.52) 135deg,
                      rgba(153, 27, 27, 0.1) 210deg,
                      rgba(253, 186, 116, 0.46) 285deg,
                      rgba(255, 237, 213, 0.48) 360deg
                    )
                  `,
                  backgroundBlendMode: 'screen',
                }}
              />

              {/* 3b. Fluid Outer Plasma Lensing Caustic Ring (Pure GPU Rotation, Zero Blur) */}
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-full pointer-events-none animate-outer-lensing-caustic"
                style={{
                  background: `
                    radial-gradient(circle at center,
                      transparent 34%,
                      rgba(255, 247, 237, 0.52) 42%,
                      rgba(251, 146, 60, 0.34) 52%,
                      rgba(220, 38, 38, 0.16) 64%,
                      transparent 75%
                    ),
                    conic-gradient(
                      from 110deg,
                      transparent 0deg,
                      rgba(255, 237, 213, 0.68) 28deg,
                      rgba(249, 115, 22, 0.32) 68deg,
                      transparent 125deg,
                      rgba(254, 215, 170, 0.54) 195deg,
                      rgba(220, 38, 38, 0.22) 245deg,
                      transparent 300deg,
                      rgba(251, 146, 60, 0.44) 340deg,
                      transparent 360deg
                    )
                  `,
                  backgroundBlendMode: 'screen',
                }}
              />

              {/* 3c. Primary Logarithmic Whirlpool Spiral Arms (Unfiltered GPU-Cached Vector Texture) */}
              <svg
                viewBox="0 0 500 500"
                className="absolute inset-0 w-full h-full overflow-visible animate-outer-whirlpool-drift"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <radialGradient id="whirlpoolArmGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="32%" stopColor="#fff7ed" stopOpacity="0" />
                    <stop offset="44%" stopColor="#ffedd5" stopOpacity="0.92" />
                    <stop offset="62%" stopColor="#fb923c" stopOpacity="0.68" />
                    <stop offset="82%" stopColor="#dc2626" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Soft outer double-stroke glow pass (replaces feGaussianBlur with zero runtime cost) */}
                <g stroke="url(#whirlpoolArmGrad)" strokeLinecap="round" opacity="0.28">
                  <path d="M 466 250 C 464 366, 368 446, 252 432 C 154 420, 94 338, 108 248 C 118 182, 174 134, 238 140" strokeWidth="10" />
                  <path d="M 34 250 C 36 134, 132 54, 248 68 C 346 80, 406 162, 392 252 C 382 318, 326 366, 262 360" strokeWidth="9.5" />
                  <path d="M 250 36 C 364 42, 444 138, 428 252 C 416 346, 336 404, 248 390 C 184 380, 138 326, 144 264" strokeWidth="7" />
                  <path d="M 250 464 C 136 458, 56 362, 72 248 C 84 154, 164 96, 252 110 C 316 120, 362 174, 356 236" strokeWidth="7" />
                </g>

                {/* Crisp core spiral accretion arms */}
                <path
                  d="M 466 250 C 464 366, 368 446, 252 432 C 154 420, 94 338, 108 248 C 118 182, 174 134, 238 140"
                  stroke="url(#whirlpoolArmGrad)"
                  strokeWidth="4.0"
                  strokeLinecap="round"
                />
                <path
                  d="M 34 250 C 36 134, 132 54, 248 68 C 346 80, 406 162, 392 252 C 382 318, 326 366, 262 360"
                  stroke="url(#whirlpoolArmGrad)"
                  strokeWidth="3.8"
                  strokeLinecap="round"
                />
                <path
                  d="M 250 36 C 364 42, 444 138, 428 252 C 416 346, 336 404, 248 390 C 184 380, 138 326, 144 264"
                  stroke="url(#whirlpoolArmGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.78"
                />
                <path
                  d="M 250 464 C 136 458, 56 362, 72 248 C 84 154, 164 96, 252 110 C 316 120, 362 174, 356 236"
                  stroke="url(#whirlpoolArmGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.78"
                />
              </svg>

              {/* 3d. Fast Inner-Outer Whirlpool Shear Filaments (Unfiltered GPU-Cached Vector Texture) */}
              <svg
                viewBox="0 0 500 500"
                className="absolute inset-0 w-full h-full overflow-visible animate-outer-whirlpool-drift-fast"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M 436 218 C 446 322, 364 406, 258 400 C 172 394, 114 324, 126 244 C 134 188, 184 148, 240 152"
                  stroke="url(#whirlpoolArmGrad)"
                  strokeWidth="2.2"
                  strokeDasharray="68 28 110 34"
                  strokeLinecap="round"
                  opacity="0.76"
                />
                <path
                  d="M 64 282 C 54 178, 136 94, 242 100 C 328 106, 386 176, 374 256 C 366 312, 316 352, 260 348"
                  stroke="url(#whirlpoolArmGrad)"
                  strokeWidth="2.2"
                  strokeDasharray="54 24 96 36"
                  strokeLinecap="round"
                  opacity="0.76"
                />
              </svg>
            </div>

            {/* 4. Inner Fast-Spinning Fiery Plasma Swirl (Back Half of 3D Tilted Accretion Disk) */}
            <div
              className="absolute w-[235%] h-[235%] pointer-events-none z-12 flex items-center justify-center"
              style={{
                transform: 'rotateX(77deg) rotateZ(-1deg)',
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 50%, 0% 50%)',
                mixBlendMode: 'screen',
                opacity: 0.56,
              }}
            >
              <div
                ref={diskBackRef}
                className="w-full h-full rounded-full celestial-gpu-layer"
                style={{
                  background: `
                    radial-gradient(circle at center,
                      transparent 24%,
                      rgba(255, 237, 213, 0.8) 27%,
                      rgba(251, 146, 60, 0.66) 33%,
                      rgba(153, 27, 27, 0.25) 37%,
                      rgba(249, 115, 22, 0.62) 42%,
                      rgba(220, 38, 38, 0.38) 50%,
                      rgba(251, 146, 60, 0.34) 56%,
                      rgba(127, 29, 29, 0.18) 64%,
                      transparent 72%
                    ),
                    conic-gradient(
                      from 0deg,
                      rgba(255, 237, 213, 0.72) 0deg,
                      rgba(220, 38, 38, 0.12) 45deg,
                      rgba(251, 146, 60, 0.75) 115deg,
                      rgba(127, 29, 29, 0.1) 180deg,
                      rgba(253, 186, 116, 0.68) 245deg,
                      rgba(185, 28, 28, 0.14) 305deg,
                      rgba(255, 237, 213, 0.72) 360deg
                    )
                  `,
                  backgroundBlendMode: 'screen',
                }}
              />
            </div>
          </div>

          {/* Periodic Radial Gravitational Flare (Pure GPU transform + opacity) */}
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-15 transition-opacity duration-1000 ease-out"
            style={{ opacity: settledBlackHoleOpacity }}
          >
            <div
              className="absolute w-[62%] h-[62%] rounded-full pointer-events-none animate-blackhole-radial-flare"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,214,0,0) 42%, rgba(251,146,60,0.34) 58%, rgba(220,38,38,0.16) 72%, transparent 86%)',
              }}
            />
            <div
              className="absolute w-[62%] h-[62%] rounded-full pointer-events-none animate-blackhole-radial-flare-delayed"
              style={{
                border: '1px solid rgba(251, 146, 60, 0.24)',
                background:
                  'radial-gradient(circle, transparent 52%, rgba(254,215,170,0.12) 68%, transparent 84%)',
              }}
            />
          </div>

          {/* Bipolar Relativistic Jet Eruption Beams (Fire after swallowing) */}
          {jetBurstActive && (
            <div
              ref={jetBurstRef}
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-18 animate-blackhole-jet-burst"
            >
              <div
                className="w-[34%] h-[340%] rounded-full"
                style={{
                  transform: 'rotate(-18deg)',
                  transformOrigin: '50% 50%',
                  background:
                    'linear-gradient(to top, transparent 0%, rgba(29,78,216,0.2) 10%, rgba(56,189,248,0.48) 24%, rgba(186,230,253,0.8) 38%, rgba(255,255,255,0.96) 50%, rgba(186,230,253,0.85) 62%, rgba(56,189,248,0.52) 76%, rgba(29,78,216,0.22) 90%, transparent 100%)',
                  mixBlendMode: 'screen',
                }}
              />
            </div>
          )}

          {/* Event Horizon Shadow Sphere & Embedded SWID-SHRK Crest */}
          <div
            className={`relative z-20 w-[49%] h-[49%] rounded-full bg-[#020102]/95 flex items-center justify-center transition-transform duration-700 ease-out ${
              isHovered ? 'scale-105' : 'scale-100'
            }`}
            style={{
              opacity: settledBlackHoleOpacity,
              boxShadow: `
                0 0 0 1px rgba(254, 215, 170, 0.28),
                0 0 10px 1.5px rgba(251, 146, 60, 0.24),
                0 0 24px 5px rgba(234, 88, 12, 0.16),
                inset 0 0 10px 2px rgba(0, 0, 0, 0.65)
              `,
            }}
          >
            <div className="w-full h-full rounded-full bg-[#020103]/92 overflow-hidden relative flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full pointer-events-none opacity-20"
                style={{
                  background:
                    'radial-gradient(circle at 50% 50%, transparent 80%, rgba(251, 146, 60, 0.26) 92%, rgba(255, 237, 213, 0.42) 97%, transparent 100%)',
                }}
              />

              <div
                className={`w-[88%] h-[88%] rounded-full relative z-20 flex items-center justify-center p-1 ${
                  isHovered && logoRevealed ? 'crest-glitch-active' : ''
                }`}
              >
                {logoRevealed && (
                  <img
                    key={`crest-horizon-${genesisCount}`}
                    src={logoLuminous}
                    alt="SWID-SHRK Research Crest inside Event Horizon"
                    loading="eager"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = logoTransparent;
                    }}
                    className={`w-full h-full object-contain select-none transition-transform duration-500 animate-crest-emerge-from-jet ${
                      isHovered ? 'scale-105 opacity-100' : 'scale-100 opacity-100'
                    }`}
                  />
                )}
              </div>
            </div>

            {/* High-transparency ethereal pulsing Event Horizon photon ring (pure GPU opacity+scale) */}
            <div
              className={`absolute inset-[-1.5px] rounded-full pointer-events-none border transition-colors duration-700 ${
                isSwallowing
                  ? 'border-amber-200/35 animate-blackhole-border-pulse-swallow'
                  : 'border-orange-200/30 animate-blackhole-border-pulse'
              }`}
            />

            {/* Fast-Orbiting Relativistic Kerr Photon-Sphere Crescent (pure transform, zero filter) */}
            <div
              ref={photonRingRef}
              aria-hidden="true"
              className="absolute inset-[-3px] rounded-full pointer-events-none celestial-gpu-layer"
              style={{
                mixBlendMode: 'screen',
                opacity: isHovered ? 0.82 : 0.62,
                transition: 'opacity 0.35s ease',
                background: `
                  conic-gradient(
                    from 0deg,
                    rgba(255, 247, 237, 0.92) 0deg,
                    rgba(251, 146, 60, 0.58) 38deg,
                    rgba(234, 88, 12, 0.12) 95deg,
                    transparent 155deg,
                    rgba(251, 146, 60, 0.34) 215deg,
                    rgba(254, 215, 170, 0.64) 255deg,
                    transparent 310deg,
                    rgba(255, 247, 237, 0.92) 360deg
                  )
                `,
                WebkitMaskImage:
                  'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 1px))',
                maskImage:
                  'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 1px))',
              }}
            />
          </div>

          {/* Front Half of 3D Tilted Spinning Fiery Accretion Disk (pure transform, zero filter) */}
          <div
            className="absolute w-[235%] h-[235%] pointer-events-none z-30 flex items-center justify-center transition-opacity duration-1000"
            style={{
              opacity: settledBlackHoleOpacity * 0.36,
              transform: 'rotateX(77deg) rotateZ(-1deg)',
              clipPath: 'polygon(0% 50%, 100% 50%, 100% 100%, 0% 100%)',
              mixBlendMode: 'screen',
            }}
          >
            <div
              ref={diskFrontRef}
              className="w-full h-full rounded-full celestial-gpu-layer"
              style={{
                background: `
                  radial-gradient(circle at center,
                    transparent 28%,
                    rgba(255, 237, 213, 0.42) 31%,
                    rgba(251, 146, 60, 0.36) 35%,
                    rgba(153, 27, 27, 0.14) 39%,
                    rgba(249, 115, 22, 0.38) 44%,
                    rgba(220, 38, 38, 0.24) 51%,
                    rgba(251, 146, 60, 0.22) 58%,
                    rgba(127, 29, 29, 0.12) 65%,
                    transparent 72%
                  ),
                  conic-gradient(
                    from 0deg,
                    rgba(255, 237, 213, 0.4) 0deg,
                    rgba(185, 28, 28, 0.12) 50deg,
                    rgba(251, 146, 60, 0.45) 120deg,
                    rgba(127, 29, 29, 0.1) 185deg,
                    rgba(253, 186, 116, 0.42) 250deg,
                    rgba(185, 28, 28, 0.12) 310deg,
                    rgba(255, 237, 213, 0.4) 360deg
                  )
                `,
                backgroundBlendMode: 'screen',
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};
