/**
 * Per-weapon aiming guide ("laser"). Length/width/color are authored at a
 * reference resolution (min screen edge ≈ 430px) and scaled at draw time, so
 * every gun keeps its own reach and beam personality on any device.
 */
export interface GunAimLine {
  /** Reach of the guide beam from the muzzle, in reference px. */
  length: number
  /** Beam thickness in reference px. */
  width: number
  color: number
  /** Solid glowing beam (energy weapons) vs. dashed tracer guide. */
  beam: boolean
  /** Optional fan half-angle (deg) for spread weapons like the shotgun. */
  coneDeg?: number
}

/** How the gun itself is drawn in the shooter's hands. */
export interface GunVisual {
  /** Barrel length in character-height units. */
  barrelLen: number
  /** Receiver/body length in character-height units. */
  bodyLen: number
  /** Body thickness in character-height units. */
  bodyHeight: number
  metal: number
  accent: number
  hasScope: boolean
  hasMag: boolean
  hasStock: boolean
  /** 2 = dual-barrel (e.g. dual pistols). */
  barrels: number
  /** Muzzle device radius in character-height units. */
  muzzle: number
}

/** Gun definition — stats scale with tier for shop progression. */
export interface GunDef {
  id: string
  name: string
  price: number
  damage: number
  fireRateMs: number
  /** 0 = no pierce, 1+ = hits multiple enemies in line */
  pierce: number
  /** Spread in degrees (0 = perfect accuracy) */
  spread: number
  /** Wider hit window on the oscillating aim (Mr Gun–style assist per gun). */
  aimWidth: number
  bulletSpeed: number
  color: number
  muzzleColor: number
  aim: GunAimLine
  visual: GunVisual
  /** Short tag shown in the shop (range/role identity). */
  tag: string
  description: string
}

