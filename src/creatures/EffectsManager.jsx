import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import useStore from '../core/store'

// ── Death burst: small spheres scatter outward and fade ──
function DeathBurst({ position, color }) {
    const groupRef = useRef()
    const [alive, setAlive] = useState(true)
    const particles = useRef(
        Array.from({ length: 6 }, () => ({
            dir: [
                (Math.random() - 0.5) * 2,
                Math.random() * 1.5 + 0.5,
                (Math.random() - 0.5) * 2,
            ],
            offset: [0, 0, 0],
            opacity: 1,
        }))
    )
    const age = useRef(0)

    useFrame((_, delta) => {
        if (!alive) return
        age.current += delta
        if (age.current > 0.8) { setAlive(false); return }

        const t = age.current / 0.8
        particles.current.forEach((p) => {
            p.offset[0] = p.dir[0] * t * 0.8
            p.offset[1] = p.dir[1] * t * 0.8
            p.offset[2] = p.dir[2] * t * 0.8
            p.opacity = 1 - t
        })
    })

    if (!alive) return null

    return (
        <group position={position}>
            {particles.current.map((p, i) => (
                <mesh key={i} position={p.offset}>
                    <sphereGeometry args={[0.04, 6, 4]} />
                    <meshStandardMaterial
                        color={color || '#ff6b6b'}
                        transparent
                        opacity={p.opacity}
                        emissive={color || '#ff6b6b'}
                        emissiveIntensity={0.3}
                    />
                </mesh>
            ))}
        </group>
    )
}

// ── Birth pop: scale 0→1 + heart rising ──
function BirthPop({ position }) {
    const heartRef = useRef()
    const [alive, setAlive] = useState(true)
    const age = useRef(0)

    useFrame((_, delta) => {
        if (!alive) return
        age.current += delta
        if (age.current > 1.2) { setAlive(false); return }

        if (heartRef.current) {
            heartRef.current.position.y = age.current * 1.2
            const opacity = Math.max(0, 1 - age.current / 1.2)
            heartRef.current.children.forEach((c) => {
                if (c.material) c.material.opacity = opacity
            })
        }
    })

    if (!alive) return null

    return (
        <group position={position} ref={heartRef}>
            <Billboard>
                <Text
                    fontSize={0.25}
                    color="#FF69B4"
                    anchorX="center"
                    anchorY="middle"
                    material-transparent
                    material-opacity={1}
                    material-depthWrite={false}
                >
                    ♥
                </Text>
            </Billboard>
        </group>
    )
}

// ── Eat pop: "+1" green text rising ──
function EatPop({ position }) {
    const groupRef = useRef()
    const [alive, setAlive] = useState(true)
    const age = useRef(0)

    useFrame((_, delta) => {
        if (!alive) return
        age.current += delta
        if (age.current > 0.8) { setAlive(false); return }

        if (groupRef.current) {
            groupRef.current.position.y = position[1] + age.current * 1.0
        }
    })

    if (!alive) return null

    const opacity = Math.max(0, 1 - age.current / 0.8)

    return (
        <group ref={groupRef} position={position}>
            <Billboard>
                <Text
                    fontSize={0.18}
                    color="#4CAF50"
                    anchorX="center"
                    anchorY="middle"
                    material-transparent
                    material-opacity={opacity}
                    material-depthWrite={false}
                >
                    +1
                </Text>
            </Billboard>
        </group>
    )
}

// ── Effects Manager: detects events from store changes ──
let effectIdCounter = 0

export default function EffectsManager() {
    const [effects, setEffects] = useState([])
    const prevCreatures = useRef(null)
    const prevFood = useRef(null)

    const creatures = useStore((s) => s.creatures)
    const foodItems = useStore((s) => s.foodItems)

    useEffect(() => {
        if (!prevCreatures.current) {
            prevCreatures.current = new Map(creatures.map((c) => [c.id, c]))
            prevFood.current = new Map(foodItems.map((f) => [f.id, f]))
            return
        }

        const newEffects = []
        const currentIds = new Set(creatures.map((c) => c.id))
        const prevMap = prevCreatures.current

        // Detect deaths (was in prev, not in current)
        for (const [id, old] of prevMap) {
            if (!currentIds.has(id)) {
                newEffects.push({
                    id: effectIdCounter++,
                    type: 'death',
                    position: [old.x, old.y, old.z],
                    color: old.color,
                })
            }
        }

        // Detect births (in current, not in prev)
        const prevIds = new Set(prevMap.keys())
        for (const c of creatures) {
            if (!prevIds.has(c.id)) {
                newEffects.push({
                    id: effectIdCounter++,
                    type: 'birth',
                    position: [c.x, c.y, c.z],
                })
            }
        }

        // Detect eaten food
        const currentFoodIds = new Set(foodItems.map((f) => f.id))
        for (const [id, old] of prevFood.current) {
            if (!currentFoodIds.has(id)) {
                newEffects.push({
                    id: effectIdCounter++,
                    type: 'eat',
                    position: old.position,
                })
            }
        }

        if (newEffects.length > 0) {
            setEffects((prev) => [...prev.slice(-30), ...newEffects]) // keep max 30 active
        }

        // Update refs
        prevCreatures.current = new Map(creatures.map((c) => [c.id, c]))
        prevFood.current = new Map(foodItems.map((f) => [f.id, f]))
    }, [creatures, foodItems])

    // Clean up old effects periodically
    useEffect(() => {
        const timer = setInterval(() => {
            setEffects((prev) => prev.slice(-20))
        }, 2000)
        return () => clearInterval(timer)
    }, [])

    return (
        <group>
            {effects.map((e) => {
                switch (e.type) {
                    case 'death':
                        return <DeathBurst key={e.id} position={e.position} color={e.color} />
                    case 'birth':
                        return <BirthPop key={e.id} position={e.position} />
                    case 'eat':
                        return <EatPop key={e.id} position={e.position} />
                    default:
                        return null
                }
            })}
        </group>
    )
}
