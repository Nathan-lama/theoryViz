// ── World Slice ─────────────────────────────────────────────────
// Manages: worldObjects registry state + active world preset

import { getWorldObjects } from '../../world/registry'
import { getPreset } from '../../world/presets'
import { setActiveHeightmap } from '../../world/terrain-utils'

// Lazy worker forwarding
let sendToWorkerFn = null
function forwardToWorker(msg) {
  if (!sendToWorkerFn) {
    import('../../simulation/SimEngine.js').then((mod) => {
      sendToWorkerFn = mod.sendToWorker
      sendToWorkerFn(msg)
    })
  } else {
    sendToWorkerFn(msg)
  }
}

export const worldSlice = (set) => ({
  worldObjects: (() => {
    const objs = {}
    try {
      getWorldObjects().forEach((o) => {
        objs[o.id] = { enabled: o.enabledByDefault !== false, count: o.defaultCount || 0 }
      })
    } catch (e) { /* registry may not be loaded yet */ }
    return objs
  })(),

  // Active preset ID (persisted separately from theory for user overrides)
  activePreset: 'forest',

  setPreset: (presetId) => {
    const preset = getPreset(presetId)
    setActiveHeightmap(preset.heightmap)

    // Apply preset's default objects
    const objs = {}
    getWorldObjects().forEach((o) => {
      const presetDefault = preset.defaultObjects?.[o.id]
      if (presetDefault) {
        objs[o.id] = {
          enabled: presetDefault.enabled !== undefined ? presetDefault.enabled : (o.enabledByDefault !== false),
          count: presetDefault.count !== undefined ? presetDefault.count : (o.defaultCount || 0),
        }
      } else {
        objs[o.id] = { enabled: o.enabledByDefault !== false, count: o.defaultCount || 0 }
      }
    })
    // Handle water
    if (objs.water && preset.water === false) {
      objs.water = { enabled: false, count: 0 }
    }

    set({ activePreset: presetId, worldObjects: objs })
    // Forward preset change to worker so its heightmap stays in sync
    forwardToWorker({ type: 'setPreset', presetId })
  },

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
})
