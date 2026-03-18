// ── EvolutionStats ───────────────────────────────────────────────
// Scientific data panel — visible only when the Evolution theory is active.
// Shows: trait evolution graphs, diversity, fitness, survival, pressure.

import { useMemo } from 'react'
import useStore from '../core/store'
import MiniGraph from './MiniGraph'

const TRAIT_LABELS = {
    speed: { name: 'Vitesse', icon: '⚡', color: '#FFD54F', unit: '' },
    size: { name: 'Taille', icon: '📐', color: '#4FC3F7', unit: '' },
    vision: { name: 'Vision', icon: '👁️', color: '#CE93D8', unit: '' },
    metabolism: { name: 'Métabolisme', icon: '🔥', color: '#FF8A65', unit: '' },
}

function PressureBar({ value, label, color }) {
    const level = value < 0.3 ? 'Faible' : value < 0.6 ? 'Modérée' : 'Forte'
    const barColor = value < 0.3 ? '#4CAF50' : value < 0.6 ? '#FFC107' : '#F44336'
    return (
        <div style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#999', marginBottom: 2 }}>
                <span>{label}</span>
                <span style={{ color: barColor, fontWeight: 600 }}>{level} ({(value * 100).toFixed(0)}%)</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                <div style={{
                    height: '100%',
                    width: `${Math.min(100, value * 100)}%`,
                    borderRadius: 2,
                    background: barColor,
                    transition: 'width 0.3s ease',
                }} />
            </div>
        </div>
    )
}

function MetricCard({ icon, label, value, sub, color }) {
    return (
        <div style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 8,
            padding: '6px 8px',
            textAlign: 'center',
            border: `1px solid rgba(${hexToRgb(color)}, 0.2)`,
        }}>
            <div style={{ fontSize: 14 }}>{icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color, marginTop: 2 }}>{value}</div>
            <div style={{ fontSize: 9, color: '#888', marginTop: 1 }}>{label}</div>
            {sub && <div style={{ fontSize: 8, color: '#666', marginTop: 1 }}>{sub}</div>}
        </div>
    )
}

function TraitRow({ traitKey, traitStats, traitHistory }) {
    const info = TRAIT_LABELS[traitKey]
    const avg = traitStats?.[`avg${cap(traitKey)}`] ?? 0
    const variance = traitStats?.[`var${cap(traitKey)}`] ?? 0
    const history = traitHistory?.[traitKey] || []

    return (
        <div style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontSize: 10, color: '#bbb' }}>{info.icon} {info.name}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: info.color }}>
                    μ={avg.toFixed(2)} <span style={{ fontSize: 9, color: '#777' }}>σ²={variance.toFixed(3)}</span>
                </span>
            </div>
            {history.length > 1 && (
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 4, padding: '2px 1px' }}>
                    <MiniGraph data={history} width={185} height={24} color={info.color} />
                </div>
            )}
        </div>
    )
}

export default function EvolutionStats() {
    const activeTheory = useStore((s) => s.activeTheory)
    const traitStats = useStore((s) => s.traitStats)
    const traitHistory = useStore((s) => s.traitHistory)
    const survivalRate = useStore((s) => s.survivalRate)
    const selectionPressure = useStore((s) => s.selectionPressure)
    const carryingCapacity = useStore((s) => s.carryingCapacity)
    const creatures = useStore((s) => s.creatures)
    const generation = useStore((s) => s.generation)

    // Only show for evolution theory
    if (activeTheory?.id !== 'evolution') return null
    if (!traitStats) return null

    const diversityHistory = traitHistory?.diversity || []
    const fitnessHistory = traitHistory?.fitness || []

    return (
        <div style={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 999,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(12px)',
            borderRadius: 12,
            padding: '12px 14px',
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            color: '#ddd',
            fontSize: 12,
            width: 220,
            maxHeight: 'calc(100vh - 80px)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            border: '1px solid rgba(76,175,80,0.15)',
        }}>
            {/* Header */}
            <div style={{
                fontSize: 11,
                color: '#4CAF50',
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontWeight: 700,
                marginBottom: 2,
            }}>
                🧬 Données Scientifiques
            </div>

            {/* ── Key Metrics ── */}
            <div style={{ display: 'flex', gap: 4 }}>
                <MetricCard
                    icon="👥"
                    label="Pop / K"
                    value={`${creatures.length}/${carryingCapacity || '?'}`}
                    color="#80CBC4"
                />
                <MetricCard
                    icon="🧬"
                    label="Gén."
                    value={generation}
                    color="#CE93D8"
                />
                <MetricCard
                    icon="💚"
                    label="Fitness"
                    value={traitStats.avgEnergy?.toFixed(0) || '0'}
                    sub="énergie moy."
                    color="#4CAF50"
                />
            </div>

            {/* Separator */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

            {/* ── Trait Evolution ── */}
            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                📊 Évolution des traits
            </div>

            <TraitRow traitKey="speed" traitStats={traitStats} traitHistory={traitHistory} />
            <TraitRow traitKey="size" traitStats={traitStats} traitHistory={traitHistory} />
            <TraitRow traitKey="vision" traitStats={traitStats} traitHistory={traitHistory} />
            <TraitRow traitKey="metabolism" traitStats={traitStats} traitHistory={traitHistory} />

            {/* Separator */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

            {/* ── Diversity ── */}
            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                🌈 Diversité génétique
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#bbb' }}>Shannon (H')</span>
                <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: traitStats.shannonDiversity > 0.6 ? '#4CAF50' : traitStats.shannonDiversity > 0.3 ? '#FFC107' : '#F44336',
                }}>
                    {traitStats.shannonDiversity?.toFixed(2) || '0'}
                </span>
            </div>
            {diversityHistory.length > 1 && (
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 4, padding: '2px 1px' }}>
                    <MiniGraph data={diversityHistory} width={185} height={24} color="#66BB6A" />
                </div>
            )}

            {/* ── Survival & Selection Pressure ── */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginTop: 2 }} />

            <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                ⚙️ Pressions de sélection
            </div>

            <PressureBar value={selectionPressure || 0} label="Pression globale" />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 2 }}>
                <span style={{ color: '#999' }}>Survie récente</span>
                <span style={{
                    fontWeight: 600,
                    color: survivalRate > 0.7 ? '#4CAF50' : survivalRate > 0.4 ? '#FFC107' : '#F44336',
                }}>
                    {((survivalRate || 0) * 100).toFixed(0)}%
                </span>
            </div>

            {/* Fitness history */}
            {fitnessHistory.length > 1 && (
                <>
                    <div style={{ fontSize: 9, color: '#777', marginTop: 4 }}>Fitness moyenne (historique)</div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 4, padding: '2px 1px' }}>
                        <MiniGraph data={fitnessHistory} width={185} height={24} color="#4CAF50" />
                    </div>
                </>
            )}

            {/* ── Legend ── */}
            <div style={{
                marginTop: 4, padding: '6px 8px', background: 'rgba(255,255,255,0.03)',
                borderRadius: 6, fontSize: 8, color: '#666', lineHeight: 1.5,
            }}>
                <div><b>μ</b> = moyenne • <b>σ²</b> = variance</div>
                <div><b>H'</b> = indice de Shannon (0=uniforme, 1=max diversité)</div>
                <div><b>K</b> = capacité d'accueil (régulation logistique)</div>
            </div>
        </div>
    )
}

// ── Helpers ──────────────────────────────────────────────────────

function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1)
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r},${g},${b}`
}
