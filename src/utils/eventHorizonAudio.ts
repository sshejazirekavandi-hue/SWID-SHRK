/**
 * Web Audio API procedural synthesis for the Black Hole Event Horizon Hum.
 * 
 * Synthesizes a soft, organic, low-frequency gravitational drone:
 * - Fundamental sub-bass sine at 49.0 Hz
 * - Detuned secondary wave at 52.8 Hz (producing a natural 3.8 Hz gravitational beat)
 * - Deep sub-harmonic at 24.5 Hz (tactile cosmic mass presence)
 * - Infrasonic LFO (0.07 Hz) gently sweeping the resonant low-pass filter (simulating plasma tidal breathing)
 * - Smooth exponential fade-ins/fade-outs with click-free gain scheduling
 */

export class EventHorizonAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;

  private isStarted = false;
  private isMuted = true;
  private baseVolume = 0.035; // Soft, unobtrusive ambient volume when explicitly unmuted
  private userVolume = 1.0;
  private isHoverSwell = false;
  private onStateChangeCallbacks: Set<(state: AudioEngineState) => void> = new Set();

  constructor() {
    // Default to muted so it never clashes with the main CosmicAudioEngine
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('swid_blackhole_audio_muted');
        if (saved === 'false') {
          this.isMuted = false;
        }
      } catch {
        // Ignore storage errors
      }
    }
  }

  public getState(): AudioEngineState {
    return {
      isStarted: this.isStarted,
      isMuted: this.isMuted,
      volume: this.userVolume,
      isHoverSwell: this.isHoverSwell,
    };
  }

  public subscribe(cb: (state: AudioEngineState) => void): () => void {
    this.onStateChangeCallbacks.add(cb);
    cb(this.getState());
    return () => this.onStateChangeCallbacks.delete(cb);
  }

  private notify() {
    const state = this.getState();
    this.onStateChangeCallbacks.forEach((cb) => cb(state));
  }

  /**
   * Initializes the Web Audio context and graph only when explicitly requested and unmuted.
   */
  public initOnInteraction(): void {
    if (this.isStarted || this.isMuted) return;
    this.startAudio();
  }

  private startAudio(): void {
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) {
        return;
      }

      this.ctx = new AudioCtxClass();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;

      // Master output gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, now);
      this.masterGain.connect(this.ctx.destination);

      // Low-pass filter keeping only a clean, pure sub-bass sine
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(75, now);
      this.filter.Q.setValueAtTime(1.0, now);
      this.filter.connect(this.masterGain);

      // Pure Perseus B-flat1 (58.27 Hz) aligned with CosmicAudioEngine sonification
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sine';
      this.osc1.frequency.setValueAtTime(58.27, now);
      const osc1Gain = this.ctx.createGain();
      osc1Gain.gain.setValueAtTime(0.45, now);
      this.osc1.connect(osc1Gain);
      osc1Gain.connect(this.filter);

      this.osc1.start(now);
      this.isStarted = true;

      const targetGain = this.isMuted ? 0.0001 : this.calculateEffectiveGain();
      this.masterGain.gain.linearRampToValueAtTime(targetGain, now + 3.2);

      this.notify();
    } catch (err) {
      console.warn('Could not start Event Horizon Audio:', err);
    }
  }

  private calculateEffectiveGain(): number {
    if (this.isMuted) return 0.0001;
    const swell = this.isHoverSwell ? 1.45 : 1.0;
    return Math.max(0.0001, this.baseVolume * this.userVolume * swell);
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('swid_blackhole_audio_muted', String(this.isMuted));
    } catch {
      // Ignore
    }

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      const target = this.calculateEffectiveGain();
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(target, now + 0.6);
    }

    this.notify();
  }

  public setVolume(volume: number): void {
    this.userVolume = Math.max(0, Math.min(1, volume));
    if (this.isMuted && this.userVolume > 0) {
      this.isMuted = false;
    }

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      const target = this.calculateEffectiveGain();
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(target, now + 0.3);
    }

    this.notify();
  }

  /**
   * Called when user hovers or interacts closely with the Singularity / Black Hole
   * subtly lifts the filter cutoff and deepens the resonance.
   */
  public setProximitySwell(active: boolean): void {
    if (this.isHoverSwell === active) return;
    this.isHoverSwell = active;

    if (this.ctx && this.filter && this.masterGain) {
      const now = this.ctx.currentTime;
      const targetCutoff = active ? 128 : 88;
      const targetGain = this.calculateEffectiveGain();

      this.filter.frequency.cancelScheduledValues(now);
      this.filter.frequency.setValueAtTime(this.filter.frequency.value, now);
      this.filter.frequency.linearRampToValueAtTime(targetCutoff, now + 1.2);

      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(targetGain, now + 1.2);
    }

    this.notify();
  }

  public destroy(): void {
    try {
      if (this.ctx && this.ctx.state !== 'closed') {
        this.ctx.close();
      }
    } catch {
      // Ignore
    }
  }
}

export interface AudioEngineState {
  isStarted: boolean;
  isMuted: boolean;
  volume: number;
  isHoverSwell: boolean;
}

// Global Singleton Instance
export const eventHorizonAudio = new EventHorizonAudioEngine();
