import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { isInWater } from './water'
import { registerWorldObject } from '../registry'

const FOLIAGE_COLORS = ['#2E7D32', '#388E3C', '#43A047', '#4CAF50']

import { getTerrainHeight } from '../terrain-utils'

function Trees({ count = 80 }) {
    const trunkRef = useRef()
    const foliageRef = useRef()

    const trees = useMemo(() => {
        const items = []
        for (let i = 0; i < count; i++) {
            let x, z
            do {
                x = (Math.random() - 0.5) * 70
                z = (Math.random() - 0.5) * 70
            } while (isInWater(x, z))

            const y = getTerrainHeight(x, z)
            const scale = 0.6 + Math.random() * 0.8
            const rotY = Math.random() * Math.PI * 2
            const colorIndex = Math.floor(Math.random() * FOLIAGE_COLORS.length)
            items.push({ x, y, z, scale, rotY, colorIndex })
        }
        return items
    }, [count])

    const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.15, 0.25, 1.5, 8), [])
    const foliageGeo = useMemo(() => new THREE.SphereGeometry(0.8, 6, 5), [])

    useEffect(() => {
        const dummy = new THREE.Object3D()
        const color = new THREE.Color()

        trees.forEach((tree, i) => {
            dummy.position.set(tree.x, tree.y + 0.75 * tree.scale, tree.z)
            dummy.rotation.set(0, tree.rotY, 0)
            dummy.scale.setScalar(tree.scale)
            dummy.updateMatrix()
            trunkRef.current.setMatrixAt(i, dummy.matrix)

            dummy.position.set(tree.x, tree.y + 1.8 * tree.scale, tree.z)
            dummy.updateMatrix()
            foliageRef.current.setMatrixAt(i, dummy.matrix)

            color.set(FOLIAGE_COLORS[tree.colorIndex])
            foliageRef.current.setColorAt(i, color)
        })

        trunkRef.current.instanceMatrix.needsUpdate = true
        foliageRef.current.instanceMatrix.needsUpdate = true
        foliageRef.current.instanceColor.needsUpdate = true
    }, [trees])

    return (
        <group>
            <instancedMesh ref={trunkRef} args={[trunkGeo, undefined, count]} castShadow>
                <meshStandardMaterial color="#5D4037" roughness={0.9} />
            </instancedMesh>
            <instancedMesh ref={foliageRef} args={[foliageGeo, undefined, count]} castShadow>
                <meshStandardMaterial roughness={0.8} flatShading />
            </instancedMesh>
        </group>
    )
}

registerWorldObject({
    id: 'trees',
    label: 'Arbres',
    component: Trees,
    defaultCount: 80,
    minCount: 0,
    maxCount: 200,
    category: 'nature',
    enabledByDefault: true,
    theoryOverrides: {
        marxisme: { label: 'Forêts (ressources naturelles)', defaultCount: 40 },
    },
})
