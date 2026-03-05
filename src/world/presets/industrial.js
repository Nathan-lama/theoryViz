// ── Industrial Preset ────────────────────────────────────────────
// Flat brownish terrain, polluted sky, factories and houses.
// Used by: Marxisme

import { registerPreset } from './registry'

registerPreset({
  id: 'industrial',
  name: '🏭 Industriel',

  heightmap: (x, z) =>
    Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.8 +
    Math.sin(x * 0.25 + z * 0.15) * 0.3,

  terrainColor: '#3a2a1a',
  terrainRoughness: 0.95,

  sky: { sunPosition: [80, 10, 80], turbidity: 14, rayleigh: 0.4 },
  fog: { color: '#4a3a2a', near: 20, far: 60 },
  ambientLight: 0.35,
  directionalLight: { intensity: 0.9, position: [10, 12, 8] },

  water: true,

  defaultObjects: {
    trees: { enabled: true, count: 25 },
    rocks: { enabled: true, count: 20 },
    flowers: { enabled: false },
    houses: { enabled: true, count: 30 },
    factories: { enabled: true, count: 10 },
    particles: { enabled: true },
  },
})
