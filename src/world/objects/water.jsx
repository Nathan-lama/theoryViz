import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { registerWorldObject } from '../registry'

// ── isInWater utility (exported for other components) ──
function createLakeShape() {
    const shape = new THREE.Shape()
    const points = 32
    const baseRadius = 12

    for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2
        const r =
            baseRadius +
            Math.sin(angle * 2) * 3 +
            Math.sin(angle * 3.7) * 1.5 +
            Math.cos(angle * 5.1) * 0.8
        const x = Math.cos(angle) * r
        const y = Math.sin(angle) * r

        if (i === 0) {
            shape.moveTo(x, y)
        } else {
            shape.lineTo(x, y)
        }
    }
    return shape
}

export function isInWater(x, z) {
    const baseRadius = 12
    const angle = Math.atan2(z, x)
    const r =
        baseRadius +
        Math.sin(angle * 2) * 3 +
        Math.sin(angle * 3.7) * 1.5 +
        Math.cos(angle * 5.1) * 0.8
    const dist = Math.sqrt(x * x + z * z)
    return dist < r - 1
}

function Water() {
    const meshRef = useRef()

    const geometry = useMemo(() => {
        const shape = createLakeShape()
        return new THREE.ShapeGeometry(shape, 48)
    }, [])

    useFrame(({ clock }) => {
        if (!meshRef.current) return
        const time = clock.getElapsedTime()
        const pos = meshRef.current.geometry.attributes.position

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i)
            const y = pos.getY(i)
            pos.setZ(i, Math.sin(time + x * 0.3) * 0.06 + Math.cos(time * 0.8 + y * 0.4) * 0.04)
        }
        pos.needsUpdate = true
    })

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.2, 0]}
        >
            <meshStandardMaterial
                color="#1565C0"
                transparent
                opacity={0.6}
                roughness={0.2}
                metalness={0.1}
                side={THREE.DoubleSide}
            />
        </mesh>
    )
}

registerWorldObject({
    id: 'water',
    label: 'Eau',
    component: Water,
    defaultCount: 1,
    minCount: 0,
    maxCount: 1,
    category: 'nature',
    enabledByDefault: true,
    theoryOverrides: {},
})
