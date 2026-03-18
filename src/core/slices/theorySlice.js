// ── Theory Slice ────────────────────────────────────────────────
// Manages: activeTheory, theoryVariables, theoryConfig, theoryBehaviors, transitions
// Uses get() to access simulation state for resets.
// Forwards preset and behavior changes to the simulation worker.

import { getWorldObjects } from '../../world/registry'
import { randomTraits } from '../../creatures/traits'
import { getPreset } from '../../world/presets'
import { setActiveHeightmap } from '../../world/terrain-utils'
import {
  createInitialCreatures,
  createInitialFood,
  createCreature,
} from '../factories'

// Lazy worker forwarding to avoid circular deps
let sendToWorkerFn = null
let initWorkerFn = null
function forwardToWorker(msg) {
  if (!sendToWorkerFn) {
    import('../../simulation/SimEngine.js').then((mod) => {
      sendToWorkerFn = mod.sendToWorker
      initWorkerFn = mod.initWorker
      sendToWorkerFn(msg)
    })
  } else {
    sendToWorkerFn(msg)
  }
}

function reinitWorker(state, presetId) {
  if (!initWorkerFn) {
    import('../../simulation/SimEngine.js').then((mod) => {
      initWorkerFn = mod.initWorker
      initWorkerFn(state, presetId)
    })
  } else {
    initWorkerFn(state, presetId)
  }
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

function activatePreset(presetId) {
  const preset = getPreset(presetId)
  setActiveHeightmap(preset.heightmap)
  return preset
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
    // Activate the world preset's heightmap on main thread (for rendering)
    const presetId = config?.world?.preset || 'forest'
    const preset = activatePreset(presetId)

    if (!config) {
      const objs = {}
      getWorldObjects().forEach((o) => {
        const presetObj = preset.defaultObjects?.[o.id]
        if (presetObj) {
          objs[o.id] = {
            enabled: presetObj.enabled !== undefined ? presetObj.enabled : (o.enabledByDefault !== false),
            count: presetObj.count !== undefined ? presetObj.count : (o.defaultCount || 0),
          }
        } else {
          objs[o.id] = { enabled: o.enabledByDefault !== false, count: o.defaultCount || 0 }
        }
      })
      if (objs.water && preset.water === false) {
        objs.water = { enabled: false, count: 0 }
      }
      const newState = {
        activePreset: presetId,
        activeTheory: null,
        theoryVariables: {},
        theoryConfig: {},
        theoryBehaviors: {},
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
      }
      set(newState)
      // Re-init worker with new state + preset
      reinitWorker(newState, presetId)
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

    // 2. Apply world objects (config overrides > preset defaults > registry defaults)
    const objs = {}
    const registeredObjects = getWorldObjects()
    registeredObjects.forEach((o) => {
      const configOverride = config.world?.objects?.[o.id]
      const presetDefault = preset.defaultObjects?.[o.id]

      if (configOverride) {
        objs[o.id] = {
          enabled: configOverride.enabled !== undefined ? configOverride.enabled : (o.enabledByDefault !== false),
          count: configOverride.count !== undefined ? configOverride.count : (o.defaultCount || 0),
        }
      } else if (presetDefault) {
        objs[o.id] = {
          enabled: presetDefault.enabled !== undefined ? presetDefault.enabled : (o.enabledByDefault !== false),
          count: presetDefault.count !== undefined ? presetDefault.count : (o.defaultCount || 0),
        }
      } else {
        objs[o.id] = { enabled: o.enabledByDefault !== false, count: o.defaultCount || 0 }
      }
    })
    if (objs.water && preset.water === false) {
      objs.water = { enabled: false, count: 0 }
    }

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
    const newState = {
      activePreset: presetId,
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
    }
    set(newState)
    // Re-init worker with new state + preset
    reinitWorker(newState, presetId)
  },
})
