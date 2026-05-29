import Phaser from 'phaser'
import { GAME } from '../config.ts'
import { getServices, type Services } from '../services.ts'
import {
  aimAngle,
  aimSweepHalfRad,
  resolveShot,
} from '../systems/AimSystem.ts'
import { EncounterSystem } from '../systems/EncounterSystem.ts'
import { InputSystem } from '../systems/InputSystem.ts'
import { ResizeSystem } from '../systems/ResizeSystem.ts'
import {
  drawHpBar,
  drawSideCharacter,
  facingToward,
  footYOnStep,
  getCharacterMetrics,
  getMuzzlePosition,
} from '../render/CharacterArt.ts'
import { drawAimBeam } from '../render/WeaponArt.ts'
import { drawStairStep } from '../render/StairArt.ts'
import { getGun, type GunDef } from '../data/guns.ts'
import type { EnemyKind } from '../types.ts'
import {
  appendSteps,
  getStep,
  positionAtProgress,
} from '../systems/StairPath.ts'
import type {
  Bullet,
  Enemy,
  Particle,
  RunState,
  StairStep,
  Viewport,
} from '../types.ts'
import { vibrate } from '../utils/haptics.ts'
import { patchSave } from '../utils/storage.ts'
import { SCENE_KEYS } from './BootScene.ts'

const MAX_PARTICLES = 100

export class GameScene extends Phaser.Scene {
  private services!: Services
  private viewport!: Viewport
  private gfx!: Phaser.GameObjects.Graphics

  private resizeSystem!: ResizeSystem
  private inputSystem!: InputSystem
  private encounters!: EncounterSystem

  private readonly steps: StairStep[] = []
  private activeEnemy: Enemy | null = null
  private readonly bullets: Bullet[] = []
  private readonly particles: Particle[] = []

  private state!: RunState
  private cameraY = 0
  private nextBulletId = 1
  private baseY = 0
  private muzzleFlash = 0
  private currentAimAngle = -Math.PI / 2
  private enemyBullet: { x: number; y: number; vx: number; vy: number; lifeMs: number } | null =
    null

  private readonly fixedDeltaMs = 1000 / GAME.fixedFps
  private readonly fixedDeltaSec = 1 / GAME.fixedFps
  private accumulator = 0

  constructor() {
    super(SCENE_KEYS.game)
  }

  create(): void {
    this.services = getServices(this)
    this.cameras.main.setBackgroundColor(GAME.backgroundColor)
    this.gfx = this.add.graphics()

    this.resizeSystem = new ResizeSystem(this.scale, (vp) => {
      this.viewport = vp
      if (this.state?.phase === 'playing') {
        this.ensureSteps()
      } else {
        this.rebuildPath()
      }
    })
    this.viewport = this.resizeSystem.current()
    this.inputSystem = new InputSystem(this, () => this.onTap())
    this.encounters = new EncounterSystem(this.services.rng)

    this.rebuildPath()
    this.state = this.freshState()

    this.services.emitter.on('restart', this.startRun, this)
    this.services.emitter.on('equipGun', this.onEquipGun, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this)
  }

  private freshState(): RunState {
    return {
      phase: 'ready',
      score: 0,
      kills: 0,
      level: 1,
      coinsEarned: 0,
      combo: 0,
      comboTimerMs: 0,
      comboMultiplier: 1,
      stepProgress: 0,
      encounter: 'duel',
      aimPhase: 0,
      aimSpeed: GAME.aim.baseCyclesPerSec * Math.PI * 2,
      climbTarget: 0,
      fireCooldownMs: 0,
      inputLockMs: 0,
      shotsFired: 0,
      enemyShotMs: 0,
      facingFlip: false,
    }
  }

  private rebuildPath(): void {
    const { width, height, stepStride, stepHeight } = this.viewport
    this.baseY = height * 0.78
    this.steps.length = 0
    appendSteps(this.steps, 0, GAME.player.bufferSteps + 8, width / 2, this.baseY, stepStride, stepHeight)
  }

  private startRun(): void {
    this.state = this.freshState()
    this.state.phase = 'playing'
    this.state.inputLockMs = GAME.input.lockAfterStartMs
    this.activeEnemy = null
    this.bullets.length = 0
    this.particles.length = 0
    this.enemyBullet = null
    this.encounters.reset()
    this.rebuildPath()
    this.cameraY = 0
    this.accumulator = 0
    this.updateAimSpeed()

    this.spawnNextEnemy()
    this.services.emitter.emit('start')
    this.emitStats()
  }

  private onEquipGun(payload: { gunId: string }): void {
    this.services.guns.equip(payload.gunId)
  }

