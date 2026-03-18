// ── Simulation Web Worker ────────────────────────────────────────
// Runs the tick loop off-main-thread so rendering stays smooth.
//
// Messages IN:
//   { type: 'init', state }        — initial state snapshot
//   { type: 'setSpeed', speed }    — change speed
//   { type: 'setVariable', key, value }
//   { type: 'setPreset', presetId } — switch heightmap
//   { type: 'setTheoryBehaviors', behaviors }
//   { type: 'reset', state }       — full state reset
//
// Messages OUT:
//   { type: 'tick', state }        — updated state after tick

import { mutateTraits, hslToString } from '../creatures/traits'
import { worldQuery, setActiveHeightmap } from '../world/world-query'
import { getBehaviorsByPriority } from '../creatures/behaviorRegistry'
import '../creatures/behaviors' // register built-in behaviors

// Import presets to register heightmaps
import '../world/presets/forest'
import '../world/presets/industrial'
import '../world/presets/desert'
import '../world/presets/shire'
import { getPreset } from '../world/presets/registry'

// ── State ────────────────────────────────────────────────────────
let simState = null
let speed = 1
let theoryBehaviors = {}
let running = false
let lastTime = 0

// ── ID Counters ──────────────────────────────────────────────────
let foodIdCounter = 100000
let creatureIdCounter = 100000
let predatorIdCounter = 100000

// ── Factory functions ────────────────────────────────────────────
// Use worldQuery abstraction for all terrain/water queries.

function randomTraits() {
    const s = 0.5 + Math.random() * 1.0
    const sz = 0.2 + Math.random() * 0.2
    const hue = Math.floor(Math.random() * 360)
    return {
        speed: s,
        size: sz,
        color: [hue, 70, 65],
        vision: 3 + Math.random() * 3,
        metabolism: 0.7 + Math.random() * 0.6,
    }
}

function createFoodItem() {
    const pos = worldQuery.randomLandPosition(60)
    return {
        id: foodIdCounter++,
        position: [pos.x, pos.y + 0.15, pos.z],
        type: Math.random() > 0.5 ? 'fruit' : 'grain',
    }
}

function createCreature(overrides = {}) {
    const pos = worldQuery.randomLandPosition(60)
    const traits = overrides.traits || randomTraits()
    return {
        id: creatureIdCounter++,
        x: overrides.x ?? pos.x,
        y: overrides.y ?? (pos.y + traits.size * 0.8),
        z: overrides.z ?? pos.z,
        angle: Math.random() * Math.PI * 2,
        dirTimer: 0,
        nextDirChange: 2 + Math.random() * 2,
        color: hslToString(traits.color),
        size: traits.size,
        speed: traits.speed,
        energy: overrides.energy ?? 50,
        generation: overrides.generation ?? 1,
        traits,
    }
}

function createPredator() {
    const pos = worldQuery.randomLandPosition(60)
    const size = 0.5
    return {
        id: predatorIdCounter++,
        x: pos.x,
        y: pos.y + size * 0.8,
        z: pos.z,
        angle: Math.random() * Math.PI * 2,
        dirTimer: 0,
        nextDirChange: 2 + Math.random() * 2,
        size,
        speed: 0.8,
        isPredator: true,
    }
}

// ── Tick sub-functions ───────────────────────────────────────────

function syncPredators(preds, targetCount) {
    const predators = [...preds]
    const target = Math.round(targetCount)
    while (predators.length < target) predators.push(createPredator())
    while (predators.length > target) predators.pop()
    return predators
}

