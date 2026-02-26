// Behavior functions for creatures
// Each returns a target angle (direction) or null if no action

/**
 * Wander — random direction changes
 * Already handled inline in Creature, but available as a fallback
 */
export function wander(dirState, delta) {
  dirState.timer += delta
  if (dirState.timer >= dirState.nextChange) {
    dirState.angle += (Math.random() - 0.5) * Math.PI * 1.5
    dirState.nextChange = 2 + Math.random() * 2
    dirState.timer = 0
  }
  return dirState.angle
}

/**
 * seekFood — move toward nearest food within range
 * Returns target angle or null if no food nearby
 */
export function seekFood(creaturePos, foodItems, range = 5) {
  let nearest = null
  let nearestDist = Infinity

  for (const food of foodItems) {
    const dx = food.position[0] - creaturePos.x
    const dz = food.position[2] - creaturePos.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < range && dist < nearestDist) {
      nearest = food
      nearestDist = dist
    }
  }

  if (!nearest) return null

  const dx = nearest.position[0] - creaturePos.x
  const dz = nearest.position[2] - creaturePos.z
  const angle = Math.atan2(dz, dx)

  return { angle, target: nearest, distance: nearestDist }
}

/**
 * flee — run away from threat
 */
export function flee(creaturePos, threatPos) {
  const dx = creaturePos.x - threatPos.x
  const dz = creaturePos.z - threatPos.z
  return Math.atan2(dz, dx)
}

/**
 * reproduce — returns props for a child creature
 */
export function reproduce(parent) {
  // Slight variations from parent
  const hueShift = (Math.random() - 0.5) * 0.1
  return {
    position: [
      parent.x + (Math.random() - 0.5) * 2,
      parent.y,
      parent.z + (Math.random() - 0.5) * 2,
    ],
    color: parent.color, // keep parent color for now
    size: parent.size * (0.9 + Math.random() * 0.2),
    speed: parent.speed * (0.9 + Math.random() * 0.2),
  }
}
