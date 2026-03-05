// ── Minecraft-style sky ──────────────────────────────────────────
// Clean gradient dome, square sun, square moon, stars at night.
// Timing proportions like Minecraft:
//   Day ~2min, Night ~1.4min, Sunrise/Sunset ~18sec each
//   Total cycle ~4 min at 1× speed

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import useStore from '../core/store'
import { getPreset } from './presets'

// ── Timing (in sim-time ticks ≈ seconds at 1× speed) ──
const SUNRISE_DUR = 18
const DAY_DUR = 120
const SUNSET_DUR = 18
const NIGHT_DUR = 84
const TOTAL_CYCLE = SUNRISE_DUR + DAY_DUR + SUNSET_DUR + NIGHT_DUR // 240

// Angle ranges for each phase (sun orbits in a circle)
// 0→π = above horizon (day), π→2π = below horizon (night)
const SUNRISE_ANGLE_START = 0
const SUNRISE_ANGLE_END = Math.PI / 12       // narrow band rising
const DAY_ANGLE_START = Math.PI / 12
const DAY_ANGLE_END = 11 * Math.PI / 12  // wide arc across sky
const SUNSET_ANGLE_START = 11 * Math.PI / 12
const SUNSET_ANGLE_END = Math.PI             // narrow band setting
const NIGHT_ANGLE_START = Math.PI
const NIGHT_ANGLE_END = Math.PI * 2         // full lower arc

const SUN_DISTANCE = 200
const SUN_SIZE = 12
const MOON_SIZE = 10

// ── Sky gradient colors ──
const DAY_TOP = new THREE.Color('#4A90D9')
const DAY_BOTTOM = new THREE.Color('#87CEEB')
const SUNSET_TOP = new THREE.Color('#2A1A4E')
const SUNSET_BOTTOM = new THREE.Color('#D4701E')
const NIGHT_TOP = new THREE.Color('#0B0B1A')
const NIGHT_BOTTOM = new THREE.Color('#151525')

// ── Map sim-time → sun angle with Minecraft proportions ──
function getAngle(time) {
    const t = ((time % TOTAL_CYCLE) + TOTAL_CYCLE) % TOTAL_CYCLE
    if (t < SUNRISE_DUR) {
        // Sunrise phase
        const p = t / SUNRISE_DUR
        return SUNRISE_ANGLE_START + p * (SUNRISE_ANGLE_END - SUNRISE_ANGLE_START)
    } else if (t < SUNRISE_DUR + DAY_DUR) {
        // Day phase
        const p = (t - SUNRISE_DUR) / DAY_DUR
        return DAY_ANGLE_START + p * (DAY_ANGLE_END - DAY_ANGLE_START)
    } else if (t < SUNRISE_DUR + DAY_DUR + SUNSET_DUR) {
        // Sunset phase
        const p = (t - SUNRISE_DUR - DAY_DUR) / SUNSET_DUR
        return SUNSET_ANGLE_START + p * (SUNSET_ANGLE_END - SUNSET_ANGLE_START)
    } else {
        // Night phase
        const p = (t - SUNRISE_DUR - DAY_DUR - SUNSET_DUR) / NIGHT_DUR
        return NIGHT_ANGLE_START + p * (NIGHT_ANGLE_END - NIGHT_ANGLE_START)
    }
}

function getPhase(time) {
    const t = ((time % TOTAL_CYCLE) + TOTAL_CYCLE) % TOTAL_CYCLE
    if (t < SUNRISE_DUR) return 'sunrise'
    if (t < SUNRISE_DUR + DAY_DUR) return 'day'
    if (t < SUNRISE_DUR + DAY_DUR + SUNSET_DUR) return 'sunset'
    return 'night'
}

function getPhaseProgress(time) {
    const t = ((time % TOTAL_CYCLE) + TOTAL_CYCLE) % TOTAL_CYCLE
    if (t < SUNRISE_DUR) return t / SUNRISE_DUR
    if (t < SUNRISE_DUR + DAY_DUR) return (t - SUNRISE_DUR) / DAY_DUR
    if (t < SUNRISE_DUR + DAY_DUR + SUNSET_DUR) return (t - SUNRISE_DUR - DAY_DUR) / SUNSET_DUR
    return (t - SUNRISE_DUR - DAY_DUR - SUNSET_DUR) / NIGHT_DUR
}

