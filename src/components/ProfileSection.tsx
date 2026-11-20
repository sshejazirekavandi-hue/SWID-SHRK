import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Play,
  Pause,
  Feather,
  Volume2,
  VolumeX,
} from 'lucide-react';
import profilePhoto from '../assets/profile.jpg';
import { useLanguage } from '../context/LanguageContext';
import { TabKey } from '../types';

interface ProfileSectionProps {
  onSelectTab?: (tab: TabKey) => void;
}

const POETIC_HIGHLIGHT_WORDS_EN = [
  'quiet dreams',
  'speak the truth',
  'guiding star',
  'all your heart',
  'inner light',
  'purpose shining bright',
];

const POETIC_HIGHLIGHT_WORDS_FA = [
  'رویاهای آرامِ',
  'راستگو',
  'ستاره روشن',
  'تمام دل',
  'نورِ درونت',
  'هدفِ درخشان',
];

function renderHighlightedLine(line: string, keywords: string[], isSpotlight: boolean) {
  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = line.split(regex);

  return parts.map((part, idx) => {
    const isKeyword = keywords.some((k) => k.toLowerCase() === part.toLowerCase());
    if (isKeyword) {
      return (
        <span
          key={idx}
          className={`transition-all duration-300 font-semibold ${
            isSpotlight
              ? 'bg-gradient-to-r from-amber-200 via-yellow-100 to-sky-300 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(253,224,71,0.4)]'
              : 'dark:text-amber-200/90 text-sky-700'
          }`}
        >
          {part}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

const STANZA_LABELS = ['I', 'II', 'III'];

export const ProfileSection: React.FC<ProfileSectionProps> = ({ onSelectTab }) => {
  const { language, isRTL, t } = useLanguage();
  const [activeStanza, setActiveStanza] = useState<number | null>(null);
  const [isReciting, setIsReciting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedPoem, setCopiedPoem] = useState(false);

  const lines = t.profile.verse[language];
  const couplets = [
    lines.slice(0, 2),
    lines.slice(2, 4),
    lines.slice(4, 6),
  ];

  const speechSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stopSpeech = useCallback(() => {
    if (speechSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [speechSupported]);

  // Cancel speech cleanly on unmount or language change
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [language]);

  // Gentle auto-spotlight cycle across the 3 couplets when Recite is active
  useEffect(() => {
    if (!isReciting) return;
    const timer = window.setInterval(() => {
      setActiveStanza((prev) => (prev === null ? 0 : (prev + 1) % 3));
    }, 3200);
    return () => window.clearInterval(timer);
  }, [isReciting]);

  const handleCopyPoem = () => {
    const fullText = lines.join('\n');
    navigator.clipboard?.writeText(fullText).then(() => {
      setCopiedPoem(true);
      window.setTimeout(() => setCopiedPoem(false), 2200);
    });
  };

  const handleToggleSpeak = () => {
    if (!speechSupported) return;
    if (isSpeaking) {
      stopSpeech();
      return;
    }
    window.speechSynthesis.cancel();
    const textToRead =
      activeStanza !== null ? couplets[activeStanza].join(' ') : lines.join(' ');
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = language === 'fa' ? 'fa-IR' : 'en-US';
    utterance.rate = 0.94;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const keywords =
    language === 'fa' ? POETIC_HIGHLIGHT_WORDS_FA : POETIC_HIGHLIGHT_WORDS_EN;

  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`relative overflow-hidden dark:bg-[#0d111a]/85 bg-white border dark:border-zinc-800/90 border-slate-200 dark:hover:border-sky-400/50 hover:border-sky-500 rounded-2xl p-6 sm:p-8 md:p-10 dark:shadow-[0_14px_38px_rgba(0,0,0,0.6)] shadow-md transition-all duration-300 group ${
        isRTL ? 'text-right' : 'text-left'
      }`}
    >
      {/* Subtle ambient celestial glow behind dossier (smooth radial gradient, zero blur pass) */}
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none opacity-35"
        style={{
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-[auto_1fr] items-center gap-8">
        {/* Avatar / Portrait (Clean portrait without PI badge underneath) */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative group/avatar">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 dark:border-[#00b8ff] border-sky-600 dark:shadow-[0_0_25px_rgba(0,184,255,0.45)] shadow-md dark:bg-gradient-to-b dark:from-[#102538] dark:to-[#050b11] bg-gradient-to-b from-sky-50 to-slate-100 relative flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-105">
              <img
                src={profilePhoto}
                alt="Pouria Hejazi Rekavandi"
                className="w-full h-full object-cover object-center relative z-10"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center font-orbitron font-bold text-3xl sm:text-4xl dark:text-[#00b8ff] text-sky-700 select-none z-0">
                PHR
              </span>
            </div>
          </div>
        </div>

        {/* Bio & Elevated Atmospheric Poetic Folio */}
        <div className={`space-y-5 ${isRTL ? 'text-right' : 'text-left'}`}>
          {/* Clean Unboxed Discipline Metadata Row */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono tracking-wider uppercase dark:text-sky-300 text-sky-700">
            {t.profile.tags.map((tag, i) => (
              <React.Fragment key={tag.en}>
                <span>{tag[language]}</span>
                {i < t.profile.tags.length - 1 && (
                  <span aria-hidden="true" className="dark:text-zinc-600 text-slate-400">
                    ·
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>

          <p className="dark:text-zinc-200 text-slate-800 text-sm sm:text-base leading-relaxed font-sans max-w-3xl">
            {t.profile.bioLead[language]}
          </p>

          {/* ===================================================================== */}
          {/* ATMOSPHERIC POETIC FOLIO ("Guiding Verse")                            */}
          {/* Easy, heartfelt English inside a warm starlit nocturnal atmosphere    */}
          {/* ===================================================================== */}
          <div className="relative rounded-xl border dark:border-amber-200/15 border-sky-200 dark:bg-gradient-to-br dark:from-[#060a14] dark:via-[#0b1324] dark:to-[#070c17] bg-gradient-to-br from-sky-50/90 via-white to-amber-50/50 p-5 sm:p-6 shadow-inner overflow-hidden">
            {/* Atmospheric celestial starlight & aurora haze inside poetry folio (zero blur pass) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-14 left-1/3 w-72 h-44 rounded-full"
              style={{
                background: 'radial-gradient(ellipse, rgba(251, 191, 36, 0.14) 0%, transparent 70%)',
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-12 -right-10 w-56 h-40 rounded-full"
              style={{
                background: 'radial-gradient(ellipse, rgba(56, 189, 248, 0.12) 0%, transparent 70%)',
              }}
            />

            {/* Header Bar with Stanza Spotlight Tabs + Recite / Listen / Copy */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-3.5 mb-4 border-b dark:border-zinc-800/80 border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-mono tracking-wide dark:text-amber-200/90 text-sky-800">
                <Feather className="w-3.5 h-3.5 dark:text-amber-300 text-sky-600 shrink-0" />
                <span className="font-semibold whitespace-nowrap">
                  {language === 'fa' ? 'مرام‌نامه شاعرانه' : 'Guiding Verse'}
                </span>
                <span aria-hidden="true" className="dark:text-zinc-600 text-slate-400">
                  ·
                </span>
                <div
                  className="inline-flex items-center gap-1"
                  role="tablist"
                  aria-label={language === 'fa' ? 'انتخاب بند شعر' : 'Verse stanza spotlight'}
                >
                  {STANZA_LABELS.map((num, idx) => {
                    const selected = activeStanza === idx;
                    return (
                      <button
                        key={num}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => {
                          setIsReciting(false);
                          setActiveStanza(selected ? null : idx);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                          selected
                            ? 'dark:bg-amber-400/20 bg-sky-600 dark:text-amber-200 text-white'
                            : 'dark:text-zinc-500 text-slate-500 hover:dark:text-zinc-200 hover:text-slate-800'
                        }`}
                        title={
                          language === 'fa'
                            ? `تمرکز بر بند ${num}`
                            : `Spotlight verse ${num}`
                        }
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (!isReciting && activeStanza === null) setActiveStanza(0);
                    setIsReciting((prev) => !prev);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                    isReciting
                      ? 'dark:bg-amber-400/15 bg-amber-100 dark:border-amber-300/40 border-amber-400 dark:text-amber-200 text-amber-800'
                      : 'dark:bg-zinc-900/80 bg-white dark:border-zinc-700/80 border-slate-200 dark:text-zinc-300 text-slate-700 hover:dark:border-amber-300/40 hover:border-sky-400'
                  }`}
                >
                  {isReciting ? (
                    <Pause className="w-3 h-3 shrink-0" />
                  ) : (
                    <Play className="w-3 h-3 shrink-0" />
                  )}
                  <span>
                    {isReciting
                      ? language === 'fa'
                        ? 'توقف'
                        : 'Pause'
                      : language === 'fa'
                      ? 'مرور'
                      : 'Recite'}
                  </span>
                </button>

                {speechSupported && (
                  <button
                    type="button"
                    onClick={handleToggleSpeak}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                      isSpeaking
                        ? 'dark:bg-sky-500/20 bg-sky-100 dark:border-sky-400/50 border-sky-400 dark:text-sky-200 text-sky-800'
                        : 'dark:bg-zinc-900/80 bg-white dark:border-zinc-700/80 border-slate-200 dark:text-zinc-300 text-slate-700 hover:dark:border-sky-400/50 hover:border-sky-400'
                    }`}
                  >
                    {isSpeaking ? (
                      <VolumeX className="w-3 h-3 shrink-0" />
                    ) : (
                      <Volume2 className="w-3 h-3 shrink-0" />
                    )}
                    <span>
                      {isSpeaking
                        ? language === 'fa'
                          ? 'توقف'
                          : 'Stop'
                        : language === 'fa'
                        ? 'شنیدن'
                        : 'Listen'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopyPoem}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border dark:bg-zinc-900/80 bg-white dark:border-zinc-700/80 border-slate-200 dark:text-zinc-300 text-slate-700 hover:dark:border-sky-400/50 hover:border-sky-400 transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  {copiedPoem ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="text-emerald-400">
                        {language === 'fa' ? 'کپی شد' : 'Copied'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 shrink-0" />
                      <span>{language === 'fa' ? 'کپی' : 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 3 Clear & Atmospheric Rhyming Couplets */}
            <blockquote className="relative z-10 m-0 space-y-3">
              {couplets.map((pair, stanzaIdx) => {
                const isFocused = activeStanza === null || activeStanza === stanzaIdx;
                const isSpotlight = activeStanza === stanzaIdx;

                return (
                  <button
                    key={stanzaIdx}
                    type="button"
                    onClick={() => {
                      setIsReciting(false);
                      setActiveStanza(activeStanza === stanzaIdx ? null : stanzaIdx);
                    }}
                    className={`w-full rounded-lg px-3.5 py-2.5 transition-all duration-300 cursor-pointer flex items-start gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 ${
                      isRTL ? 'text-right' : 'text-left'
                    } ${
                      isSpotlight
                        ? 'dark:bg-white/[0.05] bg-sky-100/60 dark:shadow-[inset_0_0_24px_rgba(251,191,36,0.06)]'
                        : 'hover:dark:bg-white/[0.03] hover:bg-slate-100/70'
                    } ${isFocused ? 'opacity-100' : 'opacity-55 hover:opacity-90'}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 text-[11px] font-poetic font-semibold tracking-widest select-none transition-colors duration-200 min-w-[1.25rem] ${
                        isSpotlight
                          ? 'dark:text-amber-300 text-sky-700'
                          : 'dark:text-zinc-500 text-slate-400'
                      }`}
                    >
                      {STANZA_LABELS[stanzaIdx]}
                    </span>

                    <div
                      className={`flex-1 space-y-1 ${
                        language === 'fa'
                          ? 'font-sans text-base sm:text-lg leading-loose'
                          : 'font-poetic italic text-lg sm:text-[22px] leading-[1.68] tracking-[0.012em]'
                      } dark:text-slate-100 text-slate-800`}
                    >
                      {pair.map((line, lineIdx) => (
                        <p key={lineIdx} className="m-0">
                          {renderHighlightedLine(
                            line,
                            keywords,
                            activeStanza === null || isSpotlight
                          )}
                        </p>
                      ))}
                    </div>
                  </button>
                );
              })}
            </blockquote>
          </div>

          {/* Signature and Team Workspace Link */}
          <div className="pt-1 font-mono text-sm flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-xs uppercase tracking-wider dark:text-zinc-400 text-slate-500 font-bold">
                {t.profile.roleTitle[language]}
              </p>
              <p className="dark:text-zinc-300 text-slate-700">
                {t.profile.signatureLead[language]}
                <br />
                <strong className="text-base dark:text-white text-slate-900 font-semibold">
                  {t.profile.signatureName[language]}
                </strong>
              </p>
            </div>

            {onSelectTab && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectTab('team')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg dark:bg-[#00b8ff]/15 dark:hover:bg-[#00b8ff] dark:text-[#00b8ff] dark:hover:text-black bg-sky-800 hover:bg-sky-900 text-white border dark:border-[#00b8ff]/40 border-sky-900 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm whitespace-nowrap"
                >
                  <span>{language === 'fa' ? 'مشاهده تیم کامل و سوابق علمی' : 'View Full Academic Team'}</span>
                  <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
                </button>

                <a
                  href="?tab=team"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg dark:bg-zinc-900 dark:hover:bg-zinc-800 bg-white hover:bg-slate-100 dark:text-zinc-400 text-slate-900 dark:hover:text-white border dark:border-zinc-700 border-slate-900 text-xs font-mono transition-colors"
                  title={language === 'fa' ? 'باز کردن بخش تیم در تب جدید' : 'Open Team workspace in new tab'}
                >
                  <ExternalLink className="w-3.5 h-3.5 dark:text-[#00b8ff] text-sky-800" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
