/** Angle helpers. All "deg" functions work in degrees; "rad" in radians. */

export const DEG = Math.PI / 180

export function degToRad(deg: number): number {
  return deg * DEG
}

export function radToDeg(rad: number): number {
  return rad / DEG
}

/** Wrap a degree value into [0, 360). */
export function wrapDeg(deg: number): number {
  const m = deg % 360
  return m < 0 ? m + 360 : m
}

/** Wrap a radian value into [-PI, PI). */
export function wrapRad(rad: number): number {
  const twoPi = Math.PI * 2
  let r = (rad + Math.PI) % twoPi
  if (r < 0) {
    r += twoPi
  }
  return r - Math.PI
}

/**
 * Smallest signed difference `target - from` in degrees, in range (-180, 180].
 * Useful for tweening along the shortest path.
 */
export function shortestDeltaDeg(from: number, target: number): number {
  let d = wrapDeg(target - from)
  if (d > 180) {
    d -= 360
  }
  return d
}

/**
 * True if `angleDeg` lies within an arc centred on `centerDeg` with the given
 * half-width (so total arc width is `halfWidthDeg * 2`). Handles wrap-around at
 * the 0/360 boundary precisely.
 */
export function arcContainsDeg(angleDeg: number, centerDeg: number, halfWidthDeg: number): boolean {
  const diff = Math.abs(shortestDeltaDeg(centerDeg, angleDeg))
  return diff <= halfWidthDeg
}
