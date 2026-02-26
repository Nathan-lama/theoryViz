import { useState, useEffect, useRef } from 'react'
import useStore from '../core/store'

const SPEED_STEPS = [0, 1, 2, 5, 10]

export default function Timeline() {
    const time = useStore((s) => s.time)
    const speed = useStore((s) => s.speed)
    const setSpeed = useStore((s) => s.setSpeed)
    const generation = useStore((s) => s.generation)
    const creatures = useStore((s) => s.creatures)
    const reset = useStore((s) => s.reset)

    // Generation flash state
    const [flash, setFlash] = useState(false)
    const [genLabel, setGenLabel] = useState(null)
    const prevGenRef = useRef(generation)

    useEffect(() => {
        if (generation > prevGenRef.current) {
            // Trigger flash
            setFlash(true)
            setGenLabel(generation)
            setTimeout(() => setFlash(false), 150)
            setTimeout(() => setGenLabel(null), 2500)
        }
        prevGenRef.current = generation
    }, [generation])

    const togglePause = () => {
        setSpeed(speed === 0 ? 1 : 0)
    }

    const speedIndex = SPEED_STEPS.indexOf(speed)

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
                        color: '#A5D6A7',
                        fontSize: 22,
                        fontWeight: 700,
                        fontFamily: "'Inter', 'Segoe UI', sans-serif",
                        letterSpacing: 1,
                        textShadow: '0 0 12px rgba(165,214,167,0.4)',
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
                height: 56,
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                gap: 12,
                zIndex: 999,
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                color: '#fff',
                borderTop: '1px solid rgba(255,255,255,0.08)',
            }}>
                {/* Rewind */}
                <button onClick={reset} style={btnStyle} title="Rewind">
                    ⏪
                </button>

                {/* Play / Pause */}
                <button onClick={togglePause} style={btnStyle} title={speed === 0 ? 'Play' : 'Pause'}>
                    {speed === 0 ? '▶️' : '⏸️'}
                </button>

                {/* Fast forward */}
                <button onClick={() => setSpeed(5)} style={btnStyle} title="Fast Forward">
                    ⏩
                </button>

                {/* Separator */}
                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.15)' }} />

                {/* Stats */}
                <div style={{
                    display: 'flex',
                    gap: 16,
                    fontSize: 13,
                    color: '#ccc',
                    flex: 1,
                }}>
                    <span>
                        <span style={{ color: '#CE93D8', fontWeight: 600 }}>Gén:</span>{' '}
                        <span style={{ color: '#fff', fontWeight: 700 }}>{generation}</span>
                    </span>
                    <span>
                        <span style={{ color: '#80CBC4', fontWeight: 600 }}>Pop:</span>{' '}
                        <span style={{ color: '#fff', fontWeight: 700 }}>{creatures.length}</span>
                    </span>
                    <span>
                        <span style={{ color: '#FFB74D', fontWeight: 600 }}>Temps:</span>{' '}
                        <span style={{ color: '#fff', fontWeight: 700 }}>{Math.floor(time)}</span>
                    </span>
                </div>

                {/* Speed slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Vitesse
                    </span>
                    <div style={{ display: 'flex', gap: 3 }}>
                        {SPEED_STEPS.map((s) => (
                            <button
                                key={s}
                                onClick={() => setSpeed(s)}
                                style={{
                                    padding: '4px 10px',
                                    border: 'none',
                                    borderRadius: 5,
                                    background: speed === s ? '#4CAF50' : 'rgba(255,255,255,0.1)',
                                    color: speed === s ? '#000' : '#aaa',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {s === 0 ? '⏸' : `${s}×`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Animations */}
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
      `}</style>
        </>
    )
}

const btnStyle = {
    width: 36,
    height: 36,
    border: 'none',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
}
