import { CelestialBodyKey } from '../types';
import { cosmicAudio } from './cosmicAudio';

/**
 * Web Audio API Cosmic Sound Synthesizer
 * Synthesizes zero-dependency, real-time procedural audio effects for celestial body
 * rotation acceleration, orbital alignment, focus hum, and terminal workspace launch.
 */

// Dedicated harmonic frequencies (Hz) for each celestial body
const CELESTIAL_HARMONICS: Record<CelestialBodyKey, number[]> = {
  blackhole: [29.14, 58.27, 87.31, 116.54], // NASA Perseus B-flat black hole pressure-wave harmonics
  sun: [185.0, 277.18, 369.99, 554.37], // Radiant high-heat solar photosphere & prominence resonance
  mercury: [293.66, 440.0, 587.33, 880.0], // Swift metallic silicate chime
  venus: [233.08, 349.23, 466.16, 698.46], // Supercritical dense greenhouse atmospheric resonance
  earth: [261.63, 329.63, 392.0, 523.25, 659.25], // Pure blue marble ocean & Rayleigh atmosphere major triad
  mars: [220.0, 329.63, 440.0, 659.25], // Iron oxide rust desert harmonic chime
  jupiter: [110.0, 220.0, 329.63, 493.88, 659.25], // Colossal Jovian magnetosphere & storm hum
  saturn: [196.0, 293.66, 392.0, 493.88, 739.99, 987.77], // Shimmering crystalline ice-ring harmonics
  uranus: [207.65, 311.13, 415.3, 622.25], // Aquamarine tilted ice giant cryogenic chime
  neptune: [174.61, 261.63, 349.23, 523.25, 698.46], // Deep abyssal cobalt supersonic ocean sweep
};

// Sub-bass focus hum frequencies (Hz) tailored to each celestial body
const FOCUS_HUM_BASE_HZ: Record<CelestialBodyKey, number> = {
  blackhole: 58.27,
  sun: 68,
  mercury: 86,
  venus: 78,
  earth: 74,
  mars: 70,
  jupiter: 54,
  saturn: 60,
  uranus: 64,
  neptune: 58,
};

let audioCtx: AudioContext | null = null;

function isAudioMuted(): boolean {
  try {
    return !cosmicAudio.getSnapshot().enabled;
  } catch {
    return false;
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (err) {
    console.warn('Web Audio API unavailable in this environment:', err);
    return null;
  }
}

/**
 * Subtle low-frequency gravitational hum for focusing a planet or the Sun (first click).
 */
export function playPlanetFocusHum(bodyKey: CelestialBodyKey): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const duration = 0.38;
    const baseFreq = FOCUS_HUM_BASE_HZ[bodyKey] || 68;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.linearRampToValueAtTime(0.11, now + 0.045);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(240, now);
    lowpass.frequency.exponentialRampToValueAtTime(110, now + duration);
    lowpass.Q.setValueAtTime(1.8, now);

    lowpass.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Primary warm sub-bass orbital hum
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(baseFreq * 0.92, now);
    subOsc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.09);
    subOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.85, now + duration);

    subGain.gain.setValueAtTime(0.85, now);
    subOsc.connect(subGain);
    subGain.connect(lowpass);

    // Subtle fifth harmonic shimmer for space body character
    const overtoneOsc = ctx.createOscillator();
    const overtoneGain = ctx.createGain();
    overtoneOsc.type = 'triangle';
    overtoneOsc.frequency.setValueAtTime(baseFreq * 1.5, now);
    overtoneOsc.frequency.exponentialRampToValueAtTime(baseFreq * 1.48, now + duration);

    overtoneGain.gain.setValueAtTime(0.22, now);
    overtoneOsc.connect(overtoneGain);
    overtoneGain.connect(lowpass);

    subOsc.start(now);
    overtoneOsc.start(now);
    subOsc.stop(now + duration + 0.02);
    overtoneOsc.stop(now + duration + 0.02);
  } catch {
    // Ignore audio synthesis errors
  }
}

/**
 * Distinct, subtle sci-fi data-terminal confirmation sound for opening a mapped workspace.
 */
export function playWorkspaceTerminalSound(bodyKey: CelestialBodyKey): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const harmonics = CELESTIAL_HARMONICS[bodyKey] || [261.63, 392.0, 523.25];
    const anchor = harmonics[Math.min(2, harmonics.length - 1)] || 440;
    const scale = Math.max(0.85, Math.min(1.25, anchor / 380));

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.09, now);
    masterGain.connect(ctx.destination);

    // Smooth terminal bandpass/lowpass filter so digital pulses feel crisp yet gentle
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, now);
    filter.Q.setValueAtTime(1.2, now);
    filter.connect(masterGain);

    // 3-step telemetry data-terminal handshake chirps
    const pulses = [
      { offset: 0.0, freq: 780 * scale, dur: 0.042, type: 'triangle' as OscillatorType, gain: 0.45 },
      { offset: 0.052, freq: 1170 * scale, dur: 0.042, type: 'triangle' as OscillatorType, gain: 0.5 },
      { offset: 0.104, freq: 1560 * scale, dur: 0.095, type: 'sine' as OscillatorType, gain: 0.65 },
    ];

    pulses.forEach((p) => {
      const t0 = now + p.offset;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();

      osc.type = p.type;
      osc.frequency.setValueAtTime(p.freq, t0);
      osc.frequency.exponentialRampToValueAtTime(p.freq * 1.03, t0 + p.dur);

      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(p.gain, t0 + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + p.dur);

      osc.connect(g);
      g.connect(filter);
      osc.start(t0);
      osc.stop(t0 + p.dur + 0.01);
    });

    // Subtle low-end console lock thump on the initial beat
    const lockOsc = ctx.createOscillator();
    const lockGain = ctx.createGain();
    lockOsc.type = 'sine';
    lockOsc.frequency.setValueAtTime(145, now);
    lockOsc.frequency.exponentialRampToValueAtTime(62, now + 0.08);

    lockGain.gain.setValueAtTime(0.0001, now);
    lockGain.gain.linearRampToValueAtTime(0.35, now + 0.008);
    lockGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    lockOsc.connect(lockGain);
    lockGain.connect(masterGain);
    lockOsc.start(now);
    lockOsc.stop(now + 0.1);
  } catch {
    // Ignore audio synthesis errors
  }
}

