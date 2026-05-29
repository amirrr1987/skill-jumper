import Phaser from 'phaser'
import { TypedEmitter } from '../events.ts'
import { setServices } from '../services.ts'
import { GunSystem } from '../systems/GunSystem.ts'
import { SoundSystem } from '../systems/SoundSystem.ts'
import { createRng } from '../utils/rng.ts'
import { loadSave } from '../utils/storage.ts'
import { GameScene } from './GameScene.ts'
import { UIScene } from './UIScene.ts'

export const SCENE_KEYS = {
  boot: 'BootScene',
  game: 'GameScene',
  ui: 'UIScene',
} as const

/**
 * One-shot bootstrap: there are no assets to load, so we just build the shared
 * services and launch the gameplay + overlay scenes in parallel.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.boot)
  }

  create(): void {
    const save = loadSave()
    setServices(this.game, {
      emitter: new TypedEmitter(),
      sound: new SoundSystem(save.soundOn),
      rng: createRng(),
      save,
      guns: new GunSystem(save),
    })

    this.scene.add(SCENE_KEYS.game, GameScene, true)
    this.scene.add(SCENE_KEYS.ui, UIScene, true)
  }
}
