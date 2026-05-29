import { GAME } from '../config.ts'
import type { GunDef } from '../data/guns.ts'
import { getCharacterMetrics } from '../render/CharacterArt.ts'
import type { Enemy, Viewport } from '../types.ts'

export function aimSweepHalfRad(playerStep: number, enemyStep: number): number {
  const dist = Math.max(1, enemyStep - playerStep)
  const t = Math.min(1, (dist - GAME.encounter.minStepsAhead) / (GAME.encounter.maxStepsAhead - GAME.encounter.minStepsAhead))
  return GAME.aim.sweepMinRad + (GAME.aim.sweepMaxRad - GAME.aim.sweepMinRad) * t
}

export function aimAngle(
  playerX: number,
  playerY: number,
  enemyX: number,
  enemyY: number,
  aimPhase: number,
  sweepHalf: number,
): number {
  const base = Math.atan2(enemyY - playerY, enemyX - playerX)
  return base + Math.sin(aimPhase) * sweepHalf
}

export interface AimHit {
  hit: boolean
  headshot: boolean
  angle: number
}

export function resolveShot(
  px: number,
  py: number,
  enemyX: number,
  enemyY: number,
  aimPhase: number,
  sweepHalf: number,
  enemy: Enemy,
  gun: GunDef,
  viewport: Viewport,
  rng: () => number,
): AimHit {
  const base = Math.atan2(enemyY - py, enemyX - px)
  const pellets = gun.id === 'shotgun' ? 5 : gun.id === 'dual' ? 2 : 1
  let hit = false
  let headshot = false
  let angle = base + Math.sin(aimPhase) * sweepHalf

  for (let i = 0; i < pellets; i += 1) {
    const spreadRad = ((gun.spread * (rng() - 0.5) * 2) * Math.PI) / 180
    const pelletAngle =
      base + Math.sin(aimPhase) * sweepHalf + spreadRad + (gun.id === 'dual' ? (i === 0 ? -0.05 : 0.05) : 0)
    if (i === 0) {
      angle = pelletAngle
    }
    const h = checkPellet(px, py, pelletAngle, enemyX, enemyY, enemy, gun, viewport)
    if (h.hit) {
      hit = true
      if (h.headshot) {
        headshot = true
      }
    }
  }

  return { hit, headshot, angle }
}

function checkPellet(
  px: number,
  py: number,
  angle: number,
  enemyX: number,
  enemyY: number,
  enemy: Enemy,
  gun: GunDef,
  viewport: Viewport,
): { hit: boolean; headshot: boolean } {
  const scaleMul = enemy.isBoss ? 1.35 : 1
  const m = getCharacterMetrics(viewport, scaleMul)
  const dist = Math.hypot(enemyX - px, enemyY - py)
  const bodyHalf = Math.atan2(m.width * 0.5, dist) * gun.aimWidth
  const headHalf = Math.atan2(m.width * 0.28, dist) * gun.aimWidth * 0.85

  const bodyAngle = Math.atan2(enemyY - py, enemyX - px)
  const headAngle = Math.atan2(enemyY - m.height * 0.23 - py, enemyX - px)

  const headshot = angularDist(angle, headAngle) <= headHalf
  const bodyHit = angularDist(angle, bodyAngle) <= bodyHalf
  return { hit: headshot || bodyHit, headshot }
}

function angularDist(a: number, b: number): number {
  let d = a - b
  while (d > Math.PI) {
    d -= Math.PI * 2
  }
  while (d < -Math.PI) {
    d += Math.PI * 2
  }
  return Math.abs(d)
}
