import React from 'react';
import { CelestialBodyKey } from '../types';
import logoTransparent from '../assets/logo_transparent.png';
import logoLuminous from '../assets/logo_luminous.png';

interface CelestialPlanetViewProps {
  bodyKey: CelestialBodyKey;
  isHovered?: boolean;
  flareActive?: boolean;
  rotationSpeed?: number;
  revolutionSpeed?: number;
  isWarping?: boolean;
  sharedRafDriven?: boolean;
}

/**
 * CelestialPlanetView
 * Renders 3D planetary surfaces with the embedded SWID-SHRK crest using pure GPU CSS
 * keyframe transforms (zero JS rAF CSS-variable style recalculations, zero heavy blur/drop-shadow filters).
 */
export const CelestialPlanetView: React.FC<CelestialPlanetViewProps> = React.memo(({
  bodyKey,
  isHovered = false,
  flareActive = false,
  isWarping = false,
}) => {
  const warpOverlay = isWarping ? (
    <div
      aria-hidden="true"
      className="absolute -inset-8 rounded-full pointer-events-none z-40 animate-warp-burst flex items-center justify-center"
    >
      <div className="w-full h-full rounded-full border-2 border-cyan-400/80 shadow-[0_0_24px_rgba(0,229,255,0.8)] opacity-90" />
      <div className="absolute inset-2 rounded-full border border-amber-300/60 shadow-[0_0_18px_rgba(255,215,64,0.75)]" />
    </div>
  ) : null;

  switch (bodyKey) {
    case 'sun':
      return (
        <div
          className="relative w-full h-full rounded-full flex items-center justify-center overflow-visible select-none"
          style={{ perspective: 1000 }}
        >
          {warpOverlay}

          {/* 1. Deep Volumetric Solar Corona (smooth radial gradient, zero blur pass) */}
          <div
            className={`absolute -inset-10 sm:-inset-14 rounded-full pointer-events-none transition-transform duration-500 ${
              isHovered || flareActive ? 'opacity-95 scale-110' : 'opacity-85 scale-100'
            }`}
            style={{
              background:
                'radial-gradient(circle, rgba(255, 235, 59, 0.72) 0%, rgba(255, 152, 0, 0.45) 42%, rgba(244, 67, 54, 0.18) 68%, transparent 84%)',
            }}
          />

          {/* 2. Coronal Plasma Prominence Loops */}
          <div className="absolute inset-[-15%] rounded-full pointer-events-none">
            <div
              className="absolute top-0 right-6 w-16 h-16 rounded-full border-2 border-amber-300 opacity-75"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60%, 0 0)' }}
            />
            <div
              className="absolute bottom-1 left-4 w-20 h-20 rounded-full border-2 border-orange-400 opacity-70"
              style={{ clipPath: 'polygon(0 50%, 100% 100%, 0 100%)' }}
            />
          </div>

          {/* 3. Solar Photosphere Body */}
          <div
            className="relative w-full h-full rounded-full overflow-hidden shadow-[0_0_36px_rgba(255,180,0,0.85),inset_0_0_32px_rgba(255,255,255,0.85)] border-2 border-amber-200"
            style={{
              background:
                'radial-gradient(circle at 40% 35%, #ffffff 0%, #fff9c4 16%, #fbc02d 38%, #f57f17 65%, #d84315 88%, #bf360c 100%)',
            }}
          >
            {/* Boiling Convective Granulation Cells */}
            <div
              className="absolute inset-0 opacity-70 mix-blend-overlay animate-planet-spin-fast"
              style={{
                background: `radial-gradient(circle at 30% 25%, transparent 20%, rgba(191, 54, 12, 0.7) 70%),
                  radial-gradient(circle at 70% 65%, transparent 20%, rgba(216, 67, 21, 0.7) 65%),
                  radial-gradient(circle at 50% 50%, rgba(255, 235, 59, 0.4) 0%, transparent 50%)`,
              }}
            />

            {/* Sunspot Groups */}
            <div className="absolute inset-0 pointer-events-none animate-planet-spin">
              <div className="absolute top-[38%] left-[28%] w-5 h-3.5 rounded-[50%] bg-[#450a0a] border border-[#d84315] flex items-center justify-center">
                <div className="w-2.5 h-1.5 rounded-[50%] bg-[#1a0505]" />
              </div>
              <div className="absolute top-[48%] left-[58%] w-4 h-3 rounded-[50%] bg-[#450a0a] border border-[#d84315]">
                <div className="w-2 h-1 rounded-[50%] bg-[#1a0505]" />
              </div>
            </div>

            {/* Embedded SWID-SHRK Crest */}
            <div className="absolute inset-0 flex items-center justify-center p-2.5 z-15 opacity-95 pointer-events-none animate-planet-spin">
              <img
                src={logoTransparent}
                alt="SWID-SHRK Solar Crest"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = logoLuminous;
                }}
                className="w-[86%] h-[86%] object-contain"
              />
            </div>

            {/* 3D Solar Limb Darkening */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none z-18"
              style={{
                boxShadow:
                  'inset 0 0 32px 8px rgba(183, 28, 28, 0.8), inset 0 0 60px rgba(127, 29, 29, 0.45)',
              }}
            />
          </div>
        </div>
      );

    case 'mercury':
      return (
        <div
          className="relative w-full h-full rounded-full flex items-center justify-center overflow-visible select-none"
          style={{ perspective: 1000 }}
        >
          {warpOverlay}

          <div
            className="absolute -inset-4 rounded-full pointer-events-none opacity-40"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, rgba(255, 235, 150, 0.4) 0%, transparent 65%)',
            }}
          />

          <div
            className="relative w-full h-full rounded-full overflow-hidden shadow-[0_0_20px_rgba(180,180,195,0.35),inset_-20px_-20px_40px_rgba(0,0,0,0.92)] border border-slate-500/60"
            style={{
              background:
                'radial-gradient(circle at 30% 28%, #f1f5f9 0%, #cbd5e1 22%, #94a3b8 48%, #64748b 72%, #334155 88%, #0f172a 100%)',
            }}
          >
            <div className="absolute inset-0 pointer-events-none animate-planet-spin">
              <div className="absolute top-[26%] left-[22%] w-16 h-16 rounded-full border border-slate-300/50 bg-slate-800/25">
                <div className="absolute inset-2.5 rounded-full border border-slate-400/40 bg-slate-800/30" />
                <div className="absolute inset-5 rounded-full bg-slate-900/50 border border-slate-500/30" />
              </div>
              <div className="absolute top-[62%] left-[36%] w-9 h-9 rounded-full border border-slate-300/40 bg-slate-800/40" />
              <div className="absolute top-[20%] right-[26%] w-7 h-7 rounded-full border border-slate-300/40 bg-slate-800/35" />
              <div className="absolute bottom-[20%] right-[32%] w-11 h-11 rounded-full border border-slate-400/40 bg-slate-800/40" />
            </div>

            <div className="absolute inset-0 flex items-center justify-center p-2.5 z-16 opacity-95 pointer-events-none animate-planet-spin">
              <img
                src={logoLuminous}
                alt="SWID-SHRK Mercury Crest"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = logoTransparent;
                }}
                className="w-[85%] h-[85%] object-contain"
              />
            </div>

            <div
              className="absolute inset-0 pointer-events-none z-20"
              style={{
                background:
                  'linear-gradient(125deg, transparent 38%, rgba(15, 23, 42, 0.6) 62%, rgba(2, 6, 23, 0.96) 88%)',
              }}
            />
          </div>
        </div>
      );

    case 'venus':
      return (
        <div
          className="relative w-full h-full rounded-full flex items-center justify-center overflow-visible select-none"
          style={{ perspective: 1000 }}
        >
          {warpOverlay}

          <div
            className="absolute -inset-6 rounded-full pointer-events-none opacity-65"
            style={{
              background:
                'radial-gradient(circle, rgba(255, 213, 79, 0.42) 0%, rgba(255, 160, 0, 0.2) 50%, transparent 74%)',
            }}
          />

          <div
            className="relative w-full h-full rounded-full overflow-hidden shadow-[0_0_26px_rgba(255,193,7,0.55),inset_-18px_-18px_40px_rgba(62,39,35,0.95)] border border-amber-300/50"
            style={{
              background:
                'radial-gradient(circle at 35% 30%, #fffde7 0%, #fff59d 18%, #ffe082 40%, #ffb74d 68%, #f57c00 88%, #5d4037 100%)',
            }}
          >
            <div
              className="absolute inset-0 opacity-75 animate-planet-spin-reverse"
              style={{
                background: `repeating-linear-gradient(
                  -18deg,
                  rgba(255, 238, 88, 0.35) 0px,
                  rgba(255, 238, 88, 0.35) 16px,
                  rgba(245, 124, 0, 0.25) 16px,
                  rgba(245, 124, 0, 0.25) 32px
                )`,
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center p-2.5 z-16 opacity-95 pointer-events-none animate-planet-spin-reverse">
              <img
                src={logoTransparent}
                alt="SWID-SHRK Venus Crest"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = logoLuminous;
                }}
                className="w-[85%] h-[85%] object-contain"
              />
            </div>

            <div
              className="absolute inset-0 pointer-events-none z-18"
              style={{
                background:
                  'linear-gradient(130deg, transparent 40%, rgba(93, 64, 55, 0.5) 65%, rgba(62, 39, 35, 0.94) 90%)',
              }}
            />
          </div>
        </div>
      );

    case 'earth':
      return (
        <div
          className="relative w-full h-full rounded-full flex items-center justify-center overflow-visible select-none"
          style={{ perspective: 1000 }}
        >
          {warpOverlay}

          <div
            className={`absolute -inset-7 sm:-inset-10 rounded-full pointer-events-none transition-transform duration-500 ${
              isHovered ? 'opacity-95 scale-110' : 'opacity-85 scale-100'
            }`}
            style={{
              background:
                'radial-gradient(circle, rgba(0, 229, 255, 0.42) 0%, rgba(33, 150, 243, 0.28) 45%, rgba(0, 255, 65, 0.12) 65%, transparent 80%)',
            }}
          />

          {/* Orbiting Moon (Luna) */}
          <div className="absolute inset-[-20%] pointer-events-none rounded-full flex items-center justify-center animate-planet-moon-orbit">
            <div
              className="absolute w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-200 border border-white shadow-[0_0_8px_#ffffff]"
              style={{ transform: 'translate3d(clamp(42px, 16vw, 78px), 0, 0)' }}
            >
              <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-400/70" />
            </div>
          </div>

          {/* Earth Body */}
          <div
            className="relative w-full h-full rounded-full overflow-hidden shadow-[0_0_32px_rgba(0,184,255,0.75),inset_-18px_-18px_38px_rgba(3,10,30,0.95)] border-2 border-cyan-300/70"
            style={{
              background:
                'radial-gradient(circle at 35% 30%, #38bdf8 0%, #0284c7 28%, #0369a1 55%, #075985 75%, #0c4a6e 90%, #022c43 100%)',
            }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-4 rounded-b-full bg-white/95 z-12" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-3.5 rounded-t-full bg-white/90 z-12" />

            {/* Continents Layer (Pure GPU translate3d drift) */}
            <div className="absolute inset-0 flex w-[200%] h-full pointer-events-none opacity-85 z-10 animate-surface-drift">
              {[0, 1].map((copy) => (
                <div key={copy} className="w-1/2 h-full relative flex-none">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M 42,32 Q 52,30 56,38 Q 60,52 52,65 Q 46,72 40,60 Q 36,46 42,32 Z" fill="#15803d" opacity="0.9" />
                    <path d="M 43,33 Q 54,32 55,42 Q 47,45 42,39 Z" fill="#d97706" opacity="0.9" />
                    <path d="M 40,16 Q 48,12 55,18 Q 50,26 42,28 Q 36,24 40,16 Z" fill="#16a34a" opacity="0.9" />
                    <path d="M 54,16 Q 74,12 82,24 Q 85,40 76,46 Q 66,50 62,38 Q 55,30 54,16 Z" fill="#16a34a" opacity="0.9" />
                    <path d="M 10,18 Q 24,14 26,26 Q 24,36 18,44 Q 10,38 8,26 Z" fill="#15803d" opacity="0.9" />
                    <path d="M 18,46 Q 26,48 24,62 Q 22,78 16,82 Q 12,70 14,56 Z" fill="#16a34a" opacity="0.9" />
                  </svg>
                </div>
              ))}
            </div>

            {/* Clouds Layer */}
            <div className="absolute inset-0 flex w-[200%] h-full pointer-events-none opacity-65 z-13 animate-surface-drift-fast">
              {[0, 1].map((copy) => (
                <div
                  key={copy}
                  className="w-1/2 h-full"
                  style={{
                    background: `radial-gradient(ellipse at 42% 38%, rgba(255, 255, 255, 0.85) 0%, transparent 35%),
                      radial-gradient(ellipse at 72% 62%, rgba(255, 255, 255, 0.8) 0%, transparent 30%),
                      radial-gradient(ellipse at 22% 72%, rgba(255, 255, 255, 0.85) 0%, transparent 28%)`,
                  }}
                />
              ))}
            </div>

            <div className="absolute inset-0 flex items-center justify-center p-2.5 z-16 opacity-95 pointer-events-none animate-planet-spin">
              <img
                src={logoLuminous}
                alt="SWID-SHRK Earth Crest"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = logoTransparent;
                }}
                className="w-[86%] h-[86%] object-contain"
              />
            </div>

            <div
              className="absolute inset-0 pointer-events-none z-18"
              style={{
                background:
                  'linear-gradient(130deg, transparent 44%, rgba(2, 6, 23, 0.5) 66%, rgba(2, 6, 23, 0.94) 90%)',
              }}
            />

            <div
              className="absolute inset-0 rounded-full pointer-events-none z-20"
              style={{
                boxShadow:
                  'inset 0 0 22px 5px rgba(0, 229, 255, 0.78), inset 0 0 42px rgba(255, 255, 255, 0.35)',
              }}
            />
          </div>
        </div>
      );

    case 'mars':
      return (
        <div
          className="relative w-full h-full rounded-full flex items-center justify-center overflow-visible select-none"
          style={{ perspective: 1000 }}
        >
          {warpOverlay}

          <div
            className="absolute -inset-6 rounded-full pointer-events-none opacity-65"
            style={{
              background:
                'radial-gradient(circle, rgba(239, 68, 68, 0.44) 0%, rgba(185, 28, 28, 0.24) 50%, transparent 74%)',
            }}
          />

          <div
            className="relative w-full h-full rounded-full overflow-hidden shadow-[0_0_26px_rgba(239,68,68,0.6),inset_-18px_-18px_38px_rgba(30,5,5,0.95)] border border-red-500/60"
            style={{
              background:
                'radial-gradient(circle at 35% 30%, #fca5a5 0%, #f87171 22%, #ef4444 45%, #dc2626 68%, #991b1b 88%, #450a0a 100%)',
            }}
          >
            <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-12 h-3.5 rounded-b-full bg-white z-12" />
            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-10 h-3 rounded-t-full bg-white/90 z-12" />

            <div className="absolute inset-0 pointer-events-none animate-planet-spin">
              <div className="absolute top-[40%] left-[22%] w-24 h-12 rounded-full bg-[#450a0a]/75 -rotate-12" />
              <div className="absolute top-[48%] left-[30%] w-32 h-2.5 bg-[#260505] rounded-full -rotate-6" />
              <div className="absolute top-[32%] right-[32%] w-8 h-8 rounded-full border-2 border-amber-300/60 bg-[#7f1d1d] flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#450a0a]" />
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center p-2.5 z-16 opacity-95 pointer-events-none animate-planet-spin">
              <img
                src={logoLuminous}
                alt="SWID-SHRK Mars Crest"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = logoTransparent;
                }}
                className="w-[85%] h-[85%] object-contain"
              />
            </div>

            <div
              className="absolute inset-0 pointer-events-none z-18"
              style={{
                background:
                  'linear-gradient(130deg, transparent 40%, rgba(40, 5, 5, 0.6) 65%, rgba(15, 2, 2, 0.94) 90%)',
              }}
            />
          </div>
        </div>
      );

    case 'jupiter':
      return (
        <div
          className="relative w-full h-full rounded-full flex items-center justify-center overflow-visible select-none"
          style={{ perspective: 1000 }}
        >
          {warpOverlay}

          <div
            className="absolute -inset-8 rounded-full pointer-events-none opacity-60"
            style={{
              background:
                'radial-gradient(circle, rgba(217, 119, 6, 0.36) 0%, rgba(180, 83, 9, 0.22) 50%, rgba(124, 58, 237, 0.14) 72%, transparent 84%)',
            }}
          />

          <div
            className="relative w-full h-full rounded-full overflow-hidden shadow-[0_0_28px_rgba(217,119,6,0.6),inset_-18px_-18px_40px_rgba(20,10,5,0.95)] border border-amber-500/60"
            style={{
              background:
                'radial-gradient(circle at 35% 30%, #fef3c7 0%, #fde68a 25%, #d97706 60%, #92400e 85%, #451a03 100%)',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-85 animate-planet-spin"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  0deg,
                  rgba(120, 53, 15, 0.9) 0px,
                  rgba(120, 53, 15, 0.9) 11px,
                  rgba(254, 243, 199, 0.8) 11px,
                  rgba(254, 243, 199, 0.8) 22px,
                  rgba(180, 83, 9, 0.9) 22px,
                  rgba(180, 83, 9, 0.9) 33px,
                  rgba(253, 230, 138, 0.8) 33px,
                  rgba(253, 230, 138, 0.8) 44px
                )`,
              }}
            />

            <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 pointer-events-none z-10 animate-planet-spin-fast">
              <div
                className="w-13 h-8.5 rounded-[50%] bg-gradient-to-r from-red-600 via-rose-700 to-amber-700 border-2 border-red-300 flex items-center justify-center"
                style={{ transform: 'translate3d(35px, 0, 0)' }}
              >
                <div className="w-5.5 h-3.5 rounded-[50%] bg-amber-200/95" />
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center p-2.5 z-16 opacity-95 pointer-events-none animate-planet-spin">
              <img
                src={logoTransparent}
                alt="SWID-SHRK Jupiter Crest"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = logoLuminous;
                }}
                className="w-[86%] h-[86%] object-contain"
              />
            </div>

            <div
              className="absolute inset-0 pointer-events-none z-18"
              style={{
                background:
                  'linear-gradient(130deg, transparent 40%, rgba(69, 26, 3, 0.5) 65%, rgba(20, 8, 2, 0.94) 90%)',
              }}
            />
          </div>
        </div>
      );

    case 'saturn':
      return (
        <div
          className="relative w-full h-full rounded-full flex items-center justify-center overflow-visible select-none"
          style={{ perspective: 1000 }}
        >
          {warpOverlay}

          {/* Ring System Back Half */}
          <div
            className="absolute w-[190%] sm:w-[215%] h-[56%] pointer-events-none z-0"
            style={{
              borderRadius: '50%',
              background: `radial-gradient(ellipse at center,
                transparent 52%,
                rgba(217, 180, 120, 0.6) 53%,
                rgba(245, 222, 179, 0.95) 64%,
                rgba(15, 10, 5, 0.95) 65%,
                rgba(15, 10, 5, 0.95) 67%,
                rgba(235, 205, 150, 0.95) 68%,
                rgba(210, 175, 120, 0.75) 80%,
                transparent 84%)`,
            }}
          />

          <div
            className="relative z-10 w-full h-full rounded-full overflow-hidden shadow-[0_0_26px_rgba(234,179,8,0.52),inset_-18px_-18px_36px_rgba(40,25,5,0.94)] border border-amber-200/50"
            style={{
              background:
                'radial-gradient(circle at 35% 30%, #fef08a 0%, #fde047 30%, #eab308 60%, #ca8a04 82%, #713f12 100%)',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-65 animate-planet-spin"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  0deg,
                  rgba(161, 98, 7, 0.5) 0px,
                  rgba(161, 98, 7, 0.5) 8px,
                  rgba(254, 240, 138, 0.4) 8px,
                  rgba(254, 240, 138, 0.4) 16px
                )`,
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center p-2.5 z-16 opacity-95 pointer-events-none animate-planet-spin">
              <img
                src={logoTransparent}
                alt="SWID-SHRK Saturn Crest"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = logoLuminous;
                }}
                className="w-[85%] h-[85%] object-contain"
              />
            </div>

            <div className="absolute top-[48%] left-0 right-0 h-4 bg-black/55 -rotate-1 pointer-events-none z-15" />

            <div
              className="absolute inset-0 pointer-events-none z-18"
              style={{
                background:
                  'linear-gradient(130deg, transparent 40%, rgba(113, 63, 18, 0.5) 65%, rgba(30, 15, 3, 0.94) 90%)',
              }}
            />
          </div>

          {/* Ring System Front Half */}
          <div
            className="absolute w-[190%] sm:w-[215%] h-[56%] pointer-events-none z-20"
            style={{
              borderRadius: '50%',
              clipPath: 'polygon(0% 48%, 100% 48%, 100% 100%, 0% 100%)',
              background: `radial-gradient(ellipse at center,
                transparent 52%,
                rgba(217, 180, 120, 0.6) 53%,
                rgba(245, 222, 179, 0.95) 64%,
                rgba(15, 10, 5, 0.95) 65%,
                rgba(15, 10, 5, 0.95) 67%,
                rgba(235, 205, 150, 0.95) 68%,
                rgba(210, 175, 120, 0.75) 80%,
                transparent 84%)`,
            }}
          />
        </div>
      );

    case 'uranus':
      return (
        <div
          className="relative w-full h-full rounded-full flex items-center justify-center overflow-visible select-none"
          style={{ perspective: 1000 }}
        >
          {warpOverlay}

          <div
            className="absolute -inset-6 rounded-full pointer-events-none opacity-65"
            style={{
              background:
                'radial-gradient(circle, rgba(103, 232, 249, 0.42) 0%, rgba(6, 182, 212, 0.22) 50%, transparent 74%)',
            }}
          />

          <div
            className="relative z-10 w-full h-full rounded-full overflow-hidden shadow-[0_0_26px_rgba(6,182,212,0.6),inset_-18px_-18px_36px_rgba(8,51,68,0.95)] border border-cyan-200/60"
            style={{
              background:
                'radial-gradient(circle at 35% 30%, #cffafe 0%, #a5f3fc 28%, #22d3ee 55%, #0891b2 80%, #155e75 100%)',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-45 animate-planet-spin"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  90deg,
                  rgba(255, 255, 255, 0.45) 0px,
                  rgba(255, 255, 255, 0.45) 14px,
                  transparent 14px,
                  transparent 28px
                )`,
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center p-2.5 z-16 opacity-95 pointer-events-none animate-planet-spin">
              <img
                src={logoTransparent}
                alt="SWID-SHRK Uranus Crest"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = logoLuminous;
                }}
                className="w-[85%] h-[85%] object-contain"
              />
            </div>

            <div
              className="absolute inset-0 pointer-events-none z-18"
              style={{
                background:
                  'linear-gradient(130deg, transparent 42%, rgba(21, 94, 117, 0.5) 65%, rgba(8, 51, 68, 0.94) 90%)',
              }}
            />
          </div>
        </div>
      );

    case 'neptune':
      return (
        <div
          className="relative w-full h-full rounded-full flex items-center justify-center overflow-visible select-none"
          style={{ perspective: 1000 }}
        >
          {warpOverlay}

          <div
            className="absolute -inset-7 rounded-full pointer-events-none opacity-75"
            style={{
              background:
                'radial-gradient(circle, rgba(59, 130, 246, 0.48) 0%, rgba(29, 78, 216, 0.28) 50%, rgba(30, 27, 75, 0.14) 72%, transparent 84%)',
            }}
          />

          <div
            className="relative w-full h-full rounded-full overflow-hidden shadow-[0_0_28px_rgba(59,130,246,0.72),inset_-18px_-18px_36px_rgba(15,23,42,0.95)] border border-blue-400/60"
            style={{
              background:
                'radial-gradient(circle at 35% 30%, #93c5fd 0%, #60a5fa 25%, #3b82f6 50%, #1d4ed8 75%, #1e40af 88%, #172554 100%)',
            }}
          >
            <div className="absolute inset-0 pointer-events-none animate-planet-spin-fast">
              <div className="absolute top-[30%] left-[16%] w-22 h-2.5 rounded-full bg-white/95" />
              <div className="absolute top-[65%] right-[20%] w-18 h-2 rounded-full bg-cyan-200/90" />
            </div>

            <div className="absolute top-[42%] right-[26%] w-12 h-8 rounded-full bg-[#020617] border border-blue-300/50 flex items-center justify-center">
              <div className="w-6 h-3 rounded-full bg-[#0f172a] opacity-80" />
            </div>

            <div className="absolute inset-0 flex items-center justify-center p-2.5 z-16 opacity-95 pointer-events-none animate-planet-spin">
              <img
                src={logoLuminous}
                alt="SWID-SHRK Neptune Crest"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = logoTransparent;
                }}
                className="w-[86%] h-[86%] object-contain"
              />
            </div>

            <div
              className="absolute inset-0 pointer-events-none z-18"
              style={{
                background:
                  'linear-gradient(130deg, transparent 40%, rgba(30, 64, 175, 0.5) 65%, rgba(15, 23, 42, 0.96) 90%)',
              }}
            />
          </div>
        </div>
      );

    case 'blackhole':
    default:
      return null;
  }
});
