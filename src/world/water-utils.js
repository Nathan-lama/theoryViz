// ── Water utilities (worker-compatible) ─────────────────────────
// Pure math function for water detection — shared between
// main thread (rendering) and simulation worker.
// No React imports here.

export function isInWater(x, z) {
    const baseRadius = 12
    const angle = Math.atan2(z, x)
    const r =
        baseRadius +
        Math.sin(angle * 2) * 3 +
        Math.sin(angle * 3.7) * 1.5 +
        Math.cos(angle * 5.1) * 0.8
    const dist = Math.sqrt(x * x + z * z)
    return dist < r - 1
}
