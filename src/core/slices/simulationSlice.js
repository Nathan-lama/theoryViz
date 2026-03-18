// ── Simulation Slice ────────────────────────────────────────────
// State container for the simulation. The actual tick() logic has been
// moved to the Web Worker (sim-worker.js). This slice now only manages
// state + forwards user actions to the worker.

import {
  createInitialCreatures,
  createInitialFood,
} from '../factories'

// Lazy import to avoid circular deps at module load time
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

  // Actions — forward to worker
  setSpeed: (s) => {
    set({ speed: s })
    forwardToWorker({ type: 'setSpeed', speed: s })
  },

  setVariable: (key, value) => {
    set((state) => ({
      variables: { ...state.variables, [key]: value },
    }))
    forwardToWorker({ type: 'setVariable', key, value })
  },

  spawnFood: (count) => {
    // No-op on main thread; food spawning happens in the worker
  },

  removeFood: (id) => {
    // No-op on main thread
  },

  spawnCreature: (props) => {
    // No-op on main thread
  },

  removeCreature: (id) => {
    // No-op on main thread
  },

  nextGeneration: () =>
    set((state) => ({ generation: state.generation + 1 })),

  reset: () => {
    const newState = {
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
      variables: {
        foodAbundance: 50,
        predatorCount: 0,
        climate: 50,
        mutationRate: 10,
        resources: 50,
      },
    }
    set(newState)
    forwardToWorker({ type: 'reset', state: { ...newState, theoryBehaviors: get().theoryBehaviors || {} } })
  },

  // tick is no longer called from main thread — the worker handles it.
  // SimEngine applies worker state snapshots via useStore.setState().
  tick: () => {},
})
