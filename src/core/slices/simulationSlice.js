// ── Simulation Slice ────────────────────────────────────────────
// State + tick logic for the simulation with scientific features:
//   - Climate effects (Bergmann's rule)
//   - Carrying capacity K (logistic growth, competition)
//   - Trait tracking (μ, σ², Shannon diversity, fitness, survival)

import { mutateTraits, hslToString } from '../../creatures/traits'
import { worldQuery } from '../../world/world-query'
import { getBehaviorsByPriority } from '../../creatures/behaviorRegistry'
import {
  createInitialCreatures,
  createInitialFood,
  createFoodItem,
  createCreature,
  createPredator,
} from '../factories'

// ══════════════════════════════════════════════════════════════════
// CLIMATE EFFECTS — Based on Bergmann's & Allen's rules
// ══════════════════════════════════════════════════════════════════

function getClimateEffects(climate, traits) {
  const deviation = Math.abs(climate - 50) / 50

  const baseCostMult = 1.0 + deviation * 0.8

  const optimalSize = climate < 50
    ? 0.35 + (50 - climate) / 50 * 0.25
    : 0.35 - (climate - 50) / 50 * 0.15

  const sizeDiff = Math.abs(traits.size - optimalSize)
  const sizeAdaptation = 1.0 + sizeDiff * 1.2

  const speedMod = climate < 30
    ? 0.7 + (climate / 30) * 0.3
    : climate > 70
      ? 1.0 - (climate - 70) / 30 * 0.2
      : 1.0

  return {
    energyCostMultiplier: baseCostMult * sizeAdaptation,
    speedMultiplier: speedMod,
  }
}

// ══════════════════════════════════════════════════════════════════
// CARRYING CAPACITY (K)
// ══════════════════════════════════════════════════════════════════

function getCarryingCapacity(resources) {
  return Math.round(10 + resources * 1.9)
}

function getCompetitionFactor(populationSize, K) {
  if (K <= 0) return 1
  return Math.min(1, Math.max(0, populationSize / K))
}

// ══════════════════════════════════════════════════════════════════
// TRAIT TRACKING
// ══════════════════════════════════════════════════════════════════

function computeTraitStats(creatures) {
  const n = creatures.length
  if (n === 0) return {
    avgSpeed: 0, avgSize: 0, avgVision: 0, avgMetabolism: 0,
    varSpeed: 0, varSize: 0, varVision: 0, varMetabolism: 0,
    avgEnergy: 0, shannonDiversity: 0, avgGeneration: 0,
  }

  let sumSpeed = 0, sumSize = 0, sumVision = 0, sumMetabolism = 0
  let sumEnergy = 0, sumGen = 0
  for (const c of creatures) {
    sumSpeed += c.traits.speed
    sumSize += c.traits.size
    sumVision += c.traits.vision
    sumMetabolism += (c.traits.metabolism || 1.0)
    sumEnergy += c.energy
    sumGen += c.generation
  }
  const avgSpeed = sumSpeed / n
  const avgSize = sumSize / n
  const avgVision = sumVision / n
  const avgMetabolism = sumMetabolism / n
  const avgEnergy = sumEnergy / n
  const avgGeneration = sumGen / n

  let varSpeed = 0, varSize = 0, varVision = 0, varMetabolism = 0
  for (const c of creatures) {
    varSpeed += (c.traits.speed - avgSpeed) ** 2
    varSize += (c.traits.size - avgSize) ** 2
    varVision += (c.traits.vision - avgVision) ** 2
    varMetabolism += ((c.traits.metabolism || 1.0) - avgMetabolism) ** 2
  }
  varSpeed /= n; varSize /= n; varVision /= n; varMetabolism /= n

  // Shannon diversity (hue bins)
  const hueBins = new Array(12).fill(0)
  for (const c of creatures) {
    const bin = Math.floor(c.traits.color[0] / 30) % 12
    hueBins[bin]++
  }
  let shannonDiversity = 0
  for (const count of hueBins) {
    if (count > 0) {
      const p = count / n
      shannonDiversity -= p * Math.log(p)
    }
  }
  shannonDiversity = shannonDiversity / Math.log(12)

  return {
    avgSpeed: +avgSpeed.toFixed(3), avgSize: +avgSize.toFixed(3),
    avgVision: +avgVision.toFixed(3), avgMetabolism: +avgMetabolism.toFixed(3),
    varSpeed: +varSpeed.toFixed(4), varSize: +varSize.toFixed(4),
    varVision: +varVision.toFixed(4), varMetabolism: +varMetabolism.toFixed(4),
    avgEnergy: +avgEnergy.toFixed(1), shannonDiversity: +shannonDiversity.toFixed(3),
    avgGeneration: +avgGeneration.toFixed(1),
  }
}

// ══════════════════════════════════════════════════════════════════

