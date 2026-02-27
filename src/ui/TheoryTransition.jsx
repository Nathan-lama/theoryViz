import { useEffect, useRef } from 'react'
import useStore from '../core/store'

/**
 * TheoryTransition — Full-screen overlay for cinematic theory transitions.
 * Uses direct DOM manipulation for reliable animation (avoids React state timing issues).
 */
export default function TheoryTransition() {
    const overlayRef = useRef(null)
    const titleRef = useRef(null)
    const descRef = useRef(null)
    const transitionRequest = useStore((s) => s._transitionRequest)

    useEffect(() => {
        if (!transitionRequest) return

        const { title, color, description } = transitionRequest
        useStore.setState({ _transitionRequest: null })

        const overlay = overlayRef.current
        const titleEl = titleRef.current
        const descEl = descRef.current
        if (!overlay || !titleEl) return

        // Set content
        titleEl.textContent = title || 'Monde Libre'
        titleEl.style.color = color || '#A5D6A7'
        titleEl.style.textShadow = `0 0 40px ${color || '#A5D6A7'}60, 0 0 80px ${color || '#A5D6A7'}30`
        if (descEl) descEl.textContent = description || ''
        titleEl.style.opacity = '0'
        if (descEl) descEl.style.opacity = '0'

        // Phase 1: Fade in overlay
        overlay.style.transition = 'opacity 0.4s ease-in'
        overlay.style.opacity = '0.92'
        overlay.style.pointerEvents = 'all'
        overlay.style.display = 'flex'

        // Phase 2: Show title
        setTimeout(() => {
            titleEl.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out'
            titleEl.style.opacity = '1'
            titleEl.style.transform = 'scale(1) translateY(0)'
            if (descEl) {
                descEl.style.transition = 'opacity 0.3s ease-out 0.15s'
                descEl.style.opacity = '1'
            }
        }, 450)

        // Phase 3: Fade out overlay
        setTimeout(() => {
            overlay.style.transition = 'opacity 0.5s ease-out'
            overlay.style.opacity = '0'
            overlay.style.pointerEvents = 'none'
        }, 2200)

        // Phase 4: Clean up — fully hide
        setTimeout(() => {
            overlay.style.display = 'none'
            titleEl.style.opacity = '0'
            titleEl.style.transform = 'scale(0.92) translateY(12px)'
            if (descEl) descEl.style.opacity = '0'
        }, 2800)
    }, [transitionRequest])

    return (
        <div
            ref={overlayRef}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: '#000',
                opacity: 0,
                display: 'none',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
            }}
        >
            <div
                ref={titleRef}
                style={{
                    fontSize: 52,
                    fontWeight: 800,
                    letterSpacing: 2,
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    opacity: 0,
                    transform: 'scale(0.92) translateY(12px)',
                    textAlign: 'center',
                }}
            />
            <div
                ref={descRef}
                style={{
                    fontSize: 16,
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: 14,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 400,
                    letterSpacing: 0.5,
                    opacity: 0,
                    textAlign: 'center',
                }}
            />
        </div>
    )
}
