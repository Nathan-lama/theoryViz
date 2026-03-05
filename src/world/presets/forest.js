// ── Forest Preset ────────────────────────────────────────────────
// The default world: green rolling hills with a river.
// Used by: Evolution, free mode

import { registerPreset } from './registry'

registerPreset({
  id: 'forest',
  name: '🌲 Forêt',

  heightmap: (x, z) =>
    Math.sin(x * 0.15) * Math.cos(z * 0.15) * 2 +
    Math.sin(x * 0.3 + z * 0.2) * 0.8,

  terrainColor: '#2d5a1e',
  terrainRoughness: 0.9,

  sky: { sunPosition: [100, 20, 100], turbidity: 8, rayleigh: 2 },
  fog: { color: '#5a7a4a', near: 40, far: 90 },
  ambientLight: 0.5,
  directionalLight: { intensity: 1.2, position: [15, 15, 10] },

  water: true,

  defaultObjects: {
    trees: { enabled: true, count: 100 },
    rocks: { enabled: true, count: 40 },
    flowers: { enabled: true, count: 60 },
    houses: { enabled: false },
    factories: { enabled: false },
    particles: { enabled: true },
  },
})