function updatePredators(predators, creatures, dt) {
    const killSet = new Set()
    for (const p of predators) {
        let { x, z, angle, dirTimer, nextDirChange, size, speed: pSpeed } = p
        let nearestCreature = null
        let nearestDist = Infinity
        for (const c of creatures) {
            const dx = c.x - x
            const dz = c.z - z
            const dist = Math.sqrt(dx * dx + dz * dz)
            if (dist < 8 && dist < nearestDist) {
                nearestCreature = c
                nearestDist = dist
            }
        }
        if (nearestCreature) {
            angle = Math.atan2(nearestCreature.z - z, nearestCreature.x - x)
            if (nearestDist < 0.5) killSet.add(nearestCreature.id)
        } else {
            dirTimer += dt
            if (dirTimer >= nextDirChange) {
                angle += (Math.random() - 0.5) * Math.PI * 1.5
                nextDirChange = 2 + Math.random() * 2
                dirTimer = 0
            }
        }
        const moveSpeed = pSpeed * dt
        let newX = x + Math.cos(angle) * moveSpeed
        let newZ = z + Math.sin(angle) * moveSpeed
        if (!worldQuery.isInBounds(newX, newZ)) {
            if (Math.abs(newX) > 35) { angle = Math.PI - angle; newX = x }
            if (Math.abs(newZ) > 35) { angle = -angle; newZ = z }
        }
        if (worldQuery.isInWater(newX, newZ)) { angle += Math.PI * 0.7; newX = x; newZ = z }
        p.x = newX
        p.z = newZ
        p.y = worldQuery.getTerrainHeight(newX, newZ) + size * 0.8
        p.angle = angle
        p.dirTimer = dirTimer
        p.nextDirChange = nextDirChange
    }
    return { predators, killSet }
}

function tickCreatures(creatures, foodItems, predators, state, dt, newTime) {
    const newBorns = []
    const movementBehaviors = getBehaviorsByPriority().filter((b) => {
        if (b.phase === 'post') return false
        if (theoryBehaviors[b.id]?.enabled === false) return false
        return true
    })
    const worldState = { foodItems, predators, creatures, variables: state.variables, time: newTime }

    for (const c of creatures) {
        const traits = c.traits
        const cSpeed = traits.speed
        const metabolism = traits.metabolism || 1.0
        let { x, z, angle, dirTimer, nextDirChange, energy, size } = c

        const energyCost = 0.12 * metabolism * (1 + (cSpeed - 1) * 0.15) * (1 + (size - 0.3) * 0.5)
        energy -= energyCost * dt

        let speedMultiplier = 1.0
        let behaviorResult = null
        for (const behavior of movementBehaviors) {
            if (behavior.condition(c, worldState)) {
                behaviorResult = behavior.execute(c, worldState, dt)
                break
            }
        }

        if (behaviorResult) {
            if (behaviorResult.angle !== undefined) angle = behaviorResult.angle
            if (behaviorResult.dirTimer !== undefined) dirTimer = behaviorResult.dirTimer
            if (behaviorResult.nextDirChange !== undefined) nextDirChange = behaviorResult.nextDirChange
            if (behaviorResult.speedMultiplier) speedMultiplier = behaviorResult.speedMultiplier
            if (behaviorResult.ate) {
                foodItems = foodItems.filter((f) => f.id !== behaviorResult.ate.foodId)
                energy = Math.min(energy + behaviorResult.ate.energyGain, 100)
                size = Math.min(size + 0.005, traits.size * 1.5)
            }
        }

        const moveSpeed = cSpeed * dt * speedMultiplier
        let newX = x + Math.cos(angle) * moveSpeed
        let newZ = z + Math.sin(angle) * moveSpeed

        if (!worldQuery.isInBounds(newX, newZ)) {
            if (Math.abs(newX) > 35) { angle = Math.PI - angle; newX = x }
            if (Math.abs(newZ) > 35) { angle = -angle; newZ = z }
        }
        if (worldQuery.isInWater(newX, newZ)) { angle += Math.PI * (0.5 + Math.random()); newX = x; newZ = z }

        if (energy > 80) {
            energy -= 30
            const childTraits = mutateTraits(traits, state.variables.mutationRate)
            const cx = newX + (Math.random() - 0.5) * 2
            const cz = newZ + (Math.random() - 0.5) * 2
            newBorns.push(createCreature({
                x: cx, z: cz,
                y: worldQuery.getTerrainHeight(cx, cz) + childTraits.size * 0.8,
                energy: 40,
                generation: c.generation + 1,
                traits: childTraits,
            }))
        }

        c.x = newX
        c.z = newZ
        c.y = worldQuery.getTerrainHeight(newX, newZ) + size * 0.8
        c.angle = angle
        c.dirTimer = dirTimer
        c.nextDirChange = nextDirChange
        c.energy = energy
        c.size = size
        c.color = hslToString(traits.color)
        c.speed = cSpeed
    }

    const alive = creatures.filter((c) => c.energy > 0)
    return { creatures: alive, foodItems, newBorns }
}

