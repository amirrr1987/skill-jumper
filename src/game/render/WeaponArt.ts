import Phaser from 'phaser'
import type { GunDef } from '../data/guns.ts'

/** Reference screen edge the gun aim metrics were authored against. */
const REFERENCE_MIN = 430

/**
 * Draw the equipped weapon held at the hand, oriented along `angle`.
 * `h` is the character height (all sizes are fractions of it).
 */
export function drawWeapon(
  g: Phaser.GameObjects.Graphics,
  handX: number,
  handY: number,
  angle: number,
  facing: 1 | -1,
  h: number,
  gun: GunDef,
  muzzleFlash: number,
): void {
  const v = gun.visual
  // Axis unit vectors: u = along barrel, n = perpendicular (for thickness).
  const ux = Math.cos(angle)
  const uy = Math.sin(angle)
  const nx = -uy
  const ny = ux

  const bodyLen = h * v.bodyLen
  const barrelLen = h * v.barrelLen
  const bodyH = h * v.bodyHeight

  const place = (
    along0: number,
    along1: number,
    halfPerp: number,
    perpOffset: number,
    color: number,
  ): void => {
    quad(g, handX, handY, ux, uy, nx, ny, along0, along1, halfPerp, perpOffset, color)
  }

  // Stock (behind the hand).
  if (v.hasStock) {
    place(-bodyLen * 0.75, -bodyLen * 0.15, bodyH * 0.42, bodyH * 0.2, shade(v.metal, -0.18))
  }

  // Receiver / body.
  place(-bodyLen * 0.2, bodyLen, bodyH * 0.5, 0, v.metal)
  // Top rail highlight.
  place(-bodyLen * 0.1, bodyLen * 0.9, bodyH * 0.12, -bodyH * 0.32, shade(v.metal, 0.25))

  // Magazine (drops below).
  if (v.hasMag) {
    place(bodyLen * 0.1, bodyLen * 0.45, bodyH * 0.5, bodyH * 0.85, shade(v.metal, -0.1))
  }

  // Barrel(s).
  const barrelHalf = bodyH * 0.22
  if (v.barrels >= 2) {
    place(bodyLen, bodyLen + barrelLen, barrelHalf, -bodyH * 0.28, v.metal)
    place(bodyLen, bodyLen + barrelLen, barrelHalf, bodyH * 0.28, v.metal)
  } else {
    place(bodyLen, bodyLen + barrelLen, barrelHalf, -bodyH * 0.05, v.metal)
  }

  // Accent strip (gun's signature color) on the body.
  place(0, bodyLen * 0.7, bodyH * 0.1, bodyH * 0.05, v.accent)

  // Scope.
  if (v.hasScope) {
    place(bodyLen * 0.2, bodyLen * 0.6, bodyH * 0.18, -bodyH * 0.6, shade(v.metal, -0.2))
    place(bodyLen * 0.25, bodyLen * 0.55, bodyH * 0.1, -bodyH * 0.78, 0x0a0a14)
  }

  // Muzzle device.
  const muzzleR = h * v.muzzle
  const mx = handX + ux * (bodyLen + barrelLen)
  const my = handY + uy * (bodyLen + barrelLen)
  g.fillStyle(shade(v.metal, -0.25), 1)
  g.fillCircle(mx, my, muzzleR)

  // Trigger hand (knuckle) on top of the grip for depth.
  g.fillStyle(0xffd7b5, 1)
  g.fillCircle(handX + ux * bodyLen * 0.12, handY + uy * bodyLen * 0.12, bodyH * 0.28)

  // Muzzle flash.
  if (muzzleFlash > 0) {
    const f = muzzleFlash
    g.fillStyle(0xffffff, Math.min(1, f))
    g.fillCircle(mx + ux * muzzleR, my + uy * muzzleR, muzzleR * (1.2 + f))
    g.fillStyle(gun.muzzleColor, f * 0.7)
    g.fillCircle(mx + ux * muzzleR * 2.2, my + uy * muzzleR * 2.2, muzzleR * (1.6 + f * 1.4))
    // Star spikes.
    g.lineStyle(muzzleR * 0.5, gun.muzzleColor, f * 0.8)
    for (let k = 0; k < 4; k += 1) {
      const a = angle + (k * Math.PI) / 2 + Math.PI / 4
      g.beginPath()
      g.moveTo(mx, my)
      g.lineTo(mx + Math.cos(a) * muzzleR * 3 * f, my + Math.sin(a) * muzzleR * 3 * f)
      g.strokePath()
    }
  }

  void facing
}

