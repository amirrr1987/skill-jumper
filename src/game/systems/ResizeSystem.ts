import Phaser from 'phaser'
import { computeViewport } from './StairPath.ts'
import type { Viewport } from '../types.ts'

export class ResizeSystem {
  private readonly scale: Phaser.Scale.ScaleManager
  private readonly onChange: (viewport: Viewport) => void
  private readonly handler: (gameSize: Phaser.Structs.Size) => void

  constructor(scale: Phaser.Scale.ScaleManager, onChange: (viewport: Viewport) => void) {
    this.scale = scale
    this.onChange = onChange
    this.handler = (size: Phaser.Structs.Size): void => {
      this.onChange(computeViewport(size.width, size.height))
    }
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handler)
  }

  current(): Viewport {
    return computeViewport(this.scale.width, this.scale.height)
  }

  destroy(): void {
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handler)
  }
}
