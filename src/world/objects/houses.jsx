import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { isInWater } from './water'
import { registerWorldObject } from '../registry'

function getTerrainHeight(x, z) {
    return (
        Math.sin(x * 0.15) * Math.cos(z * 0.15) * 2 +
        Math.sin(x * 0.3 + z * 0.2) * 0.8
    )
}

const WALL_COLORS = ['#FFCC80', '#FFAB91', '#CE93D8', '#80DEEA']

function Houses({ count = 15 }) {
    const houses = useMemo(() => {
        const items = []
        for (let i = 0; i < count; i++) {
            let x, z, y
            let attempts = 0
            do {
                x = (Math.random() - 0.5) * 65
                z = (Math.random() - 0.5) * 65
                y = getTerrainHeight(x, z)
                attempts++
            } while ((isInWater(x, z) || y < 0.2) && attempts < 50)
            if (attempts >= 50) continue

            const scale = 0.4 + Math.random() * 0.4
            items.push({
                pos: [x, y, z],
                rotY: Math.random() * Math.PI * 2,
                scale,
                wallColor: WALL_COLORS[Math.floor(Math.random() * WALL_COLORS.length)],
                hasChimney: Math.random() > 0.5,
            })
        }
        return items
    }, [count])

    return (
        <group>
            {houses.map((h, i) => (
                <group key={i} position={h.pos} rotation={[0, h.rotY, 0]} scale={h.scale}>
                    {/* Base / walls */}
                    <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
                        <boxGeometry args={[1, 0.8, 1]} />
                        <meshStandardMaterial color={h.wallColor} roughness={0.85} flatShading />
                    </mesh>

                    {/* Roof */}
                    <mesh position={[0, 1.1, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                        <coneGeometry args={[0.8, 0.6, 4]} />
                        <meshStandardMaterial color="#8D6E63" roughness={0.9} flatShading />
                    </mesh>

                    {/* Door */}
                    <mesh position={[0, 0.2, 0.51]}>
                        <boxGeometry args={[0.2, 0.35, 0.05]} />
                        <meshStandardMaterial color="#4E342E" roughness={0.95} />
                    </mesh>

                    {/* Window left */}
                    <mesh position={[-0.25, 0.5, 0.51]}>
                        <boxGeometry args={[0.15, 0.15, 0.05]} />
                        <meshStandardMaterial
                            color="#FFF9C4"
                            emissive="#FFF9C4"
                            emissiveIntensity={0.6}
                            roughness={0.5}
                        />
                    </mesh>

                    {/* Window right */}
                    <mesh position={[0.25, 0.5, 0.51]}>
                        <boxGeometry args={[0.15, 0.15, 0.05]} />
                        <meshStandardMaterial
                            color="#FFF9C4"
                            emissive="#FFF9C4"
                            emissiveIntensity={0.6}
                            roughness={0.5}
                        />
                    </mesh>

                    {/* Chimney (optional) */}
                    {h.hasChimney && (
                        <mesh position={[0.25, 1.45, -0.15]} castShadow>
                            <cylinderGeometry args={[0.06, 0.08, 0.35, 6]} />
                            <meshStandardMaterial color="#5D4037" roughness={0.95} flatShading />
                        </mesh>
                    )}
                </group>
            ))}
        </group>
    )
}

registerWorldObject({
    id: 'houses',
    label: 'Maisons',
    component: Houses,
    defaultCount: 15,
    minCount: 0,
    maxCount: 50,
    category: 'construction',
    enabledByDefault: false,
    theoryOverrides: {
        marxisme: { label: 'Logements ouvriers', defaultCount: 30, enabledByDefault: true },
        evolution: { label: 'Abris', defaultCount: 5 },
    },
})
