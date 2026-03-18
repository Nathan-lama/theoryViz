import { useMemo } from 'react'
import * as THREE from 'three'
import { isInWater } from './water'
import { registerWorldObject } from '../registry'
import { getTerrainHeight } from '../terrain-utils'
import useStore from '../../core/store'

const WALL_COLORS = ['#FFCC80', '#FFAB91', '#CE93D8', '#80DEEA']
const HOBBIT_DOOR_COLORS = ['#2E7D32', '#1B5E20', '#1565C0', '#C62828', '#F9A825']
const FENCE_COLOR = '#6D4C2E'
const GRASS = '#4d8a2a'
const GRASS_DARK = '#3d6e22'
const STONE = '#8B7D6B'
const BRICK = '#9E7E5A'
const WOOD_DARK = '#3E2718'
const WOOD_FRAME = '#5C4030'

function Houses({ count = 15 }) {
    const presetId = useStore((s) => s.activePreset || 'forest')
    const isShire = presetId === 'shire'

    const houses = useMemo(() => {
        const items = []
        for (let i = 0; i < count; i++) {
            let x, z, y, slopeAngle
            let attempts = 0
            do {
                x = (Math.random() - 0.5) * 55
                z = (Math.random() - 0.5) * 55
                y = getTerrainHeight(x, z)
                attempts++
            } while ((isInWater(x, z) || y < 1.0) && attempts < 50)
            if (attempts >= 50) continue

            if (isShire) {
                const dx = getTerrainHeight(x + 0.5, z) - getTerrainHeight(x - 0.5, z)
                const dz = getTerrainHeight(x, z + 0.5) - getTerrainHeight(x, z - 0.5)
                slopeAngle = Math.atan2(-dz, -dx)
            }

            items.push({
                pos: [x, y, z],
                rotY: isShire ? slopeAngle : Math.random() * Math.PI * 2,
                scale: isShire ? 1 : 0.4 + Math.random() * 0.4,
                wallColor: WALL_COLORS[Math.floor(Math.random() * WALL_COLORS.length)],
                doorColor: HOBBIT_DOOR_COLORS[Math.floor(Math.random() * HOBBIT_DOOR_COLORS.length)],
                hasChimney: Math.random() > 0.25,
                hasFence: Math.random() > 0.35,
                variant: Math.floor(Math.random() * 3),
            })
        }
        return items
    }, [count, isShire])

    return (
        <group>
            {houses.map((h, i) => (
                <group key={i} position={h.pos} rotation={[0, h.rotY, 0]} scale={h.scale}>
                    {isShire ? (
                        <HobbitHole doorColor={h.doorColor} hasChimney={h.hasChimney} hasFence={h.hasFence} />
                    ) : (
                        <RegularHouse wallColor={h.wallColor} hasChimney={h.hasChimney} />
                    )}
                </group>
            ))}
            {isShire && <ShirePath />}
        </group>
    )
}

