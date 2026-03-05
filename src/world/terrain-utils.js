// ── Dynamic terrain height ──────────────────────────────────────
// The heightmap function is swapped when the active preset changes.
// All consumers (store, trees, rocks, etc.) use getTerrainHeight()
// which dispatches to the active preset's heightmap.

let activeHeightmap = (x, z) =>
  Math.sin(x * 0.15) * Math.cos(z * 0.15) * 2 +
  Math.sin(x * 0.3 + z * 0.2) * 0.8

export function getTerrainHeight(x, z) {
  return activeHeightmap(x, z)
}

export function setActiveHeightmap(fn) {
  activeHeightmap = fn
}
