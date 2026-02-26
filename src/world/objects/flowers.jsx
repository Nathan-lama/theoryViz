import { useMemo } from 'react'
import { isInWater } from './water'
import { registerWorldObject } from '../registry'

function getTerrainHeight(x, z) {
    return (
        Math.sin(x * 0.15) * Math.cos(z * 0.15) * 2 +
        Math.sin(x * 0.3 + z * 0.2) * 0.8
    )
}

const FLOWER_COLORS = ['#FF69B4', '#FFD700', '#DA70D6', '#FF6B6B', '#87CEEB', '#FFA07A']

function Flowers() {
    const flowers = useMemo(() => {
        const items = []
        for (let i = 0; i < 60; i++) {
            let x, z
            do {
                x = (Math.random() - 0.5) * 65
                z = (Math.random() - 0.5) * 65
            } while (isInWater(x, z))
            const y = getTerrainHeight(x, z)
            items.push({
                pos: [x, y + 0.08, z],
                color: FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)],
                size: 0.03 + Math.random() * 0.04,
            })
        }
        return items
    }, [])

    const bushes = useMemo(() => {
        const items = []
        for (let i = 0; i < 20; i++) {
            let x, z
            do {
                x = (Math.random() - 0.5) * 65
                z = (Math.random() - 0.5) * 65
            } while (isInWater(x, z))
            const y = getTerrainHeight(x, z)
            const scale = 0.3 + Math.random() * 0.3
            items.push({
                pos: [x, y + scale * 0.4, z],
                scale,
                color: ['#2E7D32', '#388E3C', '#1B5E20'][Math.floor(Math.random() * 3)],
            })
        }
        return items
    }, [])

    return (
        <group>
            {flowers.map((f, i) => (
                <mesh key={`flower-${i}`} position={f.pos}>
                    <sphereGeometry args={[f.size, 6, 4]} />
                    <meshStandardMaterial
                        color={f.color}
                        emissive={f.color}
                        emissiveIntensity={0.5}
                        roughness={0.6}
                    />
                </mesh>
            ))}
            {bushes.map((b, i) => (
                <mesh key={`bush-${i}`} position={b.pos} castShadow>
                    <sphereGeometry args={[b.scale, 7, 5]} />
                    <meshStandardMaterial color={b.color} roughness={0.85} flatShading />
                </mesh>
            ))}
        </group>
    )
}

registerWorldObject({
    id: 'flowers',
    label: 'Fleurs & Buissons',
    component: Flowers,
    defaultCount: 60,
    minCount: 0,
    maxCount: 150,
    category: 'décor',
    enabledByDefault: true,
    theoryOverrides: {},
})
