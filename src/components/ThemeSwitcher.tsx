import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export interface ThemeSwitcherProps {
  compact?: boolean;
  variant?: 'navbar' | 'hero' | 'compact';
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  compact = false,
  variant = 'navbar',
  className = '',
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const isHero = variant === 'hero';
  const isCompactOnly = compact || variant === 'compact';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      role="switch"
      aria-checked={!isDark}
      aria-label={`Theme switcher: currently ${isDark ? 'Cyber Dark' : 'High-Contrast Light'}. Activate to switch to ${isDark ? 'High-Contrast Light' : 'Cyber Dark'} mode.`}
      title={`Switch to ${isDark ? 'High-Contrast Light' : 'Cyber Dark'} Mode`}
      className={`group relative inline-flex items-center cursor-pointer select-none rounded-full border transition-all duration-200 ease-out whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        isDark
          ? 'bg-[#090d12]/95 border-zinc-700 hover:border-[#00ff41] text-zinc-100 hover:text-white shadow-[0_0_12px_rgba(0,0,0,0.6)] hover:shadow-[0_0_16px_rgba(0,255,65,0.28)] focus-visible:ring-[#00ff41] focus-visible:ring-offset-[#02040a]'
          : 'bg-white border-2 border-slate-900 hover:bg-slate-100 text-slate-950 shadow-sm hover:shadow-md focus-visible:ring-sky-700 focus-visible:ring-offset-white'
      } ${
        isHero
          ? 'px-3.5 py-2 gap-2.5 backdrop-blur-md'
          : isCompactOnly
          ? 'p-1.5'
          : 'px-3 py-1.5 gap-2'
      } ${className}`}
    >
      {/* Sun / Moon Indicator Badge */}
      <div
        className={`relative rounded-full flex items-center justify-center border transition-all duration-200 ease-out overflow-hidden flex-none ${
          isHero ? 'w-7 h-7' : 'w-6 h-6'
        } ${
          isDark
            ? 'bg-black/85 border-[#00ff41]/60 text-[#00ff41]'
            : 'bg-amber-100 border-slate-900 text-amber-900'
        }`}
      >
        <Moon
          className={`transition-all duration-200 ease-out transform ${
            isHero ? 'w-4 h-4' : 'w-3.5 h-3.5'
          } ${
            isDark
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-50 pointer-events-none absolute'
          }`}
        />
        <Sun
          className={`transition-all duration-200 ease-out transform ${
            isHero ? 'w-4 h-4' : 'w-3.5 h-3.5'
          } ${
            !isDark
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 rotate-90 scale-50 pointer-events-none absolute'
          }`}
        />
      </div>

      {/* Mode Label */}
      {!isCompactOnly && (
        <div className="flex flex-col text-left">
          {isHero ? (
            <>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider leading-none ${
                  isDark ? 'text-zinc-400' : 'text-slate-700 font-semibold'
                }`}
              >
                Theme
              </span>
              <span
                className={`font-orbitron font-bold text-xs tracking-wider leading-tight ${
                  isDark ? 'text-[#00ff41] group-hover:text-emerald-300' : 'text-slate-950'
                }`}
              >
                {isDark ? 'Cyber Dark' : 'Light Mode'}
              </span>
            </>
          ) : (
            <span
              className={`font-mono text-[11px] font-bold uppercase tracking-wider select-none hidden sm:inline-block ${
                isDark ? 'text-[#00ff41] group-hover:text-emerald-300' : 'text-slate-950'
              }`}
            >
              {isDark ? 'Cyber Dark' : 'High Contrast'}
            </span>
          )}
        </div>
      )}
    </button>
  );
};
