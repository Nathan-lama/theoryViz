import { useState } from 'react'
import useStore from '../core/store'
import { theoryList } from '../theories'
import { getWorldObjects } from '../world/registry'
import '../world/objects' // trigger registrations

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

const SPEED_OPTIONS = [
    { label: '⏸', value: 0 },
    { label: '1×', value: 1 },
    { label: '2×', value: 2 },
    { label: '5×', value: 5 },
]

const CATEGORY_ICONS = {
    nature: '🌿',
    construction: '🏗️',
    décor: '✨',
}

const CATEGORY_LABELS = {
    nature: 'Nature',
    construction: 'Constructions',
    décor: 'Effets & Décor',
}

const CATEGORY_ORDER = ['nature', 'construction', 'décor']

export default function ControlPanel() {
    const [open, setOpen] = useState(true)
    const [tab, setTab] = useState('theory') // 'theory' | 'world'
    const variables = useStore((s) => s.variables)
    const setVariable = useStore((s) => s.setVariable)
    const reset = useStore((s) => s.reset)
    const speed = useStore((s) => s.speed)
    const setSpeed = useStore((s) => s.setSpeed)
    const creatures = useStore((s) => s.creatures)
    const generation = useStore((s) => s.generation)
    const theoryVariables = useStore((s) => s.theoryVariables)
    const theoryConfig = useStore((s) => s.theoryConfig)
    const activeTheory = useStore((s) => s.activeTheory)
    const loadTheory = useStore((s) => s.loadTheory)
    const worldObjects = useStore((s) => s.worldObjects)
    const setObjectCount = useStore((s) => s.setObjectCount)
    const toggleObject = useStore((s) => s.toggleObject)

    const labels = { ...DEFAULT_LABELS, ...theoryVariables }
    const title = activeTheory?.title || 'Monde Libre'
    const primaryColor = activeTheory?.palette?.primary || '#A5D6A7'

    const handleTheorySelect = (theory) => {
        if (activeTheory?.id === theory.id) {
            loadTheory(null)
        } else {
            loadTheory(theory)
        }
    }

    const applyScenario = (scenario) => {
        for (const [key, value] of Object.entries(scenario.variables)) {
            setVariable(key, value)
        }
    }

    return (
        <>
            {/* Toggle button */}
            <button
                onClick={() => setOpen(!open)}
                style={{
                    position: 'fixed',
                    top: 16,
                    right: open ? 292 : 16,
                    zIndex: 1000,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(8px)',
                    color: '#fff',
                    fontSize: 18,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'right 0.3s ease',
                }}
            >
                ⚙
            </button>

            {/* Panel */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    right: open ? 0 : -292,
                    width: 280,
                    height: '100vh',
                    background: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '16px 0 0 16px',
                    padding: '14px 14px 10px 14px',
                    zIndex: 999,
                    transition: 'right 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    color: '#fff',
                }}
            >
                {/* Title */}
                <h2 style={{
                    margin: '0 0 4px 0',
                    fontSize: 15,
                    fontWeight: 700,
                    color: primaryColor,
                    letterSpacing: 0.5,
                }}>
                    🌍 {title}
                </h2>
                {activeTheory?.description && (
                    <div style={{ fontSize: 10, color: '#888', marginBottom: 4, lineHeight: 1.3 }}>
                        {activeTheory.description}
                    </div>
                )}

                {/* ── Tabs ── */}
                <div style={{
                    display: 'flex',
                    gap: 0,
                    marginBottom: 8,
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    padding: 2,
                }}>
                    <button
                        onClick={() => setTab('theory')}
                        style={{
                            ...tabBtnStyle,
                            background: tab === 'theory' ? 'rgba(255,255,255,0.14)' : 'transparent',
                            color: tab === 'theory' ? '#fff' : 'rgba(255,255,255,0.4)',
                        }}
                    >
                        🎛️ Théorie
                    </button>
                    <button
                        onClick={() => setTab('world')}
                        style={{
                            ...tabBtnStyle,
                            background: tab === 'world' ? 'rgba(255,255,255,0.14)' : 'transparent',
                            color: tab === 'world' ? '#fff' : 'rgba(255,255,255,0.4)',
                        }}
                    >
                        🌍 Monde
                    </button>
                </div>

                {/* ── Tab content (scrollable) ── */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    paddingRight: 2,
                }}>
                    {tab === 'theory' ? (
                        <TheoryTab
                            variables={variables}
                            setVariable={setVariable}
                            speed={speed}
                            setSpeed={setSpeed}
                            labels={labels}
                            activeTheory={activeTheory}
                            loadTheory={loadTheory}
                            handleTheorySelect={handleTheorySelect}
                            applyScenario={applyScenario}
                            theoryConfig={theoryConfig}
                        />
                    ) : (
                        <WorldTab
                            worldObjects={worldObjects}
                            setObjectCount={setObjectCount}
                            toggleObject={toggleObject}
                            activeTheory={activeTheory}
                        />
                    )}
                </div>

                {/* ── Bottom: stats + reset ── */}
                <div style={{ flexShrink: 0, marginTop: 6 }}>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 6 }} />
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                        <StatBox value={creatures.length} label="Population" color="#80CBC4" />
                        <StatBox value={generation} label="Génération" color="#CE93D8" />
                    </div>
                    <button
                        onClick={reset}
                        style={resetBtnStyle}
                        onMouseEnter={(e) => { e.target.style.background = 'rgba(244,67,54,0.3)' }}
                        onMouseLeave={(e) => { e.target.style.background = 'rgba(244,67,54,0.15)' }}
                    >
                        🔄 Reset
                    </button>
                </div>
            </div>

            {/* Slider thumb styling */}
            <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          box-shadow: 0 0 4px rgba(0,0,0,0.4);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 4px rgba(0,0,0,0.4);
        }
        .cp-scroll::-webkit-scrollbar { width: 4px; }
        .cp-scroll::-webkit-scrollbar-track { background: transparent; }
        .cp-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }
      `}</style>
        </>
    )
}

/* ══════════════════════════════════════════════════════
   Theory Tab
   ══════════════════════════════════════════════════════ */

function TheoryTab({
    variables, setVariable, speed, setSpeed, labels,
    activeTheory, loadTheory, handleTheorySelect, applyScenario,
    theoryConfig,
}) {
    return (
        <>
            {/* Theory selector */}
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

            {/* Speed controls */}
            <div>
                <SectionLabel>Vitesse</SectionLabel>
                <div style={{ display: 'flex', gap: 4 }}>
                    {SPEED_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setSpeed(opt.value)}
                            style={{
                                flex: 1,
                                padding: '5px 0',
                                border: 'none',
                                borderRadius: 6,
                                background: speed === opt.value ? '#4CAF50' : 'rgba(255,255,255,0.1)',
                                color: speed === opt.value ? '#000' : '#ccc',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <Divider />

            {/* Sliders with icons and descriptions */}
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

/* ══════════════════════════════════════════════════════
   World Tab
   ══════════════════════════════════════════════════════ */

function WorldTab({ worldObjects, setObjectCount, toggleObject, activeTheory }) {
    const registeredObjects = getWorldObjects()

    // Group by category
    const grouped = {}
    registeredObjects.forEach((obj) => {
        const cat = obj.category || 'décor'
        if (!grouped[cat]) grouped[cat] = []
        grouped[cat].push(obj)
    })

    return (
        <>
            {CATEGORY_ORDER.map((cat) => {
                const items = grouped[cat]
                if (!items || items.length === 0) {
                    // Show empty category placeholder
                    return (
                        <div key={cat} style={{ marginBottom: 6 }}>
                            <SectionLabel>
                                {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                            </SectionLabel>
                            <div style={{
                                fontSize: 11,
                                color: 'rgba(255,255,255,0.2)',
                                fontStyle: 'italic',
                                padding: '6px 4px',
                            }}>
                                Aucun objet
                            </div>
                        </div>
                    )
                }

                return (
                    <div key={cat} style={{ marginBottom: 4 }}>
                        <SectionLabel>
                            {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                        </SectionLabel>
                        {items.map((obj) => {
                            const state = worldObjects[obj.id] || { enabled: true, count: obj.defaultCount }
                            // Check theory overrides
                            const override = activeTheory?.id && obj.theoryOverrides?.[activeTheory.id]
                            const label = override?.label || obj.label
                            const objColor = activeTheory?.palette?.primary || '#4CAF50'
                            const pct = obj.maxCount > obj.minCount
                                ? ((state.count - obj.minCount) / (obj.maxCount - obj.minCount)) * 100
                                : 100

                            return (
                                <div key={obj.id} style={{
                                    marginBottom: 6,
                                    padding: '8px 10px',
                                    borderRadius: 8,
                                    background: state.enabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                                    transition: 'all 0.2s',
                                    opacity: state.enabled ? 1 : 0.5,
                                }}>
                                    {/* Header: toggle + label */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: state.enabled && obj.maxCount > 1 ? 6 : 0,
                                    }}>
                                        <span style={{ fontSize: 12, fontWeight: 500, color: '#ddd' }}>
                                            {label}
                                        </span>
                                        {/* Toggle switch */}
                                        <button
                                            onClick={() => toggleObject(obj.id)}
                                            style={{
                                                width: 34,
                                                height: 18,
                                                borderRadius: 9,
                                                border: 'none',
                                                padding: 0,
                                                cursor: 'pointer',
                                                position: 'relative',
                                                background: state.enabled
                                                    ? objColor
                                                    : 'rgba(255,255,255,0.15)',
                                                transition: 'background 0.2s',
                                            }}
                                        >
                                            <div style={{
                                                width: 14,
                                                height: 14,
                                                borderRadius: '50%',
                                                background: '#fff',
                                                position: 'absolute',
                                                top: 2,
                                                left: state.enabled ? 18 : 2,
                                                transition: 'left 0.2s',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                            }} />
                                        </button>
                                    </div>

                                    {/* Count slider — only if enabled and object supports count > 1 */}
                                    {state.enabled && obj.maxCount > 1 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                type="range"
                                                min={obj.minCount}
                                                max={obj.maxCount}
                                                value={state.count}
                                                onChange={(e) => setObjectCount(obj.id, Number(e.target.value))}
                                                style={{
                                                    flex: 1,
                                                    height: 4,
                                                    appearance: 'none',
                                                    WebkitAppearance: 'none',
                                                    background: `linear-gradient(to right, ${objColor} ${pct}%, rgba(255,255,255,0.12) ${pct}%)`,
                                                    borderRadius: 2,
                                                    outline: 'none',
                                                    cursor: 'pointer',
                                                }}
                                            />
                                            <span style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                color: objColor,
                                                minWidth: 24,
                                                textAlign: 'right',
                                            }}>
                                                {state.count}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                        <Divider />
                    </div>
                )
            })}
        </>
    )
}

/* ══════════════════════════════════════════════════════
   Small helpers
   ══════════════════════════════════════════════════════ */

function SectionLabel({ children }) {
    return (
        <div style={{
            fontSize: 10,
            color: '#777',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 4,
            fontWeight: 600,
        }}>
            {children}
        </div>
    )
}

function Divider() {
    return <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
}

function StatBox({ value, label, color }) {
    return (
        <div style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 8,
            padding: '6px 8px',
            textAlign: 'center',
        }}>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 9, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {label}
            </div>
        </div>
    )
}

const theoryBtnStyle = {
    padding: '5px 10px',
    border: '1px solid transparent',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
}

const tabBtnStyle = {
    flex: 1,
    padding: '6px 0',
    border: 'none',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: "'Inter', sans-serif",
}

const resetBtnStyle = {
    width: '100%',
    padding: '7px 0',
    border: '1px solid rgba(244,67,54,0.4)',
    borderRadius: 8,
    background: 'rgba(244,67,54,0.15)',
    color: '#EF9A9A',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
}
