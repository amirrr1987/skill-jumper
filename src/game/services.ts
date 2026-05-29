import type Phaser from 'phaser'
import type { TypedEmitter } from './events.ts'
import type { GunSystem } from './systems/GunSystem.ts'
import type { SoundSystem } from './systems/SoundSystem.ts'
import type { Rng } from './utils/rng.ts'
import type { SaveData } from './utils/storage.ts'

/** Shared singletons created in BootScene and consumed by the other scenes. */
export interface Services {
  emitter: TypedEmitter
  sound: SoundSystem
  rng: Rng
  save: SaveData
  guns: GunSystem
}

const REGISTRY_KEY = 'services'

export function setServices(game: Phaser.Game, services: Services): void {
  game.registry.set(REGISTRY_KEY, services)
}

export function getServices(scene: Phaser.Scene): Services {
  const services = scene.registry.get(REGISTRY_KEY) as Services | undefined
  if (services === undefined) {
    throw new Error('Services not initialised; BootScene must run first.')
  }
  return services
}
