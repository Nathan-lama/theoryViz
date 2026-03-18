// ── Theory Tab ──────────────────────────────────────────────────
// Theory selector, variable sliders with icons/descriptions, scenarios.
// Extracted from ControlPanel.jsx for maintainability.

import { useParams } from 'react-router-dom'
import { theoryList } from '../theories'
import { SectionLabel, Divider, theoryBtnStyle } from './panel-components'

const DEFAULT_LABELS = {
    foodAbundance: 'Nourriture',
    predatorCount: 'Prédateurs',
    climate: 'Climat',
    mutationRate: 'Mutation',
    resources: 'Ressources',
}

const SLIDER_CONFIGS = {
    foodAbundance: { min: 0, max: 100, color: '#4CAF50' },
    predatorCount: { min: 0, max: 20, color: '#F44336' },
    climate: { min: 0, max: 100, color: '#FF9800' },
    mutationRate: { min: 0, max: 100, color: '#9C27B0' },
    resources: { min: 0, max: 100, color: '#2196F3' },
}

export default function TheoryTab({
    variables, setVariable, labels: labelOverrides,
    activeTheory, loadTheory, handleTheorySelect, applyScenario,
    theoryConfig,
}) {
    const { theoryId } = useParams()
    const isLockedTheory = !!theoryId
    const labels = { ...DEFAULT_LABELS, ...labelOverrides }

    return (
        <>
            {/* Theory selector — only in sandbox mode */}
            {!isLockedTheory && (
                <>
                    <div>
                        <SectionLabel>Théorie</SectionLabel>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <button
                                onClick={() => loadTheory(null)}
                                style={{
                                    ...theoryBtnStyle,
                                    background: !activeTheory ? 'rgba(165,214,167,0.25)' : 'rgba(255,255,255,0.08)',
                                    borderColor: !activeTheory ? '#A5D6A7' : 'transparent',
                                    color: !activeTheory ? '#A5D6A7' : '#999',
                                }}
                            >
                                🌍 Libre
                            </button>
                            {theoryList.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => handleTheorySelect(t)}
                                    style={{
                                        ...theoryBtnStyle,
                                        background: activeTheory?.id === t.id ? `${t.palette.primary}30` : 'rgba(255,255,255,0.08)',
                                        borderColor: activeTheory?.id === t.id ? t.palette.primary : 'transparent',
                                        color: activeTheory?.id === t.id ? t.palette.primary : '#999',
                                    }}
                                >
                                    {t.id === 'evolution' ? '🧬' : '⚒️'} {t.title.split(' ').pop()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Divider />
                </>
            )}

            {/* Variable sliders with icons and descriptions */}
            {Object.entries(SLIDER_CONFIGS).map(([key, config]) => {
                const value = variables[key]
                const tc = theoryConfig?.[key] || {}
                const sliderMin = tc.min !== undefined ? tc.min : config.min
                const sliderMax = tc.max !== undefined ? tc.max : config.max
                const sliderStep = tc.step || 1
                const icon = tc.icon || ''
                const description = tc.description || ''
                const pct = ((value - sliderMin) / (sliderMax - sliderMin)) * 100
                return (
                    <div key={key} style={{ marginBottom: 4 }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 2,
                        }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: '#ddd' }}>
                                {icon && <span style={{ marginRight: 4 }}>{icon}</span>}
                                {labels[key]}
                            </span>
                            <span style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: config.color,
                                minWidth: 28,
                                textAlign: 'right',
                            }}>
                                {Math.round(value)}
                            </span>
                        </div>
                        {description && (
                            <div style={{
                                fontSize: 9,
                                color: 'rgba(255,255,255,0.35)',
                                marginBottom: 3,
                                lineHeight: 1.3,
                            }}>
                                {description}
                            </div>
                        )}
                        <input
                            type="range"
                            min={sliderMin}
                            max={sliderMax}
                            step={sliderStep}
                            value={value}
                            onChange={(e) => setVariable(key, Number(e.target.value))}
                            style={{
                                width: '100%',
                                height: 5,
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                background: `linear-gradient(to right, ${config.color} ${pct}%, rgba(255,255,255,0.12) ${pct}%)`,
                                borderRadius: 3,
                                outline: 'none',
                                cursor: 'pointer',
                            }}
                        />
                    </div>
                )
            })}

            <Divider />

            {/* Scenarios with descriptions */}
            {activeTheory?.scenarios && (
                <div>
                    <SectionLabel>Scénarios</SectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {activeTheory.scenarios.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => applyScenario(s)}
                                style={{
                                    padding: '7px 10px',
                                    border: `1px solid ${activeTheory.palette.primary}40`,
                                    borderRadius: 6,
                                    background: `${activeTheory.palette.primary}15`,
                                    color: activeTheory.palette.primary,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => { e.target.style.background = `${activeTheory.palette.primary}30` }}
                                onMouseLeave={(e) => { e.target.style.background = `${activeTheory.palette.primary}15` }}
                            >
                                <div>▶ {s.name}</div>
                                {s.description && (
                                    <div style={{
                                        fontSize: 9,
                                        color: 'rgba(255,255,255,0.35)',
                                        fontWeight: 400,
                                        marginTop: 2,
                                    }}>
                                        {s.description}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    )
}