  private onTap(): void {
    this.services.sound.unlock()
    if (this.state.phase !== 'playing' || this.state.inputLockMs > 0) {
      return
    }
    if (this.state.enemyShotMs > 0) {
      return
    }
    if (this.state.encounter !== 'duel' || this.state.fireCooldownMs > 0) {
      return
    }
    const enemy = this.activeEnemy
    if (enemy === null || enemy.dead) {
      return
    }
    this.fire(enemy)
  }

  private fire(enemy: Enemy): void {
    const gun = this.services.guns.current()
    const player = this.playerAnchor()
    const ea = this.enemyAnchor(enemy)
    const sweep = aimSweepHalfRad(this.state.stepProgress, enemy.stepIndex)
    const result = resolveShot(
      player.x,
      player.y,
      ea.x,
      ea.y,
      this.state.aimPhase,
      sweep,
      enemy,
      gun,
      this.viewport,
      () => this.services.rng.next(),
    )

    this.currentAimAngle = result.angle
    this.state.fireCooldownMs = gun.fireRateMs
    this.state.shotsFired += 1
    this.muzzleFlash = 1
    this.services.sound.shoot()
    vibrate(GAME.haptics.shootMs)
    this.services.emitter.emit('shoot')

    const facing = facingToward(player.footX, ea.footX)
    const muzzle = getMuzzlePosition(
      player.footX,
      player.footY,
      facing,
      result.angle,
      getCharacterMetrics(this.viewport),
      gun,
    )
    const muzzleX = muzzle.x
    const muzzleY = muzzle.y
    this.bullets.push({
      id: this.nextBulletId++,
      x: muzzleX,
      y: muzzleY,
      vx: Math.cos(result.angle) * gun.bulletSpeed,
      vy: Math.sin(result.angle) * gun.bulletSpeed,
      damage: gun.damage,
      pierceLeft: 0,
      color: gun.color,
      lifeMs: 600,
      hitIds: [enemy.id],
    })

    if (!result.hit) {
      this.onMiss(enemy)
      return
    }

    const dmg = result.headshot ? gun.damage * 2 : gun.damage
    enemy.hp -= dmg
    this.spawnParticles(enemy.x, enemy.y, result.headshot ? 16 : 8, result.headshot ? 0x00f5d4 : 0xffaa00)

    if (enemy.hp <= 0) {
      enemy.dead = true
      this.onKill(enemy, result.headshot)
    }
  }

  private onMiss(enemy: Enemy): void {
    this.state.inputLockMs = GAME.encounter.missDeathDelayMs + 200
    this.state.enemyShotMs = GAME.encounter.missDeathDelayMs
    const player = this.playerAnchor()
    const ea = this.enemyAnchor(enemy)
    const angle = Math.atan2(player.y - ea.y, player.x - ea.x)
    this.enemyBullet = {
      x: ea.footX,
      y: ea.y,
      vx: Math.cos(angle) * 1100,
      vy: Math.sin(angle) * 1100,
      lifeMs: GAME.encounter.missDeathDelayMs,
    }
    this.services.sound.shoot()
    vibrate(GAME.haptics.deathMs * 0.4)
  }

  private spawnNextEnemy(): void {
    this.ensureSteps()
    const enemy = this.encounters.spawn(
      this.steps,
      this.state.stepProgress,
      this.state.level,
      this.state.kills,
    )
    if (enemy !== null) {
      this.activeEnemy = enemy
      this.state.encounter = 'duel'
      this.updateAimSpeed()
    }
  }

  private updateAimSpeed(): void {
    const level = this.state.level
    const t = Math.min(1, level / GAME.difficulty.rampLevels)
    const cycles =
      GAME.aim.baseCyclesPerSec +
      (GAME.aim.maxCyclesPerSec - GAME.aim.baseCyclesPerSec) * t
    const mul = this.activeEnemy?.aimSpeedMul ?? 1
    this.state.aimSpeed = cycles * Math.PI * 2 * mul
  }

