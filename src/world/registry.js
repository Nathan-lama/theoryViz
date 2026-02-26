// ── World Object Registry ──────────────────────────────────────
// Each world object registers itself as a plugin via registerWorldObject().
// The WorldRenderer reads the registry to render all enabled objects.

const objectRegistry = {}

export function registerWorldObject(config) {
  objectRegistry[config.id] = config
}

export function getWorldObjects() {
  return Object.values(objectRegistry)
}

export function getWorldObject(id) {
  return objectRegistry[id]
}
