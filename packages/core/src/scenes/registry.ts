import type { SceneId } from './palettes'
import type { ParticleKind } from './particles'

export interface SceneDef {
  id: SceneId
  particles: ParticleKind
}

export const SCENES: Record<SceneId, SceneDef> = {
  clear: { id: 'clear', particles: 'stars' },
  partly: { id: 'partly', particles: 'none' },
  cloudy: { id: 'cloudy', particles: 'none' },
  shower: { id: 'shower', particles: 'rain' },
  thunder: { id: 'thunder', particles: 'rain' },
  rain: { id: 'rain', particles: 'rain' },
  sleet: { id: 'sleet', particles: 'rain' },
  snow: { id: 'snow', particles: 'snow' },
  fog: { id: 'fog', particles: 'none' },
  haze: { id: 'haze', particles: 'dust' },
  sand: { id: 'sand', particles: 'dust' },
  unknown: { id: 'unknown', particles: 'none' },
}

const CODE_GROUPS: Array<[SceneId, number[]]> = [
  ['clear', [0]],
  ['partly', [1, 2]],
  ['cloudy', [3]],
  ['shower', [300, 301, 350, 351]],
  ['thunder', [302, 303, 304]],
  ['rain', [305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 399]],
  ['sleet', [404, 405, 406, 456]],
  ['snow', [400, 401, 402, 403, 407, 408, 409, 410, 457, 480, 481, 499]],
  ['fog', [500, 501, 514, 515]],
  ['haze', [502, 510, 511, 512, 513]],
  ['sand', [503, 504, 507, 508, 509]],
]

const CODE_MAP = new Map<number, SceneId>()
for (const [id, codes] of CODE_GROUPS) {
  for (const c of codes) CODE_MAP.set(c, id)
}

export function resolveScene(icon: string | number): SceneDef {
  const id = CODE_MAP.get(Number(icon))
  return id ? SCENES[id] : SCENES.unknown
}
