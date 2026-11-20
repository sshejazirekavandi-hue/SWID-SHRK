import React from 'react';
import { TabKey } from '../types';
import { ThemeSwitcher } from './ThemeSwitcher';
import { ArrowRight, GraduationCap, PlayCircle, Bot, Sparkles } from 'lucide-react';
import { BlackHoleLogoCrest } from './BlackHoleLogoCrest';
import { MultiLayerParallaxStarfield } from './MultiLayerParallaxStarfield';
import { CelestialPerformanceControls } from './CelestialPerformanceControls';
import { useLanguage } from '../context/LanguageContext';
import { useCelestial } from '../context/CelestialContext';
import logoLuminous from '../assets/logo_luminous.png';
import logoTransparent from '../assets/logo_transparent.png';

interface HeroSectionProps {
  onSelectTab: (tab: TabKey) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSelectTab }) => {
  const { language, isRTL, t } = useLanguage();
  const { starfieldVisible } = useCelestial();

  return (
    <header
      style={{ contain: 'layout paint' }}
      className="relative isolate flex flex-col items-center justify-center min-h-[580px] sm:min-h-[660px] py-16 px-4 overflow-hidden bg-[#02040a] border-b-2 dark:border-[#00ff41]/40 border-slate-900 shadow-2xl transition-colors duration-200"
    >
      {/* Far-Left Docked Graphics & Performance Controls */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30">
        <CelestialPerformanceControls />
      </div>

      {/* Far-Right Persistent Theme Toggle in Header */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30">
        <ThemeSwitcher variant="hero" />
      </div>

      {/* Multi-Layered CSS Perspective & Mouse-Tracking Parallax Starfield Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <MultiLayerParallaxStarfield enabled={starfieldVisible} />
      </div>

      {/* Central Black Hole Crest & Interactive Solar Orbit Engine */}
      <div className="relative z-10 flex flex-col items-center mb-3 sm:mb-4 w-full max-w-3xl">
        <BlackHoleLogoCrest onSelectTab={onSelectTab} />
      </div>

      {/* Main Titles + Bold SWID-SHRK Research Group Crest Medallion */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl px-2" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 mb-2">
          {/* Bold Illuminated Research Group Crest Seal */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-zinc-950/90 border-2 border-cyan-300/60 p-1.5 flex items-center justify-center shadow-[0_0_26px_rgba(56,189,248,0.55),inset_0_0_16px_rgba(0,0,0,0.95)] flex-none crest-glitch-hover transition-shadow duration-300 hover:shadow-[0_0_32px_rgba(0,255,65,0.55),0_0_20px_rgba(56,189,248,0.75)]">
            <img
              src={logoLuminous}
              alt="SWID-SHRK Research Group Official Crest"
              onError={(e) => {
                (e.target as HTMLImageElement).src = logoTransparent;
              }}
              className="w-full h-full object-contain filter brightness-110 contrast-125 drop-shadow-[0_0_10px_rgba(255,255,255,0.95)]"
            />
          </div>

          <h1
            className={`text-4xl sm:text-5xl md:text-7xl text-white font-normal leading-tight tracking-wide drop-shadow-[0_0_12px_rgba(255,255,255,0.7)] ${
              isRTL ? 'font-serif' : 'font-allura'
            }`}
          >
            {t.hero.mainTitle[language]}
          </h1>
        </div>

        <p className="text-zinc-300 font-mono text-xs sm:text-sm md:text-base tracking-[0.15em] uppercase mb-4 drop-shadow-xs">
          {t.hero.subtitle[language]}
        </p>

        {/* MIGA Badge */}
        <div className="inline-flex items-baseline px-4 py-1 border border-zinc-700/80 rounded-full font-orbitron font-bold text-xs sm:text-sm tracking-[0.2em] uppercase mb-8 bg-black/70 shadow-sm">
          <span className="text-[#ff3131] drop-shadow-[0_0_6px_rgba(255,49,49,0.7)]">M</span>
          <span className="text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.6)]">IG</span>
          <span className="text-[#00e676] drop-shadow-[0_0_6px_rgba(0,230,118,0.7)]">A</span>
        </div>

        {/* Interactive Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onSelectTab('chat')}
            className="flex items-center gap-2 px-5 py-2.5 rounded dark:bg-gradient-to-r dark:from-[#00ff41] dark:to-[#00b8ff] dark:hover:from-[#00ff41]/90 dark:hover:to-[#00b8ff]/90 dark:text-black bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-400/60 dark:border-transparent font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md dark:shadow-[0_0_20px_rgba(0,184,255,0.4)] cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>{t.hero.aiAssistantBtn[language]}</span>
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onSelectTab('research')}
            className="flex items-center gap-2 px-5 py-2.5 rounded border dark:bg-zinc-900 dark:border-zinc-700 dark:hover:border-[#00ff41] dark:text-zinc-200 dark:hover:text-[#00ff41] bg-white border-white hover:bg-slate-100 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm cursor-pointer"
          >
            <span>{t.hero.researchModulesBtn[language]}</span>
            <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={() => onSelectTab('students')}
            className="flex items-center gap-2 px-5 py-2.5 rounded border dark:bg-transparent dark:border-[#00b8ff] dark:text-[#00b8ff] dark:hover:bg-[#00b8ff] dark:hover:text-[#050505] bg-sky-700 border-sky-400 text-white hover:bg-sky-600 font-bold text-xs uppercase tracking-wider transition-all duration-200 dark:hover:shadow-[0_0_16px_rgba(0,184,255,0.5)] hover:shadow-md cursor-pointer"
          >
            <GraduationCap className="w-4 h-4" />
            <span>{t.hero.thesisRegistryBtn[language]}</span>
          </button>

          <button
            onClick={() => onSelectTab('abaqus')}
            className="flex items-center gap-2 px-5 py-2.5 rounded border dark:bg-zinc-900 dark:border-zinc-700 dark:hover:border-[#00ff41] dark:text-zinc-200 dark:hover:text-[#00ff41] bg-white border-white hover:bg-slate-100 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm cursor-pointer"
          >
            <PlayCircle className="w-4 h-4" />
            <span>{t.hero.abaqusSimsBtn[language]}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
