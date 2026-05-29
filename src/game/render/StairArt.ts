import Phaser from 'phaser'
import { GAME } from '../config.ts'
import type { StairStep } from '../types.ts'

/** Side-view 3D-ish stair blocks (Mr Gun style). */
export function drawStairStep(
  g: Phaser.GameObjects.Graphics,
  step: StairStep,
  screenX: number,
  screenY: number,
  stepWidth: number,
  treadDepth: number,
): void {
  const w = stepWidth * 1.4
  const d = treadDepth
  const rise = treadDepth * 0.85
  const y = screenY
  const x = screenX

  // Riser (front face) — darker.
  g.fillStyle(GAME.stair.color, 1)
  g.fillRect(x - w / 2, y - d, w, d)

  // Top tread.
  g.fillStyle(0x3d4f78, 1)
  g.fillRect(x - w / 2, y - d - rise, w, rise + 2)

  // Side cheek (depth illusion toward zigzag direction).
  const cheekW = w * 0.18
  const cheekDir = step.side === 'left' ? -1 : step.side === 'right' ? 1 : 0
  if (cheekDir !== 0) {
    g.fillStyle(0x222a48, 1)
    g.beginPath()
    if (cheekDir > 0) {
      g.moveTo(x + w / 2, y - d)
      g.lineTo(x + w / 2 + cheekW, y - d - rise * 0.5)
      g.lineTo(x + w / 2 + cheekW, y - d - rise)
      g.lineTo(x + w / 2, y - d - rise)
    } else {
      g.moveTo(x - w / 2, y - d)
      g.lineTo(x - w / 2 - cheekW, y - d - rise * 0.5)
      g.lineTo(x - w / 2 - cheekW, y - d - rise)
      g.lineTo(x - w / 2, y - d - rise)
    }
    g.closePath()
    g.fillPath()
  }

  // Neon edge on tread.
  g.lineStyle(2, GAME.stair.edgeColor, step.index % 4 === 0 ? 0.55 : 0.2)
  g.strokeRect(x - w / 2, y - d - rise, w, d + rise)

  if (step.index > 0 && step.index % 10 === 0) {
    g.fillStyle(0x00f5d4, 0.2)
    g.fillCircle(x, y - d - rise - 8, 6)
  }
}
