/**
 * NASA Perseus Galaxy Cluster Black Hole Sonification Engine
 * Pure Web Audio API procedural synthesis (zero external audio dependencies):
 *  - Modeled after NASA's Perseus Cluster black hole sonification (intracluster gas
 *    pressure waves transposed 57–58 octaves upward from B♭ into human hearing):
 *    • Layer 1: Deep B♭0 (29.14 Hz) & B♭1 (58.27 Hz) fundamental with slow 0.75 Hz
 *      gravitational pressure-wave beating (59.02 Hz companion) & subtle pitch drift.
 *    • Layer 2: Haunting hollow intracluster gas cavity formants — two incommensurate
 *      infrasonic LFOs (0.041 Hz & 0.067 Hz) sweeping resonant bandpass filters
 *      (125–255 Hz and 215–415 Hz) over a dark B♭/F harmonic bed.
 *    • Layer 3: Sculpted brown/pink relativistic plasma pressure-wave bed strictly
 *      band-limited below 240 Hz with slow tidal amplitude modulation.
 *    • Master Bus: Dark low-passed dual-tap stereo space echo + gentle compressor,
 *      3.5-second click-free fade-in, tab-visibility ducking, and proximity swell.
 */

const STORAGE_ENABLED_KEY = 'swid_cosmic_audio_enabled';
const STORAGE_VOLUME_KEY = 'swid_cosmic_audio_volume_v2';

// Transposed Perseus Cluster B-flat harmonics (57–58 octaves above astronomical B♭)
const PERSEUS_SUB_HZ = 29.14; // B♭0 tactile pressure floor
const PERSEUS_FUNDAMENTAL_HZ = 58.27; // B♭1 core black hole resonance
const PERSEUS_BEAT_HZ = 59.02; // +0.75 Hz gravitational pressure-wave beat
const PERSEUS_FIFTH_HZ = 87.31; // F2 hollow cavity overtone
const PERSEUS_OCTAVE_HZ = 116.54; // B♭2 upper cavity overtone

export interface CosmicAudioSnapshot {
  enabled: boolean;
  isPlaying: boolean;
  needsGesture: boolean;
  volume: number;
}

type Listener = (snapshot: CosmicAudioSnapshot) => void;

class CosmicAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private echoInput: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  // Persistent Perseus drone modulation targets for hover proximity swell
  private formantA: BiquadFilterNode | null = null;
  private formantB: BiquadFilterNode | null = null;
  private droneBusGain: GainNode | null = null;
  private nodesStarted: boolean = false;
  private proximityBoost: boolean = false;
  private tabHidden: boolean = false;

  private enabled: boolean = true;
  private volume: number = 0.22;
  private isPlaying: boolean = false;
  private needsGesture: boolean = true;

  private listeners: Set<Listener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedEnabled = localStorage.getItem(STORAGE_ENABLED_KEY);
        if (savedEnabled !== null) {
          this.enabled = savedEnabled === 'true';
        }
        const savedVol = localStorage.getItem(STORAGE_VOLUME_KEY);
        if (savedVol !== null) {
          const parsed = Number(savedVol);
          if (!Number.isNaN(parsed)) {
            this.volume = Math.max(0.04, Math.min(0.55, parsed));
          }
        }
      } catch {
        // ignore storage errors
      }
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSnapshot(): CosmicAudioSnapshot {
    return {
      enabled: this.enabled,
      isPlaying: this.isPlaying,
      needsGesture: this.needsGesture,
      volume: this.volume,
    };
  }

  private emit() {
    const snap = this.getSnapshot();
    for (const fn of this.listeners) {
      fn(snap);
    }
  }

  /**
   * Builds a smooth, zero-static looping brown/pink pressure-wave noise buffer
   * (6 seconds, crossfaded at loop boundary so there is never an audible click).
   */
  private createBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const durationSec = 6;
    const length = Math.floor(ctx.sampleRate * durationSec);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.024 * white) / 1.024;
        data[i] = lastOut * 2.8;
      }

      // Smooth 0.4s equal-power crossfade at the loop seam
      const fadeSamples = Math.floor(ctx.sampleRate * 0.4);
      for (let i = 0; i < fadeSamples; i++) {
        const t = i / fadeSamples;
        const tailIdx = length - fadeSamples + i;
        data[tailIdx] = data[tailIdx] * (1 - t) + data[i] * t;
      }
    }

    return buffer;
  }

  /**
   * Initializes the continuous NASA Perseus Cluster Black Hole DSP graph.
   */
  private ensureGraph(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      const ctx = new AudioCtx();
      this.ctx = ctx;
      const now = ctx.currentTime;

      // Master Dynamics Compressor (keeps sub-bass dense, smooth, and non-clipping)
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-20, now);
      compressor.knee.setValueAtTime(28, now);
      compressor.ratio.setValueAtTime(3.0, now);
      compressor.attack.setValueAtTime(0.04, now);
      compressor.release.setValueAtTime(0.45, now);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);

      const dryGain = ctx.createGain();
      dryGain.gain.setValueAtTime(0.7, now);

      // Dark Cavernous Intracluster Echo Bus (low-pass sculpted at 520 Hz)
      const echoInput = ctx.createGain();
      echoInput.gain.setValueAtTime(0.48, now);

      const echoFilter = ctx.createBiquadFilter();
      echoFilter.type = 'lowpass';
      echoFilter.frequency.setValueAtTime(520, now);
      echoFilter.Q.setValueAtTime(0.85, now);

      const delayA = ctx.createDelay(2.0);
      delayA.delayTime.setValueAtTime(0.58, now);
      const feedbackA = ctx.createGain();
      feedbackA.gain.setValueAtTime(0.44, now);

      const delayB = ctx.createDelay(2.0);
      delayB.delayTime.setValueAtTime(0.93, now);
      const feedbackB = ctx.createGain();
      feedbackB.gain.setValueAtTime(0.36, now);

      const wetGain = ctx.createGain();
      wetGain.gain.setValueAtTime(0.56, now);

      echoInput.connect(echoFilter);
      echoFilter.connect(delayA);
      delayA.connect(feedbackA);
      feedbackA.connect(echoFilter);
      delayA.connect(wetGain);

      echoFilter.connect(delayB);
      delayB.connect(feedbackB);
      feedbackB.connect(delayB);
      delayB.connect(wetGain);

      dryGain.connect(compressor);
      wetGain.connect(compressor);
      compressor.connect(masterGain);
      masterGain.connect(ctx.destination);

      this.compressor = compressor;
      this.masterGain = masterGain;
      this.dryGain = dryGain;
      this.echoInput = echoInput;

      // Build continuous Perseus black hole soundscape layers
      this.buildPerseusDrone(ctx);
    }

    return this.ctx;
  }

  private buildPerseusDrone(ctx: AudioContext) {
    if (this.nodesStarted || !this.dryGain || !this.echoInput) return;
    this.nodesStarted = true;
    const now = ctx.currentTime;

    const droneBus = ctx.createGain();
    droneBus.gain.setValueAtTime(1.0, now);
    droneBus.connect(this.dryGain);
    droneBus.connect(this.echoInput);
    this.droneBusGain = droneBus;

    // -------------------------------------------------------------------------
    // LAYER 1: Deep Transposed Perseus B-flat Sub-Bass & Gravitational Beat
    // -------------------------------------------------------------------------
    const subFilter = ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(115, now);
    subFilter.Q.setValueAtTime(0.9, now);
    subFilter.connect(droneBus);

    // Ultra-slow gravitational drift LFO modulating pitch subtly (0.023 Hz ≈ 43s period)
    const driftLfo = ctx.createOscillator();
    driftLfo.type = 'sine';
    driftLfo.frequency.setValueAtTime(0.023, now);
    const driftDepth = ctx.createGain();
    driftDepth.gain.setValueAtTime(0.75, now);
    driftLfo.connect(driftDepth);

    // Sub-harmonic B♭0 (29.14 Hz)
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(PERSEUS_SUB_HZ, now);
    const subOscGain = ctx.createGain();
    subOscGain.gain.setValueAtTime(0.24, now);
    subOsc.connect(subOscGain);
    subOscGain.connect(subFilter);

    // Fundamental B♭1 (58.27 Hz)
    const fundOsc = ctx.createOscillator();
    fundOsc.type = 'sine';
    fundOsc.frequency.setValueAtTime(PERSEUS_FUNDAMENTAL_HZ, now);
    driftDepth.connect(fundOsc.frequency);
    const fundGain = ctx.createGain();
    fundGain.gain.setValueAtTime(0.32, now);
    fundOsc.connect(fundGain);
    fundGain.connect(subFilter);

    // Detuned beating B♭1 companion (59.02 Hz -> 0.75 Hz slow tidal swell)
    const beatOsc = ctx.createOscillator();
    beatOsc.type = 'triangle';
    beatOsc.frequency.setValueAtTime(PERSEUS_BEAT_HZ, now);
    const beatGain = ctx.createGain();
    beatGain.gain.setValueAtTime(0.18, now);
    beatOsc.connect(beatGain);
    beatGain.connect(subFilter);

    // -------------------------------------------------------------------------
    // LAYER 2: Intracluster Gas Cavity Formant Resonators (Eerie Perseus Howl)
    // -------------------------------------------------------------------------
    const formantSourceBus = ctx.createGain();
    formantSourceBus.gain.setValueAtTime(0.26, now);

    // Dark rich harmonic carriers (B♭1, F2, B♭2 slightly detuned)
    const harmonicSpecs: { freq: number; type: OscillatorType; gain: number; detune: number }[] = [
      { freq: PERSEUS_FUNDAMENTAL_HZ, type: 'sawtooth', gain: 0.28, detune: -6 },
      { freq: PERSEUS_FIFTH_HZ, type: 'triangle', gain: 0.22, detune: 5 },
      { freq: PERSEUS_OCTAVE_HZ, type: 'sawtooth', gain: 0.16, detune: -9 },
      { freq: PERSEUS_OCTAVE_HZ * 1.498, type: 'sine', gain: 0.12, detune: 4 },
    ];

    const harmonicOscs: OscillatorNode[] = [];
    for (const spec of harmonicSpecs) {
      const osc = ctx.createOscillator();
      osc.type = spec.type;
      osc.frequency.setValueAtTime(spec.freq, now);
      osc.detune.setValueAtTime(spec.detune, now);
      driftDepth.connect(osc.frequency);

      const g = ctx.createGain();
      g.gain.setValueAtTime(spec.gain, now);
      osc.connect(g);
      g.connect(formantSourceBus);
      harmonicOscs.push(osc);
    }

    // Formant Filter A (Hollow deep voice cavity: 125 Hz <-> 255 Hz)
    const formantA = ctx.createBiquadFilter();
    formantA.type = 'bandpass';
    formantA.frequency.setValueAtTime(185, now);
    formantA.Q.setValueAtTime(5.6, now);

    const lfoA = ctx.createOscillator();
    lfoA.type = 'sine';
    lfoA.frequency.setValueAtTime(0.041, now); // ~24.4s wave cycle
    const lfoAGain = ctx.createGain();
    lfoAGain.gain.setValueAtTime(64, now);
    lfoA.connect(lfoAGain);
    lfoAGain.connect(formantA.frequency);

    const formantAGain = ctx.createGain();
    formantAGain.gain.setValueAtTime(0.65, now);
    formantSourceBus.connect(formantA);
    formantA.connect(formantAGain);
    formantAGain.connect(droneBus);

    // Formant Filter B (Upper eerie intracluster gas resonance: 215 Hz <-> 415 Hz)
    const formantB = ctx.createBiquadFilter();
    formantB.type = 'bandpass';
    formantB.frequency.setValueAtTime(310, now);
    formantB.Q.setValueAtTime(6.8, now);

    const lfoB = ctx.createOscillator();
    lfoB.type = 'sine';
    lfoB.frequency.setValueAtTime(0.067, now); // ~14.9s incommensurate cycle
    const lfoBGain = ctx.createGain();
    lfoBGain.gain.setValueAtTime(98, now);
    lfoB.connect(lfoBGain);
    lfoBGain.connect(formantB.frequency);

    const formantBGain = ctx.createGain();
    formantBGain.gain.setValueAtTime(0.42, now);
    formantSourceBus.connect(formantB);
    formantB.connect(formantBGain);
    formantBGain.connect(droneBus);

    this.formantA = formantA;
    this.formantB = formantB;

    // -------------------------------------------------------------------------
    // LAYER 3: Relativistic Plasma Pressure-Wave Bed (Filtered Brown Noise)
    // -------------------------------------------------------------------------
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this.createBrownNoiseBuffer(ctx);
    noiseSource.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(145, now);
    noiseFilter.Q.setValueAtTime(1.6, now);

    const noiseSweepLfo = ctx.createOscillator();
    noiseSweepLfo.type = 'sine';
    noiseSweepLfo.frequency.setValueAtTime(0.053, now);
    const noiseSweepDepth = ctx.createGain();
    noiseSweepDepth.gain.setValueAtTime(68, now);
    noiseSweepLfo.connect(noiseSweepDepth);
    noiseSweepDepth.connect(noiseFilter.frequency);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.22, now);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(droneBus);

    // Start all oscillators and looping pressure-wave bed cleanly
    driftLfo.start(now);
    subOsc.start(now);
    fundOsc.start(now);
    beatOsc.start(now);
    harmonicOscs.forEach((o) => o.start(now));
    lfoA.start(now);
    lfoB.start(now);
    noiseSweepLfo.start(now);
    noiseSource.start(now);
  }

  private getEffectiveGain(): number {
    if (!this.isPlaying || !this.enabled || this.tabHidden) return 0.0001;
    const swell = this.proximityBoost ? 1.28 : 1.0;
    return Math.min(0.65, this.volume * swell);
  }

  /**
   * Gently deepens the Perseus resonant cavity when hovering near the Black Hole.
   */
  public setProximityBoost(active: boolean) {
    if (this.proximityBoost === active) return;
    this.proximityBoost = active;
    if (!this.ctx || !this.isPlaying) return;

    const now = this.ctx.currentTime;
    if (this.formantA) {
      this.formantA.Q.cancelScheduledValues(now);
      this.formantA.Q.setValueAtTime(this.formantA.Q.value, now);
      this.formantA.Q.linearRampToValueAtTime(active ? 7.4 : 5.6, now + 0.9);
    }
    if (this.formantB) {
      this.formantB.Q.cancelScheduledValues(now);
      this.formantB.Q.setValueAtTime(this.formantB.Q.value, now);
      this.formantB.Q.linearRampToValueAtTime(active ? 8.5 : 6.8, now + 0.9);
    }
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
      this.masterGain.gain.linearRampToValueAtTime(this.getEffectiveGain(), now + 0.9);
    }
  }

  public async unlockAndStart(): Promise<boolean> {
    if (!this.enabled) return false;
    const ctx = this.ensureGraph();
    if (!ctx || !this.masterGain) return false;

    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      if (ctx.state !== 'running') {
        this.needsGesture = true;
        this.emit();
        return false;
      }

      this.needsGesture = false;

      if (!this.isPlaying) {
        this.isPlaying = true;
        const now = ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(0.0001, now);
        // Silky 3.5-second fade-in so the Perseus black hole drone emerges organically
        this.masterGain.gain.linearRampToValueAtTime(this.getEffectiveGain(), now + 3.5);
      }

      this.emit();
      return true;
    } catch {
      this.needsGesture = true;
      this.emit();
      return false;
    }
  }

  public stop() {
    this.isPlaying = false;

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.65);
    }

    this.emit();
  }

  public setTabHidden(hidden: boolean) {
    this.tabHidden = hidden;
    if (!this.ctx || !this.masterGain || !this.isPlaying) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now);
    const target = this.getEffectiveGain();
    this.masterGain.gain.linearRampToValueAtTime(target, now + 0.75);
  }

  public async setEnabled(next: boolean) {
    this.enabled = next;
    try {
      localStorage.setItem(STORAGE_ENABLED_KEY, String(next));
    } catch {
      // ignore
    }

    if (next) {
      await this.unlockAndStart();
    } else {
      this.stop();
    }
  }

  public async toggle() {
    if (!this.enabled || !this.isPlaying) {
      this.enabled = true;
      try {
        localStorage.setItem(STORAGE_ENABLED_KEY, 'true');
      } catch {
        // ignore
      }
      await this.unlockAndStart();
    } else {
      await this.setEnabled(false);
    }
  }

  public setVolume(nextVol: number) {
    this.volume = Math.max(0.02, Math.min(1, nextVol));
    try {
      localStorage.setItem(STORAGE_VOLUME_KEY, String(this.volume));
    } catch {
      // ignore
    }
    if (this.ctx && this.masterGain && this.isPlaying) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.getEffectiveGain(), now + 0.15);
    }
    this.emit();
  }
}

export const cosmicAudio = new CosmicAudioEngine();
