import useStore from '../core/store'
import Creature from './Creature'
import Predator from './Predator'

export default function CreatureManager() {
    const creatures = useStore((s) => s.creatures)
    const predators = useStore((s) => s.predators)

    return (
        <group>
            {creatures.map((c) => (
                <Creature key={c.id} data={c} />
            ))}
            {predators.map((p) => (
                <Predator key={`pred-${p.id}`} data={p} />
            ))}
        </group>
    )
}
