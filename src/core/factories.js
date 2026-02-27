// ── Shared factories ────────────────────────────────────────────
// Used by simulationSlice and theorySlice for creating entities

import { randomTraits, hslToString } from '../creatures/traits'
import { isInWater } from '../world/objects/water'
import { getTerrainHeight } from '../world/terrain-utils'

let foodIdCounter = 0
let creatureIdCounter = 0
let predatorIdCounter = 0

function randomLandPosition(spread = 60) {
  let x, z
  do {
    x = (Math.random() - 0.5) * spread
    z = (Math.random() - 0.5) * spread
  } while (isInWater(x, z))
  return { x, z, y: getTerrainHeight(x, z) }
}

export function createFoodItem() {
  const pos = randomLandPosition(60)
  return {
    id: foodIdCounter++,
    position: [pos.x, pos.y + 0.15, pos.z],
    type: Math.random() > 0.5 ? 'fruit' : 'grain',
  }
}

export function createCreature(overrides = {}) {
  const pos = randomLandPosition(60)
  const traits = overrides.traits || randomTraits()
  return {
    id: creatureIdCounter++,
    x: overrides.x ?? pos.x,
    y: overrides.y ?? (pos.y + traits.size * 0.8),
    z: overrides.z ?? pos.z,
    angle: Math.random() * Math.PI * 2,
    dirTimer: 0,
    nextDirChange: 2 + Math.random() * 2,
    color: hslToString(traits.color),
    size: traits.size,
    speed: traits.speed,
    energy: overrides.energy ?? 50,
    generation: overrides.generation ?? 1,
    traits,
  }
}

export function createPredator() {
  const pos = randomLandPosition(60)
  const size = 0.5
  return {
    id: predatorIdCounter++,
    x: pos.x,
    y: pos.y + size * 0.8,
    z: pos.z,
    angle: Math.random() * Math.PI * 2,
    dirTimer: 0,
    nextDirChange: 2 + Math.random() * 2,
    size,
    speed: 0.8,
    isPredator: true,
  }
}

export function createInitialFood(count) {
  return Array.from({ length: count }, () => createFoodItem())
}

export function createInitialCreatures(count) {
  return Array.from({ length: count }, () => createCreature())
}
