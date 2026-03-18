import { useMemo } from 'react'
import useStore from '../core/store'
import MiniGraph from './MiniGraph'

export default function Stats() {
    const creatures = useStore((s) => s.creatures)
    const foodItems = useStore((s) => s.foodItems)
    const populationHistory = useStore((s) => s.populationHistory)
    const births = useStore((s) => s.recentBirths)
    const deaths = useStore((s) => s.recentDeaths)
    const activeTheory = useStore((s) => s.activeTheory)

    const stats = useMemo(() => {
        const colorCount = {}
        let avgSize = 0
        for (const c of creatures) {
            colorCount[c.color] = (colorCount[c.color] || 0) + 1
            avgSize += c.size
        }
        avgSize = creatures.length > 0 ? (avgSize / creatures.length).toFixed(2) : 0

        let dominantColor = '#aaa'
        let maxCount = 0
        for (const [col, count] of Object.entries(colorCount)) {
            if (count > maxCount) {
                dominantColor = col
                maxCount = count
            }
        }

        return { dominantColor, dominantCount: maxCount, avgSize }
    }, [creatures])

    const graphData = useMemo(() => {
        return populationHistory.slice(-200)
    }, [populationHistory])

    // Hide when EvolutionStats is showing (must be after all hooks)
    if (activeTheory?.id === 'evolution') return null

    return (
        <div style={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 999,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(10px)',
            borderRadius: 12,
            padding: '12px 14px',
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            color: '#ddd',
            fontSize: 12,
            minWidth: 180,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
        }}>
            {/* Title */}
            <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
                📊 Stats
            </div>

            {/* Population */}
            <Row label="Population" value={creatures.length} color="#80CBC4" />
            <Row label="Nourriture" value={foodItems.length} color="#FDD835" />

            {/* Separator */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)' }} />

            {/* Dominant trait */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#999', fontSize: 11 }}>Dominant</span>
                <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: stats.dominantColor,
                    boxShadow: `0 0 6px ${stats.dominantColor}`,
                }} />
                <span style={{ color: '#fff', fontWeight: 600, fontSize: 12 }}>×{stats.dominantCount}</span>
            </div>
            <Row label="Taille moy." value={stats.avgSize} color="#B0BEC5" />

            {/* Separator */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)' }} />

            {/* Birth/Death rates */}
            <Row label="Naissances" value={births} color="#76FF03" icon="🐣" />
            <Row label="Décès" value={deaths} color="#FF5252" icon="💀" />

            {/* Mini graph */}
            <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 10, color: '#888', marginBottom: 3 }}>Population (historique)</div>
                <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 6,
                    padding: '4px 2px',
                }}>
                    <MiniGraph data={graphData} width={160} height={36} />
                </div>
            </div>
        </div>
    )
}

function Row({ label, value, color, icon }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#999', fontSize: 11 }}>{icon ? `${icon} ` : ''}{label}</span>
            <span style={{ color, fontWeight: 700, fontSize: 13 }}>{value}</span>
        </div>
    )
}
