import React, { useState } from 'react';
import { TabKey } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { useCelestial } from '../context/CelestialContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Menu,
  X,
  Layers,
  BookOpen,
  GraduationCap,
  PlayCircle,
  Mail,
  Inbox,
  Home,
  MessageSquare,
  Users,
  Globe,
  Newspaper,
  Bot,
  Wrench,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import logoLuminous from '../assets/logo_luminous.png';
import logoTransparent from '../assets/logo_transparent.png';

interface NavbarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { activeBodyKey, activeInfo, executeCapability, orbitAnimationSpeed } = useCelestial();
  const { language, isRTL, toggleLanguage, t } = useLanguage();
  const highlightedTab = activeTab;

  const navItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'home', label: t.nav.home[language], icon: <Home className="w-4 h-4" /> },
    { key: 'research', label: t.nav.research[language], icon: <Layers className="w-4 h-4" /> },
    { key: 'publications', label: t.nav.publications[language], icon: <BookOpen className="w-4 h-4" /> },
    { key: 'students', label: t.nav.students[language], icon: <GraduationCap className="w-4 h-4" /> },
    { key: 'gear', label: t.nav.gear[language], icon: <Wrench className="w-4 h-4" /> },
    { key: 'abaqus', label: t.nav.abaqus[language], icon: <PlayCircle className="w-4 h-4" /> },
    { key: 'news', label: t.nav.news?.[language] || 'News', icon: <Newspaper className="w-4 h-4" /> },
    { key: 'team', label: t.nav.team[language], icon: <Users className="w-4 h-4" /> },
    { key: 'qa', label: t.nav.qa[language], icon: <MessageSquare className="w-4 h-4" /> },
    { key: 'chat', label: t.nav.chat?.[language] || 'AI Assistant', icon: <Bot className="w-4 h-4" /> },
    { key: 'mail', label: t.nav.mail[language], icon: <Inbox className="w-4 h-4 text-rose-500" /> },
    { key: 'contact', label: t.nav.contact[language], icon: <Mail className="w-4 h-4" /> },
  ];

  const handleNavClick = (key: TabKey) => {
    setMobileMenuOpen(false);
    onSelectTab(key);
  };

  return (
    <nav className="sticky top-0 z-50 bg-[var(--nav-bg)] border-b border-[var(--line)] dark:text-white text-slate-950 shadow-sm dark:shadow-md transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between min-h-[60px] gap-2">
        <div className="flex items-center gap-2 flex-none">
          {activeTab !== 'home' && (
            <button
              type="button"
              onClick={() => handleNavClick('home')}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full dark:bg-zinc-900 bg-white dark:hover:bg-zinc-800 hover:bg-slate-100 dark:text-[#00ff41] text-slate-950 border dark:border-[#00ff41]/50 border-slate-900 dark:hover:border-[#00ff41] hover:border-sky-700 dark:shadow-[0_0_12px_rgba(0,255,65,0.25)] shadow-xs transition-all cursor-pointer flex-none"
              title={t.common.backToHome[language]}
              aria-label={t.common.backToHome[language]}
            >
              {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            </button>
          )}

          {/* Brand / Bold Research Group Crest */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none flex-none"
          >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-zinc-950 border-2 dark:border-cyan-400/55 border-slate-900 p-0.5 flex items-center justify-center flex-none transition-transform duration-300 group-hover:scale-110 dark:shadow-[0_0_14px_rgba(56,189,248,0.45)] shadow-xs">
            <img
              src={logoLuminous}
              alt="SWID-SHRK Research Group Crest"
              className="w-full h-full object-contain filter contrast-125 brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] crest-glitch-target"
              onError={(e) => {
                (e.target as HTMLImageElement).src = logoTransparent;
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-orbitron font-bold text-sm tracking-wider dark:text-white text-slate-950 dark:group-hover:text-[#00ff41] group-hover:text-sky-800 transition-colors">
              {t.nav.labName[language]}
            </span>
            <span className="text-[10px] dark:text-zinc-400 text-slate-700 font-mono font-semibold tracking-widest uppercase">
              {t.nav.labSubtitle[language]}
            </span>
          </div>
          </button>
        </div>

        {/* Desktop Navigation (Dedicated In-App Tab Links) */}
        <div className="hidden lg:flex items-center gap-0.5 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = highlightedTab === item.key;
            return (
              <a
                key={item.key}
                href={item.key === 'home' ? './' : `?tab=${item.key}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.key);
                }}
                className={`relative px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'dark:text-[#00ff41] text-sky-900 dark:glow-green'
                    : 'dark:text-zinc-300 text-slate-800 hover:text-sky-800 dark:hover:text-[#00ff41]'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] dark:bg-[#00ff41] bg-slate-950 dark:shadow-[0_0_8px_#00ff41]" />
                )}
              </a>
            );
          })}
        </div>

        {/* Right Actions: Celestial Indicator, Language Toggle, Theme Switcher & Mobile Menu */}
        <div className="flex items-center gap-2">
          {/* Celestial Orbit Indicator Button */}
          <button
            onClick={() => executeCapability(onSelectTab)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeBodyKey === 'blackhole'
                ? 'dark:bg-amber-950/40 bg-amber-100 dark:text-amber-300 text-amber-950 dark:border-amber-500/40 border-amber-800 hover:border-amber-950 dark:hover:border-amber-400'
                : 'dark:bg-zinc-900 bg-slate-100 dark:border-zinc-700 border-slate-900 dark:text-zinc-200 text-slate-950 hover:border-sky-800 dark:hover:border-[#00ff41]'
            }`}
            title={`${activeInfo.name} · Open ${activeInfo.capability.title}`}
          >
            <span className="text-sm select-none">{activeInfo.astronomicalSymbol}</span>
            <span className="hidden sm:inline font-orbitron text-[11px]">{activeInfo.name}</span>
            {orbitAnimationSpeed > 1.0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400 text-black font-extrabold hidden md:inline shadow-[0_0_8px_rgba(245,158,11,0.6)]">
                {orbitAnimationSpeed.toFixed(1)}x
              </span>
            )}
          </button>

          {/* Language Switcher Toggle */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border transition-all cursor-pointer dark:bg-zinc-900 bg-white dark:border-zinc-700 border-slate-900 dark:text-zinc-200 text-slate-950 dark:hover:border-[#00ff41] hover:bg-slate-100 dark:hover:text-[#00ff41] shadow-xs"
            title={t.common.switchLanguage[language]}
            aria-label={t.common.switchLanguage[language]}
          >
            <Globe className="w-3.5 h-3.5 dark:text-[#00b8ff] text-sky-800" />
            <span className="font-bold">{language === 'en' ? 'فا' : 'EN'}</span>
            <span className="text-[10px] opacity-85 hidden sm:inline">
              {language === 'en' ? 'فارسی' : 'English'}
            </span>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 dark:text-zinc-300 text-slate-950 hover:text-sky-800 dark:hover:text-white border dark:border-[#333333] border-slate-900 rounded hover:border-sky-800 transition-colors"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-sky-800 dark:text-[#00ff41]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b dark:border-[#333333] border-slate-300 dark:bg-[#090d12] bg-white px-4 py-3 space-y-1 animate-fadeIn shadow-lg">
          {navItems.map((item) => {
            const isActive = highlightedTab === item.key;
            return (
              <a
                key={item.key}
                href={item.key === 'home' ? './' : `?tab=${item.key}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.key);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-bold uppercase tracking-wider text-left transition-all whitespace-nowrap ${
                  isActive
                    ? 'dark:bg-[#00ff41]/10 bg-sky-50 dark:text-[#00ff41] text-sky-700 font-bold'
                    : 'dark:text-zinc-300 text-slate-600 hover:text-sky-600 dark:hover:text-[#00ff41]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            );
          })}

          <div className="pt-2 border-t dark:border-zinc-800 border-slate-200 flex items-center justify-between px-3 py-2">
            <span className="text-xs font-mono uppercase tracking-wider dark:text-zinc-400 text-slate-600 font-semibold">
              {language === 'fa' ? 'پوسته' : 'Theme'}
            </span>
            <ThemeToggle />
          </div>

          <div className="pt-2 border-t dark:border-zinc-800 border-slate-200 flex items-center justify-between px-3 py-2">
            <span className="text-xs font-mono uppercase tracking-wider dark:text-zinc-400 text-slate-600 font-semibold">
              {t.common.language[language]}
            </span>
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border dark:bg-zinc-900 bg-slate-100 dark:border-zinc-700 border-slate-300 dark:text-zinc-200 text-slate-800"
            >
              <Globe className="w-3.5 h-3.5 text-[#00b8ff]" />
              <span>{language === 'en' ? 'فارسی (FA)' : 'English (EN)'}</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
