import Phaser from 'phaser'
import type { GunDef } from '../data/guns.ts'
import type { EnemyKind, Viewport } from '../types.ts'
import { drawPixelSprite, mixColor, type PixelPalette, type PixelSprite } from './PixelArt.ts'
import { drawWeapon } from './WeaponArt.ts'

export interface CharacterMetrics {
  height: number
  width: number
  /** Vertical offset of head center above the feet (world units). */
  headY: number
}

export type CharacterKind = 'hero' | EnemyKind | 'boss'

export interface DrawCharacterOptions {
  gunAngle: number
  gun: GunDef
  muzzleFlash?: number
  bob?: number
  /** 0..1 white hit flash. */
  flash?: number
}

// ----- Pixel sprite authoring -------------------------------------------------

const GRID_W = 14
const GRID_H = 20

interface BodyParams {
  hair: 'short' | 'spiky' | 'bald' | 'mohawk'
  helmet: boolean
  shoulderPad: boolean
  accent: 'tie' | 'scarf' | 'belt' | 'sash'
  crown: boolean
  cape: boolean
}

class CharCanvas {
  private readonly cells: string[]
  private readonly w: number
  private readonly h: number

  constructor(w: number, h: number) {
    this.w = w
    this.h = h
    this.cells = new Array<string>(w * h).fill('.')
  }

  set(x: number, y: number, key: string): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) {
      return
    }
    this.cells[y * this.w + x] = key
  }

  rect(x: number, y: number, w: number, h: number, key: string): void {
    for (let yy = y; yy < y + h; yy += 1) {
      for (let xx = x; xx < x + w; xx += 1) {
        this.set(xx, yy, key)
      }
    }
  }

  rows(): string[] {
    const out: string[] = []
    for (let y = 0; y < this.h; y += 1) {
      out.push(this.cells.slice(y * this.w, y * this.w + this.w).join(''))
    }
    return out
  }
}

/**
 * Build a side-view humanoid (facing right) as a pixel grid. The front gun-arm
 * and weapon are NOT baked in — they're drawn procedurally so the aim can sweep.
 */
function buildBody(p: BodyParams): string[] {
  const c = new CharCanvas(GRID_W, GRID_H)

  // ---- Cape (boss/elite) — behind everything, on the back (left) side.
  if (p.cape) {
    c.rect(2, 8, 2, 9, 'c')
    c.set(2, 17, 'c')
    c.set(3, 17, 'c')
  }

  // ---- Back arm (relaxed, slightly behind torso).
  c.rect(4, 9, 2, 5, 's')
  c.set(4, 14, 'k') // back hand

  // ---- Legs + boots.
  c.rect(5, 14, 5, 2, 'p') // hips
  c.rect(5, 16, 2, 2, 'p') // back leg
  c.rect(8, 16, 2, 2, 'p') // front leg
  c.rect(4, 18, 3, 1, 'b') // back boot
  c.rect(8, 18, 3, 1, 'b') // front boot

  // ---- Torso (jacket) with a shaded back edge.
  c.rect(5, 8, 5, 6, 'j')
  c.rect(5, 8, 1, 6, 's') // back shadow column
  c.set(9, 8, 'j')

  // ---- Shoulder pads (armored).
  if (p.shoulderPad) {
    c.rect(4, 8, 6, 1, 'm')
    c.set(4, 9, 'm')
    c.set(9, 9, 'm')
  }

  // ---- Neck + accent.
  c.set(7, 7, 'k')
  c.set(8, 7, 'k')
  switch (p.accent) {
    case 'tie':
      c.set(7, 8, 'a')
      c.set(7, 9, 'a')
      c.set(7, 10, 'a')
      break
    case 'scarf':
      c.rect(6, 7, 4, 1, 'a')
      c.set(9, 8, 'a')
      break
    case 'sash':
      c.set(6, 9, 'a')
      c.set(7, 10, 'a')
      c.set(8, 11, 'a')
      break
    case 'belt':
      c.rect(5, 13, 5, 1, 'a')
      break
  }

  // ---- Head (skin block), shifted toward the front (right).
  c.rect(6, 1, 6, 6, 'k')
  // Brow + eye + mouth (front-facing details).
  c.set(9, 3, 'e') // eye
  c.set(10, 3, 'w') // eye glint
  c.set(8, 2, 'h') // brow hint
  c.set(11, 4, 'k') // nose poke (front)
  c.set(10, 5, 'd') // mouth shadow

  // ---- Hair / headgear.
  switch (p.hair) {
    case 'short':
      c.rect(6, 0, 6, 1, 'h')
      c.rect(6, 1, 2, 2, 'h') // back of head
      c.set(6, 3, 'h')
      break
    case 'spiky':
      c.set(6, 0, 'h')
      c.set(8, 0, 'h')
      c.set(10, 0, 'h')
      c.rect(6, 1, 6, 1, 'h')
      c.rect(6, 2, 2, 2, 'h')
      break
    case 'mohawk':
      c.rect(8, 0, 2, 1, 'h')
      c.set(8, 1, 'h')
      c.set(9, 1, 'h')
      c.rect(6, 1, 2, 3, 'h') // shaved back kept dark
      break
    case 'bald':
      break
  }

  if (p.helmet) {
    c.rect(6, 0, 7, 2, 'm')
    c.set(6, 2, 'm')
    c.set(5, 1, 'm') // brim toward back
    c.set(12, 2, 'm') // front visor lip
  }

  if (p.crown) {
    c.set(6, -0, 'a')
    c.set(6, 0, 'a')
    c.set(8, 0, 'a')
    c.set(10, 0, 'a')
    c.rect(6, 1, 6, 1, 'a')
  }

  return c.rows()
}

