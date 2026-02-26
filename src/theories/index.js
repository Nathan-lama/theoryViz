import evolutionConfig from './evolution/config.json'
import marxismeConfig from './marxisme/config.json'

export const theories = {
  evolution: evolutionConfig,
  marxisme: marxismeConfig,
}

export const theoryList = Object.values(theories)