  override update(_time: number, delta: number): void {
    if (this.state.phase === 'playing') {
      if (this.state.inputLockMs > 0) {
        this.state.inputLockMs = Math.max(0, this.state.inputLockMs - delta)
      }
      if (this.state.fireCooldownMs > 0) {
        this.state.fireCooldownMs = Math.max(0, this.state.fireCooldownMs - delta)
      }
      if (this.state.comboTimerMs > 0) {
        this.state.comboTimerMs = Math.max(0, this.state.comboTimerMs - delta)
        if (this.state.comboTimerMs === 0) {
          this.state.combo = 0
          this.state.comboMultiplier = 1
        }
      }
      if (this.state.enemyShotMs > 0) {
        this.state.enemyShotMs = Math.max(0, this.state.enemyShotMs - delta)
        if (this.state.enemyShotMs === 0) {
          this.die()
        }
      }

      this.accumulator += delta
      let steps = 0
      while (this.accumulator >= this.fixedDeltaMs && steps < GAME.maxStepsPerFrame) {
        this.step(this.fixedDeltaSec)
        this.accumulator -= this.fixedDeltaMs
        steps += 1
        if (this.state.phase !== 'playing') {
          break
        }
      }
    }

    this.updateCamera(delta)
    this.updateBullets(delta)
    this.updateEnemyBullet(delta)
    this.updateParticles(delta)
    this.muzzleFlash = Math.max(0, this.muzzleFlash - delta * 0.008)
    this.render()
  }

  private step(dt: number): void {
    if (this.state.enemyShotMs > 0) {
      return
    }

    if (this.state.encounter === 'climb') {
      const rate = GAME.player.climbStepsPerSec
      this.state.stepProgress += rate * dt
      if (this.state.stepProgress >= this.state.climbTarget) {
        this.state.stepProgress = this.state.climbTarget
        this.state.encounter = 'duel'
        this.state.facingFlip = !this.state.facingFlip
        this.spawnNextEnemy()
        this.updateAimSpeed()
      }
      this.ensureSteps()
      return
    }

    const enemy = this.activeEnemy
    if (enemy !== null && !enemy.dead) {
      this.state.aimPhase += this.state.aimSpeed * dt
      const player = this.playerAnchor()
      const ea = this.enemyAnchor(enemy)
      const sweep = aimSweepHalfRad(this.state.stepProgress, enemy.stepIndex)
      this.currentAimAngle = aimAngle(
        player.x,
        player.y,
        ea.x,
        ea.y,
        this.state.aimPhase,
        sweep,
      )
    }

    this.ensureSteps()
  }

  private onKill(enemy: Enemy, headshot: boolean): void {
    this.state.kills += 1
    this.state.combo += 1
    this.state.comboTimerMs = GAME.combo.windowMs
    this.state.comboMultiplier = Math.min(
      GAME.combo.maxMultiplier,
      1 + Math.floor(this.state.combo / 3),
    )

    const bonus = EncounterSystem.coinBonus(enemy.kind)
    const headBonus = headshot ? GAME.economy.headshotBonus : 0
    const coins =
      (GAME.economy.coinPerKill + bonus + headBonus) * this.state.comboMultiplier
    this.state.coinsEarned += coins
    this.state.score += (headshot ? 200 : 100) * this.state.comboMultiplier
    this.state.level = Math.floor(this.state.kills / GAME.difficulty.killsPerLevel) + 1

    this.services.sound.kill()
    if (headshot) {
      this.services.sound.reward()
    }
    vibrate(GAME.haptics.killMs)
    this.spawnParticles(enemy.x, enemy.y, 14, EncounterSystem.kindColor(enemy.kind))
    this.cameras.main.shake(50, 0.003)

    if (enemy.isBoss) {
      this.cameras.main.shake(120, 0.008)
      this.services.sound.reward()
    }

    this.services.emitter.emit('kill', {
      kills: this.state.kills,
      coins: this.state.coinsEarned,
      combo: this.state.combo,
      headshot,
    })
    this.emitStats()

    this.activeEnemy = null
    this.state.climbTarget = enemy.stepIndex
    this.state.encounter = 'climb'
    this.state.inputLockMs = 80
  }

  private die(): void {
    if (this.state.phase !== 'playing') {
      return
    }
    this.state.phase = 'gameover'
    this.services.sound.gameOver()
    vibrate(GAME.haptics.deathMs)
    this.cameras.main.shake(280, 0.015)

    const totalCoins = this.services.save.coins + this.state.coinsEarned
    const best = Math.max(this.services.save.best, this.state.score)
    this.services.save = patchSave({
      coins: totalCoins,
      best,
      totalKills: this.services.save.totalKills + this.state.kills,
    })

    this.services.emitter.emit('gameover', {
      score: this.state.score,
      kills: this.state.kills,
      coinsEarned: this.state.coinsEarned,
      best,
    })
  }

  private ensureSteps(): void {
    const need = Math.floor(this.state.stepProgress) + GAME.player.bufferSteps + 12
    if (this.steps.length < need) {
      const last = this.steps[this.steps.length - 1]
      if (last !== undefined) {
        appendSteps(
          this.steps,
          this.steps.length,
          need - this.steps.length + 4,
          this.viewport.width / 2,
          this.baseY,
          this.viewport.stepStride,
          this.viewport.stepHeight,
        )
      }
    }
  }