export default function Sky() {
    const domeRef = useRef()
    const sunRef = useRef()
    const moonRef = useRef()
    const starsRef = useRef()
    const presetId = useStore((s) => s.activePreset || 'forest')

    // ── Square sun texture (pixel art) ──
    const sunTexture = useMemo(() => {
        const size = 16
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#D4871E'
        ctx.fillRect(0, 0, size, size)
        ctx.fillStyle = '#F5D442'
        ctx.fillRect(2, 2, size - 4, size - 4)
        ctx.fillStyle = '#FFEEBB'
        ctx.fillRect(4, 4, size - 8, size - 8)
        const tex = new THREE.CanvasTexture(canvas)
        tex.magFilter = THREE.NearestFilter
        tex.minFilter = THREE.NearestFilter
        return tex
    }, [])

    // ── Square moon texture (bright white, pixel art) ──
    const moonTexture = useMemo(() => {
        const size = 16
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        // White-ish base
        ctx.fillStyle = '#F0F0FF'
        ctx.fillRect(0, 0, size, size)
        // Pure white center
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(2, 2, size - 4, size - 4)
        // Craters (light gray, subtle)
        ctx.fillStyle = '#C8C8E0'
        ctx.fillRect(4, 5, 3, 3)
        ctx.fillRect(10, 7, 2, 2)
        ctx.fillRect(6, 10, 3, 2)
        const tex = new THREE.CanvasTexture(canvas)
        tex.magFilter = THREE.NearestFilter
        tex.minFilter = THREE.NearestFilter
        return tex
    }, [])

    // ── Gradient sky dome shader ──
    const skyMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            side: THREE.BackSide,
            depthWrite: false,
            uniforms: {
                uTopColor: { value: DAY_TOP.clone() },
                uBottomColor: { value: DAY_BOTTOM.clone() },
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uTopColor;
                uniform vec3 uBottomColor;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition).y;
                    float t = clamp(h * 0.5 + 0.5, 0.0, 1.0);
                    t = pow(t, 0.6);
                    gl_FragColor = vec4(mix(uBottomColor, uTopColor, t), 1.0);
                }
            `,
        })
    }, [])

    const topColor = useMemo(() => new THREE.Color(), [])
    const bottomColor = useMemo(() => new THREE.Color(), [])

    useFrame((state) => {
        const time = useStore.getState().time
        const angle = getAngle(time)
        const sinA = Math.sin(angle)
        const phase = getPhase(time)
        const progress = getPhaseProgress(time)

        // Sun orbit
        const sunX = Math.cos(angle) * SUN_DISTANCE
        const sunY = Math.sin(angle) * SUN_DISTANCE
        const sunZ = 40

        // ── Sky gradient ──
        if (domeRef.current) {
            switch (phase) {
                case 'sunrise':
                    topColor.copy(NIGHT_TOP).lerp(DAY_TOP, progress)
                    bottomColor.copy(SUNSET_BOTTOM).lerp(DAY_BOTTOM, progress)
                    break
                case 'day':
                    topColor.copy(DAY_TOP)
                    bottomColor.copy(DAY_BOTTOM)
                    break
                case 'sunset':
                    topColor.copy(DAY_TOP).lerp(SUNSET_TOP, progress)
                    bottomColor.copy(DAY_BOTTOM).lerp(SUNSET_BOTTOM, progress)
                    break
                case 'night':
                    topColor.copy(SUNSET_TOP).lerp(NIGHT_TOP, Math.min(1, progress * 3))
                    bottomColor.copy(SUNSET_BOTTOM).lerp(NIGHT_BOTTOM, Math.min(1, progress * 3))
                    break
            }
            skyMaterial.uniforms.uTopColor.value.copy(topColor)
            skyMaterial.uniforms.uBottomColor.value.copy(bottomColor)
        }

        // ── Sun ──
        if (sunRef.current) {
            sunRef.current.position.set(sunX, sunY, sunZ)
            sunRef.current.lookAt(state.camera.position)
            sunRef.current.visible = sinA > -0.05
        }

        // ── Moon (opposite side) ──
        if (moonRef.current) {
            moonRef.current.position.set(-sunX, -sunY, sunZ)
            moonRef.current.lookAt(state.camera.position)
            moonRef.current.visible = sinA < 0.1
        }

        // ── Stars ──
        if (starsRef.current) {
            const isNight = phase === 'night'
            const isSunset = phase === 'sunset'
            let starOpacity = 0
            if (isNight) starOpacity = Math.min(1, progress * 4)
            else if (isSunset && progress > 0.7) starOpacity = (progress - 0.7) / 0.3
            starsRef.current.material.opacity = starOpacity
            starsRef.current.material.transparent = true
        }
    })

    return (
        <>
            {/* Gradient sky dome */}
            <mesh ref={domeRef} scale={[400, 400, 400]}>
                <sphereGeometry args={[1, 32, 32]} />
                <primitive object={skyMaterial} attach="material" />
            </mesh>

            {/* ☀ Square sun */}
            <mesh ref={sunRef}>
                <planeGeometry args={[SUN_SIZE, SUN_SIZE]} />
                <meshBasicMaterial
                    map={sunTexture}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                />
            </mesh>

            {/* 🌙 Square moon — toneMapped false to prevent darkening */}
            <mesh ref={moonRef}>
                <planeGeometry args={[MOON_SIZE, MOON_SIZE]} />
                <meshBasicMaterial
                    map={moonTexture}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                />
            </mesh>

            {/* ✨ Stars */}
            <Stars
                ref={starsRef}
                radius={150}
                depth={50}
                count={1500}
                factor={3}
                saturation={0}
                fade
                speed={0.3}
            />
        </>
    )
}

// ── Export for lighting sync (WorldPage.jsx) ──
export function getSunPosition(time) {
    const angle = getAngle(time)
    return {
        x: Math.cos(angle) * SUN_DISTANCE,
        y: Math.sin(angle) * SUN_DISTANCE,
        z: 40,
        height01: Math.max(0, Math.sin(angle)),
        isNight: getPhase(time) === 'night',
    }
}
