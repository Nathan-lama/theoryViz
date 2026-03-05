import { useMemo } from 'react'
import * as THREE from 'three'
import useStore from '../core/store'
import { getTerrainHeight } from './terrain-utils'
import { getPreset } from './presets'

export default function Terrain() {
    const presetId = useStore((s) => s.activePreset || 'forest')
    const preset = getPreset(presetId)

    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(80, 80, 128, 128)
        geo.rotateX(-Math.PI / 2)

        const pos = geo.attributes.position
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i)
            const z = pos.getZ(i)
            pos.setY(i, getTerrainHeight(x, z))
        }

        geo.computeVertexNormals()
        return geo
    }, [presetId])

    return (
        <mesh geometry={geometry} receiveShadow>
            <meshStandardMaterial
                color={preset.terrainColor}
                roughness={preset.terrainRoughness ?? 0.9}
                flatShading
            />
        </mesh>
    )
}