  private updateBullets(delta: number): void {
    const dt = delta / 1000
    let w = 0
    for (let r = 0; r < this.bullets.length; r += 1) {
      const b = this.bullets[r]
      if (b === undefined) {
        continue
      }
      b.lifeMs -= delta
      if (b.lifeMs <= 0) {
        continue
      }
      b.x += b.vx * dt
      b.y += b.vy * dt
      this.bullets[w] = b
      w += 1
    }
    this.bullets.length = w
  }

  private updateEnemyBullet(delta: number): void {
    if (this.enemyBullet === null) {
      return
    }
    const dt = delta / 1000
    this.enemyBullet.lifeMs -= delta
    this.enemyBullet.x += this.enemyBullet.vx * dt
    this.enemyBullet.y += this.enemyBullet.vy * dt
    if (this.enemyBullet.lifeMs <= 0) {
      this.enemyBullet = null
    }
  }

  private emitStats(): void {
    this.services.emitter.emit('stats', {
      score: this.state.score,
      kills: this.state.kills,
      level: this.state.level,
      coins: this.state.coinsEarned,
      combo: this.state.combo,
      multiplier: this.state.comboMultiplier,
    })
  }

  private updateCamera(delta: number): void {
    const player = positionAtProgress(this.steps, this.state.stepProgress)
    const targetScreenY = this.viewport.height * GAME.camera.playerScreenYRatio
    const targetCam = player.y - targetScreenY
    const k = 1 - Math.pow(1 - GAME.camera.followLerp, delta / 16)
    this.cameraY += (targetCam - this.cameraY) * k
  }

