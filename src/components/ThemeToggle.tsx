import React, { useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme, Theme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

const applyDocumentTheme = (nextTheme: Theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', nextTheme);
  root.classList.remove('dark', 'light');
  root.classList.add(nextTheme);
  root.style.colorScheme = nextTheme;
};

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  compact = false,
}) => {
  const { theme, setTheme } = useTheme();
  const { language } = useLanguage();
  const isDark = theme === 'dark';

  // Ensure document data-theme and class list stay synced with active theme
  useEffect(() => {
    applyDocumentTheme(theme);
  }, [theme]);

  const handleToggle = () => {
    const nextTheme: Theme = isDark ? 'light' : 'dark';
    applyDocumentTheme(nextTheme);
    setTheme(nextTheme);
  };

  const toggleTitle = isDark
    ? language === 'fa'
      ? 'تغییر به حالت روشن با کنتراست بالا'
      : 'Switch to High-Contrast Light mode'
    : language === 'fa'
    ? 'تغییر به حالت تاریک سایبری'
    : 'Switch to Cyber Dark mode';

  const modeLabel = isDark
    ? language === 'fa'
      ? 'تاریک'
      : 'Cyber Dark'
    : language === 'fa'
    ? 'روشن'
    : 'Light Mode';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={!isDark}
      onClick={handleToggle}
      aria-label={toggleTitle}
      title={toggleTitle}
      className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all duration-200 border cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 ${
        isDark
          ? 'bg-[#080d14] hover:bg-[#0f1722] border-[#00ff41]/55 hover:border-[#00ff41] text-[#00ff41] shadow-[0_0_12px_rgba(0,255,65,0.18)]'
          : 'bg-white hover:bg-slate-950 border-2 border-slate-950 text-slate-950 hover:text-white shadow-xs'
      } ${className}`}
    >
      <span
        className={`flex items-center justify-center w-5 h-5 rounded-full transition-colors duration-200 ${
          isDark
            ? 'bg-[#00ff41]/15 text-[#00ff41]'
            : 'bg-amber-200 text-amber-950 group-hover:bg-amber-300'
        }`}
      >
        {isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
      </span>

      {!compact && (
        <span className="hidden sm:inline-flex items-center gap-1.5 tracking-wider uppercase text-[11px]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isDark
                ? 'bg-[#00ff41] shadow-[0_0_6px_#00ff41]'
                : 'bg-sky-700 group-hover:bg-sky-300'
            }`}
          />
          {modeLabel}
        </span>
      )}
    </button>
  );
};
