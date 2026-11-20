import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const DARK_ROOT_VARS: Record<string, string> = {
  '--bg': '#02040a',
  '--bg-elevated': '#0a0f18',
  '--surface': '#0d111a',
  '--surface-muted': '#141b29',
  '--text': '#e2e8f0',
  '--text-strong': '#ffffff',
  '--text-muted': '#94a3b8',
  '--line': '#1e2638',
  '--border-strong': '#334155',
  '--green': '#00ff41',
  '--blue': '#00b8ff',
  '--red': '#ff3131',
  '--mint': '#00e676',
  '--accent-primary': '#00ff41',
  '--accent-secondary': '#00b8ff',
  '--focus-ring': 'rgba(0, 255, 65, 0.55)',
  '--nav-bg': 'rgba(2, 4, 10, 0.95)',
  '--footer-bg': '#010308',
};

const LIGHT_ROOT_VARS: Record<string, string> = {
  '--bg': '#ffffff',
  '--bg-elevated': '#f8fafc',
  '--surface': '#ffffff',
  '--surface-muted': '#f1f5f9',
  '--text': '#090d16',
  '--text-strong': '#020617',
  '--text-muted': '#334155',
  '--line': '#94a3b8',
  '--border-strong': '#0f172a',
  '--green': '#047857',
  '--blue': '#0369a1',
  '--red': '#b91c1c',
  '--mint': '#065f46',
  '--accent-primary': '#047857',
  '--accent-secondary': '#0369a1',
  '--focus-ring': 'rgba(3, 105, 161, 0.65)',
  '--nav-bg': 'rgba(255, 255, 255, 0.97)',
  '--footer-bg': '#f8fafc',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('swid_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore storage errors
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    const vars = theme === 'dark' ? DARK_ROOT_VARS : LIGHT_ROOT_VARS;

    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;

    Object.entries(vars).forEach(([prop, value]) => {
      root.style.setProperty(prop, value);
    });

    const themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.content = theme === 'dark' ? '#02040a' : '#ffffff';
    }

    try {
      localStorage.setItem('swid_theme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
