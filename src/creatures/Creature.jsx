import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Creature({ data }) {
    const groupRef = useRef()
    const trailRef = useRef([])
    const { x, y, z, angle, color, size, energy, traits } = data

    const bodyColor = new THREE.Color(color)
    const isfast = (traits?.speed || 1) > 1.5

    // Smooth visual interpolation + bounce + trail
    useFrame(({ clock }) => {
        if (!groupRef.current) return
        const pos = groupRef.current.position

        // Store old position for trail
        if (isfast) {
            trailRef.current.push({ x: pos.x, y: pos.y, z: pos.z })
            if (trailRef.current.length > 4) trailRef.current.shift()
        }

        // Lerp toward simulation position
        pos.x += (x - pos.x) * 0.15
        pos.y += (y - pos.y) * 0.15
        pos.z += (z - pos.z) * 0.15

        // Bounce
        const bounce = Math.abs(Math.sin(clock.getElapsedTime() * (data.speed || 1) * 5)) * 0.1
        pos.y += bounce

        // Smooth rotation toward movement angle
        const targetRotY = -angle + Math.PI / 2
        const currentRotY = groupRef.current.rotation.y
        let diff = targetRotY - currentRotY
        while (diff > Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        groupRef.current.rotation.y += diff * 0.1
    })

    const eyeOffset = size * 0.35
    const eyeY = size * 0.15
    const eyeZ = size * 0.7

    // Opacity based on energy (fades when dying)
    const opacity = Math.max(0.3, Math.min(1, energy / 20))

    return (
        <group ref={groupRef} position={[x, y, z]}>
            {/* Body */}
            <mesh scale={[1, 0.8, 1]} castShadow>
                <sphereGeometry args={[size, 10, 8]} />
                <meshStandardMaterial
                    color={bodyColor}
                    roughness={0.6}
                    flatShading
                    transparent={opacity < 1}
                    opacity={opacity}
                />
            </mesh>

            {/* Speed trail for fast creatures */}
            {isfast && trailRef.current.map((tp, i) => (
                <mesh
                    key={i}
                    position={[
                        tp.x - groupRef.current?.position.x || 0,
                        tp.y - groupRef.current?.position.y || 0,
                        tp.z - groupRef.current?.position.z || 0,
                    ]}
                >
                    <sphereGeometry args={[size * 0.3 * ((i + 1) / 4), 6, 4]} />
                    <meshStandardMaterial
                        color={bodyColor}
                        transparent
                        opacity={0.15 * ((i + 1) / 4)}
                    />
                </mesh>
            ))}

            {/* Left eye */}
            <mesh position={[-eyeOffset, eyeY, eyeZ]}>
                <sphereGeometry args={[size * 0.18, 8, 6]} />
                <meshStandardMaterial color="white" />
            </mesh>
            <mesh position={[-eyeOffset, eyeY, eyeZ + size * 0.12]}>
                <sphereGeometry args={[size * 0.09, 6, 6]} />
                <meshStandardMaterial color="#111111" />
            </mesh>

            {/* Right eye */}
            <mesh position={[eyeOffset, eyeY, eyeZ]}>
                <sphereGeometry args={[size * 0.18, 8, 6]} />
                <meshStandardMaterial color="white" />
            </mesh>
            <mesh position={[eyeOffset, eyeY, eyeZ + size * 0.12]}>
                <sphereGeometry args={[size * 0.09, 6, 6]} />
                <meshStandardMaterial color="#111111" />
            </mesh>

            {/* Left leg */}
            <mesh position={[-size * 0.3, -size * 0.65, 0]}>
                <cylinderGeometry args={[size * 0.1, size * 0.12, size * 0.4, 6]} />
                <meshStandardMaterial color={bodyColor} roughness={0.7} />
            </mesh>

            {/* Right leg */}
            <mesh position={[size * 0.3, -size * 0.65, 0]}>
                <cylinderGeometry args={[size * 0.1, size * 0.12, size * 0.4, 6]} />
                <meshStandardMaterial color={bodyColor} roughness={0.7} />
            </mesh>
        </group>
    )
}
