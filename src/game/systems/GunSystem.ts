import { getGun, type GunDef } from '../data/guns.ts'
import type { SaveData } from '../utils/storage.ts'

export class GunSystem {
  private equippedId: string

  constructor(save: SaveData) {
    this.equippedId = save.equippedGunId
  }

  equip(id: string): void {
    this.equippedId = id
  }

  current(): GunDef {
    return getGun(this.equippedId)
  }

  id(): string {
    return this.equippedId
  }
}
