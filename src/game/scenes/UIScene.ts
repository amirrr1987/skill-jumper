import Phaser from 'phaser'
import { GUNS } from '../data/guns.ts'
import { getServices, type Services } from '../services.ts'
import { patchSave } from '../utils/storage.ts'
import { SCENE_KEYS } from './BootScene.ts'

const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif'
const CYAN = '#00f5d4'
const GOLD = '#ffd166'
const WHITE = '#f4f7ff'
const MUTED = '#6b7394'
const PINK = '#ff3366'

export class UIScene extends Phaser.Scene {
  private services!: Services

  private scoreText!: Phaser.GameObjects.Text
  private levelText!: Phaser.GameObjects.Text
  private coinText!: Phaser.GameObjects.Text
  private comboText!: Phaser.GameObjects.Text
  private gunText!: Phaser.GameObjects.Text

  private overlayBg!: Phaser.GameObjects.Rectangle
  private titleText!: Phaser.GameObjects.Text
  private subtitleText!: Phaser.GameObjects.Text
  private statsText!: Phaser.GameObjects.Text
  private shopBtn!: Phaser.GameObjects.Text
  private startBtnBg!: Phaser.GameObjects.Rectangle
  private startBtn!: Phaser.GameObjects.Text

  private shopPanel!: Phaser.GameObjects.Rectangle
  private shopTitle!: Phaser.GameObjects.Text
  private shopClose!: Phaser.GameObjects.Text
  private shopItems: Phaser.GameObjects.Text[] = []


  constructor() {
    super({ key: SCENE_KEYS.ui, active: false })
  }

