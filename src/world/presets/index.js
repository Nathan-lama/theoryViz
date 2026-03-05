// ── World Presets ────────────────────────────────────────────────
// Side-effect imports: each preset file registers itself.
// The registry lives in registry.js (separate to avoid circular deps).

export { registerPreset, getPreset, getAllPresets } from './registry'

import './forest'
import './industrial'
import './desert'
import './shire'
