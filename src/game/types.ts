export interface Vec2 {
  x: number
  y: number
}

export interface Viewport {
  width: number
  height: number
  stepWidth: number
  /** Horizontal shift per step along the zigzag (independent of block width). */
  stepStride: number
  stepHeight: number
  treadDepth: number
}

export type RunPhase = 'ready' | 'playing' | 'gameover' | 'shop'

export type EnemyKind = 'grunt' | 'armored' | 'runner' | 'elite'

export interface StairStep {
  index: number
  x: number
  y: number
  side: 'left' | 'right' | 'center'
}

export interface Enemy {
  id: number
  stepIndex: number
  kind: EnemyKind
  hp: number
  maxHp: number
  x: number
  y: number
  timerMs: number
  maxTimerMs: number
  dead: boolean
  isBoss: boolean
  /** Faster oscillating aim when fighting runners, etc. */
  aimSpeedMul: number
}

export type EncounterPhase = 'duel' | 'climb'

export interface Bullet {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  damage: number
  pierceLeft: number
  color: number
  lifeMs: number
  hitIds: number[]
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  radius: number
  color: number
}

export interface RunState {
  phase: RunPhase
  score: number
  kills: number
  level: number
  coinsEarned: number
  combo: number
  comboTimerMs: number
  comboMultiplier: number
  /** Fractional step index along the stair path. */
  stepProgress: number
  encounter: EncounterPhase
  /** Sine phase for oscillating aim (radians, unbounded). */
  aimPhase: number
  aimSpeed: number
  /** After a kill, run up to the enemy step. */
  climbTarget: number
  fireCooldownMs: number
  inputLockMs: number
  shotsFired: number
  /** Miss → enemy fires, then you die. */
  enemyShotMs: number
  facingFlip: boolean
}

export interface GameEvents {
  start: void
  shoot: void
  kill: { kills: number; coins: number; combo: number; headshot: boolean }
  stats: {
    score: number
    kills: number
    level: number
    coins: number
    combo: number
    multiplier: number
  }
  gameover: { score: number; kills: number; coinsEarned: number; best: number }
  restart: void
  openShop: void
  closeShop: void
  buyGun: { gunId: string; success: boolean }
  equipGun: { gunId: string }
  soundToggle: { soundOn: boolean }
}
