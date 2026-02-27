import { useEffect, useCallback } from 'react'
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
import TheoryTransition from '../ui/TheoryTransition'
import CinemaCamera from '../core/CinemaCamera'
import AudioManager from '../core/AudioManager'
import useStore from '../core/store'
import { theories } from '../theories'

export default function WorldPage() {
    const { theoryId } = useParams()
    const loadTheory = useStore((s) => s.loadTheory)
    const reset = useStore((s) => s.reset)
    const hudVisible = useStore((s) => s.hudVisible)
    const cinemaMode = useStore((s) => s.cinemaMode)
    const toggleCinema = useStore((s) => s.toggleCinema)
    const toggleHud = useStore((s) => s.toggleHud)

    useEffect(() => {
        reset()
        if (theoryId && theories[theoryId]) {
            useStore.getState()._applyTheory(theories[theoryId])
        } else {
            useStore.getState()._applyTheory(null)
        }
    }, [theoryId])

    // ── Keyboard shortcuts ──
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'h' || e.key === 'H') {
                if (e.shiftKey) {
                    toggleCinema()
                } else {
                    toggleHud()
                }
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [toggleCinema, toggleHud])

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <Canvas
                shadows
                dpr={[1, 2]}
                camera={{ position: [0, 12, 20], fov: 55 }}
                gl={{ preserveDrawingBuffer: true }}
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

                {!cinemaMode && (
                    <OrbitControls
                        autoRotate
                        autoRotateSpeed={0.2}
                        enableDamping
                        dampingFactor={0.05}
                        maxPolarAngle={Math.PI / 2.2}
                    />
                )}
                {cinemaMode && <CinemaCamera />}
            </Canvas>

            {/* ── HUD (hideable) ── */}
            <div style={{
                opacity: hudVisible ? 1 : 0,
                pointerEvents: hudVisible ? 'auto' : 'none',
                transition: 'opacity 0.3s ease',
            }}>
                <ControlPanel />
                <Stats />
                <InfoCard />
            </div>

            {/* ── Bottom bar (always visible) ── */}
            <Timeline />

            {/* ── Cinema mode indicator ── */}
            {cinemaMode && (
                <div style={{
                    position: 'fixed',
                    bottom: 48,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    color: '#4CAF50',
                    padding: '5px 14px',
                    borderRadius: 14,
                    fontSize: 10,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    border: '1px solid rgba(76,175,80,0.3)',
                }}>
                    🎬 Mode Cinéma — Shift+H pour quitter
                </div>
            )}

            {/* ── HUD toggle hint ── */}
            {!hudVisible && !cinemaMode && (
                <div style={{
                    position: 'fixed',
                    bottom: 44,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    background: 'rgba(0,0,0,0.5)',
                    color: 'rgba(255,255,255,0.4)',
                    padding: '4px 14px',
                    borderRadius: 10,
                    fontSize: 10,
                    fontFamily: "'Inter', sans-serif",
                }}>
                    H pour afficher l'interface
                </div>
            )}

            {/* ── Overlays ── */}
            <AudioManager />
            <TheoryTransition />
        </div>
    )
}
