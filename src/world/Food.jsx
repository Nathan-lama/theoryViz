import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useStore from '../core/store'

const MAX_FOOD = 200

const fruitGeo = new THREE.SphereGeometry(1, 6, 5)
const grainGeo = new THREE.BoxGeometry(1, 1, 1)

const _dummy = new THREE.Object3D()
const _color = new THREE.Color()

const FRUIT_COLOR = '#E53935'
const GRAIN_COLOR = '#FDD835'

export default function Food() {
    const fruitRef = useRef()
    const grainRef = useRef()

    const foodItems = useStore((s) => s.foodItems)

    useFrame(({ clock }) => {
        if (!fruitRef.current || !grainRef.current) return

        const t = clock.getElapsedTime()
        const items = foodItems

        let fruitIdx = 0
        let grainIdx = 0

        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            const size = 0.08 + (item.id % 5) * 0.015

            const bob = Math.sin(t * 2 + item.id) * 0.05
            const spinY = t * 1.0 + item.id * 0.5

            _dummy.position.set(
                item.position[0],
                item.position[1] + bob,
                item.position[2]
            )
            _dummy.rotation.set(0, spinY, 0)
            _dummy.scale.setScalar(size)
            _dummy.updateMatrix()

            if (item.type === 'grain') {
                grainRef.current.setMatrixAt(grainIdx, _dummy.matrix)
                grainIdx++
            } else {
                fruitRef.current.setMatrixAt(fruitIdx, _dummy.matrix)
                fruitIdx++
            }
        }

        // Hide unused instances
        _dummy.scale.set(0, 0, 0)
        _dummy.position.set(0, -100, 0)
        _dummy.updateMatrix()

        for (let i = fruitIdx; i < MAX_FOOD; i++) {
            fruitRef.current.setMatrixAt(i, _dummy.matrix)
        }
        for (let i = grainIdx; i < MAX_FOOD; i++) {
            grainRef.current.setMatrixAt(i, _dummy.matrix)
        }

        fruitRef.current.instanceMatrix.needsUpdate = true
        grainRef.current.instanceMatrix.needsUpdate = true
    })

    return (
        <group>
            <instancedMesh ref={fruitRef} args={[fruitGeo, undefined, MAX_FOOD]} castShadow>
                <meshStandardMaterial
                    color={FRUIT_COLOR}
                    roughness={0.5}
                    emissive={FRUIT_COLOR}
                    emissiveIntensity={0.15}
                />
            </instancedMesh>
            <instancedMesh ref={grainRef} args={[grainGeo, undefined, MAX_FOOD]} castShadow>
                <meshStandardMaterial
                    color={GRAIN_COLOR}
                    roughness={0.5}
                    emissive={GRAIN_COLOR}
                    emissiveIntensity={0.15}
                />
            </instancedMesh>
        </group>
    )
}
