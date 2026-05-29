import { GAME } from '../config.ts'
import type { StairStep, Viewport } from '../types.ts'

/**
 * Extend zigzag stairs upward from `fromIndex`.
 * `stride` controls horizontal travel left/right; it is independent of the
 * tread block width so we can spread the path wider without fat blocks.
 */
export function appendSteps(
  steps: StairStep[],
  fromIndex: number,
  count: number,
  cx: number,
  baseY: number,
  stride: number,
  stepH: number,
): void {
  for (let i = fromIndex; i < fromIndex + count; i += 1) {
    if (i === 0) {
      steps.push({ index: 0, x: cx, y: baseY, side: 'center' })
      continue
    }
    const prev = steps[i - 1]
    if (prev === undefined) {
      continue
    }
    const goLeft = i % 2 === 1
    steps.push({
      index: i,
      x: prev.x + (goLeft ? -stride : stride),
      y: prev.y - stepH,
      side: goLeft ? 'left' : 'right',
    })
  }
}

export function positionAtProgress(steps: StairStep[], progress: number): { x: number; y: number } {
  const idx = Math.floor(progress)
  const frac = progress - idx
  const a = steps[idx]
  const b = steps[idx + 1]
  if (a === undefined) {
    return { x: 0, y: 0 }
  }
  if (b === undefined || frac <= 0) {
    return { x: a.x, y: a.y }
  }
  return {
    x: a.x + (b.x - a.x) * frac,
    y: a.y + (b.y - a.y) * frac,
  }
}

export function getStep(steps: readonly StairStep[], index: number): StairStep | undefined {
  return steps.find((s) => s.index === index)
}

export function computeViewport(width: number, height: number): Viewport {
  const min = Math.min(width, height)
  // Clamp stride so the zigzag never pushes characters off-screen on wide/narrow displays.
  const maxStride = (width * 0.5 - min * GAME.stair.stepWidthRatio * 0.75) * 0.92
  const stride = Math.min(min * GAME.stair.strideRatio, Math.max(min * 0.28, maxStride))
  return {
    width,
    height,
    stepWidth: min * GAME.stair.stepWidthRatio,
    stepStride: stride,
    stepHeight: min * GAME.stair.stepHeightRatio,
    treadDepth: min * GAME.stair.treadDepthRatio,
  }
}
