import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../core/store'

const FRUIT_COLORS = { fruit: '#E53935', grain: '#FDD835' }

function FoodItem({ item }) {
    const meshRef = useRef()

    useFrame(({ clock }) => {
        if (!meshRef.current) return
        const t = clock.getElapsedTime()
        // Gentle bob up and down
        meshRef.current.position.y =
            item.position[1] + Math.sin(t * 2 + item.id) * 0.05
        // Slow spin
        meshRef.current.rotation.y += 0.01
    })

    const color = FRUIT_COLORS[item.type] || '#E53935'
    const size = 0.08 + (item.id % 5) * 0.015 // 0.08 to 0.14

    return (
        <mesh ref={meshRef} position={item.position} castShadow>
            {item.type === 'grain' ? (
                <boxGeometry args={[size, size, size]} />
            ) : (
                <sphereGeometry args={[size, 6, 5]} />
            )}
            <meshStandardMaterial
                color={color}
                roughness={0.5}
                emissive={color}
                emissiveIntensity={0.15}
            />
        </mesh>
    )
}

export default function Food() {
    const foodItems = useStore((s) => s.foodItems)

    return (
        <group>
            {foodItems.map((item) => (
                <FoodItem key={item.id} item={item} />
            ))}
        </group>
    )
}
