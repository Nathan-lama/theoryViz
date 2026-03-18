// ── Control Panel ────────────────────────────────────────────────
// Thin shell: toggle button, panel container, tab switcher,
// and bottom bar (stats + actions + reset).
// Tab content is delegated to TheoryTab / WorldTab.

import { useState, useCallback } from 'react'
import useStore from '../core/store'
import TheoryTab from './TheoryTab'
import WorldTab from './WorldTab'
import { StatBox, ActionBtn, tabBtnStyle, resetBtnStyle } from './panel-components'

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
    const activePreset = useStore((s) => s.activePreset)
    const setPreset = useStore((s) => s.setPreset)
    const audioMuted = useStore((s) => s.audioMuted)
    const toggleMute = useStore((s) => s.toggleMute)
    const cinemaMode = useStore((s) => s.cinemaMode)
    const toggleCinema = useStore((s) => s.toggleCinema)

    const takeScreenshot = useCallback(() => {
        const canvas = document.querySelector('canvas')
        if (!canvas) return
        try {
            const link = document.createElement('a')
            link.download = `theoryviz-${Date.now()}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
        } catch (e) {
            console.warn('Screenshot failed:', e)
        }
    }, [])

    const labels = { ...theoryVariables }
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

            {/* Panel container */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    right: open ? 0 : -292,
                    width: 280,
                    height: 'calc(100vh - 40px)',
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

                {/* ── Scrollable tab content ── */}
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
                            activePreset={activePreset}
                            setPreset={setPreset}
                        />
                    )}
                </div>

                {/* ── Bottom bar: actions + stats + reset ── */}
                <div style={{ flexShrink: 0, marginTop: 6 }}>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 6 }} />

                    {/* Action buttons row */}
                    <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                        <ActionBtn
                            icon={audioMuted ? '🔇' : '🔊'}
                            label={audioMuted ? 'Son off' : 'Son on'}
                            onClick={toggleMute}
                            active={!audioMuted}
                            color={primaryColor}
                        />
                        <ActionBtn
                            icon="📸"
                            label="Screenshot"
                            onClick={takeScreenshot}
                            color={primaryColor}
                        />
                        <ActionBtn
                            icon="🎬"
                            label="Cinéma"
                            onClick={toggleCinema}
                            active={cinemaMode}
                            color={primaryColor}
                        />
                    </div>

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
