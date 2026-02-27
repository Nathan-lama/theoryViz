// ── Simulation Slice ────────────────────────────────────────────
// Manages: time, speed, generation, creatures, foodItems, predators,
//          variables, populationHistory, birth/death tracking, tick

import { mutateTraits, hslToString } from '../../creatures/traits'
import { isInWater } from '../../world/objects/water'
import { getTerrainHeight } from '../../world/terrain-utils'
import { getBehaviorsByPriority } from '../../creatures/behaviorRegistry'
import {
  createFoodItem,
  createCreature,
  createPredator,
  createInitialCreatures,
  createInitialFood,
} from '../factories'

// ── Tick sub-functions ──────────────────────────────────────────

function syncPredators(currentPredators, targetCount) {
  const predators = [...currentPredators]
  const target = Math.round(targetCount)
  while (predators.length < target) predators.push(createPredator())
  while (predators.length > target) predators.pop()
  return predators
}

function updatePredators(predators, creatures, dt) {
  const killSet = new Set()

  for (const p of predators) {
    let { x, z, angle, dirTimer, nextDirChange, size, speed: pSpeed } = p

    let nearestCreature = null
    let nearestDist = Infinity
    for (const c of creatures) {
      const dx = c.x - x
      const dz = c.z - z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < 8 && dist < nearestDist) {
        nearestCreature = c
        nearestDist = dist
      }
    }

    if (nearestCreature) {
      angle = Math.atan2(nearestCreature.z - z, nearestCreature.x - x)
      if (nearestDist < 0.5) killSet.add(nearestCreature.id)
    } else {
      dirTimer += dt
      if (dirTimer >= nextDirChange) {
        angle += (Math.random() - 0.5) * Math.PI * 1.5
        nextDirChange = 2 + Math.random() * 2
        dirTimer = 0
      }
    }

    const moveSpeed = pSpeed * dt
    let newX = x + Math.cos(angle) * moveSpeed
    let newZ = z + Math.sin(angle) * moveSpeed

    if (Math.abs(newX) > 35) { angle = Math.PI - angle; newX = x }
    if (Math.abs(newZ) > 35) { angle = -angle; newZ = z }
    if (isInWater(newX, newZ)) { angle += Math.PI * 0.7; newX = x; newZ = z }

    p.x = newX
    p.z = newZ
    p.y = getTerrainHeight(newX, newZ) + size * 0.8
    p.angle = angle
    p.dirTimer = dirTimer
    p.nextDirChange = nextDirChange
  }

  return { predators, killSet }
}

function tickCreatures(creatures, foodItems, predators, state, dt, newTime) {
  const newBorns = []
  const theoryBehaviors = state.theoryBehaviors || {}

  const movementBehaviors = getBehaviorsByPriority().filter((b) => {
    if (b.phase === 'post') return false
    if (theoryBehaviors[b.id]?.enabled === false) return false
    return true
  })

  const worldState = { foodItems, predators, creatures, variables: state.variables, time: newTime }

  for (const c of creatures) {
    const traits = c.traits
    const cSpeed = traits.speed
    const metabolism = traits.metabolism || 1.0
    let { x, z, angle, dirTimer, nextDirChange, energy, size } = c

    const energyCost = 0.12 * metabolism * (1 + (cSpeed - 1) * 0.15) * (1 + (size - 0.3) * 0.5)
    energy -= energyCost * dt

    let speedMultiplier = 1.0
    let behaviorResult = null
    for (const behavior of movementBehaviors) {
      if (behavior.condition(c, worldState)) {
        behaviorResult = behavior.execute(c, worldState, dt)
        break
      }
    }

    if (behaviorResult) {
      if (behaviorResult.angle !== undefined) angle = behaviorResult.angle
      if (behaviorResult.dirTimer !== undefined) dirTimer = behaviorResult.dirTimer
      if (behaviorResult.nextDirChange !== undefined) nextDirChange = behaviorResult.nextDirChange
      if (behaviorResult.speedMultiplier) speedMultiplier = behaviorResult.speedMultiplier

      if (behaviorResult.ate) {
        foodItems = foodItems.filter((f) => f.id !== behaviorResult.ate.foodId)
        energy = Math.min(energy + behaviorResult.ate.energyGain, 100)
        size = Math.min(size + 0.005, traits.size * 1.5)
      }
    }

    const moveSpeed = cSpeed * dt * speedMultiplier
    let newX = x + Math.cos(angle) * moveSpeed
    let newZ = z + Math.sin(angle) * moveSpeed

    if (Math.abs(newX) > 35) { angle = Math.PI - angle; newX = x }
    if (Math.abs(newZ) > 35) { angle = -angle; newZ = z }
    if (isInWater(newX, newZ)) { angle += Math.PI * (0.5 + Math.random()); newX = x; newZ = z }

    if (energy > 80) {
      energy -= 30
      const childTraits = mutateTraits(traits, state.variables.mutationRate)
      const cx = newX + (Math.random() - 0.5) * 2
      const cz = newZ + (Math.random() - 0.5) * 2
      newBorns.push(createCreature({
        x: cx, z: cz,
        y: getTerrainHeight(cx, cz) + childTraits.size * 0.8,
        energy: 40,
        generation: c.generation + 1,
        traits: childTraits,
      }))
    }

    c.x = newX
    c.z = newZ
    c.y = getTerrainHeight(newX, newZ) + size * 0.8
    c.angle = angle
    c.dirTimer = dirTimer
    c.nextDirChange = nextDirChange
    c.energy = energy
    c.size = size
    c.color = hslToString(traits.color)
    c.speed = cSpeed
  }

  const alive = creatures.filter((c) => c.energy > 0)
  return { creatures: alive, foodItems, newBorns }
}

