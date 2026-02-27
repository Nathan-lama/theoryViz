// ── Store ────────────────────────────────────────────────────────
// Thin combiner: merges all slices into a single Zustand store.
// Each slice is in its own file under core/slices/ for maintainability.

import { create } from 'zustand'
import '../world/objects'  // trigger world object registrations

import { uiSlice } from './slices/uiSlice'
import { worldSlice } from './slices/worldSlice'
import { theorySlice } from './slices/theorySlice'
import { simulationSlice } from './slices/simulationSlice'

const useStore = create((...a) => ({
  ...simulationSlice(...a),
  ...uiSlice(...a),
  ...worldSlice(...a),
  ...theorySlice(...a),
}))

export default useStore
