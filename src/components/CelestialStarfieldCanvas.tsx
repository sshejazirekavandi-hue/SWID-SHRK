import React, { useEffect, useRef } from 'react';

interface CelestialStarfieldCanvasProps {
  className?: string;
  starCount?: number;
  interactiveParallax?: boolean;
  showShootingStars?: boolean;
  blackHoleLensing?: boolean;
}

interface Star {
  x: number;
  y: number;
  z: number;
  baseRadius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  secondaryTwinkleSpeed: number;
  color: string;
  hasSpikes: boolean;
  vx: number;
  vy: number;
}

interface ShootingStar {
  x: number;
  y: number;
  dx: number;
  dy: number;
  length: number;
  speed: number;
  progress: number;
  maxProgress: number;
  opacity: number;
  color: string;
}

const SPECTRAL_COLORS = [
  '#ffffff',
  '#e0f2fe',
  '#bae6fd',
  '#fef08a',
  '#fed7aa',
  '#e9d5ff',
];

export const CelestialStarfieldCanvas: React.FC<CelestialStarfieldCanvasProps> = ({
  className = '',
  starCount = 60,
  interactiveParallax = true,
  showShootingStars = true,
  blackHoleLensing = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const nextShootingStarTimeRef = useRef<number>(performance.now() + 4500);

  const initStars = (count: number) => {
    const stars: Star[] = [];
    for (let i = 0; i < count; i++) {
      const z = Math.pow(Math.random(), 1.5) * 0.9 + 0.1;
      const color = SPECTRAL_COLORS[Math.floor(Math.random() * SPECTRAL_COLORS.length)];
      const isHeroStar = Math.random() < 0.08;
      const baseRadius = isHeroStar
        ? 1.7 + Math.random() * 0.9
        : (1.0 - z * 0.65) * 1.35 + 0.35;

      const speedScale = (1.1 - z) * 0.000018;
      const angle = Math.PI * 0.25 + (Math.random() - 0.5) * 0.6;

      stars.push({
        x: Math.random(),
        y: Math.random(),
        z,
        baseRadius,
        baseAlpha: (1.1 - z * 0.5) * (0.4 + Math.random() * 0.5),
        twinkleSpeed: 0.8 + Math.random() * 2.4,
        twinklePhase: Math.random() * Math.PI * 2,
        secondaryTwinkleSpeed: 1.4 + Math.random() * 3.2,
        color,
        hasSpikes: isHeroStar && z < 0.45,
        vx: Math.cos(angle) * speedScale,
        vy: Math.sin(angle) * speedScale,
      });
    }
    return stars;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    starsRef.current = initStars(starCount);

    // Cache bounding rect on resize/scroll rather than reading it on every mousemove (zero layout thrash)
    let cachedRect = { left: 0, top: 0, width: 1, height: 1 };
    let isVisible = true;

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      cachedRect = {
        left: rect.left,
        top: rect.top,
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
      };
      canvas.width = Math.max(1, Math.floor(rect.width));
      canvas.height = Math.max(1, Math.floor(rect.height));
    };

    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactiveParallax || !isVisible) return;
      const normX = ((e.clientX - cachedRect.left) / cachedRect.width - 0.5) * 2;
      const normY = ((e.clientY - cachedRect.top) / cachedRect.height - 0.5) * 2;
      mouseRef.current.targetX = Math.max(-1, Math.min(1, normX)) * 16;
      mouseRef.current.targetY = Math.max(-1, Math.min(1, normY)) * 16;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const render = (now: number) => {
      if (!isVisible || document.hidden) {
        animFrameIdRef.current = null;
        return;
      }

      const dt = Math.min(now - lastTimeRef.current, 64);
      lastTimeRef.current = now;

      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.06;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.06;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const blackHoleCenterX = width * 0.5;
      const blackHoleCenterY = height * 0.38;
      const blackHoleRadius = 140;
      const timeSec = now * 0.001;

      const stars = starsRef.current;
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        star.x += star.vx * dt;
        star.y += star.vy * dt;

        if (star.x < -0.05) star.x += 1.1;
        else if (star.x > 1.05) star.x -= 1.1;
        if (star.y < -0.05) star.y += 1.1;
        else if (star.y > 1.05) star.y -= 1.1;

        const sineWave1 = Math.sin(timeSec * star.twinkleSpeed + star.twinklePhase);
        const sineWave2 = Math.cos(timeSec * star.secondaryTwinkleSpeed + star.twinklePhase * 1.5);
        const twinkleMod = 0.65 + 0.35 * (sineWave1 * 0.7 + sineWave2 * 0.3);
        const currentAlpha = Math.max(0.08, Math.min(1.0, star.baseAlpha * twinkleMod));

        const parallaxFactor = 1.1 - star.z;
        let posX = star.x * width + mouseRef.current.x * parallaxFactor;
        let posY = star.y * height + mouseRef.current.y * parallaxFactor;

        if (blackHoleLensing) {
          const dx = posX - blackHoleCenterX;
          const dy = posY - blackHoleCenterY;
          const distSq = dx * dx + dy * dy;
          if (distSq < 122500 && distSq > 1) {
            const dist = Math.sqrt(distSq);
            const deflectionFactor = Math.pow(blackHoleRadius / (dist + blackHoleRadius * 0.4), 1.6);
            const bend = Math.min(deflectionFactor * 24, 50);
            posX += (dx / dist) * bend;
            posY += (dy / dist) * bend;
          }
        }

        const radius = star.baseRadius;
        ctx.fillStyle = star.color;

        if (star.z < 0.42 || star.hasSpikes) {
          ctx.globalAlpha = currentAlpha * 0.16;
          ctx.beginPath();
          ctx.arc(posX, posY, radius * 2.4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = currentAlpha;
        if (radius <= 1.15) {
          const size = radius * 2;
          ctx.fillRect(posX - radius, posY - radius, size, size);
        } else {
          ctx.beginPath();
          ctx.arc(posX, posY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;

      if (showShootingStars) {
        if (now > nextShootingStarTimeRef.current) {
          const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5;
          const length = 60 + Math.random() * 80;
          const speed = 0.7 + Math.random() * 0.6;
          const startX = Math.random() * (width * 0.85);
          const startY = Math.random() * (height * 0.4);

          shootingStarsRef.current.push({
            x: startX,
            y: startY,
            dx: Math.cos(angle),
            dy: Math.sin(angle),
            length,
            speed,
            progress: 0,
            maxProgress: 180 + Math.random() * 100,
            opacity: 0.7 + Math.random() * 0.3,
            color: Math.random() > 0.4 ? '#38bdf8' : '#ffffff',
          });

          nextShootingStarTimeRef.current = now + 6000 + Math.random() * 8000;
        }

        for (let s = shootingStarsRef.current.length - 1; s >= 0; s--) {
          const ss = shootingStarsRef.current[s];
          ss.progress += ss.speed * (dt / 16);

          const tailX = ss.x + ss.dx * (ss.progress - ss.length);
          const tailY = ss.y + ss.dy * (ss.progress - ss.length);
          const headX = ss.x + ss.dx * ss.progress;
          const headY = ss.y + ss.dy * ss.progress;

          const lifeRatio = ss.progress / ss.maxProgress;
          const currentFade =
            lifeRatio < 0.2 ? lifeRatio / 0.2 : Math.max(0, 1 - (lifeRatio - 0.2) / 0.8);

          if (currentFade > 0.01) {
            const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            grad.addColorStop(
              0.7,
              ss.color === '#ffffff' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(56, 189, 248, 0.4)'
            );
            grad.addColorStop(
              1,
              ss.color === '#ffffff'
                ? `rgba(255, 255, 255, ${(ss.opacity * currentFade).toFixed(2)})`
                : `rgba(56, 189, 248, ${(ss.opacity * currentFade).toFixed(2)})`
            );

            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(headX, headY);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = ss.opacity * currentFade;
            ctx.beginPath();
            ctx.arc(headX, headY, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
          }

          if (ss.progress >= ss.maxProgress) {
            shootingStarsRef.current.splice(s, 1);
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    const startLoop = () => {
      if (animFrameIdRef.current === null && isVisible && !document.hidden) {
        lastTimeRef.current = performance.now();
        animFrameIdRef.current = requestAnimationFrame(render);
      }
    };

    const stopLoop = () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };

    let intersectionObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          isVisible = entries[0]?.isIntersecting ?? true;
          if (isVisible) startLoop();
          else stopLoop();
        },
        { rootMargin: '140px 0px' }
      );
      intersectionObserver.observe(canvas);
    }

    const handleVisibility = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    startLoop();

    return () => {
      stopLoop();
      intersectionObserver?.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [starCount, interactiveParallax, showShootingStars, blackHoleLensing]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${className}`}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
      }}
      aria-hidden="true"
    />
  );
};
