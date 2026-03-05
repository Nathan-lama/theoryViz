// ── Preset Registry (no imports of preset files here to avoid circular deps) ──

const presets = {}

export function registerPreset(preset) {
  presets[preset.id] = preset
}

export function getPreset(id) {
  return presets[id] || presets['forest']
}

export function getAllPresets() {
  return Object.values(presets)
}
