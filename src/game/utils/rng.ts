/**
 * Tiny, fast, deterministic PRNG (mulberry32). Given the same seed it always
 * produces the same sequence, which keeps spawns reproducible for debugging and
 * keeps gameplay deterministic alongside the fixed-step simulation.
 */
export class Rng {
  private state: number

  constructor(seed: number) {
    // Force to a 32-bit unsigned integer.
    this.state = seed >>> 0
  }

  /** Next float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0
    let t = this.state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** Next float in [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  /** Random element of a non-empty array. */
  pick<T>(items: readonly T[]): T {
    const index = Math.floor(this.next() * items.length)
    // Clamp guards against the (vanishingly unlikely) next() === ~1 edge.
    const safe = Math.min(index, items.length - 1)
    const value = items[safe]
    if (value === undefined) {
      throw new Error('Rng.pick called on an empty array')
    }
    return value
  }

  /** True with the given probability in [0, 1]. */
  chance(probability: number): boolean {
    return this.next() < probability
  }
}

/** Convenience factory seeded from the clock. */
export function createRng(seed: number = Date.now()): Rng {
  return new Rng(seed)
}
