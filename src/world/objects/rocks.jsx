import { useMemo } from 'react'
import { isInWater } from './water'
import { registerWorldObject } from '../registry'

import { getTerrainHeight } from '../terrain-utils'

const ROCK_COLORS = ['#5A5A5A', '#6B6B6B', '#4A4A4A', '#7A7A7A']

function Rocks() {
    const rocks = useMemo(() => {
        const items = []
        for (let i = 0; i < 30; i++) {
            let x, z
            do {
                x = (Math.random() - 0.5) * 70
                z = (Math.random() - 0.5) * 70
            } while (isInWater(x, z))
            const y = getTerrainHeight(x, z)
            items.push({
                pos: [x, y + 0.05, z],
                scale: [
                    0.3 + Math.random() * 0.5,
                    0.15 + Math.random() * 0.2,
                    0.3 + Math.random() * 0.5,
                ],
                rotation: [Math.random() * 0.3, Math.random() * Math.PI * 2, Math.random() * 0.3],
                color: ROCK_COLORS[Math.floor(Math.random() * ROCK_COLORS.length)],
            })
        }
        return items
    }, [])

    return (
        <group>
            {rocks.map((r, i) => (
                <mesh key={`rock-${i}`} position={r.pos} scale={r.scale} rotation={r.rotation} receiveShadow castShadow>
                    <dodecahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial color={r.color} roughness={0.95} flatShading />
                </mesh>
            ))}
        </group>
    )
}

registerWorldObject({
    id: 'rocks',
    label: 'Rochers',
    component: Rocks,
    defaultCount: 30,
    minCount: 0,
    maxCount: 100,
    category: 'nature',
    enabledByDefault: true,
    theoryOverrides: {},
})
