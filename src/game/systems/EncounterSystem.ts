import { GAME } from '../config.ts'
import type { Enemy, EnemyKind, StairStep } from '../types.ts'
import type { Rng } from '../utils/rng.ts'

const KIND_STATS: Record<
  EnemyKind,
  { hp: number; aimSpeedMul: number; color: number; coinBonus: number }
> = {
  grunt: { hp: 1, aimSpeedMul: 1, color: 0xff6b6b, coinBonus: 0 },
  armored: { hp: 2, aimSpeedMul: 0.95, color: 0xff9500, coinBonus: 4 },
  runner: { hp: 1, aimSpeedMul: 1.35, color: 0xf72585, coinBonus: 3 },
  elite: { hp: 3, aimSpeedMul: 1.1, color: 0xffd166, coinBonus: 10 },
}

export class EncounterSystem {
  private readonly rng: Rng
  private nextId = 1

  constructor(rng: Rng) {
    this.rng = rng
  }

  reset(): void {
    this.nextId = 1
  }

  isBossWave(kills: number): boolean {
    if (kills === 0) {
      return false
    }
    return kills % GAME.encounter.bossEveryKills === 0
  }

  /** Steps between player and the next enemy along the zigzag. */
  stepsAhead(level: number): number {
    const min = GAME.encounter.minStepsAhead
    const max = GAME.encounter.maxStepsAhead
    const span = max - min
    const t = Math.min(1, level / 40)
    const hi = min + Math.floor(span * (0.35 + t * 0.65))
    return min + Math.floor(this.rng.next() * (hi - min + 1))
  }

  spawn(
    steps: readonly StairStep[],
    playerStep: number,
    level: number,
    kills: number,
  ): Enemy | null {
    const ahead = this.stepsAhead(level)
    const stepIndex = Math.floor(playerStep) + ahead
    const step = steps.find((s) => s.index === stepIndex)
    if (step === undefined) {
      return null
    }

    const boss = this.isBossWave(kills)
    const kind = boss ? 'elite' : this.pickKind(level)
    const stats = KIND_STATS[kind]
    const hp = boss
      ? GAME.encounter.bossHpBase + Math.floor(level / 8)
      : stats.hp

    return {
      id: this.nextId++,
      stepIndex,
      kind: boss ? 'elite' : kind,
      hp,
      maxHp: hp,
      x: step.x,
        y: step.y,
      timerMs: 0,
      maxTimerMs: 0,
      dead: false,
      isBoss: boss,
      aimSpeedMul: stats.aimSpeedMul,
    }
  }

  private pickKind(level: number): EnemyKind {
    if (level >= 40 && this.rng.chance(0.12)) {
      return 'elite'
    }
    if (level >= 20 && this.rng.chance(0.2)) {
      return 'armored'
    }
    if (level >= 8 && this.rng.chance(0.22)) {
      return 'runner'
    }
    return 'grunt'
  }

  static kindColor(kind: EnemyKind): number {
    return KIND_STATS[kind].color
  }

  static coinBonus(kind: EnemyKind): number {
    return KIND_STATS[kind].coinBonus
  }
}
