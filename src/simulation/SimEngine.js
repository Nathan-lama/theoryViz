// ── SimEngine ────────────────────────────────────────────────────
// Bridge between the simulation Web Worker and the Zustand store.
// The worker runs the tick loop; SimEngine relays state updates
// and forwards user actions (speed, variables, preset, reset).

import { useEffect, useRef } from 'react'
import useStore from '../core/store'

let worker = null
let workerReady = false

function getWorker() {
    if (!worker) {
        worker = new Worker(
            new URL('./sim-worker.js', import.meta.url),
            { type: 'module' }
        )
        worker.onmessage = (e) => {
            if (e.data.type === 'tick') {
                const s = e.data.state
                useStore.setState({
                    time: s.time,
                    creatures: s.creatures,
                    foodItems: s.foodItems,
                    predators: s.predators,
                    generation: s.generation,
                    populationHistory: s.populationHistory,
                    recentBirths: s.recentBirths,
                    recentDeaths: s.recentDeaths,
                    _birthLog: s._birthLog,
                    _deathLog: s._deathLog,
                })
            }
        }
    }
    return worker
}

export function sendToWorker(msg) {
    getWorker().postMessage(msg)
}

export function initWorker(state, presetId) {
    const w = getWorker()
    w.postMessage({
        type: 'init',
        state: {
            time: state.time,
            speed: state.speed,
            creatures: state.creatures,
            foodItems: state.foodItems,
            predators: state.predators,
            variables: state.variables,
            generation: state.generation,
            populationHistory: state.populationHistory,
            recentBirths: state.recentBirths,
            recentDeaths: state.recentDeaths,
            _birthLog: state._birthLog,
            _deathLog: state._deathLog,
            theoryBehaviors: state.theoryBehaviors || {},
        },
        presetId: presetId || state.activePreset || 'forest',
    })
    workerReady = true
}

export default function SimEngine() {
    const initialized = useRef(false)

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true
            const state = useStore.getState()
            initWorker(state, state.activePreset)
        }
    }, [])

    return null // No visual output — pure bridge
}
