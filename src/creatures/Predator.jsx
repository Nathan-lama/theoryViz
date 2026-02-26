import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Predator({ data }) {
    const groupRef = useRef()
    const { x, y, z, angle, size } = data

    useFrame(({ clock }) => {
        if (!groupRef.current) return
        const pos = groupRef.current.position

        pos.x += (x - pos.x) * 0.15
        pos.y += (y - pos.y) * 0.15
        pos.z += (z - pos.z) * 0.15

        // Menacing bob
        const bounce = Math.abs(Math.sin(clock.getElapsedTime() * 3)) * 0.06
        pos.y += bounce

        // Smooth rotation
        const targetRotY = -angle + Math.PI / 2
        let diff = targetRotY - groupRef.current.rotation.y
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        groupRef.current.rotation.y += diff * 0.12
    })

    const eyeOffset = size * 0.35
    const eyeY = size * 0.2
    const eyeZ = size * 0.7
    const toothSize = size * 0.12

    return (
        <group ref={groupRef} position={[x, y, z]}>
            {/* Body — dark red/black */}
            <mesh scale={[1.1, 0.85, 1]} castShadow>
                <sphereGeometry args={[size, 10, 8]} />
                <meshStandardMaterial
                    color="#4A0000"
                    roughness={0.5}
                    flatShading
                />
            </mesh>

            {/* Darker belly overlay */}
            <mesh scale={[0.95, 0.6, 0.9]} position={[0, -size * 0.15, 0]}>
                <sphereGeometry args={[size, 8, 6]} />
                <meshStandardMaterial color="#2A0000" roughness={0.7} flatShading />
            </mesh>

            {/* Left eye (red) */}
            <mesh position={[-eyeOffset, eyeY, eyeZ]}>
                <sphereGeometry args={[size * 0.18, 8, 6]} />
                <meshStandardMaterial color="#FF1744" emissive="#FF1744" emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[-eyeOffset, eyeY, eyeZ + size * 0.12]}>
                <sphereGeometry args={[size * 0.1, 6, 6]} />
                <meshStandardMaterial color="#111111" />
            </mesh>

            {/* Right eye (red) */}
            <mesh position={[eyeOffset, eyeY, eyeZ]}>
                <sphereGeometry args={[size * 0.18, 8, 6]} />
                <meshStandardMaterial color="#FF1744" emissive="#FF1744" emissiveIntensity={0.6} />
            </mesh>
            <mesh position={[eyeOffset, eyeY, eyeZ + size * 0.12]}>
                <sphereGeometry args={[size * 0.1, 6, 6]} />
                <meshStandardMaterial color="#111111" />
            </mesh>

            {/* Teeth — 3 white cones in front */}
            <mesh position={[-toothSize * 1.2, -size * 0.2, eyeZ + size * 0.1]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[toothSize * 0.5, toothSize * 1.5, 4]} />
                <meshStandardMaterial color="#EEEEEE" flatShading />
            </mesh>
            <mesh position={[0, -size * 0.25, eyeZ + size * 0.15]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[toothSize * 0.6, toothSize * 1.8, 4]} />
                <meshStandardMaterial color="#EEEEEE" flatShading />
            </mesh>
            <mesh position={[toothSize * 1.2, -size * 0.2, eyeZ + size * 0.1]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[toothSize * 0.5, toothSize * 1.5, 4]} />
                <meshStandardMaterial color="#EEEEEE" flatShading />
            </mesh>

            {/* Left leg */}
            <mesh position={[-size * 0.35, -size * 0.65, 0]}>
                <cylinderGeometry args={[size * 0.12, size * 0.15, size * 0.5, 6]} />
                <meshStandardMaterial color="#3A0000" roughness={0.7} />
            </mesh>

            {/* Right leg */}
            <mesh position={[size * 0.35, -size * 0.65, 0]}>
                <cylinderGeometry args={[size * 0.12, size * 0.15, size * 0.5, 6]} />
                <meshStandardMaterial color="#3A0000" roughness={0.7} />
            </mesh>
        </group>
    )
}
