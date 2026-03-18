// ── Simulation Web Worker ────────────────────────────────────────
// Runs the tick loop off-main-thread so rendering stays smooth.
// Implements real biology: climate effects, carrying capacity,
// intraspecific competition, and detailed trait tracking.
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
import '../creatures/behaviors'

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

// ══════════════════════════════════════════════════════════════════
// CLIMATE EFFECTS — Based on Bergmann's & Allen's rules
// ══════════════════════════════════════════════════════════════════
//
// Climate slider: 0 = glacial, 50 = tempéré, 100 = canicule
//
// Bergmann's rule: larger body mass in colder climates (better heat retention)
// Allen's rule: shorter extremities in cold (lower surface/volume → less heat loss)
//
// In practice:
//   - Cold (0–30): high energy cost, speed penalty, LARGE creatures survive better
//   - Temperate (30–70): neutral — no extra pressure
//   - Hot (70–100): high energy cost, small creatures have advantage (better heat dissipation)
//
// metabolism is also affected: cold slows metabolism, hot accelerates it

function getClimateEffects(climate, traits) {
    const deviation = Math.abs(climate - 50) / 50 // 0 = temperate, 1 = extreme

    // Energy cost multiplier: increases with climate extremes
    // Base: 1.0 at temperate, up to 1.8 at extremes
    const baseCostMult = 1.0 + deviation * 0.8

    // Size advantage: in cold, large creatures waste less energy
    // In hot, small creatures dissipate heat better
    const optimalSize = climate < 50
        ? 0.35 + (50 - climate) / 50 * 0.25    // cold → optimal ~0.6
        : 0.35 - (climate - 50) / 50 * 0.15    // hot → optimal ~0.2

    const sizeDiff = Math.abs(traits.size - optimalSize)
    const sizeAdaptation = 1.0 + sizeDiff * 1.2 // penalty for wrong size

    // Speed modifier: cold slows movement, hot increases water needs
    const speedMod = climate < 30
        ? 0.7 + (climate / 30) * 0.3   // 0.7–1.0 in cold
        : climate > 70
            ? 1.0 - (climate - 70) / 30 * 0.2  // 0.8–1.0 in hot
            : 1.0

    return {
        energyCostMultiplier: baseCostMult * sizeAdaptation,
        speedMultiplier: speedMod,
    }
}

// ══════════════════════════════════════════════════════════════════
// CARRYING CAPACITY (K) — Logistic growth model
// ══════════════════════════════════════════════════════════════════
//
// resources slider (0–100) maps to carrying capacity K
// When population > K:
//   - Food energy gain is reduced (intraspecific competition)
//   - Reproduction threshold increases (harder to reproduce)
// This creates natural population regulation (logistic curve)

function getCarryingCapacity(resources) {
    // K ranges from 10 (resources=0) to 200 (resources=100)
    return Math.round(10 + resources * 1.9)
}

function getCompetitionFactor(populationSize, K) {
    // Returns 0–1: how stressed the population is
    // 0 = well under K (no competition), 1 = at/above K (max competition)
    if (K <= 0) return 1
    return Math.min(1, Math.max(0, populationSize / K))
}

// ══════════════════════════════════════════════════════════════════
// TRAIT TRACKING — Scientific metrics every tick
// ══════════════════════════════════════════════════════════════════