  private spawnParticles(x: number, y: number, count: number, color: number): void {
    for (let i = 0; i < count; i += 1) {
      if (this.particles.length >= MAX_PARTICLES) {
        break
      }
      const a = this.services.rng.next() * Math.PI * 2
      const speed = 60 + this.services.rng.next() * 180
      const life = 250 + this.services.rng.next() * 300
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life,
        maxLife: life,
        radius: 2 + this.services.rng.next() * 4,
        color,
      })
    }
  }

  private updateParticles(deltaMs: number): void {
    const dt = deltaMs / 1000
    let w = 0
    for (let r = 0; r < this.particles.length; r += 1) {
      const p = this.particles[r]
      if (p === undefined) {
        continue
      }
      p.life -= deltaMs
      if (p.life <= 0) {
        continue
      }
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 220 * dt
      this.particles[w] = p
      w += 1
    }
    this.particles.length = w
  }

  private render(): void {
    const g = this.gfx
    g.clear()
    const cam = this.cameraY
    const { width, height } = this.viewport

    g.fillStyle(0x141a32, 1)
    g.fillRect(0, 0, width, height)
    g.fillStyle(0x0c1020, 0.5)
    g.fillRect(0, height * 0.5, width, height * 0.5)

    const minStep = Math.max(0, Math.floor(this.state.stepProgress) - 2)
    const maxStep = Math.floor(this.state.stepProgress) + 22

    for (const step of this.steps) {
      if (step.index < minStep || step.index > maxStep) {
        continue
      }
      this.drawStep(g, step, cam)
    }

    const enemy = this.activeEnemy
    if (enemy !== null && !enemy.dead && enemy.stepIndex >= minStep - 1 && enemy.stepIndex <= maxStep + 2) {
      this.drawEnemy(g, enemy, cam)
    }

    for (const b of this.bullets) {
      if (b.lifeMs <= 0) {
        continue
      }
      g.lineStyle(GAME.bullet.width, b.color, 0.9)
      g.beginPath()
      g.moveTo(b.x, b.y - cam)
      g.lineTo(b.x - b.vx * 0.04, b.y - b.vy * 0.04 - cam)
      g.strokePath()
    }

    if (this.enemyBullet !== null) {
      const eb = this.enemyBullet
      g.lineStyle(5, 0xff0033, 0.95)
      g.beginPath()
      g.moveTo(eb.x, eb.y - cam)
      g.lineTo(eb.x - eb.vx * 0.03, eb.y - eb.vy * 0.03 - cam)
      g.strokePath()
    }

    const player = this.playerAnchor()
    const screenFootY = player.footY - cam
    this.drawAimLine(g, player, cam)
    this.drawPlayer(g, player.footX, screenFootY, cam)

    for (const p of this.particles) {
      const a = Math.max(0, p.life / p.maxLife)
      g.fillStyle(p.color, a)
      g.fillCircle(p.x, p.y - cam, p.radius)
    }
  }

  private playerAnchor(): { footX: number; footY: number; x: number; y: number } {
    const pos = positionAtProgress(this.steps, this.state.stepProgress)
    const footY = footYOnStep(pos.y, this.viewport.treadDepth)
    const m = getCharacterMetrics(this.viewport)
    const chestY = footY - m.height * 0.55
    return { footX: pos.x, footY, x: pos.x, y: chestY }
  }

  private enemyAnchor(enemy: Enemy): { footX: number; footY: number; x: number; y: number } {
    const step = getStep(this.steps, enemy.stepIndex)
    const wx = step?.x ?? enemy.x
    const wy = step?.y ?? enemy.y
    const scaleMul = enemy.isBoss ? 1.35 : 1
    const footY = footYOnStep(wy, this.viewport.treadDepth)
    const m = getCharacterMetrics(this.viewport, scaleMul)
    return { footX: wx, footY, x: wx, y: footY - m.height * 0.55 }
  }

  private drawAimLine(
    g: Phaser.GameObjects.Graphics,
    player: { footX: number; footY: number },
    cam: number,
  ): void {
    if (this.state.phase !== 'playing' || this.state.encounter !== 'duel') {
      return
    }
    const enemy = this.activeEnemy
    if (enemy === null || this.state.enemyShotMs > 0) {
      return
    }

    const ea = this.enemyAnchor(enemy)
    const facing = facingToward(player.footX, ea.footX)
    const metrics = getCharacterMetrics(this.viewport)
    const gun = this.services.guns.current()
    const muzzle = getMuzzlePosition(
      player.footX,
      player.footY - cam,
      facing,
      this.currentAimAngle,
      metrics,
      gun,
    )

    const minEdge = Math.min(this.viewport.width, this.viewport.height)
    const pulse = 0.5 + 0.5 * Math.sin(this.state.aimPhase * 2)
    drawAimBeam(g, muzzle.x, muzzle.y, this.currentAimAngle, gun, minEdge, pulse)
  }

  private drawStep(g: Phaser.GameObjects.Graphics, step: StairStep, cam: number): void {
    drawStairStep(g, step, step.x, step.y - cam, this.viewport.stepWidth, this.viewport.treadDepth)
  }

  private drawEnemy(g: Phaser.GameObjects.Graphics, e: Enemy, cam: number): void {
    const ea = this.enemyAnchor(e)
    const scaleMul = e.isBoss ? 1.35 : 1
    const metrics = getCharacterMetrics(this.viewport, scaleMul)
    const footY = ea.footY - cam
    const player = this.playerAnchor()
    const facing = facingToward(ea.footX, player.footX)
    const toPlayer = Math.atan2(player.y - ea.y, player.x - ea.x)

    drawSideCharacter(g, ea.footX, footY, facing, e.kind, e.isBoss, metrics, {
      gunAngle: toPlayer,
      gun: enemyGun(e.kind, e.isBoss),
      bob: Math.sin(this.state.aimPhase * 1.3 + e.id) * 0.5,
    })

    drawHpBar(g, ea.footX, footY - metrics.height, metrics.width, e.hp, e.maxHp)
  }

  private drawPlayer(g: Phaser.GameObjects.Graphics, footX: number, footY: number, _cam: number): void {
    const metrics = getCharacterMetrics(this.viewport)
    const enemy = this.activeEnemy
    const facing: 1 | -1 =
      enemy !== null
        ? facingToward(footX, this.enemyAnchor(enemy).footX)
        : this.state.facingFlip
          ? -1
          : 1

    drawSideCharacter(g, footX, footY, facing, 'hero', false, metrics, {
      gunAngle: this.currentAimAngle,
      gun: this.services.guns.current(),
      muzzleFlash: this.muzzleFlash,
      bob: Math.sin(this.state.aimPhase) * 0.35,
    })
  }

  private shutdown(): void {
    this.services.emitter.off('restart', this.startRun, this)
    this.services.emitter.off('equipGun', this.onEquipGun, this)
    this.resizeSystem.destroy()
    this.inputSystem.destroy()
  }
}

/** Weapon each enemy archetype visually wields. */
function enemyGun(kind: EnemyKind, isBoss: boolean): GunDef {
  if (isBoss) {
    return getGun('cannon')
  }
  switch (kind) {
    case 'runner':
      return getGun('smg')
    case 'armored':
      return getGun('shotgun')
    case 'elite':
      return getGun('rifle')
    case 'grunt':
    default:
      return getGun('pistol')
  }
}
