/** Fire a vibration if the device supports it. Safe to call anywhere. */
export function vibrate(ms: number): void {
  const nav: Navigator & { vibrate?: (pattern: number | number[]) => boolean } = navigator
  if (typeof nav.vibrate === 'function') {
    try {
      nav.vibrate(ms)
    } catch {
      // Some browsers throw outside a user gesture; ignore.
    }
  }
}
