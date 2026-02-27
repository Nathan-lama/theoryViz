import { useEffect, useRef, useCallback } from 'react'
import useStore from './store'

/**
 * AudioManager — Manages ambient sounds and UI sound effects.
 * Uses Web Audio API with oscillators for lightweight sound effects.
 */

// ── Tiny synth sound effects (no external files needed) ────────

let audioCtx = null

function getAudioCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    }
    return audioCtx
}

function playPop() {
    try {
        const ctx = getAudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(800, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05)
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15)
        gain.gain.setValueAtTime(0.08, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.2)
    } catch (e) { /* audio not available */ }
}

function playWhoosh() {
    try {
        const ctx = getAudioCtx()
        const bufferSize = ctx.sampleRate * 0.3
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
        }
        const source = ctx.createBufferSource()
        source.buffer = buffer
        const filter = ctx.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.setValueAtTime(2000, ctx.currentTime)
        filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.25)
        filter.Q.value = 1
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0.06, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
        source.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        source.start(ctx.currentTime)
    } catch (e) { /* audio not available */ }
}

function playClick() {
    try {
        const ctx = getAudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(1000, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.04)
        gain.gain.setValueAtTime(0.04, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.05)
    } catch (e) { /* audio not available */ }
}

// ── Ambient drone generator ────────────────────────────────────

class AmbientDrone {
    constructor() {
        this.isPlaying = false
        this.nodes = null
    }

    start(volume = 0.03) {
        if (this.isPlaying) return
        try {
            const ctx = getAudioCtx()
            // Low drone using multiple detuned oscillators
            const gain = ctx.createGain()
            gain.gain.value = volume
            gain.connect(ctx.destination)

            const oscs = []
            const freqs = [55, 82.4, 110, 130.8] // A1, E2, A2, C3
            freqs.forEach((freq, i) => {
                const osc = ctx.createOscillator()
                osc.type = i % 2 === 0 ? 'sine' : 'triangle'
                osc.frequency.value = freq
                osc.detune.value = (Math.random() - 0.5) * 10
                const oscGain = ctx.createGain()
                oscGain.gain.value = i === 0 ? 0.4 : 0.15
                osc.connect(oscGain)
                oscGain.connect(gain)
                osc.start()
                oscs.push(osc)
            })

            // Gentle noise layer for wind
            const bufferSize = ctx.sampleRate * 2
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
            const data = buffer.getChannelData(0)
            for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1)
            const noise = ctx.createBufferSource()
            noise.buffer = buffer
            noise.loop = true
            const filter = ctx.createBiquadFilter()
            filter.type = 'lowpass'
            filter.frequency.value = 400
            filter.Q.value = 0.5
            const noiseGain = ctx.createGain()
            noiseGain.gain.value = 0.08
            noise.connect(filter)
            filter.connect(noiseGain)
            noiseGain.connect(gain)
            noise.start()

            this.nodes = { gain, oscs, noise }
            this.isPlaying = true
        } catch (e) { /* audio not available */ }
    }

    stop() {
        if (!this.isPlaying || !this.nodes) return
        try {
            this.nodes.oscs.forEach(o => { try { o.stop() } catch (e) { } })
            try { this.nodes.noise.stop() } catch (e) { }
            this.nodes.gain.disconnect()
        } catch (e) { }
        this.nodes = null
        this.isPlaying = false
    }

    setVolume(v) {
        if (this.nodes?.gain) {
            this.nodes.gain.gain.value = v
        }
    }
}

const ambientDrone = new AmbientDrone()

// ── Exports for use from other components ─────────────────────

export { playPop, playWhoosh, playClick }

// ── React component that manages audio lifecycle ──────────────

export default function AudioManager() {
    const muted = useStore((s) => s.audioMuted)
    const prevBirths = useRef(0)
    const prevDeaths = useRef(0)

    // Track births and deaths for sound effects
    const recentBirths = useStore((s) => s.recentBirths)
    const recentDeaths = useStore((s) => s.recentDeaths)

    useEffect(() => {
        if (muted) {
            ambientDrone.stop()
            return
        }
        // Start ambient on first interaction
        const startAmbient = () => {
            ambientDrone.start(0.025)
            document.removeEventListener('click', startAmbient)
            document.removeEventListener('keydown', startAmbient)
        }
        document.addEventListener('click', startAmbient)
        document.addEventListener('keydown', startAmbient)
        return () => {
            document.removeEventListener('click', startAmbient)
            document.removeEventListener('keydown', startAmbient)
            ambientDrone.stop()
        }
    }, [muted])

    // Birth sound
    useEffect(() => {
        if (muted) return
        if (recentBirths > prevBirths.current && prevBirths.current > 0) {
            playPop()
        }
        prevBirths.current = recentBirths
    }, [recentBirths, muted])

    // Death sound
    useEffect(() => {
        if (muted) return
        if (recentDeaths > prevDeaths.current && prevDeaths.current > 0) {
            playWhoosh()
        }
        prevDeaths.current = recentDeaths
    }, [recentDeaths, muted])

    return null
}