// ═══════════════════════════════════════════════════════════════════
// HOBBIT HOLE — Based on the reference image
//
// Structure (front to back):
//   Stone stepping path → Stone foundation → Big round door
//   with brick arch → Round windows on sides → Wide grassy
//   dome above → Curving grassy side slopes → Chimney on top
// ═══════════════════════════════════════════════════════════════════
function HobbitHole({ doorColor, hasChimney, hasFence }) {
    return (
        <group position={[0, -0.5, 0]}>

            {/* ====================================================
                GRASSY DOME — wide, low, with flowers
               ==================================================== */}

            {/* Main dome (wide ellipsoid — wider than tall) */}
            <mesh position={[0, 0, -0.5]} scale={[1.4, 0.7, 1.0]} castShadow receiveShadow>
                <sphereGeometry args={[2.2, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={GRASS} roughness={0.95} flatShading />
            </mesh>

            {/* Extended back hill volume */}
            <mesh position={[0, 0, -2.0]} scale={[1.2, 0.6, 1.0]} castShadow receiveShadow>
                <sphereGeometry args={[2.0, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={GRASS} roughness={0.95} flatShading />
            </mesh>

            {/* ====================================================
                GRASSY SIDE SLOPES — curve inward toward the door
                (the iconic "embracing" shape from the reference)
               ==================================================== */}

            {/* Left grassy slope curving inward */}
            <mesh position={[-1.6, 0.15, 0.5]} rotation={[0, 0.6, -0.3]} castShadow>
                <boxGeometry args={[1.5, 0.7, 1.8]} />
                <meshStandardMaterial color={GRASS} roughness={0.95} flatShading />
            </mesh>
            {/* Left slope top (rounded) */}
            <mesh position={[-1.4, 0.5, 0.3]} rotation={[0, 0.4, -0.2]} scale={[1, 0.5, 1]} castShadow>
                <sphereGeometry args={[0.8, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={GRASS} roughness={0.95} flatShading />
            </mesh>

            {/* Right grassy slope curving inward */}
            <mesh position={[1.6, 0.15, 0.5]} rotation={[0, -0.6, 0.3]} castShadow>
                <boxGeometry args={[1.5, 0.7, 1.8]} />
                <meshStandardMaterial color={GRASS} roughness={0.95} flatShading />
            </mesh>
            {/* Right slope top (rounded) */}
            <mesh position={[1.4, 0.5, 0.3]} rotation={[0, -0.4, 0.2]} scale={[1, 0.5, 1]} castShadow>
                <sphereGeometry args={[0.8, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={GRASS} roughness={0.95} flatShading />
            </mesh>

            {/* ====================================================
                FACADE — Stone/cream colored wall
               ==================================================== */}

            {/* Cream/stone facade behind the door */}
            <mesh position={[0, 0.55, 0.15]}>
                <boxGeometry args={[2.2, 1.5, 0.12]} />
                <meshStandardMaterial color="#D4C4A0" roughness={0.88} />
            </mesh>

            {/* Stone foundation base */}
            <mesh position={[0, 0.08, 0.2]}>
                <boxGeometry args={[2.6, 0.25, 0.15]} />
                <meshStandardMaterial color={STONE} roughness={0.92} flatShading />
            </mesh>

            {/* Stone foundation detail lines */}
            {[0.05, 0.12, 0.19].map((ly, li) => (
                <mesh key={`f${li}`} position={[0, ly, 0.29]}>
                    <boxGeometry args={[2.5, 0.008, 0.01]} />
                    <meshStandardMaterial color="#7A6B58" roughness={0.95} />
                </mesh>
            ))}

            {/* ====================================================
                BRICK ARCH around the door
               ==================================================== */}

            {/* Outer brick arch (thick ring) */}
            <mesh position={[0, 0.6, 0.25]} rotation={[0, 0, 0]}>
                <torusGeometry args={[0.62, 0.09, 10, 28]} />
                <meshStandardMaterial color={BRICK} roughness={0.85} flatShading />
            </mesh>

            {/* Inner brick ring */}
            <mesh position={[0, 0.6, 0.27]}>
                <torusGeometry args={[0.55, 0.04, 8, 24]} />
                <meshStandardMaterial color="#8A6E4A" roughness={0.88} />
            </mesh>

            {/* ====================================================
                WOODEN LINTEL (beam above the door)
               ==================================================== */}
            <mesh position={[0, 1.28, 0.22]} castShadow>
                <boxGeometry args={[2.4, 0.08, 0.14]} />
                <meshStandardMaterial color={WOOD_FRAME} roughness={0.85} />
            </mesh>
            {/* Lintel support brackets */}
            <mesh position={[-1.1, 1.2, 0.24]}>
                <boxGeometry args={[0.06, 0.12, 0.08]} />
                <meshStandardMaterial color={WOOD_FRAME} roughness={0.85} />
            </mesh>
            <mesh position={[1.1, 1.2, 0.24]}>
                <boxGeometry args={[0.06, 0.12, 0.08]} />
                <meshStandardMaterial color={WOOD_FRAME} roughness={0.85} />
            </mesh>

            {/* ====================================================
                THE ROUND DOOR — BIG, prominent, with planks
               ==================================================== */}

            {/* Door circle (main color) */}
            <mesh position={[0, 0.6, 0.3]}>
                <circleGeometry args={[0.5, 28]} />
                <meshStandardMaterial color={doorColor} roughness={0.5} />
            </mesh>

            {/* Vertical planks on the door */}
            {[-0.3, -0.15, 0, 0.15, 0.3].map((dx, di) => (
                <mesh key={`pk${di}`} position={[dx, 0.6, 0.32]}>
                    <boxGeometry args={[0.01, 0.9, 0.01]} />
                    <meshStandardMaterial color={WOOD_DARK} roughness={0.9} />
                </mesh>
            ))}

            {/* Door frame ring */}
            <mesh position={[0, 0.6, 0.33]}>
                <torusGeometry args={[0.5, 0.035, 8, 28]} />
                <meshStandardMaterial color={WOOD_DARK} roughness={0.8} />
            </mesh>

            {/* Door knocker/handle ring (brass) */}
            <mesh position={[0, 0.6, 0.37]}>
                <torusGeometry args={[0.05, 0.012, 8, 16]} />
                <meshStandardMaterial color="#C9A44E" metalness={0.7} roughness={0.25} />
            </mesh>
            {/* Knocker mount */}
            <mesh position={[0, 0.66, 0.36]}>
                <sphereGeometry args={[0.02, 6, 6]} />
                <meshStandardMaterial color="#C9A44E" metalness={0.7} roughness={0.25} />
            </mesh>

            {/* ====================================================
                ROUND WINDOWS — warm stained glass (orange/yellow)
               ==================================================== */}

            {[[-0.85, 'left'], [0.85, 'right']].map(([wx]) => (
                <group key={wx} position={[wx, 0.7, 0.22]}>
                    {/* Window glow */}
                    <mesh>
                        <circleGeometry args={[0.17, 16]} />
                        <meshStandardMaterial
                            color="#FFD54F"
                            emissive="#FF8F00"
                            emissiveIntensity={0.6}
                            roughness={0.3}
                        />
                    </mesh>
                    {/* Window frame ring */}
                    <mesh position={[0, 0, 0.02]}>
                        <torusGeometry args={[0.17, 0.025, 6, 16]} />
                        <meshStandardMaterial color={WOOD_FRAME} roughness={0.85} />
                    </mesh>
                    {/* Cross bars (stained glass dividers) */}
                    <mesh position={[0, 0, 0.02]}>
                        <boxGeometry args={[0.34, 0.02, 0.01]} />
                        <meshStandardMaterial color={WOOD_FRAME} roughness={0.85} />
                    </mesh>
                    <mesh position={[0, 0, 0.02]}>
                        <boxGeometry args={[0.02, 0.34, 0.01]} />
                        <meshStandardMaterial color={WOOD_FRAME} roughness={0.85} />
                    </mesh>
                    {/* Window shutters (tiny wooden panels beside the window) */}
                    <mesh position={[-0.22, 0, 0]}>
                        <boxGeometry args={[0.06, 0.32, 0.03]} />
                        <meshStandardMaterial color={WOOD_FRAME} roughness={0.85} />
                    </mesh>
                    <mesh position={[0.22, 0, 0]}>
                        <boxGeometry args={[0.06, 0.32, 0.03]} />
                        <meshStandardMaterial color={WOOD_FRAME} roughness={0.85} />
                    </mesh>
                </group>
            ))}

            {/* ====================================================
                CHIMNEY — stone, poking through the grassy dome
               ==================================================== */}
            {hasChimney && (
                <group position={[0.8, 1.3, -0.8]}>
                    {/* Chimney stack */}
                    <mesh castShadow>
                        <boxGeometry args={[0.18, 0.5, 0.18]} />
                        <meshStandardMaterial color={STONE} roughness={0.92} flatShading />
                    </mesh>
                    {/* Chimney cap */}
                    <mesh position={[0, 0.3, 0]}>
                        <boxGeometry args={[0.24, 0.06, 0.24]} />
                        <meshStandardMaterial color="#6B5B4B" roughness={0.9} />
                    </mesh>
                    {/* Chimney mortar lines */}
                    {[0, 0.12, 0.24].map((cy, ci) => (
                        <mesh key={`ch${ci}`} position={[0, -0.15 + cy, 0.1]}>
                            <boxGeometry args={[0.17, 0.008, 0.005]} />
                            <meshStandardMaterial color="#5C4C3C" roughness={0.95} />
                        </mesh>
                    ))}
                </group>
            )}

            {/* ====================================================
                FLOWERS on top of the mound
               ==================================================== */}
            {[
                [-0.8, 1.0, -0.3], [0.6, 0.95, -0.4], [-0.3, 1.02, -0.8],
                [0.9, 0.85, -0.6], [-1.0, 0.8, -0.5], [0.2, 1.05, -0.2],
                [-0.5, 0.98, -1.0], [1.1, 0.7, -0.3], [-1.2, 0.65, -0.2],
            ].map(([fx, fy, fz], fi) => (
                <mesh key={`fl${fi}`} position={[fx, fy, fz]}>
                    <sphereGeometry args={[0.03, 5, 4]} />
                    <meshStandardMaterial
                        color={['#FF5252', '#FFEB3B', '#E040FB', '#64B5F6', '#FF7043', '#FFFFFF', '#FF80AB', '#69F0AE', '#FFF176'][fi]}
                        roughness={0.8}
                    />
                </mesh>
            ))}

            {/* ====================================================
                STONE STEPPING PATH leading to the door
               ==================================================== */}
            {[0.6, 0.95, 1.3, 1.7, 2.1, 2.5].map((d, si) => (
                <mesh key={`sp${si}`}
                    position={[(si % 2 === 0 ? -0.05 : 0.08), 0.02, d]}
                    rotation={[-Math.PI / 2, 0, si * 0.3]}
                >
                    <circleGeometry args={[0.12 + (si % 3) * 0.03, 7]} />
                    <meshStandardMaterial color="#8A8A7A" roughness={0.92} />
                </mesh>
            ))}

            {/* Dirt path under stepping stones */}
            <mesh position={[0, 0.01, 1.5]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.7, 2.5]} />
                <meshStandardMaterial color="#9E8868" roughness={0.95} />
            </mesh>

            {/* ====================================================
                MUSHROOMS beside the door (cute detail)
               ==================================================== */}
            {[[-0.55, 0.04, 0.45], [0.6, 0.04, 0.5]].map(([mx, my, mz], mi) => (
                <group key={`mu${mi}`} position={[mx, my, mz]}>
                    {/* Stem */}
                    <mesh>
                        <cylinderGeometry args={[0.015, 0.02, 0.06, 6]} />
                        <meshStandardMaterial color="#E0D8C0" roughness={0.9} />
                    </mesh>
                    {/* Cap */}
                    <mesh position={[0, 0.04, 0]}>
                        <sphereGeometry args={[0.03, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        <meshStandardMaterial color="#CD853F" roughness={0.85} />
                    </mesh>
                </group>
            ))}

            {/* ====================================================
                FENCING (if present)
               ==================================================== */}
            {hasFence && (
                <group>
                    <FenceRow position={[-1.8, 0, 1.2]} length={2.8} rotation={[0, Math.PI / 2, 0]} />
                    <FenceRow position={[0, 0, 2.8]} length={3.6} rotation={[0, 0, 0]} />
                    <FenceRow position={[1.8, 0, 1.2]} length={2.8} rotation={[0, Math.PI / 2, 0]} />
                </group>
            )}
        </group>
    )
}

// ── Fence section ──
function FenceRow({ position, length, rotation = [0, 0, 0] }) {
    const postCount = Math.max(2, Math.floor(length / 0.55))
    return (
        <group position={position} rotation={rotation}>
            {Array.from({ length: postCount }).map((_, i) => {
                const x = (i / (postCount - 1) - 0.5) * length
                return (
                    <mesh key={i} position={[x, 0.2, 0]} castShadow>
                        <boxGeometry args={[0.04, 0.45, 0.04]} />
                        <meshStandardMaterial color={FENCE_COLOR} roughness={0.9} />
                    </mesh>
                )
            })}
            <mesh position={[0, 0.34, 0]}>
                <boxGeometry args={[length, 0.03, 0.03]} />
                <meshStandardMaterial color={FENCE_COLOR} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.14, 0]}>
                <boxGeometry args={[length, 0.03, 0.03]} />
                <meshStandardMaterial color={FENCE_COLOR} roughness={0.9} />
            </mesh>
        </group>
    )
}

// ═══════════════════════════════════════════════════════════════════
// SHIRE WINDING PATH
// ═══════════════════════════════════════════════════════════════════
function ShirePath() {
    const pathGeo = useMemo(() => {
        const controlPoints = [
            new THREE.Vector3(-28, 0, -22),
            new THREE.Vector3(-15, 0, -10),
            new THREE.Vector3(-5, 0, -16),
            new THREE.Vector3(3, 0, -3),
            new THREE.Vector3(10, 0, 6),
            new THREE.Vector3(18, 0, -5),
            new THREE.Vector3(24, 0, 4),
            new THREE.Vector3(20, 0, 16),
            new THREE.Vector3(8, 0, 20),
            new THREE.Vector3(-5, 0, 15),
            new THREE.Vector3(-18, 0, 22),
            new THREE.Vector3(-25, 0, 12),
        ]
        const curve = new THREE.CatmullRomCurve3(controlPoints, false, 'catmullrom', 0.5)
        const points = curve.getPoints(150)
        const pathWidth = 0.9
        const vertices = []
        const indices = []
        const uvs = []

        for (let i = 0; i < points.length; i++) {
            const p = points[i]
            const next = points[Math.min(i + 1, points.length - 1)]
            const prev = points[Math.max(i - 1, 0)]
            const tangent = new THREE.Vector3().subVectors(next, prev).normalize()
            const perp = new THREE.Vector3(-tangent.z, 0, tangent.x)
            const lx = p.x + perp.x * pathWidth
            const lz = p.z + perp.z * pathWidth
            const ly = getTerrainHeight(lx, lz) + 0.06
            const rx = p.x - perp.x * pathWidth
            const rz = p.z - perp.z * pathWidth
            const ry = getTerrainHeight(rx, rz) + 0.06
            vertices.push(lx, ly, lz, rx, ry, rz)
            const t = i / (points.length - 1)
            uvs.push(0, t, 1, t)
            if (i < points.length - 1) {
                const bi = i * 2
                indices.push(bi, bi + 1, bi + 2, bi + 1, bi + 3, bi + 2)
            }
        }
        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
        geo.setIndex(indices)
        geo.computeVertexNormals()
        return geo
    }, [])

    return (
        <mesh geometry={pathGeo} receiveShadow>
            <meshStandardMaterial color="#9E8868" roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
    )
}

// ═══════════════════════════════════════════════════════════════════
// REGULAR HOUSE
// ═══════════════════════════════════════════════════════════════════
function RegularHouse({ wallColor, hasChimney }) {
    return (
        <group>
            <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
                <boxGeometry args={[1, 0.8, 1]} />
                <meshStandardMaterial color={wallColor} roughness={0.85} flatShading />
            </mesh>
            <mesh position={[0, 1.1, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[0.8, 0.6, 4]} />
                <meshStandardMaterial color="#8D6E63" roughness={0.9} flatShading />
            </mesh>
            <mesh position={[0, 0.2, 0.51]}>
                <boxGeometry args={[0.2, 0.35, 0.05]} />
                <meshStandardMaterial color="#4E342E" roughness={0.95} />
            </mesh>
            <mesh position={[-0.25, 0.5, 0.51]}>
                <boxGeometry args={[0.15, 0.15, 0.05]} />
                <meshStandardMaterial color="#FFF9C4" emissive="#FFF9C4" emissiveIntensity={0.6} roughness={0.5} />
            </mesh>
            <mesh position={[0.25, 0.5, 0.51]}>
                <boxGeometry args={[0.15, 0.15, 0.05]} />
                <meshStandardMaterial color="#FFF9C4" emissive="#FFF9C4" emissiveIntensity={0.6} roughness={0.5} />
            </mesh>
            {hasChimney && (
                <mesh position={[0.25, 1.45, -0.15]} castShadow>
                    <cylinderGeometry args={[0.06, 0.08, 0.35, 6]} />
                    <meshStandardMaterial color="#5D4037" roughness={0.95} flatShading />
                </mesh>
            )}
        </group>
    )
}

registerWorldObject({
    id: 'houses',
    label: 'Maisons',
    component: Houses,
    defaultCount: 15,
    minCount: 0,
    maxCount: 50,
    category: 'construction',
    enabledByDefault: false,
    theoryOverrides: {
        marxisme: { label: 'Logements ouvriers', defaultCount: 30, enabledByDefault: true },
        evolution: { label: 'Abris', defaultCount: 5 },
    },
})