function respawnFood(foodItems, newTime, prevTime, foodAbundance) {
  const tickInt = Math.floor(newTime)
  const prevTickInt = Math.floor(prevTime)
  if (tickInt > prevTickInt && tickInt % 3 === 0) {
    const spawnCount = Math.max(1, Math.floor(foodAbundance / 15))
    const newFood = Array.from({ length: spawnCount }, () => createFoodItem())
    return [...foodItems, ...newFood]
  }
  return foodItems
}

function updateStats(state, newTime, creatureCount, birthsThisTick, deathsThisTick) {
  const prevGenTick = Math.floor(state.time / 300)
  const newGenTick = Math.floor(newTime / 300)
  const generation = newGenTick > prevGenTick ? state.generation + 1 : state.generation

  const tickInt = Math.floor(newTime)
  const prevTickInt = Math.floor(state.time)
  const populationHistory = tickInt > prevTickInt
    ? [...state.populationHistory, creatureCount].slice(-300)
    : state.populationHistory

  const _birthLog = [...state._birthLog, { t: newTime, count: birthsThisTick }]
    .filter((e) => newTime - e.t < 100)
  const _deathLog = [...state._deathLog, { t: newTime, count: deathsThisTick }]
    .filter((e) => newTime - e.t < 100)

  const recentBirths = _birthLog.reduce((s, e) => s + e.count, 0)
  const recentDeaths = _deathLog.reduce((s, e) => s + e.count, 0)

  return { generation, populationHistory, recentBirths, recentDeaths, _birthLog, _deathLog }
}

// ── Slice export ────────────────────────────────────────────────

export const simulationSlice = (set, get) => ({
  // State
  worldSeed: 42,
  time: 0,
  speed: 1,
  generation: 1,

  creatures: createInitialCreatures(25),
  foodItems: createInitialFood(40),
  predators: [],

  variables: {
    foodAbundance: 50,
    predatorCount: 0,
    climate: 50,
    mutationRate: 10,
    resources: 50,
  },

  populationHistory: [],
  recentBirths: 0,
  recentDeaths: 0,
  _birthLog: [],
  _deathLog: [],

  // Actions
  setSpeed: (s) => set({ speed: s }),

  setVariable: (key, value) =>
    set((state) => ({
      variables: { ...state.variables, [key]: value },
    })),

  spawnFood: (count) => {
    const newItems = Array.from({ length: count }, () => createFoodItem())
    set((state) => ({
      foodItems: [...state.foodItems, ...newItems],
    }))
  },

  removeFood: (id) =>
    set((state) => ({
      foodItems: state.foodItems.filter((f) => f.id !== id),
    })),

  spawnCreature: (props) =>
    set((state) => ({
      creatures: [...state.creatures, createCreature(props)],
    })),

  removeCreature: (id) =>
    set((state) => ({
      creatures: state.creatures.filter((c) => c.id !== id),
    })),

  nextGeneration: () =>
    set((state) => ({ generation: state.generation + 1 })),

  reset: () =>
    set({
      time: 0,
      generation: 1,
      creatures: createInitialCreatures(25),
      foodItems: createInitialFood(40),
      predators: [],
      populationHistory: [],
      recentBirths: 0,
      recentDeaths: 0,
      _birthLog: [],
      _deathLog: [],
      variables: {
        foodAbundance: 50,
        predatorCount: 0,
        climate: 50,
        mutationRate: 10,
        resources: 50,
      },
    }),

  // Tick
  tick: (delta) => {
    const state = get()
    if (state.speed === 0) return

    const dt = delta * state.speed
    const newTime = state.time + dt

    let predators = syncPredators(state.predators, state.variables.predatorCount)
    const predResult = updatePredators(predators, state.creatures, dt)
    predators = predResult.predators

    let creatures = predResult.killSet.size > 0
      ? state.creatures.filter((c) => !predResult.killSet.has(c.id))
      : [...state.creatures]

    let foodItems = [...state.foodItems]
    const creatureResult = tickCreatures(creatures, foodItems, predators, state, dt, newTime)
    creatures = creatureResult.creatures
    foodItems = creatureResult.foodItems

    const deathsThisTick = state.creatures.length - creatures.length
    const birthsThisTick = creatureResult.newBorns.length
    creatures = [...creatures, ...creatureResult.newBorns]

    foodItems = respawnFood(foodItems, newTime, state.time, state.variables.foodAbundance)
    const stats = updateStats(state, newTime, creatures.length, birthsThisTick, deathsThisTick)

    set({
      time: newTime,
      creatures,
      foodItems,
      predators,
      ...stats,
    })
  },
})
