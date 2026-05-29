import Phaser from 'phaser'

/**
 * Turns raw pointer/keyboard input into a single semantic "tap" callback. Uses
 * `pointerdown` (covers mouse + touch + pen) for the lowest possible latency,
 * and also accepts Space/Enter for desktop accessibility.
 */
export class InputSystem {
  private readonly scene: Phaser.Scene
  private readonly onTap: () => void
  private readonly pointerHandler: () => void
  private readonly keyHandler: (event: KeyboardEvent) => void

  constructor(scene: Phaser.Scene, onTap: () => void) {
    this.scene = scene
    this.onTap = onTap

    this.pointerHandler = (): void => {
      this.onTap()
    }
    this.keyHandler = (event: KeyboardEvent): void => {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault()
        this.onTap()
      }
    }

    this.scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.pointerHandler)
    this.scene.input.keyboard?.on('keydown', this.keyHandler)
  }

  destroy(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.pointerHandler)
    this.scene.input.keyboard?.off('keydown', this.keyHandler)
  }
}
