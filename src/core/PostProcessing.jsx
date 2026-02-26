import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

export default function PostProcessing() {
    return (
        <EffectComposer>
            <Bloom
                luminanceThreshold={0.8}
                intensity={0.4}
                mipmapBlur
            />
            <Vignette
                offset={0.3}
                darkness={0.5}
            />
        </EffectComposer>
    )
}