// ----- Palettes ---------------------------------------------------------------

interface KindArt {
  sprite: PixelSprite
  /** Eye/aura tint used for hit flashes & boss aura. */
  signature: number
}

function palette(over: Partial<PixelPalette>): PixelPalette {
  return {
    h: 0x1a1a2e, // hair
    k: 0xffd7b5, // skin
    d: 0xc98c6b, // skin shadow
    j: 0x4361ee, // jacket
    s: 0x2b3f9e, // jacket shadow
    p: 0x2a2f45, // pants
    b: 0x14182a, // boots
    e: 0x14182a, // eye
    w: 0xffffff, // glint
    a: 0x00f5d4, // accent
    m: 0x9aa3c0, // metal/armor
    c: 0x3a0d2e, // cape
    ...over,
  }
}

function makeArt(params: BodyParams, pal: PixelPalette, signature: number): KindArt {
  return { sprite: { rows: buildBody(params), palette: pal }, signature }
}

const HERO_ART = makeArt(
  { hair: 'short', helmet: false, shoulderPad: false, accent: 'tie', crown: false, cape: false },
  palette({ j: 0x4361ee, s: 0x2b3f9e, a: 0x00f5d4, h: 0x141430 }),
  0x00f5d4,
)

const ENEMY_ART: Record<EnemyKind, KindArt> = {
  grunt: makeArt(
    { hair: 'short', helmet: false, shoulderPad: false, accent: 'belt', crown: false, cape: false },
    palette({ j: 0xe63946, s: 0x9d1f2a, a: 0x1d3557, h: 0x2a1810, p: 0x222231 }),
    0xff6b6b,
  ),
  runner: makeArt(
    { hair: 'mohawk', helmet: false, shoulderPad: false, accent: 'scarf', crown: false, cape: false },
    palette({ j: 0xf72585, s: 0xb5175f, a: 0xffd166, h: 0xff006e, p: 0x2a1430 }),
    0xf72585,
  ),
  armored: makeArt(
    { hair: 'bald', helmet: true, shoulderPad: true, accent: 'sash', crown: false, cape: false },
    palette({ j: 0xff9500, s: 0xc46c00, a: 0x4a4a68, m: 0xb7bdd6, p: 0x2a2f45 }),
    0xff9500,
  ),
  elite: makeArt(
    { hair: 'spiky', helmet: false, shoulderPad: true, accent: 'sash', crown: true, cape: true },
    palette({ j: 0x5a189a, s: 0x3c096c, a: 0xffd166, h: 0xf72585, m: 0xc9a0ff }),
    0xffd166,
  ),
}

const BOSS_ART = makeArt(
  { hair: 'spiky', helmet: false, shoulderPad: true, accent: 'sash', crown: true, cape: true },
  palette({ j: 0x14182a, s: 0x0a0a14, a: 0xffd166, h: 0xf72585, m: 0xffd166, p: 0x101020 }),
  0xffd166,
)

function artFor(kind: CharacterKind, isBoss: boolean): KindArt {
  if (isBoss || kind === 'boss') {
    return BOSS_ART
  }
  if (kind === 'hero') {
    return HERO_ART
  }
  return ENEMY_ART[kind]
}

// ----- Public API -------------------------------------------------------------

export function getCharacterMetrics(viewport: Viewport, scaleMul = 1): CharacterMetrics {
  const height = viewport.stepHeight * 1.55 * scaleMul
  const width = (height / GRID_H) * GRID_W
  // Head center sits ~ row 3.5 of 20 from the top.
  const headY = height * (1 - 3.5 / GRID_H)
  return { height, width, headY }
}

