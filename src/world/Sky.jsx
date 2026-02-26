import { Sky as DreiSky } from '@react-three/drei'

export default function Sky() {
    return (
        <DreiSky
            sunPosition={[100, 20, 100]}
            turbidity={8}
            rayleigh={2}
        />
    )
}
