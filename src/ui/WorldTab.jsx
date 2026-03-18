// ── World Tab ───────────────────────────────────────────────────
// Preset picker + world objects grouped by category with toggles & sliders.
// Extracted from ControlPanel.jsx for maintainability.

import { getWorldObjects } from '../world/registry'
import { getAllPresets } from '../world/presets'
import { SectionLabel, Divider } from './panel-components'

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

export default function WorldTab({ worldObjects, setObjectCount, toggleObject, activeTheory, activePreset, setPreset }) {
    const registeredObjects = getWorldObjects()
    const presets = getAllPresets()

    // Group by category
    const grouped = {}
    registeredObjects.forEach((obj) => {
        const cat = obj.category || 'décor'
        if (!grouped[cat]) grouped[cat] = []
        grouped[cat].push(obj)
    })

    return (
        <>
            {/* ── Preset Picker ── */}
            <SectionLabel>🗺️ Preset de monde</SectionLabel>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 6,
                marginBottom: 10,
            }}>
                {presets.map((preset) => {
                    const isActive = activePreset === preset.id
                    return (
                        <button
                            key={preset.id}
                            onClick={() => setPreset(preset.id)}
                            style={{
                                padding: '10px 8px',
                                borderRadius: 10,
                                border: isActive ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
                                background: isActive ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 4,
                                transition: 'all 0.2s',
                                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) e.target.style.background = 'rgba(255,255,255,0.08)'
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) e.target.style.background = 'rgba(255,255,255,0.04)'
                            }}
                        >
                            <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: preset.terrainColor,
                                border: '2px solid rgba(255,255,255,0.15)',
                                boxShadow: isActive ? '0 0 10px rgba(255,255,255,0.2)' : 'none',
                            }} />
                            <span style={{
                                fontSize: 11,
                                fontWeight: isActive ? 700 : 500,
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                                whiteSpace: 'nowrap',
                            }}>
                                {preset.name}
                            </span>
                        </button>
                    )
                })}
            </div>
            <Divider />

            {/* ── Objects by category ── */}
            {CATEGORY_ORDER.map((cat) => {
                const items = grouped[cat]
                if (!items || items.length === 0) {
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

                                    {/* Count slider */}
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
