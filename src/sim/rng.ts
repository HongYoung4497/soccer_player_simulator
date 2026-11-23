/** 결정적 mulberry32 RNG — 동일 seed → 동일 분기 결과 `[가정: 구현]` */

export function hashSeed(parts: Array<string | number>): number {
  const s = parts.join('|')
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export interface Rng {
  next(): number
  float(min: number, max: number): number
  int(min: number, max: number): number
  chance(p: number): boolean
  pick<T>(items: readonly T[]): T
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    float(min, max) {
      return min + next() * (max - min)
    },
    int(min, max) {
      return Math.floor(min + next() * (max - min + 1))
    },
    chance(p) {
      return next() < p
    },
    pick(items) {
      return items[Math.floor(next() * items.length)]!
    },
  }
}