function respawnFood(foodItems, newTime, prevTime, foodAbundance) {
    const tickInt = Math.floor(newTime)
    const prevTickInt = Math.floor(prevTime)
    if (tickInt > prevTickInt && tickInt % 3 === 0) {
        const spawnCount = Math.max(1, Math.floor(foodAbundance / 15))
        const newFood = Array.from({ length: spawnCount }, () => createFoodItem())
        return [...foodItems, ...newFood]
    }
    return foodItems
}

function updateStats(state, newTime, creatureCount, birthsThisTick, deathsThisTick) {
    const prevGenTick = Math.floor(state.time / 300)
    const newGenTick = Math.floor(newTime / 300)
    const generation = newGenTick > prevGenTick ? state.generation + 1 : state.generation

    const tickInt = Math.floor(newTime)
    const prevTickInt = Math.floor(state.time)
    const populationHistory = tickInt > prevTickInt
        ? [...state.populationHistory, creatureCount].slice(-300)
        : state.populationHistory

    const _birthLog = [...state._birthLog, { t: newTime, count: birthsThisTick }]
        .filter((e) => newTime - e.t < 100)
    const _deathLog = [...state._deathLog, { t: newTime, count: deathsThisTick }]
        .filter((e) => newTime - e.t < 100)

    const recentBirths = _birthLog.reduce((s, e) => s + e.count, 0)
    const recentDeaths = _deathLog.reduce((s, e) => s + e.count, 0)

    return { generation, populationHistory, recentBirths, recentDeaths, _birthLog, _deathLog }
}

// ── Main tick ────────────────────────────────────────────────────

function tick(dt) {
    if (!simState || speed === 0) return

    const scaledDt = dt * speed
    const newTime = simState.time + scaledDt

    let predators = syncPredators(simState.predators, simState.variables.predatorCount)
    const predResult = updatePredators(predators, simState.creatures, scaledDt)
    predators = predResult.predators

    let creatures = predResult.killSet.size > 0
        ? simState.creatures.filter((c) => !predResult.killSet.has(c.id))
        : [...simState.creatures]

    let foodItems = [...simState.foodItems]
    const creatureResult = tickCreatures(creatures, foodItems, predators, simState, scaledDt, newTime)
    creatures = creatureResult.creatures
    foodItems = creatureResult.foodItems

    const deathsThisTick = simState.creatures.length - creatures.length
    const birthsThisTick = creatureResult.newBorns.length
    creatures = [...creatures, ...creatureResult.newBorns]

    foodItems = respawnFood(foodItems, newTime, simState.time, simState.variables.foodAbundance)
    const stats = updateStats(simState, newTime, creatures.length, birthsThisTick, deathsThisTick)

    simState = {
        ...simState,
        time: newTime,
        creatures,
        foodItems,
        predators,
        ...stats,
    }

    self.postMessage({ type: 'tick', state: simState })
}

// ── Tick loop (~60fps) ───────────────────────────────────────────

function startLoop() {
    if (running) return
    running = true
    lastTime = performance.now()

    function loop() {
        if (!running) return
        const now = performance.now()
        const dt = Math.min((now - lastTime) / 1000, 0.1)
        lastTime = now
        tick(dt)
        setTimeout(loop, 16)
    }
    loop()
}

function stopLoop() {
    running = false
}

// ── Message handler ──────────────────────────────────────────────

self.onmessage = (e) => {
    const { type, ...data } = e.data

    switch (type) {
        case 'init':
            simState = data.state
            speed = data.state.speed || 1
            theoryBehaviors = data.state.theoryBehaviors || {}
            if (data.presetId) {
                const preset = getPreset(data.presetId)
                setActiveHeightmap(preset.heightmap)
            }
            startLoop()
            break

        case 'setSpeed':
            speed = data.speed
            break

        case 'setVariable':
            if (simState) {
                simState.variables = { ...simState.variables, [data.key]: data.value }
            }
            break

        case 'setPreset': {
            const preset = getPreset(data.presetId)
            setActiveHeightmap(preset.heightmap)
            break
        }

        case 'setTheoryBehaviors':
            theoryBehaviors = data.behaviors || {}
            break

        case 'reset':
            simState = data.state
            speed = data.state.speed || 1
            theoryBehaviors = data.state.theoryBehaviors || {}
            break

        case 'stop':
            stopLoop()
            break
    }
}
