// ── SimEngine ────────────────────────────────────────────────────
// Calls tick() on every frame via useFrame. Runs on main thread.

import { useFrame } from '@react-three/fiber'
import useStore from '../core/store'

export default function SimEngine() {
    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.1) // clamp large deltas
        useStore.getState().tick(dt)
    })
    return null
}
