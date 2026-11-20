import React, { useState, useEffect } from 'react';
import { TabKey } from '../types';
import {
  CELESTIAL_ORDER,
  getCelestialBodyInfo,
  getNextCelestialBody,
  getPrevCelestialBody,
} from '../utils/celestialBodies';
import { playPlanetFocusHum } from '../utils/celestialAudio';
import { cosmicAudio } from '../utils/cosmicAudio';
import { useCelestial } from '../context/CelestialContext';
import { BlackHoleStarSwallow } from './BlackHoleStarSwallow';
import { SolarSystemStage } from './SolarSystemStage';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface BlackHoleLogoCrestProps {
  className?: string;
  externalGenesisKey?: number;
  onMaterializingChange?: (materializing: boolean) => void;
  showEmbeddedChip?: boolean;
  onSelectTab?: (tab: TabKey) => void;
}

export const BlackHoleLogoCrest: React.FC<BlackHoleLogoCrestProps> = ({
  className = '',
  externalGenesisKey,
  onMaterializingChange,
  onSelectTab,
}) => {
  const {
    activeBodyKey,
    flareActive,
    notification,
    genesisCount,
    setCelestialBody,
    advanceToNextBody,
    stepToPrevBody,
    triggerSingularityGenesis,
    executeCapability,
  } = useCelestial();

  const [isHovered, setIsHovered] = useState(false);
  const [isMaterializing, setIsMaterializing] = useState(true);
  const blackHoleInfo = getCelestialBodyInfo('blackhole');

  // Sync Black Hole hover proximity resonance with NASA Perseus sonification engine
  useEffect(() => {
    const active = activeBodyKey === 'blackhole' && isHovered;
    cosmicAudio.setProximityBoost(active);
    return () => {
      cosmicAudio.setProximityBoost(false);
    };
  }, [activeBodyKey, isHovered]);

  // Sync external genesis trigger
  useEffect(() => {
    if (externalGenesisKey !== undefined && externalGenesisKey > 0) {
      triggerSingularityGenesis();
    }
  }, [externalGenesisKey, triggerSingularityGenesis]);

  // Trigger initial black hole fade-in emergence sequence once
  useEffect(() => {
    if (activeBodyKey === 'blackhole') {
      setIsMaterializing(true);
      onMaterializingChange?.(true);
      const timer = setTimeout(() => {
        setIsMaterializing(false);
        onMaterializingChange?.(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setIsMaterializing(false);
      onMaterializingChange?.(false);
    }
  }, [genesisCount, activeBodyKey, onMaterializingChange]);

  return (
    <div className={`relative flex flex-col items-center justify-center select-none w-full ${className}`}>
      {/* Toast Notification Banner from State Management */}
      {notification && (
        <div className="absolute -top-12 z-50 pointer-events-none px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-wide dark:bg-black/95 bg-slate-900/95 text-[#00ff41] border border-[#00ff41]/50 shadow-[0_0_20px_rgba(0,255,65,0.4)] animate-in fade-in slide-in-from-top-2 duration-300">
          {notification}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CELESTIAL STAGE (SEPARATE MODES):                                         */}
      {/* 1. Intro (`blackhole`): Bipolar-jet Black Hole (click -> AI Assistant)    */}
      {/* 2. Solar System (`sun` .. `neptune`): Sun & 8 Planets (click -> Tab)      */}
      {/* ========================================================================= */}
      <div className="relative flex items-center justify-center pt-12 sm:pt-14 pb-10 sm:pb-12 px-4 w-full max-w-3xl min-h-[380px] sm:min-h-[430px] md:min-h-[465px] overflow-visible">
        {activeBodyKey === 'blackhole' ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              executeCapability(onSelectTab, 'blackhole');
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                executeCapability(onSelectTab, 'blackhole');
              }
            }}
            title={`${blackHoleInfo.name} — Click to open ${blackHoleInfo.capability.title}`}
            aria-label={`${blackHoleInfo.name} — Open ${blackHoleInfo.capability.title}`}
            style={{ willChange: 'transform, opacity' }}
            className="relative z-20 w-[225px] xs:w-[250px] sm:w-[285px] md:w-[310px] aspect-square rounded-full flex items-center justify-center cursor-pointer group celestial-gpu-layer fade-in"
          >
            <BlackHoleStarSwallow
              isHovered={isHovered}
              isMaterializing={isMaterializing}
              genesisCount={genesisCount}
            />
          </div>
        ) : (
          /* 3D Solar System Stage: Appears when Sun or any Planet is chosen */
          <div className="relative w-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
            <SolarSystemStage
              activeBodyKey={activeBodyKey}
              flareActive={flareActive}
              onSelectBody={setCelestialBody}
              onOpenWorkspace={(key) => executeCapability(onSelectTab, key)}
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* CLEAN NAVIGATION RAIL: BACK (END LEFT) | ORBIT STRIP | NEXT (END RIGHT)   */}
      {/* ========================================================================= */}
      <div className="relative z-30 w-full max-w-3xl mx-auto mt-2 px-2">
        <div className="w-full flex items-center justify-between gap-2 sm:gap-3 py-1.5 px-2 sm:px-3 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 shadow-lg">
          {/* Far-Left Back Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playPlanetFocusHum(getPrevCelestialBody(activeBodyKey));
              stepToPrevBody();
            }}
            className="flex-none inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-[#00ff41] border border-zinc-700/80 hover:border-[#00ff41]/60 font-mono font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0"
            title="Step to previous celestial body"
            aria-label="Back to previous celestial body"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {/* Orbit Timeline Rail: All 10 Celestial Bodies */}
          <div className="flex-1 flex items-center justify-around gap-1 overflow-x-auto no-scrollbar py-0.5">
            {CELESTIAL_ORDER.map((key) => {
              const isActive = key === activeBodyKey;
              const bodyInfo = getCelestialBodyInfo(key);
              return (
                <button
                  type="button"
                  key={key}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isActive) {
                      executeCapability(onSelectTab, key);
                    } else {
                      playPlanetFocusHum(key);
                      setCelestialBody(key);
                    }
                  }}
                  className={`group relative flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-amber-400/20 text-amber-300 scale-110 border border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                  title={
                    isActive
                      ? `${bodyInfo.name} — Click again to open ${bodyInfo.capability.title}`
                      : `${bodyInfo.name} → ${bodyInfo.capability.title}`
                  }
                >
                  <span className="text-base sm:text-lg leading-none">
                    {key === 'blackhole'
                      ? '🕳️'
                      : key === 'sun'
                      ? '☉'
                      : key === 'mercury'
                      ? '☿'
                      : key === 'venus'
                      ? '♀'
                      : key === 'earth'
                      ? '♁'
                      : key === 'mars'
                      ? '♂'
                      : key === 'jupiter'
                      ? '♃'
                      : key === 'saturn'
                      ? '♄'
                      : key === 'uranus'
                      ? '♅'
                      : '♆'}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-mono tracking-tighter opacity-80 uppercase mt-0.5">
                    {key === 'blackhole' ? 'Hole' : key.slice(0, 3)}
                  </span>

                  {/* Active Indicator Pip */}
                  {isActive && (
                    <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.9)]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Far-Right Next Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playPlanetFocusHum(getNextCelestialBody(activeBodyKey));
              advanceToNextBody();
            }}
            className="flex-none inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#00ff41]/15 hover:bg-[#00ff41]/25 text-[#00ff41] border border-[#00ff41]/55 hover:border-[#00ff41] font-mono font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(0,255,65,0.2)] whitespace-nowrap shrink-0"
            title="Step to next celestial body"
            aria-label="Next celestial body"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
