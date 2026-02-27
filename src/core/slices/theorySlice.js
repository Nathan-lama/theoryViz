// ── Theory Slice ────────────────────────────────────────────────
// Manages: activeTheory, theoryVariables, theoryConfig, theoryBehaviors, transitions
// Uses get() to access simulation state for resets

import { getWorldObjects } from '../../world/registry'
import { randomTraits } from '../../creatures/traits'
import {
  createInitialCreatures,
  createInitialFood,
  createCreature,
} from '../factories'

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

export const theorySlice = (set, get) => ({
  activeTheory: null,
  theoryVariables: {},
  theoryConfig: {},
  theoryBehaviors: {},
  _transitionRequest: null,

  loadTheory: (config) => {
    const title = config?.title || 'Monde Libre'
    const color = config?.palette?.primary || '#A5D6A7'
    const description = config?.description || ''
    set({ _transitionRequest: { title, color, description } })
    setTimeout(() => {
      get()._applyTheory(config)
    }, 350)
  },

  _applyTheory: (config) => {
    if (!config) {
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
})
