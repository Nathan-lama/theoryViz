// ── Behavior Registry ────────────────────────────────────────────
// Central registry for creature behaviors. Each behavior has:
//   id, label, priority, phase, condition, execute, theoryOverrides

const behaviorRegistry = {}

export function registerBehavior(config) {
  behaviorRegistry[config.id] = config
}

export function getBehaviors() {
  return Object.values(behaviorRegistry)
}

export function getBehaviorsByPriority() {
  return Object.values(behaviorRegistry).sort((a, b) => b.priority - a.priority)
}

// ── Built-in behaviors ───────────────────────────────────────────

// --- Flee (priority 10) ---
registerBehavior({
  id: 'flee',
  label: 'Fuir les prédateurs',
  priority: 10,
  condition: (creature, worldState) => {
    for (const p of worldState.predators) {
      const dx = p.x - creature.x
      const dz = p.z - creature.z
      if (dx * dx + dz * dz < 16) return true  // < 4 units
    }
    return false
  },
  execute: (creature, worldState, dt) => {
    let nearestDist = Infinity
    let fleeAngle = creature.angle
    for (const p of worldState.predators) {
      const dx = p.x - creature.x
      const dz = p.z - creature.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < 4 && dist < nearestDist) {
        nearestDist = dist
        fleeAngle = Math.atan2(creature.z - p.z, creature.x - p.x)
      }
    }
    return { angle: fleeAngle, speedMultiplier: 1.3 }
  },
  theoryOverrides: {
    marxisme: { label: "Fuir l'oppression", priority: 10 },
  },
})

// --- Seek Food (priority 5) ---
registerBehavior({
  id: 'seekFood',
  label: 'Chercher nourriture',
  priority: 5,
  condition: (creature, worldState) => {
    const vision = creature.traits.vision
    const visionSq = vision * vision
    for (const food of worldState.foodItems) {
      const dx = food.position[0] - creature.x
      const dz = food.position[2] - creature.z
      if (dx * dx + dz * dz < visionSq) return true
    }
    return false
  },
  execute: (creature, worldState, dt) => {
    const vision = creature.traits.vision
    let nearestFood = null
    let nearestDist = Infinity
    for (const food of worldState.foodItems) {
      const dx = food.position[0] - creature.x
      const dz = food.position[2] - creature.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < vision && dist < nearestDist) {
        nearestFood = food
        nearestDist = dist
      }
    }
    if (!nearestFood) return { angle: creature.angle }
    if (nearestDist < 0.4) {
      return { angle: creature.angle, ate: { foodId: nearestFood.id, energyGain: 15 } }
    }
    return { angle: Math.atan2(nearestFood.position[2] - creature.z, nearestFood.position[0] - creature.x) }
  },
  theoryOverrides: {
    marxisme: { label: 'Chercher du capital', priority: 8 },
  },
})

// --- Reproduce (priority 3, post-movement phase) ---
registerBehavior({
  id: 'reproduce',
  label: 'Se reproduire',
  priority: 3,
  phase: 'post',
  condition: (creature, worldState) => creature.energy > 80,
  execute: (creature, worldState, dt) => ({ reproduce: true, energyCost: 30 }),
  theoryOverrides: {
    marxisme: { label: 'Redistribuer', priority: 3 },
  },
})

// --- Wander (priority 1 — fallback) ---
registerBehavior({
  id: 'wander',
  label: 'Errer',
  priority: 1,
  condition: () => true,
  execute: (creature, worldState, dt) => {
    let { angle, dirTimer, nextDirChange } = creature
    dirTimer += dt
    if (dirTimer >= nextDirChange) {
      angle += (Math.random() - 0.5) * Math.PI * 1.5
      nextDirChange = 2 + Math.random() * 2
      dirTimer = 0
    }
    return { angle, dirTimer, nextDirChange }
  },
  theoryOverrides: {
    marxisme: { label: 'Marcher sans but', priority: 1 },
  },
})
