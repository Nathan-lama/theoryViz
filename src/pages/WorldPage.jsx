import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useFrame } from '@react-three/fiber'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import Terrain from '../world/Terrain'
import Sky, { getSunPosition } from '../world/Sky'
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
import { getPreset } from '../world/presets'

// ── Dynamic fog (darkens at night) ──
function WorldFog() {
    const fogRef = useRef()
    const presetId = useStore((s) => s.activePreset || 'forest')
    const preset = getPreset(presetId)
    const fog = preset.fog
    if (!fog) return null

    const baseFogColor = new THREE.Color(fog.color)
    const nightFogColor = new THREE.Color('#0a0a15')

    useFrame(() => {
        if (!fogRef.current) return
        const time = useStore.getState().time
        const sun = getSunPosition(time)
        // Lerp fog color between day and night
        const t = Math.max(0, Math.min(1, sun.height01))
        fogRef.current.color.copy(nightFogColor).lerp(baseFogColor, t)
        // Tighten fog at night
        fogRef.current.near = fog.near * (0.4 + t * 0.6)
        fogRef.current.far = fog.far * (0.5 + t * 0.5)
    })

    return <fog ref={fogRef} attach="fog" args={[fog.color, fog.near, fog.far]} />
}

// ── Dynamic lighting (follows sun, dims at night) ──
function WorldLighting() {
    const dirRef = useRef()
    const ambRef = useRef()
    const presetId = useStore((s) => s.activePreset || 'forest')
    const preset = getPreset(presetId)
    const baseAmbient = preset.ambientLight ?? 0.5
    const baseDir = preset.directionalLight?.intensity ?? 1.2

    useFrame(() => {
        const time = useStore.getState().time
        const sun = getSunPosition(time)
        const t = sun.height01 // 0=horizon, 1=noon

        // Directional light follows sun
        if (dirRef.current) {
            dirRef.current.position.set(sun.x * 0.15, Math.max(sun.y * 0.15, 1), sun.z * 0.15)
            // Intensity fades from full at noon to near-zero at night
            dirRef.current.intensity = baseDir * Math.max(0, t)
            // Warm color at sunrise/sunset, white at noon
            if (t > 0.3) {
                dirRef.current.color.setHex(0xffffff)
            } else if (t > 0) {
                dirRef.current.color.setRGB(1, 0.7 + t, 0.4 + t * 2)
            } else {
                dirRef.current.intensity = 0
            }
        }
        // Ambient: dim at night but not zero (moonlight)
        if (ambRef.current) {
            const nightAmbient = 0.08
            ambRef.current.intensity = nightAmbient + (baseAmbient - nightAmbient) * Math.max(0, t)
            // Bluish tint at night
            if (sun.isNight) {
                ambRef.current.color.setRGB(0.4, 0.5, 0.8)
            } else {
                ambRef.current.color.setRGB(1, 1, 1)
            }
        }
    })

    return (
        <>
            <ambientLight ref={ambRef} intensity={baseAmbient} />
            <directionalLight
                ref={dirRef}
                position={[15, 15, 10]}
                intensity={baseDir}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
            />
        </>
    )
}

export default function WorldPage() {
    const { theoryId } = useParams()
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

                <WorldFog />
                <WorldLighting />

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
