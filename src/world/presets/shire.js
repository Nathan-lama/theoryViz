// ── Shire Preset ─────────────────────────────────────────────────
// Gentle rolling hills, pastoral greens, warm golden light.
// Inspired by the Shire from Lord of the Rings.

import { registerPreset } from './registry'

registerPreset({
  id: 'shire',
  name: '🏡 Comté',

  heightmap: (x, z) =>
    Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2.5 +
    Math.sin(x * 0.05 + z * 0.08) * 1.5 +
    Math.cos(x * 0.2 + z * 0.12) * 0.4,

  terrainColor: '#4a7a2e',
  terrainRoughness: 0.85,

  sky: { sunPosition: [120, 18, 90], turbidity: 5, rayleigh: 3 },
  fog: { color: '#7a9a5a', near: 35, far: 85 },
  ambientLight: 0.55,
  directionalLight: { intensity: 1.1, position: [18, 14, 12] },

  water: true,

  defaultObjects: {
    trees: { enabled: true, count: 80 },
    rocks: { enabled: true, count: 25 },
    flowers: { enabled: true, count: 100 },
    houses: { enabled: true, count: 12 },
    factories: { enabled: false },
    particles: { enabled: true },
  },
})