/**
 * Synthesizes a cosmic hyperspace warp transit sound when a celestial body accelerates or is entered.
 * Combines:
 * 1. Sub-bass dimensional drop (singularity bass plunge)
 * 2. Hyperspace whoosh filter sweep (bandpassed noise transient)
 * 3. Body-specific celestial harmonic chord with shimmer overtone
 *
 * @param bodyKey The target celestial body
 * @param speedMultiplier Current rotation velocity multiplier (1.0 to 26.0+)
 */
export function playCosmicWarpSound(bodyKey: CelestialBodyKey, speedMultiplier: number = 1.0): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const speed = Math.max(1, speedMultiplier);
    // As rotation speeds up, the warp transit tightens and pitch shifts higher
    const duration = Math.max(0.45, Math.min(1.5, 1.35 / Math.sqrt(speed * 0.75)));
    const pitchShift = Math.pow(1.08, Math.min(speed, 12) - 1);

    // Master bus for this sound
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.28, now + 0.05);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    masterGain.connect(ctx.destination);

    // 1. Sub-Bass Singularity Drop
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = bodyKey === 'blackhole' ? 'sawtooth' : 'sine';

    const startBassFreq = (bodyKey === 'blackhole' ? 85 : 125) * pitchShift;
    const endBassFreq = (bodyKey === 'blackhole' ? 28 : 38) * Math.max(0.7, pitchShift * 0.85);

    bassOsc.frequency.setValueAtTime(startBassFreq, now);
    bassOsc.frequency.exponentialRampToValueAtTime(endBassFreq, now + duration * 0.85);

    bassGain.gain.setValueAtTime(0.001, now);
    bassGain.gain.linearRampToValueAtTime(0.4, now + 0.04);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.9);

    bassOsc.connect(bassGain);
    bassGain.connect(masterGain);
    bassOsc.start(now);
    bassOsc.stop(now + duration);

    // 2. Hyperspace Whoosh (Procedural Noise Bandpass Sweep)
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      // White noise with slight pink roll-off
      noiseData[i] = (Math.random() * 2 - 1) * 0.8;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.Q.setValueAtTime(4.5, now);

    const startFilterFreq = 220;
    const peakFilterFreq = Math.min(6500, 1400 * Math.sqrt(speed));
    noiseFilter.frequency.setValueAtTime(startFilterFreq, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(peakFilterFreq, now + duration * 0.4);
    noiseFilter.frequency.exponentialRampToValueAtTime(320, now + duration);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(0.22, now + 0.06);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSource.start(now);
    noiseSource.stop(now + duration);

    // 3. Celestial Harmonic Chord Swell
    const harmonics = CELESTIAL_HARMONICS[bodyKey] || [261.63, 329.63, 392.0];
    const chordGain = ctx.createGain();
    chordGain.gain.setValueAtTime(0.001, now);
    chordGain.gain.linearRampToValueAtTime(0.18 / Math.sqrt(harmonics.length), now + 0.08);
    chordGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.95);
    chordGain.connect(masterGain);

    harmonics.forEach((baseFreq, idx) => {
      const osc = ctx.createOscillator();
      // Black hole uses darker sawtooth/square, planets use pure sine/triangle
      osc.type = bodyKey === 'blackhole' ? 'triangle' : idx % 2 === 0 ? 'sine' : 'triangle';

      const targetFreq = baseFreq * pitchShift;
      // Frequency sweep introduces the "entering a dimensional portal" warp sensation
      osc.frequency.setValueAtTime(targetFreq * 0.88, now);
      osc.frequency.exponentialRampToValueAtTime(targetFreq * 1.05, now + duration * 0.35);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, now + duration);

      osc.connect(chordGain);
      osc.start(now);
      osc.stop(now + duration);
    });
  } catch (err) {
    console.warn('Audio synthesis playback error:', err);
  }
}

/**
 * Resets sound: Plays a subtle cosmic crystalline alignment chime
 */
export function playResetSound(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.2, now + 0.03);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    masterGain.connect(ctx.destination);

    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      osc.connect(masterGain);
      osc.start(now + idx * 0.06);
      osc.stop(now + 0.6);
    });
  } catch {
    // Ignore
  }
}
