import { useMemo, useRef } from 'react'
import * as THREE from 'three'

export default function Terrain() {
    const meshRef = useRef()

    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(80, 80, 128, 128)
        geo.rotateX(-Math.PI / 2)

        const pos = geo.attributes.position
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i)
            const z = pos.getZ(i)
            const y =
                Math.sin(x * 0.15) * Math.cos(z * 0.15) * 2 +
                Math.sin(x * 0.3 + z * 0.2) * 0.8
            pos.setY(i, y)
        }

        geo.computeVertexNormals()
        return geo
    }, [])

    return (
        <mesh ref={meshRef} geometry={geometry} receiveShadow>
            <meshStandardMaterial
                color="#2d5a1e"
                roughness={0.9}
                flatShading
            />
        </mesh>
    )
}
