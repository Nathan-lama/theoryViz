import { useState, useEffect } from 'react'
import useStore from '../core/store'

export default function InfoCard() {
    const activeTheory = useStore((s) => s.activeTheory)
    const generation = useStore((s) => s.generation)
    const creatures = useStore((s) => s.creatures)
    const variables = useStore((s) => s.variables)
    const [visible, setVisible] = useState(null)
    const [shownTriggers, setShownTriggers] = useState(new Set())

    useEffect(() => {
        if (!activeTheory?.infoCards) return

        const population = creatures.length
        const context = {
            generation,
            population,
            ...variables,
        }

        for (const card of activeTheory.infoCards) {
            const key = card.trigger
            if (shownTriggers.has(key)) continue

            // Evaluate trigger
            let triggered = false
            try {
                // Simple expression evaluator for safe triggers
                const expr = card.trigger
                    .replace(/generation/g, context.generation)
                    .replace(/population/g, context.population)
                    .replace(/foodAbundance/g, context.foodAbundance)
                    .replace(/predatorCount/g, context.predatorCount)
                    .replace(/climate/g, context.climate)
                    .replace(/mutationRate/g, context.mutationRate)
                    .replace(/resources/g, context.resources)
                triggered = Function(`"use strict"; return (${expr})`)()
            } catch {
                continue
            }

            if (triggered) {
                setVisible(card)
                setShownTriggers((prev) => new Set([...prev, key]))
                // Auto-dismiss after 5s
                setTimeout(() => setVisible(null), 5000)
                break
            }
        }
    }, [generation, creatures.length, variables, activeTheory])

    // Reset shown triggers when theory changes
    useEffect(() => {
        setShownTriggers(new Set())
        setVisible(null)
    }, [activeTheory?.id])

    if (!visible) return null

    const primaryColor = activeTheory?.palette?.primary || '#4CAF50'

    return (
        <div
            onClick={() => setVisible(null)}
            style={{
                position: 'fixed',
                top: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 3000,
                cursor: 'pointer',
                animation: 'infoSlideDown 0.4s ease-out',
            }}
        >
            <div style={{
                background: primaryColor,
                borderRadius: 12,
                padding: '14px 24px',
                maxWidth: 420,
                boxShadow: `0 4px 24px ${primaryColor}55`,
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
            }}>
                <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#fff',
                    marginBottom: 4,
                }}>
                    💡 {visible.title}
                </div>
                <div style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.9)',
                    lineHeight: 1.4,
                }}>
                    {visible.text}
                </div>
            </div>

            <style>{`
        @keyframes infoSlideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
        </div>
    )
}
