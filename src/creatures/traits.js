// ── Trait definitions ─────────────────────────────────────────────

export const TRAIT_DEFS = {
  speed:      { min: 0.3, max: 3.0, default: 1.0 },
  size:       { min: 0.15, max: 0.6, default: 0.3 },
  vision:     { min: 1, max: 8, default: 4.0 },
  metabolism: { min: 0.5, max: 2.0, default: 1.0 },
}

// ── Generate random initial traits ───────────────────────────────

export function randomTraits() {
  const speed = 0.5 + Math.random() * 1.0
  const size = 0.2 + Math.random() * 0.2
  const hue = Math.floor(Math.random() * 360)
  return {
    speed,
    size,
    color: [hue, 70, 65], // [H, S, L]
    vision: 3 + Math.random() * 3,
    metabolism: 0.7 + Math.random() * 0.6,
  }
}

// ── Clamp a trait to its valid range ─────────────────────────────

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

// ── Mutate traits for offspring ──────────────────────────────────

export function mutateTraits(parentTraits, mutationRate) {
  const rate = mutationRate / 50 // normalize: 50 → 1x, 100 → 2x

  function mutateTrait(value, def) {
    const delta = (Math.random() - 0.5) * 0.2 * rate
    return clamp(value + delta, def.min, def.max)
  }

  const [h, s, l] = parentTraits.color
  const hueDelta = (Math.random() - 0.5) * 20 * rate
  const newHue = ((h + hueDelta) % 360 + 360) % 360

  return {
    speed: mutateTrait(parentTraits.speed, TRAIT_DEFS.speed),
    size: mutateTrait(parentTraits.size, TRAIT_DEFS.size),
    color: [
      Math.round(newHue),
      clamp(s + (Math.random() - 0.5) * 6 * rate, 40, 90),
      clamp(l + (Math.random() - 0.5) * 6 * rate, 45, 80),
    ],
    vision: mutateTrait(parentTraits.vision, TRAIT_DEFS.vision),
    metabolism: mutateTrait(parentTraits.metabolism, TRAIT_DEFS.metabolism),
  }
}

// ── Convert traits.color to CSS string ───────────────────────────

export function hslToString([h, s, l]) {
  return `hsl(${h}, ${s}%, ${l}%)`
}