/**
 * Draw the per-weapon aiming guide ("laser"). Length/width are scaled from the
 * authored reference resolution. Returns nothing; purely visual feedback.
 */
export function drawAimBeam(
  g: Phaser.GameObjects.Graphics,
  muzzleX: number,
  muzzleY: number,
  angle: number,
  gun: GunDef,
  minEdge: number,
  pulse: number,
): void {
  const scale = minEdge / REFERENCE_MIN
  const len = gun.aim.length * scale
  const width = gun.aim.width * scale
  const ux = Math.cos(angle)
  const uy = Math.sin(angle)
  const ex = muzzleX + ux * len
  const ey = muzzleY + uy * len

  if (gun.aim.coneDeg) {
    // Spread fan (shotgun): two faint edge lines + soft fill.
    const half = (gun.aim.coneDeg * Math.PI) / 180
    const a1 = angle - half
    const a2 = angle + half
    g.fillStyle(gun.aim.color, 0.12)
    g.beginPath()
    g.moveTo(muzzleX, muzzleY)
    g.lineTo(muzzleX + Math.cos(a1) * len, muzzleY + Math.sin(a1) * len)
    g.lineTo(muzzleX + Math.cos(a2) * len, muzzleY + Math.sin(a2) * len)
    g.closePath()
    g.fillPath()
  }

  if (gun.aim.beam) {
    // Glowing energy beam: outer glow + bright core.
    g.lineStyle(width * 2.4, gun.aim.color, 0.18 + pulse * 0.1)
    beamLine(g, muzzleX, muzzleY, ex, ey)
    g.lineStyle(width, gun.aim.color, 0.85)
    beamLine(g, muzzleX, muzzleY, ex, ey)
    g.lineStyle(Math.max(1, width * 0.4), 0xffffff, 0.9)
    beamLine(g, muzzleX, muzzleY, ex, ey)
  } else {
    // Dashed tracer guide.
    const segs = 9
    for (let i = 0; i < segs; i += 1) {
      if (i % 2 === 1) {
        continue
      }
      const t0 = i / segs
      const t1 = (i + 1) / segs
      g.lineStyle(width, gun.aim.color, 0.8)
      beamLine(
        g,
        muzzleX + ux * len * t0,
        muzzleY + uy * len * t0,
        muzzleX + ux * len * t1,
        muzzleY + uy * len * t1,
      )
    }
  }

  // Targeting reticle at the end.
  g.fillStyle(gun.aim.color, 0.3)
  g.fillCircle(ex, ey, width * 2.2 + pulse * 2)
  g.fillStyle(0xffffff, 0.95)
  g.fillCircle(ex, ey, Math.max(2, width * 0.9))
}

function beamLine(
  g: Phaser.GameObjects.Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): void {
  g.beginPath()
  g.moveTo(x1, y1)
  g.lineTo(x2, y2)
  g.strokePath()
}

/** Draw an oriented rectangle (quad) along the gun axis. */
function quad(
  g: Phaser.GameObjects.Graphics,
  ox: number,
  oy: number,
  ux: number,
  uy: number,
  nx: number,
  ny: number,
  along0: number,
  along1: number,
  halfPerp: number,
  perpOffset: number,
  color: number,
): void {
  const cx = (a: number, p: number): number => ox + ux * a + nx * p
  const cy = (a: number, p: number): number => oy + uy * a + ny * p
  const x1 = cx(along0, perpOffset - halfPerp)
  const y1 = cy(along0, perpOffset - halfPerp)
  const x2 = cx(along1, perpOffset - halfPerp)
  const y2 = cy(along1, perpOffset - halfPerp)
  const x3 = cx(along1, perpOffset + halfPerp)
  const y3 = cy(along1, perpOffset + halfPerp)
  const x4 = cx(along0, perpOffset + halfPerp)
  const y4 = cy(along0, perpOffset + halfPerp)
  g.fillStyle(color, 1)
  g.beginPath()
  g.moveTo(x1, y1)
  g.lineTo(x2, y2)
  g.lineTo(x3, y3)
  g.lineTo(x4, y4)
  g.closePath()
  g.fillPath()
}

function shade(color: number, amount: number): number {
  const r = (color >> 16) & 0xff
  const gg = (color >> 8) & 0xff
  const b = color & 0xff
  const f = (v: number): number => {
    if (amount >= 0) {
      return Math.round(v + (255 - v) * amount)
    }
    return Math.round(v * (1 + amount))
  }
  return (f(r) << 16) | (f(gg) << 8) | f(b)
}
