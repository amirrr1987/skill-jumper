import Phaser from 'phaser'

/**
 * Lightweight pixel-art sprite drawing on a Phaser Graphics object.
 *
 * A sprite is a list of equal-length rows. Each character maps to a palette
 * color (hex number) or is transparent when missing from the palette. Sprites
 * are authored facing RIGHT; pass `flip` to mirror for a left-facing pose.
 *
 * We snap the pixel size and origin to whole device pixels so the art stays
 * crisp (no blurry sub-pixel seams) regardless of the responsive scale.
 */
export type PixelPalette = Record<string, number>

export interface PixelSprite {
  rows: string[]
  palette: PixelPalette
}

export interface DrawPixelOptions {
  /** Center X of the sprite in world/screen space. */
  cx: number
  /** Bottom (feet) Y of the sprite in world/screen space. */
  bottomY: number
  /** Target draw height in px; pixel size = height / rows. */
  height: number
  flip?: boolean
  alpha?: number
  /** Multiply every palette color toward this tint (0..1). Used for hit flash. */
  tint?: number
  tintAmount?: number
}

export function spriteDimensions(sprite: PixelSprite): { cols: number; rows: number } {
  return { cols: sprite.rows[0]?.length ?? 0, rows: sprite.rows.length }
}

export function drawPixelSprite(
  g: Phaser.GameObjects.Graphics,
  sprite: PixelSprite,
  opts: DrawPixelOptions,
): void {
  const rowsCount = sprite.rows.length
  if (rowsCount === 0) {
    return
  }
  const cols = sprite.rows[0]?.length ?? 0
  if (cols === 0) {
    return
  }

  const px = Math.max(1, Math.round(opts.height / rowsCount))
  const totalW = cols * px
  const totalH = rowsCount * px
  const left = Math.round(opts.cx - totalW / 2)
  const top = Math.round(opts.bottomY - totalH)
  const alpha = opts.alpha ?? 1
  const flip = opts.flip ?? false

  for (let r = 0; r < rowsCount; r += 1) {
    const row = sprite.rows[r]
    if (row === undefined) {
      continue
    }
    let c = 0
    while (c < cols) {
      const key = row.charAt(flip ? cols - 1 - c : c)
      const color = sprite.palette[key]
      if (color === undefined) {
        c += 1
        continue
      }
      // Merge horizontal runs of the same color into one rect (fewer draw calls).
      let run = 1
      while (c + run < cols) {
        const nextKey = row.charAt(flip ? cols - 1 - (c + run) : c + run)
        if (sprite.palette[nextKey] !== color) {
          break
        }
        run += 1
      }
      const drawColor =
        opts.tint !== undefined && opts.tintAmount
          ? mixColor(color, opts.tint, opts.tintAmount)
          : color
      g.fillStyle(drawColor, alpha)
      g.fillRect(left + c * px, top + r * px, run * px, px)
      c += run
    }
  }
}

export function mixColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff
  const ag = (a >> 8) & 0xff
  const ab = a & 0xff
  const br = (b >> 16) & 0xff
  const bg = (b >> 8) & 0xff
  const bb = b & 0xff
  const rr = Math.round(ar + (br - ar) * t)
  const rg = Math.round(ag + (bg - ag) * t)
  const rb = Math.round(ab + (bb - ab) * t)
  return (rr << 16) | (rg << 8) | rb
}
