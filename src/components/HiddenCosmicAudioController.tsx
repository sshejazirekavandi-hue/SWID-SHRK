import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { cosmicAudio, CosmicAudioSnapshot } from '../utils/cosmicAudio';
import { useLanguage } from '../context/LanguageContext';

/**
 * HiddenCosmicAudioController
 * Persistent, unobtrusive background audio controller mounted at the app root.
 * - Unlocks and fades in the synthesized Interstellar ("Stay"-inspired) synth-space
 *   soundscape seamlessly on the user's first interaction without interrupting UI flows.
 * - Keeps UI surface clean (no hero or navbar clutter); exposes a discreet obsidian
 *   ghost mute/unmute micro-affordance (opacity-20 until hovered/focused) for accessibility.
 */
export const HiddenCosmicAudioController: React.FC = () => {
  const [snap, setSnap] = useState<CosmicAudioSnapshot>(() => cosmicAudio.getSnapshot());
  const { isRTL } = useLanguage();

  useEffect(() => {
    const unsub = cosmicAudio.subscribe(setSnap);
    return unsub;
  }, []);

  // Seamless first-gesture audio unlock without interrupting any click/key action
  useEffect(() => {
    if (!snap.enabled || snap.isPlaying) return;

    const unlock = () => {
      cosmicAudio.unlockAndStart();
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, [snap.enabled, snap.isPlaying]);

  // Gently duck / resume audio when browser tab visibility changes
  useEffect(() => {
    const handleVisibility = () => {
      cosmicAudio.setTabHidden(document.visibilityState === 'hidden');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const isActive = snap.enabled && snap.isPlaying;

  return (
    <div
      className={`fixed bottom-4 ${isRTL ? 'right-4' : 'left-4'} z-20 pointer-events-none select-none`}
      aria-label="Background Space Soundscape Controller"
    >
      {/* Discreet dark-celestial ghost toggle: stays virtually hidden until hovered/focused */}
      <button
        type="button"
        onClick={() => cosmicAudio.toggle()}
        aria-pressed={isActive}
        aria-label={
          isActive
            ? 'Mute Perseus black hole sonification'
            : 'Play Perseus black hole sonification'
        }
        title={
          isActive
            ? 'NASA Perseus Black Hole Sonification: Active (Click to mute)'
            : 'NASA Perseus Black Hole Sonification: Muted (Click to play)'
        }
        className={`pointer-events-auto w-8 h-8 rounded-full flex items-center justify-center border transition-opacity duration-300 cursor-pointer bg-[#02040a]/80 backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 ${
          isActive
            ? 'border-sky-400/30 text-sky-300/90 opacity-20 hover:opacity-95 focus-visible:opacity-95 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
            : 'border-zinc-800/80 text-zinc-500 opacity-15 hover:opacity-90 focus-visible:opacity-90'
        }`}
      >
        {isActive ? (
          <Volume2 className="w-3.5 h-3.5" />
        ) : (
          <VolumeX className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
};
