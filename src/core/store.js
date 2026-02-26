import { create } from 'zustand'
import { randomTraits, mutateTraits, hslToString } from '../creatures/traits'
import { isInWater } from '../world/objects/water'
import { getWorldObjects } from '../world/registry'
import { getBehaviorsByPriority } from '../creatures/behaviorRegistry'
import '../world/objects'  // trigger world object registrations

// ── Helpers ──────────────────────────────────────────────────────

function getTerrainHeight(x, z) {
  return (
    Math.sin(x * 0.15) * Math.cos(z * 0.15) * 2 +
    Math.sin(x * 0.3 + z * 0.2) * 0.8
  )
}


let foodIdCounter = 0
let creatureIdCounter = 0

function randomLandPosition(spread = 60) {
  let x, z
  do {
    x = (Math.random() - 0.5) * spread
    z = (Math.random() - 0.5) * spread
  } while (isInWater(x, z))
  return { x, z, y: getTerrainHeight(x, z) }
}

function createFoodItem() {
  const pos = randomLandPosition(60)
  return {
    id: foodIdCounter++,
    position: [pos.x, pos.y + 0.15, pos.z],
    type: Math.random() > 0.5 ? 'fruit' : 'grain',
  }
}

function createCreature(overrides = {}) {
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

let predatorIdCounter = 0

function createPredator() {
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

// ── Initial data ─────────────────────────────────────────────────

function createInitialFood(count) {
  return Array.from({ length: count }, () => createFoodItem())
}

function createInitialCreatures(count) {
  return Array.from({ length: count }, () => createCreature())
}

function randomTraitsFromRanges(ranges) {
  const base = randomTraits()
  if (ranges.speed) {
    base.speed = ranges.speed.min + Math.random() * (ranges.speed.max - ranges.speed.min)
  }
  if (ranges.size) {
    base.size = ranges.size.min + Math.random() * (ranges.size.max - ranges.size.min)
  }
  if (ranges.vision) {
    base.vision = ranges.vision.min + Math.random() * (ranges.vision.max - ranges.vision.min)
  }
  return base
}

// ── Store ────────────────────────────────────────────────────────

const useStore = create((set, get) => ({
  // World
  worldSeed: 42,
  time: 0,
  speed: 1,       // 0 = pause, 1 = normal, 2 = x2, 5 = x5
  generation: 1,

  // Populations
  creatures: createInitialCreatures(25),
  foodItems: createInitialFood(40),
  predators: [],

  // Variables (sliders)
  variables: {
    foodAbundance: 50,
    predatorCount: 0,
    climate: 50,
    mutationRate: 10,
    resources: 50,
  },

  // History & tracking
  populationHistory: [],
  recentBirths: 0,
  recentDeaths: 0,
  _birthLog: [],
  _deathLog: [],

  // Theory
  activeTheory: null,
  theoryVariables: {},
  theoryConfig: {},
  theoryBehaviors: {},

  // World objects (generated from registry)
  worldObjects: (() => {
    const objs = {}
    try {
      getWorldObjects().forEach((o) => {
        objs[o.id] = { enabled: o.enabledByDefault !== false, count: o.defaultCount || 0 }
      })
    } catch (e) { /* registry may not be loaded yet */ }
    return objs
  })(),

  // ── Actions ──────────────────────────────────────────────────

  setSpeed: (s) => set({ speed: s }),

  setVariable: (key, value) =>
    set((state) => ({
      variables: { ...state.variables, [key]: value },
    })),

  setObjectCount: (id, count) =>
    set((state) => ({
      worldObjects: {
        ...state.worldObjects,
        [id]: { ...state.worldObjects[id], count },
      },
    })),

  toggleObject: (id) =>
    set((state) => ({
      worldObjects: {
        ...state.worldObjects,
        [id]: { ...state.worldObjects[id], enabled: !state.worldObjects[id]?.enabled },
      },
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

  loadTheory: (config) => {
    if (!config) {
      // Reset to free mode
      const objs = {}
      getWorldObjects().forEach((o) => {
        objs[o.id] = { enabled: o.enabledByDefault !== false, count: o.defaultCount || 0 }
      })
      set({
        activeTheory: null,
        theoryVariables: {},
        theoryConfig: {},
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
        worldObjects: objs,
        variables: {
          foodAbundance: 50,
          predatorCount: 0,
          climate: 50,
          mutationRate: 10,
          resources: 50,
        },
      })
      return
    }

    // 1. Build variable labels & defaults & full configs
    const labels = {}
    const defaults = {}
    const varConfigs = {}
    if (config.variables) {
      for (const [key, val] of Object.entries(config.variables)) {
        labels[key] = val.label || key
        if (val.default !== undefined) defaults[key] = val.default
        varConfigs[key] = val
      }
    }

    // 2. Apply world objects
    const objs = {}
    const registeredObjects = getWorldObjects()
    registeredObjects.forEach((o) => {
      const override = config.world?.objects?.[o.id]
      if (override) {
        objs[o.id] = {
          enabled: override.enabled !== undefined ? override.enabled : (o.enabledByDefault !== false),
          count: override.count !== undefined ? override.count : (o.defaultCount || 0),
        }
      } else {
        objs[o.id] = { enabled: o.enabledByDefault !== false, count: o.defaultCount || 0 }
      }
    })

    // 3. Create creatures with theory-specific trait ranges
    const creatureCount = config.creatures?.initialCount || 25
    const traitRanges = config.creatures?.initialTraits || null
    const creatures = Array.from({ length: creatureCount }, () => {
      if (traitRanges) {
        return createCreature({ traits: randomTraitsFromRanges(traitRanges) })
      }
      return createCreature()
    })

    // 4. Store behavior config for tick filtering
    const behaviorConfig = config.creatures?.behaviors || {}

    // 5. Apply everything and reset simulation
    set({
      activeTheory: config,
      theoryVariables: labels,
      theoryConfig: varConfigs,
      theoryBehaviors: behaviorConfig,
      time: 0,
      generation: 1,
      creatures,
      foodItems: createInitialFood(defaults.foodAbundance || 40),
      predators: [],
      populationHistory: [],
      recentBirths: 0,
      recentDeaths: 0,
      _birthLog: [],
      _deathLog: [],
      worldObjects: objs,
      variables: {
        foodAbundance: 50,
        predatorCount: 0,
        climate: 50,
        mutationRate: 10,
        resources: 50,
        ...defaults,
      },
    })
  },

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

  // ── Tick (called by SimEngine each frame) ────────────────────

  tick: (delta) => {
    const state = get()
    if (state.speed === 0) return

    const dt = delta * state.speed
    const newTime = state.time + dt

    // --- Sync predator count with slider ---
    let predators = [...state.predators]
    const targetPredCount = Math.round(state.variables.predatorCount)
    while (predators.length < targetPredCount) {
      predators.push(createPredator())
    }
    while (predators.length > targetPredCount) {
      predators.pop()
    }

    // --- Update predators (hunt creatures) ---
    let creatures = [...state.creatures]
    let killSet = new Set()

    predators = predators.map((p) => {
      let { x, z, angle, dirTimer, nextDirChange, size, speed: pSpeed } = p

      // Find nearest creature within 8 units
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
        // Kill on contact
        if (nearestDist < 0.5) {
          killSet.add(nearestCreature.id)
        }
      } else {
        dirTimer += dt
        if (dirTimer >= nextDirChange) {
          angle += (Math.random() - 0.5) * Math.PI * 1.5
          nextDirChange = 2 + Math.random() * 2
          dirTimer = 0
        }
      }

      // Move
      const moveSpeed = pSpeed * dt
      let newX = x + Math.cos(angle) * moveSpeed
      let newZ = z + Math.sin(angle) * moveSpeed

      if (Math.abs(newX) > 35) { angle = Math.PI - angle; newX = x }
      if (Math.abs(newZ) > 35) { angle = -angle; newZ = z }
      if (isInWater(newX, newZ)) { angle += Math.PI * 0.7; newX = x; newZ = z }

      const terrainY = getTerrainHeight(newX, newZ)

      return { ...p, x: newX, z: newZ, y: terrainY + size * 0.8, angle, dirTimer, nextDirChange }
    })

    // Remove killed creatures
    if (killSet.size > 0) {
      creatures = creatures.filter((c) => !killSet.has(c.id))
    }

    // --- Update creatures via behavior registry ---
    let foodItems = [...state.foodItems]
    const newCreatures = []
    const theoryBehaviors = state.theoryBehaviors || {}
    const movementBehaviors = getBehaviorsByPriority().filter((b) => {
      if (b.phase === 'post') return false
      // If theory defines behavior toggles, respect them
      if (theoryBehaviors[b.id]?.enabled === false) return false
      return true
    })

    const worldState = {
      foodItems,
      predators,
      creatures,
      variables: state.variables,
      time: newTime,
    }

    creatures = creatures
      .map((c) => {
        let { x, z, angle, dirTimer, nextDirChange, energy, size } = c
        const traits = c.traits
        const cSpeed = traits.speed
        const metabolism = traits.metabolism || 1.0

        // 1. Reduce energy (metabolism)
        const energyCost = 0.12 * metabolism * (1 + (cSpeed - 1) * 0.15) * (1 + (size - 0.3) * 0.5)
        energy -= energyCost * dt

        // 2. Run movement behaviors by priority (first match wins)
        let speedMultiplier = 1.0
        let behaviorResult = null

        for (const behavior of movementBehaviors) {
          if (behavior.condition(c, worldState)) {
            behaviorResult = behavior.execute(c, worldState, dt)
            break
          }
        }

        // Apply movement behavior result
        if (behaviorResult) {
          if (behaviorResult.angle !== undefined) angle = behaviorResult.angle
          if (behaviorResult.dirTimer !== undefined) dirTimer = behaviorResult.dirTimer
          if (behaviorResult.nextDirChange !== undefined) nextDirChange = behaviorResult.nextDirChange
          if (behaviorResult.speedMultiplier) speedMultiplier = behaviorResult.speedMultiplier

          // Eating
          if (behaviorResult.ate) {
            foodItems = foodItems.filter((f) => f.id !== behaviorResult.ate.foodId)
            energy = Math.min(energy + behaviorResult.ate.energyGain, 100)
            size = Math.min(size + 0.005, traits.size * 1.5)
          }
        }

        // 3. Move
        const moveSpeed = cSpeed * dt * speedMultiplier
        let newX = x + Math.cos(angle) * moveSpeed
        let newZ = z + Math.sin(angle) * moveSpeed

        if (Math.abs(newX) > 35) { angle = Math.PI - angle; newX = x }
        if (Math.abs(newZ) > 35) { angle = -angle; newZ = z }
        if (isInWater(newX, newZ)) { angle += Math.PI * (0.5 + Math.random()); newX = x; newZ = z }

        const terrainY = getTerrainHeight(newX, newZ)

        // 4. Reproduce if energy > 80 (runs independently of movement behaviors)
        if (energy > 80) {
          energy -= 30
          const childTraits = mutateTraits(traits, state.variables.mutationRate)
          const cx = newX + (Math.random() - 0.5) * 2
          const cz = newZ + (Math.random() - 0.5) * 2
          newCreatures.push(createCreature({
            x: cx,
            z: cz,
            y: getTerrainHeight(cx, cz) + childTraits.size * 0.8,
            energy: 40,
            generation: c.generation + 1,
            traits: childTraits,
          }))
        }

        return {
          ...c,
          x: newX, z: newZ, y: terrainY + size * 0.8,
          angle, dirTimer, nextDirChange, energy, size,
          color: hslToString(traits.color),
          speed: cSpeed,
        }
      })
      .filter((c) => c.energy > 0)

    const deathsThisTick = state.creatures.length - creatures.length
    const birthsThisTick = newCreatures.length

    creatures = [...creatures, ...newCreatures]

    // Respawn food based on foodAbundance
    const tickInt = Math.floor(newTime)
    const prevTickInt = Math.floor(state.time)
    if (tickInt > prevTickInt && tickInt % 3 === 0) {
      const spawnCount = Math.max(1, Math.floor(state.variables.foodAbundance / 15))
      const newFood = Array.from({ length: spawnCount }, () => createFoodItem())
      foodItems = [...foodItems, ...newFood]
    }

    // Update generation: every 300 ticks = new generation
    const prevGenTick = Math.floor(state.time / 300)
    const newGenTick = Math.floor(newTime / 300)
    let newGen = state.generation
    if (newGenTick > prevGenTick) {
      newGen = state.generation + 1
    }

    // Population history (keep last 300 entries, sample every ~0.5 ticks)
    let popHistory = state.populationHistory
    if (tickInt > prevTickInt) {
      popHistory = [...popHistory, creatures.length].slice(-300)
    }

    // Birth/death rolling window (last 100 ticks)
    let birthLog = [...state._birthLog, { t: newTime, count: birthsThisTick }]
      .filter((e) => newTime - e.t < 100)
    let deathLog = [...state._deathLog, { t: newTime, count: deathsThisTick }]
      .filter((e) => newTime - e.t < 100)

    const recentBirths = birthLog.reduce((s, e) => s + e.count, 0)
    const recentDeaths = deathLog.reduce((s, e) => s + e.count, 0)

    set({
      time: newTime,
      creatures,
      foodItems,
      predators,
      generation: newGen,
      populationHistory: popHistory,
      recentBirths,
      recentDeaths,
      _birthLog: birthLog,
      _deathLog: deathLog,
    })
  },
}))

export default useStore
