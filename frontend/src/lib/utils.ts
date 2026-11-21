import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/** Deterministic PRNG so demonstration data is stable between reloads. */
export function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function round(value: number, digits = 2) {
  const f = 10 ** digits
  return Math.round(value * f) / f
}

export function addMonths(period: string, delta: number) {
  const [y, m] = period.split('-').map(Number)
  const total = y * 12 + (m - 1) + delta
  const year = Math.floor(total / 12)
  const month = (total % 12) + 1
  return `${year}-${String(month).padStart(2, '0')}`
}

export function monthsBetween(start: string, end: string) {
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  return (ey - sy) * 12 + (em - sm)
}
