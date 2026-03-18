// ── World Query ─────────────────────────────────────────────────
// Abstraction layer for world-related queries used by the simulation.
// The simulation logic (factories, tick, worker) only depends on this
// module — never on specific terrain or water implementations directly.
//
// This allows swapping the underlying implementation (e.g., different
// terrain generation, custom water shapes, planet surfaces) without
// touching any simulation code.
//
// Usage:
//   import { worldQuery } from '../world/world-query'
//   worldQuery.getTerrainHeight(x, z)
//   worldQuery.isInWater(x, z)
//   worldQuery.randomLandPosition(spread)

import { getTerrainHeight, setActiveHeightmap } from './terrain-utils'
import { isInWater } from './water-utils'

// ── The world query interface ────────────────────────────────────

export const worldQuery = {
  /**
   * Get the terrain height at (x, z).
   * Default: delegates to terrain-utils.js heightmap.
   */
  getTerrainHeight(x, z) {
    return getTerrainHeight(x, z)
  },

  /**
   * Check if (x, z) is inside a body of water.
   * Default: lake shape detection from water-utils.js.
   */
  isInWater(x, z) {
    return isInWater(x, z)
  },

  /**
   * Check if a position is within world bounds.
   * Override this to change world shape (square, circular, etc.)
   */
  isInBounds(x, z) {
    return Math.abs(x) <= 35 && Math.abs(z) <= 35
  },

  /**
   * Find a random position on land (not in water, in bounds).
   * @param {number} spread - spread of the random area (default 60)
   * @returns {{ x: number, z: number, y: number }}
   */
  randomLandPosition(spread = 60) {
    let x, z
    do {
      x = (Math.random() - 0.5) * spread
      z = (Math.random() - 0.5) * spread
    } while (this.isInWater(x, z))
    return { x, z, y: this.getTerrainHeight(x, z) }
  },
}

// ── Implementation swap ──────────────────────────────────────────
// Call this to override any world query function. For example, to use
// a flat terrain: setWorldQueryImpl({ getTerrainHeight: () => 0 })

export function setWorldQueryImpl(overrides) {
  for (const [key, fn] of Object.entries(overrides)) {
    if (typeof fn === 'function' && key in worldQuery) {
      worldQuery[key] = fn
    }
  }
}

// Re-export setActiveHeightmap for preset switching
export { setActiveHeightmap }
