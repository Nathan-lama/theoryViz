import { getWorldObjects } from './registry'
import useStore from '../core/store'

// Trigger all side-effect registrations
import './objects'

export default function WorldRenderer() {
    const worldObjects = useStore((s) => s.worldObjects)
    const registeredObjects = getWorldObjects()

    return (
        <group>
            {registeredObjects.map((obj) => {
                const state = worldObjects[obj.id]
                // If state exists and is disabled, skip rendering
                if (state && !state.enabled) return null
                const Component = obj.component
                return <Component key={obj.id} />
            })}
        </group>
    )
}
