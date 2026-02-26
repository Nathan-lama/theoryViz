import { useFrame } from '@react-three/fiber'
import useStore from '../core/store'

export default function SimEngine() {
  useFrame((_, delta) => {
    // Clamp delta to avoid huge jumps (e.g. tab switching)
    const clampedDelta = Math.min(delta, 0.1)
    useStore.getState().tick(clampedDelta)
  })

  return null // No visual output — pure logic
}
