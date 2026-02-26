import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { registerWorldObject } from '../registry'

const PARTICLE_COUNT = 200

function Particles() {
    const pointsRef = useRef()

    const positions = useMemo(() => {
        const arr = new Float32Array(PARTICLE_COUNT * 3)
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            arr[i * 3] = (Math.random() - 0.5) * 70
            arr[i * 3 + 1] = Math.random() * 15 + 1
            arr[i * 3 + 2] = (Math.random() - 0.5) * 70
        }
        return arr
    }, [])

    const speeds = useMemo(() => {
        return Array.from({ length: PARTICLE_COUNT }, () => 0.02 + Math.random() * 0.04)
    }, [])

    const drifts = useMemo(() => {
        return Array.from({ length: PARTICLE_COUNT }, () => ({
            x: (Math.random() - 0.5) * 0.01,
            z: (Math.random() - 0.5) * 0.01,
        }))
    }, [])

    useFrame(() => {
        if (!pointsRef.current) return
        const pos = pointsRef.current.geometry.attributes.position.array

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            pos[i * 3 + 1] += speeds[i]
            pos[i * 3] += drifts[i].x
            pos[i * 3 + 2] += drifts[i].z

            if (pos[i * 3 + 1] > 18) {
                pos[i * 3] = (Math.random() - 0.5) * 70
                pos[i * 3 + 1] = 0.5
                pos[i * 3 + 2] = (Math.random() - 0.5) * 70
            }
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true
    })

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={PARTICLE_COUNT}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                color="#ffffff"
                size={0.07}
                transparent
                opacity={0.4}
                sizeAttenuation
                depthWrite={false}
            />
        </points>
    )
}

registerWorldObject({
    id: 'particles',
    label: 'Particules',
    component: Particles,
    defaultCount: 200,
    minCount: 0,
    maxCount: 500,
    category: 'décor',
    enabledByDefault: true,
    theoryOverrides: {},
})
