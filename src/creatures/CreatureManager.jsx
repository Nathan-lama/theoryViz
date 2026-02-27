import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../core/store'

const MAX_CREATURES = 300
const MAX_PREDATORS = 30

// Shared geometries (created once)
const bodyGeo = new THREE.SphereGeometry(1, 10, 8)
const eyeWhiteGeo = new THREE.SphereGeometry(1, 8, 6)
const eyePupilGeo = new THREE.SphereGeometry(1, 6, 6)
const legGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.4, 6)

// Predator geometries
const predBodyGeo = new THREE.ConeGeometry(1, 1.6, 8)
const predEyeGeo = new THREE.SphereGeometry(1, 6, 4)

const _dummy = new THREE.Object3D()
const _color = new THREE.Color()

export default function CreatureManager() {
    const bodyRef = useRef()
    const eyeWhiteLRef = useRef()
    const eyeWhiteRRef = useRef()
    const eyePupilLRef = useRef()
    const eyePupilRRef = useRef()
    const legLRef = useRef()
    const legRRef = useRef()

    const predBodyRef = useRef()
    const predEyeLRef = useRef()
    const predEyeRRef = useRef()

    // Smooth positions for lerp
    const smoothPos = useRef(new Map())
    const smoothRot = useRef(new Map())

    const creatures = useStore((s) => s.creatures)
    const predators = useStore((s) => s.predators)

    // Single useFrame for ALL creatures + predators
    useFrame(({ clock }) => {
        const t = clock.getElapsedTime()
        const cList = creatures
        const pList = predators

        // ── Update creature instances ──
        const count = Math.min(cList.length, MAX_CREATURES)
        const sPos = smoothPos.current
        const sRot = smoothRot.current

        for (let i = 0; i < count; i++) {
            const c = cList[i]
            const size = c.size

            // Lerp position
            let sx, sy, sz
            if (sPos.has(c.id)) {
                const sp = sPos.get(c.id)
                sp.x += (c.x - sp.x) * 0.15
                sp.y += (c.y - sp.y) * 0.15
                sp.z += (c.z - sp.z) * 0.15
                sx = sp.x; sy = sp.y; sz = sp.z
            } else {
                sPos.set(c.id, { x: c.x, y: c.y, z: c.z })
                sx = c.x; sy = c.y; sz = c.z
            }

            // Bounce
            const bounce = Math.abs(Math.sin(t * (c.speed || 1) * 5)) * 0.1
            sy += bounce

            // Lerp rotation
            const targetRotY = -c.angle + Math.PI / 2
            let rotY
            if (sRot.has(c.id)) {
                let currentRotY = sRot.get(c.id)
                let diff = targetRotY - currentRotY
                while (diff > Math.PI) diff -= Math.PI * 2
                while (diff < -Math.PI) diff += Math.PI * 2
                currentRotY += diff * 0.1
                sRot.set(c.id, currentRotY)
                rotY = currentRotY
            } else {
                sRot.set(c.id, targetRotY)
                rotY = targetRotY
            }

            // Body (scaled sphere, slightly squished Y)
            _dummy.position.set(sx, sy, sz)
            _dummy.rotation.set(0, rotY, 0)
            _dummy.scale.set(size, size * 0.8, size)
            _dummy.updateMatrix()
            bodyRef.current.setMatrixAt(i, _dummy.matrix)
            _color.set(c.color)
            bodyRef.current.setColorAt(i, _color)

            // Eye measurements
            const eyeOff = size * 0.35
            const eyeY = size * 0.15
            const eyeZ = size * 0.7
            const cosR = Math.cos(rotY)
            const sinR = Math.sin(rotY)

            // Left eye white
            const lEyeLocalX = -eyeOff, lEyeLocalY = eyeY, lEyeLocalZ = eyeZ
            _dummy.position.set(
                sx + lEyeLocalX * cosR + lEyeLocalZ * sinR,
                sy + lEyeLocalY,
                sz - lEyeLocalX * sinR + lEyeLocalZ * cosR
            )
            _dummy.rotation.set(0, 0, 0)
            _dummy.scale.setScalar(size * 0.18)
            _dummy.updateMatrix()
            eyeWhiteLRef.current.setMatrixAt(i, _dummy.matrix)

            // Right eye white
            const rEyeLocalX = eyeOff
            _dummy.position.set(
                sx + rEyeLocalX * cosR + lEyeLocalZ * sinR,
                sy + lEyeLocalY,
                sz - rEyeLocalX * sinR + lEyeLocalZ * cosR
            )
            _dummy.updateMatrix()
            eyeWhiteRRef.current.setMatrixAt(i, _dummy.matrix)

            // Left pupil
            const pupilZ = eyeZ + size * 0.12
            _dummy.position.set(
                sx + lEyeLocalX * cosR + pupilZ * sinR,
                sy + lEyeLocalY,
                sz - lEyeLocalX * sinR + pupilZ * cosR
            )
            _dummy.scale.setScalar(size * 0.09)
            _dummy.updateMatrix()
            eyePupilLRef.current.setMatrixAt(i, _dummy.matrix)

            // Right pupil
            _dummy.position.set(
                sx + rEyeLocalX * cosR + pupilZ * sinR,
                sy + lEyeLocalY,
                sz - rEyeLocalX * sinR + pupilZ * cosR
            )
            _dummy.updateMatrix()
            eyePupilRRef.current.setMatrixAt(i, _dummy.matrix)

            // Left leg
            const legOffX = -size * 0.3
            const legY = -size * 0.65
            _dummy.position.set(
                sx + legOffX * cosR,
                sy + legY,
                sz - legOffX * sinR
            )
            _dummy.rotation.set(0, rotY, 0)
            _dummy.scale.setScalar(size)
            _dummy.updateMatrix()
            legLRef.current.setMatrixAt(i, _dummy.matrix)

            // Right leg
            const legOffXR = size * 0.3
            _dummy.position.set(
                sx + legOffXR * cosR,
                sy + legY,
                sz - legOffXR * sinR
            )
            _dummy.updateMatrix()
            legRRef.current.setMatrixAt(i, _dummy.matrix)
        }

        // Hide unused instances
        _dummy.scale.set(0, 0, 0)
        _dummy.position.set(0, -100, 0)
        _dummy.updateMatrix()
        for (let i = count; i < MAX_CREATURES; i++) {
            bodyRef.current.setMatrixAt(i, _dummy.matrix)
            eyeWhiteLRef.current.setMatrixAt(i, _dummy.matrix)
            eyeWhiteRRef.current.setMatrixAt(i, _dummy.matrix)
            eyePupilLRef.current.setMatrixAt(i, _dummy.matrix)
            eyePupilRRef.current.setMatrixAt(i, _dummy.matrix)
            legLRef.current.setMatrixAt(i, _dummy.matrix)
            legRRef.current.setMatrixAt(i, _dummy.matrix)
        }

        bodyRef.current.instanceMatrix.needsUpdate = true
        if (bodyRef.current.instanceColor) bodyRef.current.instanceColor.needsUpdate = true
        eyeWhiteLRef.current.instanceMatrix.needsUpdate = true
        eyeWhiteRRef.current.instanceMatrix.needsUpdate = true
        eyePupilLRef.current.instanceMatrix.needsUpdate = true
        eyePupilRRef.current.instanceMatrix.needsUpdate = true
        legLRef.current.instanceMatrix.needsUpdate = true
        legRRef.current.instanceMatrix.needsUpdate = true

        // ── Update predator instances ──
        const pCount = Math.min(pList.length, MAX_PREDATORS)

        for (let i = 0; i < pCount; i++) {
            const p = pList[i]
            const s = p.size

            // Lerp predator positions
            let px, py, pz
            const pKey = `pred_${p.id}`
            if (sPos.has(pKey)) {
                const sp = sPos.get(pKey)
                sp.x += (p.x - sp.x) * 0.15
                sp.y += (p.y - sp.y) * 0.15
                sp.z += (p.z - sp.z) * 0.15
                px = sp.x; py = sp.y; pz = sp.z
            } else {
                sPos.set(pKey, { x: p.x, y: p.y, z: p.z })
                px = p.x; py = p.y; pz = p.z
            }

            const rotY = -p.angle + Math.PI / 2

            // Predator body (cone)
            _dummy.position.set(px, py, pz)
            _dummy.rotation.set(0, rotY, 0)
            _dummy.scale.setScalar(s)
            _dummy.updateMatrix()
            predBodyRef.current.setMatrixAt(i, _dummy.matrix)

            // Eyes
            const cosR = Math.cos(rotY)
            const sinR = Math.sin(rotY)
            const eyeOff = s * 0.25
            const eyeZ = s * 0.6
            const eyeY = s * 0.3

            _dummy.rotation.set(0, 0, 0)
            _dummy.scale.setScalar(s * 0.15)

            // Left eye
            _dummy.position.set(
                px - eyeOff * cosR + eyeZ * sinR,
                py + eyeY,
                pz + eyeOff * sinR + eyeZ * cosR
            )
            _dummy.updateMatrix()
            predEyeLRef.current.setMatrixAt(i, _dummy.matrix)

            // Right eye
            _dummy.position.set(
                px + eyeOff * cosR + eyeZ * sinR,
                py + eyeY,
                pz - eyeOff * sinR + eyeZ * cosR
            )
            _dummy.updateMatrix()
            predEyeRRef.current.setMatrixAt(i, _dummy.matrix)
        }

        // Hide unused predator instances
        _dummy.scale.set(0, 0, 0)
        _dummy.position.set(0, -100, 0)
        _dummy.updateMatrix()
        for (let i = pCount; i < MAX_PREDATORS; i++) {
            predBodyRef.current.setMatrixAt(i, _dummy.matrix)
            predEyeLRef.current.setMatrixAt(i, _dummy.matrix)
            predEyeRRef.current.setMatrixAt(i, _dummy.matrix)
        }

        predBodyRef.current.instanceMatrix.needsUpdate = true
        predEyeLRef.current.instanceMatrix.needsUpdate = true
        predEyeRRef.current.instanceMatrix.needsUpdate = true

        // Cleanup stale smooth entries
        if (sPos.size > count + pCount + 50) {
            const activeIds = new Set([
                ...cList.map(c => c.id),
                ...pList.map(p => `pred_${p.id}`)
            ])
            for (const key of sPos.keys()) {
                if (!activeIds.has(key)) sPos.delete(key)
            }
            for (const key of sRot.keys()) {
                if (!activeIds.has(key)) sRot.delete(key)
            }
        }
    })

    return (
        <group>
            {/* Creature bodies */}
            <instancedMesh ref={bodyRef} args={[bodyGeo, undefined, MAX_CREATURES]} castShadow>
                <meshStandardMaterial roughness={0.6} flatShading />
            </instancedMesh>

            {/* Eyes – white */}
            <instancedMesh ref={eyeWhiteLRef} args={[eyeWhiteGeo, undefined, MAX_CREATURES]}>
                <meshStandardMaterial color="white" />
            </instancedMesh>
            <instancedMesh ref={eyeWhiteRRef} args={[eyeWhiteGeo, undefined, MAX_CREATURES]}>
                <meshStandardMaterial color="white" />
            </instancedMesh>

            {/* Eyes – pupils */}
            <instancedMesh ref={eyePupilLRef} args={[eyePupilGeo, undefined, MAX_CREATURES]}>
                <meshStandardMaterial color="#111111" />
            </instancedMesh>
            <instancedMesh ref={eyePupilRRef} args={[eyePupilGeo, undefined, MAX_CREATURES]}>
                <meshStandardMaterial color="#111111" />
            </instancedMesh>

            {/* Legs */}
            <instancedMesh ref={legLRef} args={[legGeo, undefined, MAX_CREATURES]}>
                <meshStandardMaterial color="#888" roughness={0.7} />
            </instancedMesh>
            <instancedMesh ref={legRRef} args={[legGeo, undefined, MAX_CREATURES]}>
                <meshStandardMaterial color="#888" roughness={0.7} />
            </instancedMesh>

            {/* Predator bodies */}
            <instancedMesh ref={predBodyRef} args={[predBodyGeo, undefined, MAX_PREDATORS]} castShadow>
                <meshStandardMaterial color="#D32F2F" roughness={0.5} flatShading />
            </instancedMesh>

            {/* Predator eyes */}
            <instancedMesh ref={predEyeLRef} args={[predEyeGeo, undefined, MAX_PREDATORS]}>
                <meshStandardMaterial color="#FFEB3B" emissive="#FFEB3B" emissiveIntensity={0.3} />
            </instancedMesh>
            <instancedMesh ref={predEyeRRef} args={[predEyeGeo, undefined, MAX_PREDATORS]}>
                <meshStandardMaterial color="#FFEB3B" emissive="#FFEB3B" emissiveIntensity={0.3} />
            </instancedMesh>
        </group>
    )
}
