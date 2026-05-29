/**
 * Zero-asset sound via Web Audio API.
 */
export class SoundSystem {
  private ctx: AudioContext | null = null
  private enabled: boolean

  constructor(enabled: boolean) {
    this.enabled = enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  unlock(): void {
    const ctx = this.context()
    if (ctx !== null && ctx.state === 'suspended') {
      void ctx.resume()
    }
  }

  private context(): AudioContext | null {
    if (this.ctx !== null) {
      return this.ctx
    }
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (Ctor === undefined) {
      return null
    }
    this.ctx = new Ctor()
    return this.ctx
  }

  private tone(
    freqStart: number,
    freqEnd: number,
    durationSec: number,
    type: OscillatorType,
    gainPeak: number,
  ): void {
    if (!this.enabled) {
      return
    }
    const ctx = this.context()
    if (ctx === null) {
      return
    }
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freqStart, now)
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), now + durationSec)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + durationSec + 0.02)
  }

  shoot(): void {
    this.tone(820, 420, 0.05, 'square', 0.1)
  }

  kill(): void {
    this.tone(520, 880, 0.07, 'triangle', 0.12)
  }

  buy(): void {
    this.tone(660, 990, 0.12, 'sine', 0.14)
  }

  gameOver(): void {
    this.tone(280, 80, 0.4, 'sawtooth', 0.18)
  }

  reward(): void {
    this.tone(523, 1047, 0.2, 'square', 0.12)
  }
}
