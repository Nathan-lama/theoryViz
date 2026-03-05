import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { isInWater } from './water'
import { getTerrainHeight } from '../terrain-utils'
import { registerWorldObject } from '../registry'

const FACTORY_COLORS = ['#616161', '#757575', '#546E7A', '#455A64']

function Factories({ count = 8 }) {
    const bodyRef = useRef()
    const roofRef = useRef()
    const chimneyRef = useRef()
    const smokeRef = useRef()

    const bodyGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
    const roofGeo = useMemo(() => new THREE.BoxGeometry(1.1, 0.15, 1.1), [])
    const chimneyGeo = useMemo(() => new THREE.CylinderGeometry(0.08, 0.1, 0.8, 6), [])
    const smokeGeo = useMemo(() => new THREE.SphereGeometry(0.12, 6, 4), [])

    const factories = useMemo(() => {
        const items = []
        for (let i = 0; i < count; i++) {
            let x, z, y
            let attempts = 0
            do {
                x = (Math.random() - 0.5) * 60
                z = (Math.random() - 0.5) * 60
                y = getTerrainHeight(x, z)
                attempts++
            } while ((isInWater(x, z) || y < 0.3) && attempts < 50)
            if (attempts >= 50) continue

            const scale = 0.8 + Math.random() * 0.6
            const height = 0.8 + Math.random() * 0.6
            items.push({
                x, z, y,
                rotY: Math.random() * Math.PI * 2,
                scale,
                height,
                color: FACTORY_COLORS[Math.floor(Math.random() * FACTORY_COLORS.length)],
                chimneyCount: 1 + Math.floor(Math.random() * 2),
            })
        }
        return items
    }, [count])

    // Set up instanced transforms
    useMemo(() => {
        if (!bodyRef.current || !roofRef.current || !chimneyRef.current) return

        const tempMatrix = new THREE.Matrix4()
        const tempColor = new THREE.Color()

        let chimneyIdx = 0

        factories.forEach((f, i) => {
            // Body
            tempMatrix.identity()
            tempMatrix.makeRotationY(f.rotY)
            tempMatrix.setPosition(f.x, f.y + f.height * 0.5, f.z)
            tempMatrix.scale(new THREE.Vector3(f.scale, f.height, f.scale))
            bodyRef.current.setMatrixAt(i, tempMatrix)
            tempColor.set(f.color)
            bodyRef.current.setColorAt(i, tempColor)

            // Roof
            tempMatrix.identity()
            tempMatrix.makeRotationY(f.rotY)
            tempMatrix.setPosition(f.x, f.y + f.height + 0.075, f.z)
            tempMatrix.scale(new THREE.Vector3(f.scale, 1, f.scale))
            roofRef.current.setMatrixAt(i, tempMatrix)
            tempColor.set('#37474F')
            roofRef.current.setColorAt(i, tempColor)

            // Chimneys
            for (let c = 0; c < f.chimneyCount && chimneyIdx < count * 2; c++) {
                const offsetX = (c === 0 ? -0.2 : 0.2) * f.scale
                tempMatrix.identity()
                tempMatrix.setPosition(
                    f.x + Math.cos(f.rotY) * offsetX,
                    f.y + f.height + 0.4,
                    f.z + Math.sin(f.rotY) * offsetX
                )
                tempMatrix.scale(new THREE.Vector3(f.scale, 1, f.scale))
                chimneyRef.current.setMatrixAt(chimneyIdx, tempMatrix)
                tempColor.set('#424242')
                chimneyRef.current.setColorAt(chimneyIdx, tempColor)
                chimneyIdx++
            }
        })

        bodyRef.current.instanceMatrix.needsUpdate = true
        if (bodyRef.current.instanceColor) bodyRef.current.instanceColor.needsUpdate = true
        roofRef.current.instanceMatrix.needsUpdate = true
        if (roofRef.current.instanceColor) roofRef.current.instanceColor.needsUpdate = true
        chimneyRef.current.instanceMatrix.needsUpdate = true
        if (chimneyRef.current.instanceColor) chimneyRef.current.instanceColor.needsUpdate = true

        // Hide unused chimney instances
        for (let j = chimneyIdx; j < count * 2; j++) {
            tempMatrix.identity()
            tempMatrix.setPosition(0, -100, 0)
            chimneyRef.current.setMatrixAt(j, tempMatrix)
        }
        chimneyRef.current.instanceMatrix.needsUpdate = true
    }, [factories])

    // Animate smoke puffs
    useFrame(({ clock }) => {
        if (!smokeRef.current) return
        const time = clock.getElapsedTime()
        const tempMatrix = new THREE.Matrix4()
        const tempColor = new THREE.Color('#9E9E9E')

        let smokeIdx = 0
        factories.forEach((f) => {
            for (let c = 0; c < f.chimneyCount && smokeIdx < count * 2; c++) {
                const offsetX = (c === 0 ? -0.2 : 0.2) * f.scale
                const rise = (time * 0.3 + smokeIdx * 1.7) % 2
                const fadeScale = 0.3 + rise * 0.5

                tempMatrix.identity()
                tempMatrix.setPosition(
                    f.x + Math.cos(f.rotY) * offsetX + Math.sin(time * 0.5 + smokeIdx) * 0.15,
                    f.y + f.height + 0.8 + rise * 1.5,
                    f.z + Math.sin(f.rotY) * offsetX + Math.cos(time * 0.3 + smokeIdx) * 0.1
                )
                tempMatrix.scale(new THREE.Vector3(fadeScale, fadeScale, fadeScale))
                smokeRef.current.setMatrixAt(smokeIdx, tempMatrix)
                smokeRef.current.setColorAt(smokeIdx, tempColor)
                smokeIdx++
            }
        })

        // Hide unused
        for (let j = smokeIdx; j < count * 2; j++) {
            tempMatrix.identity()
            tempMatrix.setPosition(0, -100, 0)
            smokeRef.current.setMatrixAt(j, tempMatrix)
        }

        smokeRef.current.instanceMatrix.needsUpdate = true
        if (smokeRef.current.instanceColor) smokeRef.current.instanceColor.needsUpdate = true
    })

    return (
        <group>
            <instancedMesh ref={bodyRef} args={[bodyGeo, undefined, count]} castShadow receiveShadow>
                <meshStandardMaterial roughness={0.85} flatShading vertexColors />
            </instancedMesh>
            <instancedMesh ref={roofRef} args={[roofGeo, undefined, count]}>
                <meshStandardMaterial roughness={0.9} flatShading vertexColors />
            </instancedMesh>
            <instancedMesh ref={chimneyRef} args={[chimneyGeo, undefined, count * 2]} castShadow>
                <meshStandardMaterial roughness={0.9} flatShading vertexColors />
            </instancedMesh>
            <instancedMesh ref={smokeRef} args={[smokeGeo, undefined, count * 2]}>
                <meshStandardMaterial
                    transparent
                    opacity={0.35}
                    roughness={1}
                    vertexColors
                />
            </instancedMesh>
        </group>
    )
}

registerWorldObject({
    id: 'factories',
    label: 'Usines',
    component: Factories,
    defaultCount: 0,
    minCount: 0,
    maxCount: 30,
    category: 'construction',
    enabledByDefault: false,
    theoryOverrides: {
        marxisme: { label: 'Moyens de production', defaultCount: 10, enabledByDefault: true },
    },
})
