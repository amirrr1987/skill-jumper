import Phaser from 'phaser'
import type { GameEvents } from './types.ts'

/** Keys that carry no payload (declared as `void` in {@link GameEvents}). */
type VoidKeys = {
  [K in keyof GameEvents]: GameEvents[K] extends void ? K : never
}[keyof GameEvents]

/** Keys that carry a payload. */
type PayloadKeys = Exclude<keyof GameEvents, VoidKeys>

type Handler<K extends keyof GameEvents> = GameEvents[K] extends void
  ? () => void
  : (payload: GameEvents[K]) => void

/**
 * A thin, fully-typed wrapper around Phaser's EventEmitter. It constrains event
 * names and payloads to the {@link GameEvents} map, giving us compile-time
 * safety for cross-scene communication without resorting to `any`.
 */
export class TypedEmitter {
  private readonly emitter = new Phaser.Events.EventEmitter()

  emit<K extends VoidKeys>(event: K): void
  emit<K extends PayloadKeys>(event: K, payload: GameEvents[K]): void
  emit(event: keyof GameEvents, payload?: unknown): void {
    this.emitter.emit(event, payload)
  }

  on<K extends keyof GameEvents>(event: K, handler: Handler<K>, context?: object): this {
    this.emitter.on(event, handler, context)
    return this
  }

  off<K extends keyof GameEvents>(event: K, handler?: Handler<K>, context?: object): this {
    this.emitter.off(event, handler, context)
    return this
  }

  destroy(): void {
    this.emitter.removeAllListeners()
  }
}
