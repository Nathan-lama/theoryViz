// ── Desert Preset ────────────────────────────────────────────────
// Rolling sand dunes, harsh sun, no water, no trees.
// Used by: future theories (survie, darwinisme social, etc.)

import { registerPreset } from './registry'

registerPreset({
  id: 'desert',
  name: '🏜️ Désert',

  heightmap: (x, z) =>
    Math.sin(x * 0.08 + z * 0.05) * 3.0 +
    Math.sin(x * 0.2) * Math.cos(z * 0.15) * 1.2 +
    Math.cos(x * 0.12 + z * 0.18) * 0.6,

  terrainColor: '#C2A645',
  terrainRoughness: 0.98,

  sky: { sunPosition: [100, 35, 50], turbidity: 15, rayleigh: 0.15 },
  fog: { color: '#D4A95A', near: 25, far: 70 },
  ambientLight: 0.6,
  directionalLight: { intensity: 1.5, position: [20, 20, 5] },

  water: false,

  defaultObjects: {
    trees: { enabled: false },
    rocks: { enabled: true, count: 50 },
    flowers: { enabled: false },
    houses: { enabled: false },
    factories: { enabled: false },
    particles: { enabled: true },
  },
})
