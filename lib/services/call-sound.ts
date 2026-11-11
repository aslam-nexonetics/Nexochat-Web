/**
 * Pure Web Audio API Synthesizer for Call Ringtones & Alerts
 * Zero external asset dependencies, zero 404s, instant playback across all browsers.
 */

class CallSoundService {
  private audioCtx: AudioContext | null = null;
  private ringTimer: NodeJS.Timeout | null = null;
  private isRinging = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Play outgoing ringback tone (dual tone 440Hz & 480Hz)
   */
  startOutgoingRinging() {
    this.stopAll();
    this.isRinging = true;

    const playBurst = () => {
      if (!this.isRinging) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
      gain.gain.setValueAtTime(0.08, now + 1.6);
      gain.gain.linearRampToValueAtTime(0.001, now + 1.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.8);
      osc2.stop(now + 1.8);
    };

    playBurst();
    this.ringTimer = setInterval(playBurst, 4000);
  }

  /**
   * Play cheerful, modern melodic incoming call ringtone
   */
  startIncomingRinging() {
    this.stopAll();
    this.isRinging = true;

    const playMelody = () => {
      if (!this.isRinging) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const duration = 0.2;
      const start = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start + idx * duration);

        const noteStart = start + idx * duration;
        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(0.12, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + duration - 0.02);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + duration);
      });
    };

    playMelody();
    this.ringTimer = setInterval(playMelody, 2200);
  }

  /**
   * Play soft ascending chime when call connects
   */
  playCallConnected() {
    this.stopAll();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25]; // A4, C#5, E5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.1;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  /**
   * Play soft descending chime when call ends
   */
  playCallEnded() {
    this.stopAll();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [587.33, 440]; // D5, A4
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.15;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.09, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  /**
   * Stop any looping ringtone
   */
  stopAll() {
    this.isRinging = false;
    if (this.ringTimer) {
      clearInterval(this.ringTimer);
      this.ringTimer = null;
    }
  }
}

export const callSoundService = new CallSoundService();
