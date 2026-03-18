// ── Shire Preset ─────────────────────────────────────────────────
// BIG rolling green hills like Hobbiton from the movies.
// Dramatic terrain with large hobbit holes visible from far away.

import { registerPreset } from './registry'

registerPreset({
  id: 'shire',
  name: '🏡 Comté',

  // Big dramatic rolling hills — like the movie
  heightmap: (x, z) => {
    // Large dramatic hills (tall, round)
    const bigHills = Math.sin(x * 0.05) * Math.cos(z * 0.04) * 5.0
    // Secondary rolling hills
    const medHills = Math.sin(x * 0.08 + 1.5) * Math.cos(z * 0.07 + 0.5) * 3.0
    // Gentle undulations
    const small = Math.sin(x * 0.15 + z * 0.12) * 1.0
    // Tiny detail
    const micro = Math.cos(x * 0.3 + z * 0.25) * 0.3
    return bigHills + medHills + small + micro + 1.0 // +1 to raise base
  },

  terrainColor: '#4d8a2a',      // rich hobbiton green
  terrainRoughness: 0.92,

  sky: { sunPosition: [120, 18, 90], turbidity: 5, rayleigh: 3 },
  fog: { color: '#7a9e55', near: 45, far: 100 },
  ambientLight: 0.6,
  directionalLight: { intensity: 1.0, position: [18, 14, 12] },

  water: true,

  defaultObjects: {
    trees: { enabled: true, count: 50 },
    rocks: { enabled: true, count: 8 },
    flowers: { enabled: true, count: 180 },
    houses: { enabled: true, count: 10 },
    factories: { enabled: false },
  },
})
