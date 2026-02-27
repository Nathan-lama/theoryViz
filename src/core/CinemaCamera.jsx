import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import useStore from '../core/store'

/**
 * CinemaCamera — When cinemaMode is active, takes over camera control
 * with slow orbiting and occasional zooms on random creatures.
 */
export default function CinemaCamera() {
    const cinemaMode = useStore((s) => s.cinemaMode)
    const creatures = useStore((s) => s.creatures)
    const { camera } = useThree()

    const stateRef = useRef({
        time: 0,
        phase: 'overview', // 'overview' | 'zoom'
        phaseTimer: 0,
        targetCreature: null,
        savedPosition: null,
        savedTarget: null,
    })

    // Save/restore camera position when entering/leaving cinema mode
    useEffect(() => {
        if (cinemaMode) {
            stateRef.current.savedPosition = camera.position.clone()
            stateRef.current.phase = 'overview'
            stateRef.current.phaseTimer = 0
            stateRef.current.time = 0
        }
    }, [cinemaMode])

    useFrame((_, delta) => {
        if (!cinemaMode) return

        const s = stateRef.current
        s.time += delta
        s.phaseTimer += delta

        if (s.phase === 'overview') {
            // Slow orbit around center
            const radius = 28
            const height = 16
            const speed = 0.08
            const angle = s.time * speed
            camera.position.set(
                Math.cos(angle) * radius,
                height + Math.sin(s.time * 0.15) * 3,
                Math.sin(angle) * radius
            )
            camera.lookAt(0, 0, 0)

            // Switch to zoom after 8s
            if (s.phaseTimer > 8 && creatures.length > 0) {
                s.phase = 'zoom'
                s.phaseTimer = 0
                s.targetCreature = creatures[Math.floor(Math.random() * creatures.length)]
            }
        } else if (s.phase === 'zoom') {
            // Zoom on a creature
            const target = s.targetCreature
            if (target && creatures.find(c => c.id === target.id)) {
                const tx = target.x
                const tz = target.z
                const ty = (target.y || 0) + 1

                // Smooth approach
                const camX = tx + Math.cos(s.time * 0.3) * 4
                const camZ = tz + Math.sin(s.time * 0.3) * 4
                const camY = ty + 2.5

                camera.position.lerp({ x: camX, y: camY, z: camZ }, 0.02)
                camera.lookAt(tx, ty, tz)
            }

            // Switch back to overview after 6s
            if (s.phaseTimer > 6) {
                s.phase = 'overview'
                s.phaseTimer = 0
                s.targetCreature = null
            }
        }
    })

    return null
}