export function footYOnStep(stepY: number, treadDepth: number): number {
  return stepY - treadDepth + 2
}

/** 1 = faces right, -1 = faces left (side profile). */
export function facingToward(fromX: number, toX: number): 1 | -1 {
  return toX >= fromX ? 1 : -1
}

/** Shoulder pivot where the gun arm starts (world/screen space). */
export function getShoulder(
  footX: number,
  footY: number,
  facing: 1 | -1,
  metrics: CharacterMetrics,
): { x: number; y: number } {
  const h = metrics.height
  return {
    x: footX + facing * h * 0.08,
    y: footY - h * 0.56,
  }
}

export function getMuzzlePosition(
  footX: number,
  footY: number,
  facing: 1 | -1,
  gunAngle: number,
  metrics: CharacterMetrics,
  gun: GunDef,
): { x: number; y: number } {
  const shoulder = getShoulder(footX, footY, facing, metrics)
  const h = metrics.height
  const armLen = h * 0.3
  const handX = shoulder.x + Math.cos(gunAngle) * armLen
  const handY = shoulder.y + Math.sin(gunAngle) * armLen
  const reach = h * (gun.visual.bodyLen + gun.visual.barrelLen)
  return {
    x: handX + Math.cos(gunAngle) * reach,
    y: handY + Math.sin(gunAngle) * reach,
  }
}

export function drawSideCharacter(
  g: Phaser.GameObjects.Graphics,
  footX: number,
  footY: number,
  facing: 1 | -1,
  kind: CharacterKind,
  isBoss: boolean,
  metrics: CharacterMetrics,
  opts: DrawCharacterOptions,
): void {
  const art = artFor(kind, isBoss)
  const h = metrics.height
  const bob = (opts.bob ?? 0) * h * 0.015
  const fy = footY + bob

  // Ground shadow.
  g.fillStyle(0x000000, 0.25)
  g.fillEllipse(footX, footY + h * 0.02, metrics.width * 0.85, h * 0.05)

  // Boss aura ring.
  if (isBoss) {
    g.lineStyle(2, art.signature, 0.5)
    g.strokeEllipse(footX, fy - h * 0.45, metrics.width * 1.25, h * 1.05)
  }

  const flash = opts.flash ?? 0

  // Body pixels.
  drawPixelSprite(g, art.sprite, {
    cx: footX,
    bottomY: fy,
    height: h,
    flip: facing === -1,
    tint: flash > 0 ? 0xffffff : undefined,
    tintAmount: flash,
  })

  // Front gun arm + weapon (procedural so it can aim).
  const shoulder = getShoulder(footX, fy, facing, metrics)
  const armLen = h * 0.3
  const handX = shoulder.x + Math.cos(opts.gunAngle) * armLen
  const handY = shoulder.y + Math.sin(opts.gunAngle) * armLen

  const skin = art.sprite.palette.k ?? 0xffd7b5
  const sleeve = art.sprite.palette.j ?? 0x4361ee

  // Upper arm (sleeve) then forearm (skin).
  thickLine(g, shoulder.x, shoulder.y, (shoulder.x + handX) / 2, (shoulder.y + handY) / 2, h * 0.07, sleeve)
  thickLine(g, (shoulder.x + handX) / 2, (shoulder.y + handY) / 2, handX, handY, h * 0.055, skin)

  drawWeapon(g, handX, handY, opts.gunAngle, facing, metrics.height, opts.gun, opts.muzzleFlash ?? 0)
}

export function drawHpBar(
  g: Phaser.GameObjects.Graphics,
  x: number,
  topY: number,
  width: number,
  hp: number,
  maxHp: number,
): void {
  if (maxHp <= 1) {
    return
  }
  const barW = width * 1.15
  const barH = 6
  const y = topY - 12
  const t = Math.max(0, hp / maxHp)
  g.fillStyle(0x000000, 0.5)
  g.fillRoundedRect(x - barW / 2 - 1, y - 1, barW + 2, barH + 2, 3)
  g.fillStyle(0x220011, 0.9)
  g.fillRoundedRect(x - barW / 2, y, barW, barH, 3)
  g.fillStyle(t < 0.35 ? 0xff3355 : 0x46d39a, 1)
  g.fillRoundedRect(x - barW / 2, y, barW * t, barH, 3)
}

function thickLine(
  g: Phaser.GameObjects.Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness: number,
  color: number,
): void {
  g.lineStyle(thickness, color, 1)
  g.beginPath()
  g.moveTo(x1, y1)
  g.lineTo(x2, y2)
  g.strokePath()
  g.fillStyle(color, 1)
  g.fillCircle(x2, y2, thickness * 0.5)
}

export { mixColor }