export const simulationSlice = (set, get) => ({
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

  // Scientific data
  traitStats: null,
  traitHistory: {},
  survivalRate: 1,
  selectionPressure: 0,
  carryingCapacity: 120,

  // ── Actions ──

  setSpeed: (s) => set({ speed: s }),

  setVariable: (key, value) =>
    set((state) => ({ variables: { ...state.variables, [key]: value } })),

  spawnFood: (count) =>
    set((state) => ({
      foodItems: [...state.foodItems, ...Array.from({ length: count }, () => createFoodItem())],
    })),

  removeFood: (id) =>
    set((state) => ({ foodItems: state.foodItems.filter((f) => f.id !== id) })),

  spawnCreature: (props) =>
    set((state) => ({ creatures: [...state.creatures, createCreature(props)] })),

  removeCreature: (id) =>
    set((state) => ({ creatures: state.creatures.filter((c) => c.id !== id) })),

  nextGeneration: () =>
    set((state) => ({ generation: state.generation + 1 })),

  reset: () =>
    set({
      time: 0,
      speed: 1,
      generation: 1,
      creatures: createInitialCreatures(25),
      foodItems: createInitialFood(40),
      predators: [],
      populationHistory: [],
      recentBirths: 0,
      recentDeaths: 0,
      _birthLog: [],
      _deathLog: [],
      traitStats: null,
      traitHistory: {},
      survivalRate: 1,
      selectionPressure: 0,
      carryingCapacity: 120,
      variables: {
        foodAbundance: 50,
        predatorCount: 0,
        climate: 50,
        mutationRate: 10,
        resources: 50,
      },
    }),

  // ── Tick ──

  tick: (dt) => set((state) => {
    if (state.speed === 0) return {}

    const scaledDt = dt * state.speed
    const newTime = state.time + scaledDt
    const vars = state.variables

    // ── Sync predators
    let predators = [...state.predators]
    const targetPreds = Math.round(vars.predatorCount)
    while (predators.length < targetPreds) predators.push(createPredator())
    while (predators.length > targetPreds) predators.pop()

    // ── Update predators
    const killSet = new Set()
    for (const p of predators) {
      let { x, z, angle, dirTimer, nextDirChange, size, speed: pSpeed } = p
      let nearestCreature = null, nearestDist = Infinity
      for (const c of state.creatures) {
        const dx = c.x - x, dz = c.z - z
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist < 8 && dist < nearestDist) { nearestCreature = c; nearestDist = dist }
      }
      if (nearestCreature) {
        angle = Math.atan2(nearestCreature.z - z, nearestCreature.x - x)
        if (nearestDist < 0.5) killSet.add(nearestCreature.id)
      } else {
        dirTimer += scaledDt
        if (dirTimer >= nextDirChange) {
          angle += (Math.random() - 0.5) * Math.PI * 1.5
          nextDirChange = 2 + Math.random() * 2
          dirTimer = 0
        }
      }
      const ms = pSpeed * scaledDt
      let nx = x + Math.cos(angle) * ms, nz = z + Math.sin(angle) * ms
      if (!worldQuery.isInBounds(nx, nz)) {
        if (Math.abs(nx) > 35) { angle = Math.PI - angle; nx = x }
        if (Math.abs(nz) > 35) { angle = -angle; nz = z }
      }
      if (worldQuery.isInWater(nx, nz)) { angle += Math.PI * 0.7; nx = x; nz = z }
      p.x = nx; p.z = nz
      p.y = worldQuery.getTerrainHeight(nx, nz) + size * 0.8
      p.angle = angle; p.dirTimer = dirTimer; p.nextDirChange = nextDirChange
    }

    // ── Filter killed creatures
    let creatures = killSet.size > 0
      ? state.creatures.filter((c) => !killSet.has(c.id))
      : [...state.creatures]

    // ── Tick creatures with scientific effects
    let foodItems = [...state.foodItems]
    const newBorns = []

    const climate = vars.climate ?? 50
    const resources = vars.resources ?? 50
    const K = getCarryingCapacity(resources)
    const competition = getCompetitionFactor(creatures.length, K)
    const reproThreshold = 80 + competition * 15
    const foodEnergyGain = Math.max(5, 25 - competition * 15)

    const behaviors = getBehaviorsByPriority().filter((b) => {
      if (b.phase === 'post') return false
      const tb = state.theoryBehaviors?.[b.id]
      if (tb?.enabled === false) return false
      return true
    })
    const worldState = { foodItems, predators, creatures, variables: vars, time: newTime }

    for (const c of creatures) {
      const traits = c.traits
      const cSpeed = traits.speed
      const metabolism = traits.metabolism || 1.0
      let { x, z, angle, dirTimer, nextDirChange, energy, size } = c

      // Climate-adjusted energy cost
      const ce = getClimateEffects(climate, traits)
      const baseCost = 0.12 * metabolism * (1 + (cSpeed - 1) * 0.15) * (1 + (size - 0.3) * 0.5)
      energy -= baseCost * ce.energyCostMultiplier * scaledDt

      let speedMult = ce.speedMultiplier
      let behaviorResult = null
      for (const b of behaviors) {
        if (b.condition(c, worldState)) {
          behaviorResult = b.execute(c, worldState, scaledDt)
          break
        }
      }

      if (behaviorResult) {
        if (behaviorResult.angle !== undefined) angle = behaviorResult.angle
        if (behaviorResult.dirTimer !== undefined) dirTimer = behaviorResult.dirTimer
        if (behaviorResult.nextDirChange !== undefined) nextDirChange = behaviorResult.nextDirChange
        if (behaviorResult.speedMultiplier) speedMult *= behaviorResult.speedMultiplier
        if (behaviorResult.ate) {
          foodItems = foodItems.filter((f) => f.id !== behaviorResult.ate.foodId)
          energy = Math.min(energy + foodEnergyGain, 100)
          size = Math.min(size + 0.005, traits.size * 1.5)
        }
      }

      const ms = cSpeed * scaledDt * speedMult
      let nx = x + Math.cos(angle) * ms, nz = z + Math.sin(angle) * ms
      if (!worldQuery.isInBounds(nx, nz)) {
        if (Math.abs(nx) > 35) { angle = Math.PI - angle; nx = x }
        if (Math.abs(nz) > 35) { angle = -angle; nz = z }
      }
      if (worldQuery.isInWater(nx, nz)) { angle += Math.PI * (0.5 + Math.random()); nx = x; nz = z }

      if (energy > reproThreshold) {
        energy -= 30
        const childTraits = mutateTraits(traits, vars.mutationRate)
        const cx = nx + (Math.random() - 0.5) * 2
        const cz = nz + (Math.random() - 0.5) * 2
        newBorns.push(createCreature({
          x: cx, z: cz,
          y: worldQuery.getTerrainHeight(cx, cz) + childTraits.size * 0.8,
          energy: 40, generation: c.generation + 1, traits: childTraits,
        }))
      }

      c.x = nx; c.z = nz
      c.y = worldQuery.getTerrainHeight(nx, nz) + size * 0.8
      c.angle = angle; c.dirTimer = dirTimer; c.nextDirChange = nextDirChange
      c.energy = energy; c.size = size
      c.color = hslToString(traits.color); c.speed = cSpeed
    }

    const alive = creatures.filter((c) => c.energy > 0)
    const deathsThisTick = state.creatures.length - alive.length
    const birthsThisTick = newBorns.length
    creatures = [...alive, ...newBorns]

    // ── Respawn food
    const tInt = Math.floor(newTime), pInt = Math.floor(state.time)
    if (tInt > pInt && tInt % 3 === 0) {
      const count = Math.max(1, Math.floor(vars.foodAbundance / 15))
      foodItems = [...foodItems, ...Array.from({ length: count }, () => createFoodItem())]
    }

    // ── Stats
    const prevGenTick = Math.floor(state.time / 300)
    const newGenTick = Math.floor(newTime / 300)
    const generation = newGenTick > prevGenTick ? state.generation + 1 : state.generation

    const populationHistory = tInt > pInt
      ? [...state.populationHistory, creatures.length].slice(-300)
      : state.populationHistory

    const _birthLog = [...state._birthLog, { t: newTime, count: birthsThisTick }].filter((e) => newTime - e.t < 100)
    const _deathLog = [...state._deathLog, { t: newTime, count: deathsThisTick }].filter((e) => newTime - e.t < 100)
    const recentBirths = _birthLog.reduce((s, e) => s + e.count, 0)
    const recentDeaths = _deathLog.reduce((s, e) => s + e.count, 0)

    // ── Trait tracking (sample every sim second)
    const traitStats = computeTraitStats(creatures)
    let traitHistory = state.traitHistory || {}
    if (tInt > pInt) {
      const MAX = 200
      const push = (arr, val) => [...(arr || []), val].slice(-MAX)
      traitHistory = {
        speed: push(traitHistory.speed, traitStats.avgSpeed),
        size: push(traitHistory.size, traitStats.avgSize),
        vision: push(traitHistory.vision, traitStats.avgVision),
        metabolism: push(traitHistory.metabolism, traitStats.avgMetabolism),
        diversity: push(traitHistory.diversity, traitStats.shannonDiversity),
        fitness: push(traitHistory.fitness, traitStats.avgEnergy),
      }
    }

    // Survival + selection pressure
    const totalRecent = recentBirths + recentDeaths + creatures.length
    const survivalRate = +(totalRecent > 0 ? creatures.length / totalRecent : 1).toFixed(3)

    const climatePressure = Math.abs(climate - 50) / 50
    const predatorPressure = Math.min(1, (vars.predatorCount ?? 0) / 10)
    const foodPressure = 1 - Math.min(1, (vars.foodAbundance ?? 50) / 80)
    const densityPressure = getCompetitionFactor(creatures.length, K)
    const selectionPressure = +(climatePressure * 0.25 + predatorPressure * 0.3 + foodPressure * 0.25 + densityPressure * 0.2).toFixed(3)

    return {
      time: newTime, creatures, foodItems, predators, generation,
      populationHistory, recentBirths, recentDeaths, _birthLog, _deathLog,
      traitStats, traitHistory, survivalRate, selectionPressure, carryingCapacity: K,
    }
  }),
})