export const GUNS: readonly GunDef[] = [
  {
    id: 'pistol',
    name: 'M9 Pistol',
    price: 0,
    damage: 1,
    fireRateMs: 280,
    pierce: 0,
    spread: 2,
    aimWidth: 1,
    bulletSpeed: 1400,
    color: 0xffd166,
    muzzleColor: 0xffffff,
    aim: { length: 150, width: 2.5, color: 0xffd166, beam: false },
    visual: {
      barrelLen: 0.16,
      bodyLen: 0.16,
      bodyHeight: 0.07,
      metal: 0x2b2f45,
      accent: 0xffd166,
      hasScope: false,
      hasMag: true,
      hasStock: false,
      barrels: 1,
      muzzle: 0.03,
    },
    tag: 'Mid range • balanced',
    description: 'Reliable starter sidearm. Forgiving and steady.',
  },
  {
    id: 'smg',
    name: 'Vector SMG',
    price: 250,
    damage: 1,
    fireRateMs: 120,
    pierce: 0,
    spread: 6,
    aimWidth: 1.05,
    bulletSpeed: 1200,
    color: 0x06d6a0,
    muzzleColor: 0xb7ffda,
    aim: { length: 120, width: 2, color: 0x06d6a0, beam: false },
    visual: {
      barrelLen: 0.18,
      bodyLen: 0.2,
      bodyHeight: 0.085,
      metal: 0x222a3a,
      accent: 0x06d6a0,
      hasScope: false,
      hasMag: true,
      hasStock: true,
      barrels: 1,
      muzzle: 0.028,
    },
    tag: 'Short range • rapid fire',
    description: 'Spray fast — melt grunts before they blink.',
  },
  {
    id: 'shotgun',
    name: 'Breacher 12G',
    price: 600,
    damage: 2,
    fireRateMs: 520,
    pierce: 0,
    spread: 18,
    aimWidth: 1.2,
    bulletSpeed: 900,
    color: 0xff6b6b,
    muzzleColor: 0xffaaaa,
    aim: { length: 95, width: 3, color: 0xff6b6b, beam: false, coneDeg: 12 },
    visual: {
      barrelLen: 0.26,
      bodyLen: 0.18,
      bodyHeight: 0.09,
      metal: 0x3a2622,
      accent: 0xff6b6b,
      hasScope: false,
      hasMag: false,
      hasStock: true,
      barrels: 1,
      muzzle: 0.05,
    },
    tag: 'Close range • wide cone',
    description: 'Wide pellet cone — huge close-range payoff.',
  },
  {
    id: 'rifle',
    name: 'AK Carbine',
    price: 1200,
    damage: 2,
    fireRateMs: 340,
    pierce: 1,
    spread: 1,
    aimWidth: 1.08,
    bulletSpeed: 1600,
    color: 0x4cc9f0,
    muzzleColor: 0xaeeaff,
    aim: { length: 200, width: 2.5, color: 0x4cc9f0, beam: false },
    visual: {
      barrelLen: 0.32,
      bodyLen: 0.22,
      bodyHeight: 0.08,
      metal: 0x24323f,
      accent: 0x4cc9f0,
      hasScope: false,
      hasMag: true,
      hasStock: true,
      barrels: 1,
      muzzle: 0.03,
    },
    tag: 'Long range • pierces 2',
    description: 'Punches clean through two targets in a row.',
  },
  {
    id: 'sniper',
    name: 'Phantom .50',
    price: 2500,
    damage: 4,
    fireRateMs: 680,
    pierce: 2,
    spread: 0,
    aimWidth: 1.25,
    bulletSpeed: 2200,
    color: 0xc77dff,
    muzzleColor: 0xe0b0ff,
    aim: { length: 320, width: 2, color: 0xc77dff, beam: true },
    visual: {
      barrelLen: 0.42,
      bodyLen: 0.24,
      bodyHeight: 0.075,
      metal: 0x2c2540,
      accent: 0xc77dff,
      hasScope: true,
      hasMag: true,
      hasStock: true,
      barrels: 1,
      muzzle: 0.035,
    },
    tag: 'Extreme range • headshot king',
    description: 'A laser-guided beam that drops bosses fast.',
  },
  {
    id: 'laser',
    name: 'Ion Beam',
    price: 5000,
    damage: 3,
    fireRateMs: 200,
    pierce: 99,
    spread: 0,
    aimWidth: 1.15,
    bulletSpeed: 2800,
    color: 0x00f5d4,
    muzzleColor: 0xffffff,
    aim: { length: 300, width: 5, color: 0x00f5d4, beam: true },
    visual: {
      barrelLen: 0.3,
      bodyLen: 0.24,
      bodyHeight: 0.1,
      metal: 0x16323a,
      accent: 0x00f5d4,
      hasScope: false,
      hasMag: false,
      hasStock: true,
      barrels: 1,
      muzzle: 0.06,
    },
    tag: 'Long range • cuts whole lines',
    description: 'Continuous energy lance that pierces everything.',
  },
  {
    id: 'cannon',
    name: 'Demolisher',
    price: 9000,
    damage: 6,
    fireRateMs: 900,
    pierce: 0,
    spread: 4,
    aimWidth: 1.1,
    bulletSpeed: 800,
    color: 0xff9500,
    muzzleColor: 0xffcc00,
    aim: { length: 130, width: 6, color: 0xff9500, beam: false },
    visual: {
      barrelLen: 0.28,
      bodyLen: 0.22,
      bodyHeight: 0.13,
      metal: 0x3a2c14,
      accent: 0xff9500,
      hasScope: false,
      hasMag: true,
      hasStock: true,
      barrels: 1,
      muzzle: 0.08,
    },
    tag: 'Mid range • boss breaker',
    description: 'Slow, heavy slugs that devastate armor.',
  },
  {
    id: 'dual',
    name: 'Twin Elite',
    price: 15000,
    damage: 2,
    fireRateMs: 90,
    pierce: 1,
    spread: 5,
    aimWidth: 1.12,
    bulletSpeed: 1500,
    color: 0xf72585,
    muzzleColor: 0xff8fab,
    aim: { length: 160, width: 2.5, color: 0xf72585, beam: false },
    visual: {
      barrelLen: 0.18,
      bodyLen: 0.16,
      bodyHeight: 0.075,
      metal: 0x331026,
      accent: 0xf72585,
      hasScope: false,
      hasMag: true,
      hasStock: false,
      barrels: 2,
      muzzle: 0.032,
    },
    tag: 'Mid range • endgame DPS',
    description: 'Twin pistols hammering double the lead.',
  },
] as const

export function getGun(id: string): GunDef {
  const gun = GUNS.find((g) => g.id === id)
  return gun ?? GUNS[0]!
}

export function defaultUnlocked(): string[] {
  return ['pistol']
}
