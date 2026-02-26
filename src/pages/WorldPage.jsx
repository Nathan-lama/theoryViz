import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Terrain from '../world/Terrain'
import Sky from '../world/Sky'
import WorldRenderer from '../world/WorldRenderer'
import PostProcessing from '../core/PostProcessing'
import CreatureManager from '../creatures/CreatureManager'
import EffectsManager from '../creatures/EffectsManager'
import Food from '../world/Food'
import SimEngine from '../simulation/SimEngine'
import ControlPanel from '../ui/ControlPanel'
import Timeline from '../ui/Timeline'
import Stats from '../ui/Stats'
import InfoCard from '../ui/InfoCard'
import useStore from '../core/store'
import { theories } from '../theories'

export default function WorldPage() {
    const { theoryId } = useParams()
    const loadTheory = useStore((s) => s.loadTheory)
    const reset = useStore((s) => s.reset)

    useEffect(() => {
        reset()
        if (theoryId && theories[theoryId]) {
            loadTheory(theories[theoryId])
        } else {
            loadTheory(null)
        }
    }, [theoryId])

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <Canvas
                shadows
                dpr={[1, 2]}
                camera={{ position: [0, 12, 20], fov: 55 }}
            >
                <SimEngine />

                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[15, 15, 10]}
                    intensity={1.2}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />

                <Sky />
                <Terrain />
                <WorldRenderer />
                <Food />
                <CreatureManager />
                <EffectsManager />

                <PostProcessing />

                <OrbitControls
                    autoRotate
                    autoRotateSpeed={0.2}
                    enableDamping
                    dampingFactor={0.05}
                    maxPolarAngle={Math.PI / 2.2}
                />
            </Canvas>
            <ControlPanel />
            <Timeline />
            <Stats />
            <InfoCard />
        </div>
    )
}
