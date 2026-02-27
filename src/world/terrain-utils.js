// ── Terrain height utility ──────────────────────────────────────
// Single source of truth for terrain height calculation.
// Used by store.js, trees, rocks, flowers, houses, etc.

export function getTerrainHeight(x, z) {
  return (
    Math.sin(x * 0.15) * Math.cos(z * 0.15) * 2 +
    Math.sin(x * 0.3 + z * 0.2) * 0.8
  )
}
