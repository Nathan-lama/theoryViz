// ── World Slice ─────────────────────────────────────────────────
// Manages: worldObjects registry state

import { getWorldObjects } from '../../world/registry'

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