function computeTraitStats(creatures) {
    const n = creatures.length
    if (n === 0) return {
        avgSpeed: 0, avgSize: 0, avgVision: 0, avgMetabolism: 0,
        varSpeed: 0, varSize: 0, varVision: 0, varMetabolism: 0,
        avgEnergy: 0, shannonDiversity: 0, avgGeneration: 0,
    }

    // ── Means ──
    let sumSpeed = 0, sumSize = 0, sumVision = 0, sumMetabolism = 0
    let sumEnergy = 0, sumGen = 0
    for (const c of creatures) {
        sumSpeed += c.traits.speed
        sumSize += c.traits.size
        sumVision += c.traits.vision
        sumMetabolism += (c.traits.metabolism || 1.0)
        sumEnergy += c.energy
        sumGen += c.generation
    }
    const avgSpeed = sumSpeed / n
    const avgSize = sumSize / n
    const avgVision = sumVision / n
    const avgMetabolism = sumMetabolism / n
    const avgEnergy = sumEnergy / n
    const avgGeneration = sumGen / n

    // ── Variance (σ²) ──
    let varSpeed = 0, varSize = 0, varVision = 0, varMetabolism = 0
    for (const c of creatures) {
        varSpeed += (c.traits.speed - avgSpeed) ** 2
        varSize += (c.traits.size - avgSize) ** 2
        varVision += (c.traits.vision - avgVision) ** 2
        varMetabolism += ((c.traits.metabolism || 1.0) - avgMetabolism) ** 2
    }
    varSpeed /= n
    varSize /= n
    varVision /= n
    varMetabolism /= n

    // ── Shannon diversity index (based on color hue bins) ──
    // H = -Σ(pᵢ × ln(pᵢ))
    // Divide hue into 12 bins (30° each, like months of color wheel)
    const hueBins = new Array(12).fill(0)
    for (const c of creatures) {
        const hue = c.traits.color[0]
        const bin = Math.floor(hue / 30) % 12
        hueBins[bin]++
    }
    let shannonDiversity = 0
    for (const count of hueBins) {
        if (count > 0) {
            const p = count / n
            shannonDiversity -= p * Math.log(p)
        }
    }
    // Normalize: max Shannon for 12 bins = ln(12) ≈ 2.485
    shannonDiversity = shannonDiversity / Math.log(12)

    return {
        avgSpeed: +avgSpeed.toFixed(3),
        avgSize: +avgSize.toFixed(3),
        avgVision: +avgVision.toFixed(3),
        avgMetabolism: +avgMetabolism.toFixed(3),
        varSpeed: +varSpeed.toFixed(4),
        varSize: +varSize.toFixed(4),
        varVision: +varVision.toFixed(4),
        varMetabolism: +varMetabolism.toFixed(4),
        avgEnergy: +avgEnergy.toFixed(1),
        shannonDiversity: +shannonDiversity.toFixed(3),
        avgGeneration: +avgGeneration.toFixed(1),
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

    const climate = state.variables.climate ?? 50
    const resources = state.variables.resources ?? 50
    const K = getCarryingCapacity(resources)
    const competition = getCompetitionFactor(creatures.length, K)

    // Reproduction threshold: harder when population is near/above K
    // Base: 80 energy → up to 95 at max competition
    const reproThreshold = 80 + competition * 15

    // Food energy gain: reduced by competition
    // Base: +25 → down to +10 at max competition
    const foodEnergyGain = 25 - competition * 15

    for (const c of creatures) {
        const traits = c.traits
        const cSpeed = traits.speed
        const metabolism = traits.metabolism || 1.0
        let { x, z, angle, dirTimer, nextDirChange, energy, size } = c

        // ── Climate-adjusted energy cost ──
        const climateEffects = getClimateEffects(climate, traits)
        const baseEnergyCost = 0.12 * metabolism * (1 + (cSpeed - 1) * 0.15) * (1 + (size - 0.3) * 0.5)
        const energyCost = baseEnergyCost * climateEffects.energyCostMultiplier
        energy -= energyCost * dt

        let speedMultiplier = climateEffects.speedMultiplier
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
            if (behaviorResult.speedMultiplier) speedMultiplier *= behaviorResult.speedMultiplier
            if (behaviorResult.ate) {
                foodItems = foodItems.filter((f) => f.id !== behaviorResult.ate.foodId)
                // Competition reduces food energy gain
                const gain = Math.max(5, foodEnergyGain)
                energy = Math.min(energy + gain, 100)
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

        // ── Reproduction with carrying capacity pressure ──
        if (energy > reproThreshold) {
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

function updateStats(state, newTime, creatures, birthsThisTick, deathsThisTick) {
    const creatureCount = creatures.length
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

    // ── Trait tracking (sampled every second of sim time) ──
    const traitStats = computeTraitStats(creatures)

    const traitHistory = { ...(state.traitHistory || {}) }
    if (tickInt > prevTickInt) {
        const MAX_HISTORY = 200
        const push = (arr, val) => [...(arr || []), val].slice(-MAX_HISTORY)

        traitHistory.speed = push(traitHistory.speed, traitStats.avgSpeed)
        traitHistory.size = push(traitHistory.size, traitStats.avgSize)
        traitHistory.vision = push(traitHistory.vision, traitStats.avgVision)
        traitHistory.metabolism = push(traitHistory.metabolism, traitStats.avgMetabolism)
        traitHistory.diversity = push(traitHistory.diversity, traitStats.shannonDiversity)
        traitHistory.fitness = push(traitHistory.fitness, traitStats.avgEnergy)
    }

    // ── Survival rate (over last 100 time units) ──
    const totalRecent = recentBirths + recentDeaths + creatureCount
    const survivalRate = totalRecent > 0 ? creatureCount / totalRecent : 1.0

    // ── Selection pressure indicator ──
    // High if: extreme climate + predators + low food + near K
    const climate = state.variables?.climate ?? 50
    const resources = state.variables?.resources ?? 50
    const K = getCarryingCapacity(resources)
    const climatePressure = Math.abs(climate - 50) / 50
    const predatorPressure = Math.min(1, (state.variables?.predatorCount ?? 0) / 10)
    const foodPressure = 1 - Math.min(1, (state.variables?.foodAbundance ?? 50) / 80)
    const densityPressure = getCompetitionFactor(creatureCount, K)
    const selectionPressure = +(
        (climatePressure * 0.25 + predatorPressure * 0.3 + foodPressure * 0.25 + densityPressure * 0.2)
    ).toFixed(3)

    return {
        generation, populationHistory, recentBirths, recentDeaths,
        _birthLog, _deathLog,
        traitStats, traitHistory,
        survivalRate: +survivalRate.toFixed(3),
        selectionPressure,
        carryingCapacity: K,
    }
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
    const stats = updateStats(simState, newTime, creatures, birthsThisTick, deathsThisTick)

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
