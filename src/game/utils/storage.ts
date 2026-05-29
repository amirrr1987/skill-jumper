import { defaultUnlocked } from '../data/guns.ts'

const STORAGE_KEY = 'stair-strike'
const SCHEMA_VERSION = 3

export interface SaveData {
  version: number
  best: number
  coins: number
  soundOn: boolean
  seenInstructions: boolean
  equippedGunId: string
  unlockedGuns: string[]
  totalKills: number
}

const DEFAULTS: SaveData = {
  version: SCHEMA_VERSION,
  best: 0,
  coins: 0,
  soundOn: true,
  seenInstructions: false,
  equippedGunId: 'pistol',
  unlockedGuns: defaultUnlocked(),
  totalKills: 0,
}

function isSaveData(value: unknown): value is SaveData {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const v = value as Record<string, unknown>
  return (
    typeof v['version'] === 'number' &&
    typeof v['best'] === 'number' &&
    typeof v['coins'] === 'number' &&
    typeof v['soundOn'] === 'boolean' &&
    typeof v['seenInstructions'] === 'boolean' &&
    typeof v['equippedGunId'] === 'string' &&
    Array.isArray(v['unlockedGuns']) &&
    typeof v['totalKills'] === 'number'
  )
}

function safeStorage(): Storage | null {
  try {
    const probe = '__ss_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    return null
  }
}

export function loadSave(): SaveData {
  const storage = safeStorage()
  if (storage === null) {
    return { ...DEFAULTS, unlockedGuns: [...DEFAULTS.unlockedGuns] }
  }
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) {
      return { ...DEFAULTS, unlockedGuns: [...DEFAULTS.unlockedGuns] }
    }
    const parsed: unknown = JSON.parse(raw)
    if (!isSaveData(parsed) || parsed.version !== SCHEMA_VERSION) {
      const legacy =
        typeof parsed === 'object' && parsed !== null
          ? (parsed as Record<string, unknown>)
          : {}
      const maybeBest = typeof legacy['best'] === 'number' ? legacy['best'] : 0
      const maybeCoins = typeof legacy['coins'] === 'number' ? legacy['coins'] : 0
      return {
        ...DEFAULTS,
        best: maybeBest,
        coins: maybeCoins,
        unlockedGuns: [...DEFAULTS.unlockedGuns],
      }
    }
    return { ...parsed, unlockedGuns: [...parsed.unlockedGuns] }
  } catch {
    return { ...DEFAULTS, unlockedGuns: [...DEFAULTS.unlockedGuns] }
  }
}

export function saveSave(data: SaveData): void {
  const storage = safeStorage()
  if (storage === null) {
    return
  }
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...data, version: SCHEMA_VERSION, unlockedGuns: [...data.unlockedGuns] }),
    )
  } catch {
    // ignore
  }
}

export function patchSave(patch: Partial<Omit<SaveData, 'version'>>): SaveData {
  const current = loadSave()
  const next: SaveData = {
    ...current,
    ...patch,
    version: SCHEMA_VERSION,
    unlockedGuns: patch.unlockedGuns ? [...patch.unlockedGuns] : [...current.unlockedGuns],
  }
  saveSave(next)
  return next
}
