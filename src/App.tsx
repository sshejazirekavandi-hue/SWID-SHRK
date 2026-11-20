import React, { useState, useEffect } from 'react';
import { TabKey } from './types';
import { ProjectBanner } from './components/ProjectBanner';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ProfileSection } from './components/ProfileSection';
import { ResearchSection } from './components/ResearchSection';
import { PublicationsSection } from './components/PublicationsSection';
import { ThesisRegistry } from './components/ThesisRegistry';
import { EquipmentSection } from './components/EquipmentSection';
import { ContactSection } from './components/ContactSection';
import { AIChatSection } from './components/AIChatSection';
import { AbaqusGallery } from './components/AbaqusGallery';
import { LaboratoryNewsSection } from './components/LaboratoryNewsSection';
import { Team } from './components/Team';
import { EngineeringQAChatbox } from './components/EngineeringQAChatbox';
import { GmailResearchHub } from './components/GmailResearchHub';
import { Footer } from './components/Footer';
import { ReadingProgressBar } from './components/ReadingProgressBar';
import { HiddenCosmicAudioController } from './components/HiddenCosmicAudioController';
import { CheckCircle2, AlertCircle, Bot, Sparkles, ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';

export const App: React.FC = () => {
  const { language, t, isRTL, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab') as TabKey;
        if (tabParam && (tabParam as string) !== 'analyzer') return tabParam;
      } catch {
        // ignore
      }
    }
    return 'home';
  });
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  // Sync with browser back/forward buttons and ?tab= query parameters
  useEffect(() => {
    const handlePopState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tabParam = (params.get('tab') as TabKey) || 'home';
        setActiveTab(tabParam);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        // ignore
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3800);
  };

  const handleSelectTab = (tab: TabKey) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const url = new URL(window.location.href);
      url.hash = '';
      if (tab === 'home') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', tab);
      }
      window.history.pushState({}, '', url.toString());
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-mono selection:bg-sky-200 selection:text-slate-950 dark:selection:bg-[#00ff41]/20 dark:selection:text-[#00ff41] transition-colors duration-200">
      {/* Viewport Reading Progress Bar */}
      <ReadingProgressBar />

      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-1/2 focus:-translate-x-1/2 focus:z-50 focus:px-4 focus:py-2 dark:focus:bg-[#00ff41] dark:focus:text-black focus:bg-slate-950 focus:text-white focus:font-bold focus:rounded-md shadow-lg"
      >
        {t.common.skipToMain[language]}
      </a>

      {/* Top Active Project Banner */}
      <ProjectBanner />

      {/* Navigation */}
      <Navbar activeTab={activeTab} onSelectTab={handleSelectTab} />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 focus:outline-none">
        {activeTab !== 'home' && (
          <div className="max-w-6xl mx-auto px-4 pt-6 -mb-2" dir={dir}>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--line)]">
              <button
                type="button"
                onClick={() => handleSelectTab('home')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg dark:bg-zinc-900/90 dark:hover:bg-zinc-800 dark:text-zinc-100 dark:hover:text-[#00ff41] dark:border-zinc-700/80 dark:hover:border-[#00ff41]/70 bg-white hover:bg-slate-950 text-slate-950 hover:text-white border-2 border-slate-900 shadow-sm dark:hover:shadow-[0_0_16px_rgba(0,255,65,0.25)] transition-all duration-200 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer group"
                title={t.common.backToHome[language]}
                aria-label={t.common.backToHome[language]}
              >
                {isRTL ? (
                  <ArrowRight className="w-4 h-4 dark:text-[#00ff41] text-emerald-700 group-hover:text-white dark:group-hover:text-[#00ff41] transition-transform duration-200 group-hover:translate-x-0.5" />
                ) : (
                  <ArrowLeft className="w-4 h-4 dark:text-[#00ff41] text-emerald-700 group-hover:text-white dark:group-hover:text-[#00ff41] transition-transform duration-200 group-hover:-translate-x-0.5" />
                )}
                <Home className="w-3.5 h-3.5 dark:text-[#00b8ff] text-sky-700 group-hover:text-sky-300 dark:group-hover:text-[#00b8ff]" />
                <span>{t.common.backToHome[language]}</span>
              </button>

              <div className="inline-flex items-center gap-2 text-[11px] font-mono dark:text-zinc-400 text-slate-700">
                <button
                  type="button"
                  onClick={() => handleSelectTab('home')}
                  className="dark:hover:text-[#00ff41] hover:text-slate-950 hover:underline font-semibold transition-colors cursor-pointer"
                >
                  {t.nav.home[language]}
                </button>
                <span className="dark:text-zinc-600 text-slate-400">/</span>
                <span className="dark:text-[#00b8ff] text-sky-800 font-bold">
                  {(t.nav as Record<string, { en: string; fa: string }>)[activeTab]?.[language] || activeTab}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'home' && (
          <div className="pb-12">
            {/* Celestial Hero Observatory (Bipolar Black Hole + 3D Solar System) & PI Executive Dossier */}
            {/* All laboratory sections (starting from Research Modules & Focus Areas onward) open in dedicated tab views */}
            <section id="section-home" className="scroll-mt-20 space-y-16">
              <HeroSection onSelectTab={handleSelectTab} />

              <div className="max-w-6xl mx-auto px-4">
                <ProfileSection onSelectTab={handleSelectTab} />
              </div>
            </section>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="max-w-6xl mx-auto px-4 py-12">
            <LaboratoryNewsSection onNotify={showToast} onSelectTab={handleSelectTab} />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="max-w-6xl mx-auto px-4 py-8">
            <AIChatSection onNotify={showToast} />
          </div>
        )}

        {activeTab === 'research' && (
          <div className="max-w-6xl mx-auto px-4 py-12">
            <ResearchSection onNotify={showToast} />
          </div>
        )}

        {activeTab === 'publications' && (
          <div className="max-w-6xl mx-auto px-4 py-12">
            <PublicationsSection onNotify={showToast} />
          </div>
        )}

        {activeTab === 'students' && (
          <div className="max-w-6xl mx-auto px-4 py-12">
            <ThesisRegistry onNotify={showToast} />
          </div>
        )}

        {activeTab === 'gear' && (
          <div className="max-w-6xl mx-auto px-4 py-12">
            <EquipmentSection />
          </div>
        )}

        {activeTab === 'abaqus' && (
          <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
            <div>
              <div className="inline-block border-b-2 dark:border-[#00b8ff] border-sky-800 pb-1 mb-4">
                <h2 className="font-section-title text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-wider dark:text-white text-slate-950 flex items-center">
                  <span className="dark:text-[#00ff41] text-emerald-700 font-mono mr-2 select-none">//</span>
                  <span>Abaqus FEA Simulations &amp; Gallery</span>
                </h2>
              </div>
              <p className="dark:text-zinc-400 text-slate-700 font-mono text-sm max-w-3xl leading-relaxed">
                Showcasing finite element analysis runs, dynamic explicit stress/strain contour fields, mesh formulations, and interactive lightbox telemetry.
              </p>
            </div>
            <AbaqusGallery onNotify={showToast} />
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="max-w-6xl mx-auto px-4 py-12">
            <ContactSection onNotify={showToast} onSelectTab={handleSelectTab} />
          </div>
        )}

        {activeTab === 'mail' && (
          <div className="max-w-6xl mx-auto px-4 py-12">
            <GmailResearchHub onNotify={showToast} />
          </div>
        )}

        {activeTab === 'team' && (
          <div className="max-w-6xl mx-auto px-4 py-8">
            <Team onNotify={showToast} onSelectTab={handleSelectTab} />
          </div>
        )}

        {activeTab === 'qa' && (
          <div className="max-w-6xl mx-auto px-4 py-8">
            <EngineeringQAChatbox onNotify={showToast} />
          </div>
        )}
      </main>

      {/* Floating AI Assistant Trigger Button */}
      {activeTab !== 'chat' && (
        <button
          onClick={() => handleSelectTab('chat')}
          className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full dark:bg-black/90 bg-white text-slate-950 dark:text-white border-2 dark:border-[#00ff41] border-slate-950 shadow-xl dark:shadow-[0_0_20px_rgba(0,255,65,0.4)] shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all text-xs font-mono font-bold cursor-pointer group`}
          title={t.common.askLabAI[language]}
        >
          <div className="w-5 h-5 rounded-full flex items-center justify-center dark:bg-[#00ff41] bg-emerald-700 dark:text-black text-white">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <span className="hidden sm:inline">{t.common.askLabAI[language]}</span>
          <Sparkles className="w-3 h-3 dark:text-[#00b8ff] text-sky-700 animate-pulse" />
        </button>
      )}

      {/* Persistent Hidden Cosmic Soundscape Controller */}
      <HiddenCosmicAudioController />

      {/* Footer */}
      <Footer onSelectTab={handleSelectTab} />

      {/* Global Cyber Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg font-mono text-xs shadow-2xl transition-all duration-300 max-w-sm ${
            toast.isError
              ? 'bg-[#8d3038] text-white border border-[#ff4d5a]'
              : 'bg-[#00ff41] text-[#001407] border border-[#00ff41] font-bold shadow-[0_0_20px_rgba(0,255,65,0.4)]'
          }`}
        >
          {toast.isError ? (
            <AlertCircle className="w-4 h-4 flex-none" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-none" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};