  create(): void {
    this.services = getServices(this)

    this.scoreText = this.add
      .text(0, 0, '0', { fontFamily: FONT, color: WHITE, fontStyle: 'bold' })
      .setDepth(20)
      .setVisible(false)
    this.levelText = this.add
      .text(0, 0, 'LV 1', { fontFamily: FONT, color: CYAN })
      .setDepth(20)
      .setVisible(false)
    this.coinText = this.add
      .text(0, 0, '0', { fontFamily: FONT, color: GOLD })
      .setDepth(20)
      .setVisible(false)
    this.comboText = this.add
      .text(0, 0, '', { fontFamily: FONT, color: PINK, fontStyle: 'bold' })
      .setDepth(20)
      .setAlpha(0)
    this.gunText = this.add
      .text(0, 0, '', { fontFamily: FONT, color: MUTED })
      .setDepth(20)
      .setVisible(false)

    this.overlayBg = this.add
      .rectangle(0, 0, 100, 100, 0x050810, 0.78)
      .setDepth(10)
      .setOrigin(0, 0)
      .setInteractive()

    this.titleText = this.add
      .text(0, 0, 'STAIR GUN', { fontFamily: FONT, color: CYAN, fontStyle: 'bold', align: 'center' })
      .setOrigin(0.5)
      .setDepth(11)
    this.subtitleText = this.add
      .text(0, 0, '', { fontFamily: FONT, color: WHITE, align: 'center' })
      .setOrigin(0.5)
      .setDepth(11)
    this.statsText = this.add
      .text(0, 0, '', { fontFamily: FONT, color: MUTED, align: 'center' })
      .setOrigin(0.5)
      .setDepth(11)

    this.shopBtn = this.add
      .text(0, 0, '🛒 ARMORY', { fontFamily: FONT, color: GOLD, fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(12)
      .setInteractive({ useHandCursor: true })
    this.shopBtn.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation()
      this.openShopPanel()
    })

    this.startBtnBg = this.add
      .rectangle(0, 0, 200, 56, 0x00f5d4, 1)
      .setDepth(12)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    this.startBtnBg.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation()
      this.startGame()
    })
    this.startBtnBg.on(Phaser.Input.Events.POINTER_OVER, () => {
      this.startBtnBg.setFillStyle(0x33f7dd)
    })
    this.startBtnBg.on(Phaser.Input.Events.POINTER_OUT, () => {
      this.startBtnBg.setFillStyle(0x00f5d4)
    })

    this.startBtn = this.add
      .text(0, 0, 'START', { fontFamily: FONT, color: '#0c1020', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(13)
      .setInteractive({ useHandCursor: true })
    this.startBtn.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation()
      this.startGame()
    })

    this.shopPanel = this.add
      .rectangle(0, 0, 100, 100, 0x0a0e1c, 0.96)
      .setDepth(30)
      .setOrigin(0, 0)
      .setVisible(false)
      .setInteractive()

    this.shopTitle = this.add
      .text(0, 0, 'ARMORY', { fontFamily: FONT, color: CYAN, fontStyle: 'bold' })
      .setDepth(31)
      .setVisible(false)

    this.shopClose = this.add
      .text(0, 0, '✕', { fontFamily: FONT, color: MUTED, fontStyle: 'bold' })
      .setDepth(31)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
    this.shopClose.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      p.event.stopPropagation()
      this.closeShopPanel()
    })

    this.buildShopItems()
    this.showMenu()

    const e = this.services.emitter
    e.on('start', this.onRunStart, this)
    e.on('stats', this.onStats, this)
    e.on('gameover', this.onGameOver, this)

    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this)
    this.layout()

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this)
  }

  private buildShopItems(): void {
    for (const t of this.shopItems) {
      t.destroy()
    }
    this.shopItems = []

    for (const gun of GUNS) {
      const row = this.add
        .text(0, 0, '', { fontFamily: FONT, color: WHITE, fontSize: '14px' })
        .setDepth(31)
        .setVisible(false)
        .setInteractive({ useHandCursor: true })
      row.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
        p.event.stopPropagation()
        this.onGunRowTap(gun.id, gun.price)
      })
      this.shopItems.push(row)
    }
  }

  private onGunRowTap(gunId: string, price: number): void {
    this.services.sound.unlock()
    const save = this.services.save
    const unlocked = save.unlockedGuns.includes(gunId)

    if (unlocked) {
      this.services.guns.equip(gunId)
      this.services.save = patchSave({ equippedGunId: gunId })
      this.services.emitter.emit('equipGun', { gunId })
      this.services.sound.buy()
      this.refreshShopRows()
      this.refreshGunLabel()
      this.services.emitter.emit('buyGun', { gunId, success: true })
      return
    }

    if (save.coins >= price) {
      const nextUnlocked = [...save.unlockedGuns, gunId]
      this.services.save = patchSave({
        coins: save.coins - price,
        unlockedGuns: nextUnlocked,
        equippedGunId: gunId,
      })
      this.services.guns.equip(gunId)
      this.services.emitter.emit('equipGun', { gunId })
      this.services.sound.buy()
      this.refreshShopRows()
      this.refreshCoinDisplay()
      this.refreshGunLabel()
      this.services.emitter.emit('buyGun', { gunId, success: true })
    } else {
      this.services.emitter.emit('buyGun', { gunId, success: false })
      this.cameras.main.shake(80, 0.004)
    }
  }

  private layout(): void {
    const w = this.scale.width
    const h = this.scale.height
    const min = Math.min(w, h)
    const pad = min * 0.04

    this.scoreText.setFontSize(min * 0.11).setPosition(w / 2, pad)
    this.levelText.setFontSize(min * 0.042).setPosition(pad, pad)
    this.coinText.setFontSize(min * 0.042).setPosition(w - pad, pad).setOrigin(1, 0)
    this.comboText.setFontSize(min * 0.055).setPosition(w / 2, pad + min * 0.12).setOrigin(0.5, 0)
    this.gunText.setFontSize(min * 0.035).setPosition(w / 2, h - pad).setOrigin(0.5, 1)

    this.overlayBg.setSize(w, h).setPosition(0, 0)
    this.titleText.setFontSize(min * 0.1).setPosition(w / 2, h * 0.28)
    this.subtitleText.setFontSize(min * 0.045).setPosition(w / 2, h * 0.4)
    this.statsText.setFontSize(min * 0.038).setPosition(w / 2, h * 0.52)
    const btnW = Math.min(w * 0.62, min * 0.72)
    const btnH = min * 0.11
    this.startBtnBg.setSize(btnW, btnH).setPosition(w / 2, h * 0.66)
    this.startBtn.setFontSize(min * 0.065).setPosition(w / 2, h * 0.66)
    this.shopBtn.setFontSize(min * 0.042).setPosition(w / 2, h * 0.66 + btnH * 0.75 + min * 0.04)

    this.shopPanel.setSize(w, h).setPosition(0, 0)
    this.shopTitle.setFontSize(min * 0.07).setPosition(w / 2, pad * 2)
    this.shopClose.setFontSize(min * 0.06).setPosition(w - pad, pad)

    const rowH = min * 0.075
    const startY = pad * 4 + min * 0.04
    for (let i = 0; i < this.shopItems.length; i += 1) {
      const row = this.shopItems[i]
      if (row !== undefined) {
        row.setPosition(w / 2, startY + i * rowH).setOrigin(0.5, 0)
        row.setFontSize(min * 0.034)
      }
    }

    this.refreshMenuStats()
    this.refreshShopRows()
    this.refreshGunLabel()
  }

  private showMenu(): void {
    this.overlayBg.setVisible(true).setInteractive()
    this.titleText.setVisible(true)
    this.subtitleText.setVisible(true).setText(
      this.services.save.seenInstructions
        ? 'Time your shot. Miss = dead.'
        : 'Aim sweeps up & down — tap when aligned\nMiss once and they shoot back\nHeadshots pay double • Boss every 5 kills',
    )
    this.statsText.setVisible(true)
    this.shopBtn.setVisible(true)
    this.startBtnBg.setVisible(true)
    this.startBtn.setVisible(true)
    this.shopPanel.setVisible(false)
    this.shopTitle.setVisible(false)
    this.shopClose.setVisible(false)
    for (const r of this.shopItems) {
      r.setVisible(false)
    }
    this.setHudVisible(false)
    this.refreshMenuStats()
  }

  private refreshMenuStats(): void {
    const s = this.services.save
    this.statsText.setText(
      `Best ${s.best}  •  Bank ${s.coins} 🪙  •  Kills ${s.totalKills}`,
    )
  }

  private startGame(): void {
    this.services.sound.unlock()
    if (!this.services.save.seenInstructions) {
      this.services.save = patchSave({ seenInstructions: true })
    }
    this.services.emitter.emit('restart')
  }

  private onRunStart(): void {
    this.overlayBg.setVisible(false).disableInteractive()
    this.titleText.setVisible(false)
    this.subtitleText.setVisible(false)
    this.statsText.setVisible(false)
    this.shopBtn.setVisible(false)
    this.startBtnBg.setVisible(false)
    this.startBtn.setVisible(false)
    this.closeShopPanel()
    this.setHudVisible(true)
    this.scoreText.setText('0')
    this.levelText.setText('LV 1')
    this.coinText.setText('0 🪙')
    this.comboText.setAlpha(0)
    this.refreshGunLabel()
  }

  private onStats(payload: {
    score: number
    kills: number
    level: number
    coins: number
    combo: number
    multiplier: number
  }): void {
    this.scoreText.setText(String(payload.score))
    this.levelText.setText(`LV ${payload.level}`)
    this.coinText.setText(`${payload.coins} 🪙`)
    if (payload.combo >= 2) {
      this.comboText.setText(`COMBO ×${payload.multiplier}`).setAlpha(1)
    } else {
      this.comboText.setAlpha(0)
    }
  }

  private onGameOver(payload: {
    score: number
    kills: number
    coinsEarned: number
    best: number
  }): void {
    this.setHudVisible(false)
    this.overlayBg.setVisible(true).setInteractive()
    this.titleText.setVisible(true).setText('WASTED')
    this.subtitleText.setVisible(true).setText(
      `Score ${payload.score}  •  Kills ${payload.kills}\n+${payload.coinsEarned} 🪙 this run`,
    )
    this.statsText.setVisible(true).setText(`Best ${payload.best}`)
    this.shopBtn.setVisible(true)
    this.startBtnBg.setVisible(true)
    this.startBtn.setVisible(true)
    this.services.save = patchSave({}) // refresh reference
    this.refreshMenuStats()
  }

  private setHudVisible(v: boolean): void {
    this.scoreText.setVisible(v)
    this.levelText.setVisible(v)
    this.coinText.setVisible(v)
    this.gunText.setVisible(v)
  }

  private refreshCoinDisplay(): void {
    this.coinText.setText(`${this.services.save.coins} 🪙`)
    this.refreshMenuStats()
  }

  private refreshGunLabel(): void {
    const gun = this.services.guns.current()
    this.gunText.setText(`🔫 ${gun.name}`)
  }

  private openShopPanel(): void {
    this.startBtnBg.setVisible(false)
    this.startBtn.setVisible(false)
    this.shopBtn.setVisible(false)
    this.shopPanel.setVisible(true)
    this.shopTitle.setVisible(true)
    this.shopClose.setVisible(true)
    for (const r of this.shopItems) {
      r.setVisible(true)
    }
    this.refreshShopRows()
    this.services.emitter.emit('openShop')
  }

  private closeShopPanel(): void {
    this.shopPanel.setVisible(false)
    this.shopTitle.setVisible(false)
    this.shopClose.setVisible(false)
    for (const r of this.shopItems) {
      r.setVisible(false)
    }
    if (this.overlayBg.visible) {
      this.startBtnBg.setVisible(true)
      this.startBtn.setVisible(true)
      this.shopBtn.setVisible(true)
    }
    this.services.emitter.emit('closeShop')
  }

  private refreshShopRows(): void {
    const save = this.services.save
    for (let i = 0; i < GUNS.length; i += 1) {
      const gun = GUNS[i]
      const row = this.shopItems[i]
      if (gun === undefined || row === undefined) {
        continue
      }
      const owned = save.unlockedGuns.includes(gun.id)
      const equipped = save.equippedGunId === gun.id
      const priceLabel = owned ? (equipped ? 'EQUIPPED ✓' : 'TAP TO EQUIP') : `${gun.price} 🪙`
      const afford = owned || save.coins >= gun.price
      row.setText(`${gun.name}  DMG:${gun.damage}  ${priceLabel}`)
      row.setColor(afford ? WHITE : MUTED)
    }
  }

  private shutdown(): void {
    const e = this.services.emitter
    e.off('start', this.onRunStart, this)
    e.off('stats', this.onStats, this)
    e.off('gameover', this.onGameOver, this)
    this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this)
  }
}
