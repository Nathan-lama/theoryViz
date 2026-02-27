import { useState, useEffect, useRef } from 'react'
import useStore from '../core/store'

const SPEED_STEPS = [0, 1, 2, 5, 10, 100]

export default function Timeline() {
    const time = useStore((s) => s.time)
    const speed = useStore((s) => s.speed)
    const setSpeed = useStore((s) => s.setSpeed)
    const generation = useStore((s) => s.generation)
    const creatures = useStore((s) => s.creatures)
    const reset = useStore((s) => s.reset)
    const activeTheory = useStore((s) => s.activeTheory)

    const accentColor = activeTheory?.palette?.primary || '#4CAF50'

    // Generation flash state
    const [flash, setFlash] = useState(false)
    const [genLabel, setGenLabel] = useState(null)
    const prevGenRef = useRef(generation)

    useEffect(() => {
        if (generation > prevGenRef.current) {
            setFlash(true)
            setGenLabel(generation)
            setTimeout(() => setFlash(false), 150)
            setTimeout(() => setGenLabel(null), 2500)
        }
        prevGenRef.current = generation
    }, [generation])

    return (
        <>
            {/* Generation flash overlay */}
            {flash && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(255,255,255,0.12)',
                    zIndex: 2000,
                    pointerEvents: 'none',
                    animation: 'flashFade 0.3s ease-out forwards',
                }} />
            )}

            {/* Generation label overlay */}
            {genLabel !== null && (
                <div style={{
                    position: 'fixed',
                    top: '18%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 2001,
                    pointerEvents: 'none',
                    animation: 'genFadeIn 0.3s ease-out, genFadeOut 0.5s ease-in 1.8s forwards',
                }}>
                    <div style={{
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: 12,
                        padding: '12px 28px',
                        color: accentColor,
                        fontSize: 22,
                        fontWeight: 700,
                        fontFamily: "'Inter', 'Segoe UI', sans-serif",
                        letterSpacing: 1,
                        textShadow: `0 0 12px ${accentColor}66`,
                    }}>
                        🧬 Génération {genLabel}
                    </div>
                </div>
            )}

            {/* Timeline bar */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: 36,
                background: 'linear-gradient(180deg, rgba(10,10,18,0.85) 0%, rgba(6,6,12,0.95) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                gap: 12,
                zIndex: 999,
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                color: '#fff',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
            }}>
                {/* Stats — left side */}
                <div style={{
                    display: 'flex',
                    gap: 16,
                    fontSize: 11,
                    flex: 1,
                    alignItems: 'center',
                }}>
                    <StatPill label="Gén" value={generation} color="#CE93D8" />
                    <StatPill label="Pop" value={creatures.length} color="#80CBC4" />
                    <StatPill label="Temps" value={Math.floor(time)} color="#FFB74D" />
                </div>

                {/* Speed controls — right side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.35)',
                        textTransform: 'uppercase',
                        letterSpacing: 1.2,
                        fontWeight: 600,
                    }}>
                        Vitesse
                    </span>
                    <div style={{
                        display: 'flex',
                        gap: 2,
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: 7,
                        padding: 2,
                    }}>
                        {SPEED_STEPS.map((s) => (
                            <button
                                key={s}
                                onClick={() => setSpeed(s)}
                                className="tl-speed-btn"
                                style={{
                                    padding: '3px 8px',
                                    border: 'none',
                                    borderRadius: 5,
                                    background: speed === s ? accentColor : 'transparent',
                                    color: speed === s ? '#000' : 'rgba(255,255,255,0.5)',
                                    fontSize: 10,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    letterSpacing: 0.3,
                                    boxShadow: speed === s ? `0 2px 8px ${accentColor}40` : 'none',
                                }}
                            >
                                {s === 0 ? '⏸' : `${s}×`}
                            </button>
                        ))}
                    </div>

                    <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)' }} />

                    <button
                        onClick={reset}
                        className="tl-reset-btn"
                        title="Reset la simulation"
                        style={{
                            width: 26,
                            height: 26,
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 6,
                            background: 'rgba(255,255,255,0.05)',
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: 12,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        🔄
                    </button>
                </div>
            </div>

            {/* Hover effects */}
            <style>{`
                @keyframes flashFade {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                @keyframes genFadeIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                @keyframes genFadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                .tl-speed-btn:hover {
                    background: rgba(255,255,255,0.1) !important;
                    color: rgba(255,255,255,0.85) !important;
                }
                .tl-reset-btn:hover {
                    background: rgba(244,67,54,0.15) !important;
                    border-color: rgba(244,67,54,0.3) !important;
                    color: #F44336 !important;
                }
            `}</style>
        </>
    )
}

function StatPill({ label, value, color }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                fontWeight: 600,
            }}>
                {label}
            </span>
            <span style={{
                color,
                fontWeight: 700,
                fontSize: 13,
                fontVariantNumeric: 'tabular-nums',
                textShadow: `0 0 8px ${color}30`,
            }}>
                {value}
            </span>
        </div>
    )
}
