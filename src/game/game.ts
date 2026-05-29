import Phaser from 'phaser'
import { GAME } from './config.ts'
import { BootScene } from './scenes/BootScene.ts'

/**
 * Create and start the Phaser game, mounted into the element with the given id.
 * RESIZE scale mode keeps the canvas matched to the viewport (mobile portrait
 * and desktop alike); BootScene wires up the rest.
 */
export function startGame(parentId: string): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: parentId,
    backgroundColor: GAME.backgroundColor,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: '100%',
      height: '100%',
    },
    render: {
      antialias: true,
      powerPreference: 'high-performance',
    },
    input: {
      activePointers: 1,
    },
    scene: [BootScene],
  })
}
