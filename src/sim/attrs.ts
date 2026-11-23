import type { AttrKey, PlayerAttrs, PositionGroup, StyleTag } from '../types'

const BASE = 58

/** 포지션별 기본 능력 스프레드 `[가정]` */
export function defaultAttrs(
  position: PositionGroup,
  style: StyleTag,
  ovr: number,
): PlayerAttrs {
  const bump = (v: number) => Math.min(90, Math.max(35, Math.round(v + (ovr - 68) * 0.6)))
  const attrs: PlayerAttrs = {
    stamina: bump(BASE + 4),
    mental: bump(BASE + 2),
    footballIQ: bump(BASE + 3),
    finishing: bump(BASE - 4),
    positioning: bump(BASE),
    speed: bump(BASE + 2),
    passing: bump(BASE),
    vision: bump(BASE - 2),
    pressing: bump(BASE),
    tackling: bump(BASE - 2),
    marking: bump(BASE - 2),
    aerial: bump(BASE),
    shotStopping: bump(BASE - 8),
    command: bump(BASE - 8),
    buildup: bump(BASE - 6),
  }

  const boost = (keys: AttrKey[], amount: number) => {
    for (const k of keys) attrs[k] = Math.min(92, attrs[k] + amount)
  }

  if (position === 'FW') {
    boost(['finishing', 'positioning', 'speed'], 8)
  } else if (position === 'MF') {
    boost(['passing', 'vision', 'pressing', 'stamina'], 7)
  } else if (position === 'DF') {
    boost(['tackling', 'marking', 'aerial', 'positioning'], 8)
  } else {
    boost(['shotStopping', 'command', 'buildup'], 12)
  }

  if (style === '포처') boost(['finishing', 'positioning'], 4)
  if (style === '타겟') boost(['aerial', 'finishing'], 4)
  if (style === '박스투박스') boost(['stamina', 'pressing', 'passing'], 3)
  if (style === '플레이메이커') boost(['vision', 'passing'], 4)
  if (style === '윙백') boost(['speed', 'stamina', 'tackling'], 3)
  if (style === '스위퍼키퍼') boost(['buildup', 'command'], 4)

  return attrs
}

export function recomputeOvr(position: PositionGroup, attrs: PlayerAttrs): number {
  const weighted: Array<[AttrKey, number]> =
    position === 'FW'
      ? [
          ['finishing', 3],
          ['positioning', 2],
          ['speed', 2],
          ['stamina', 1],
          ['mental', 1],
        ]
      : position === 'MF'
        ? [
            ['passing', 2],
            ['vision', 2],
            ['pressing', 2],
            ['stamina', 2],
            ['footballIQ', 1],
          ]
        : position === 'DF'
          ? [
              ['tackling', 3],
              ['marking', 2],
              ['aerial', 2],
              ['positioning', 1],
              ['mental', 1],
            ]
          : [
              ['shotStopping', 3],
              ['command', 2],
              ['buildup', 2],
              ['mental', 1],
              ['footballIQ', 1],
            ]

  let sum = 0
  let w = 0
  for (const [k, weight] of weighted) {
    sum += attrs[k] * weight
    w += weight
  }
  return Math.round(sum / w)
}

export const ATTR_LABEL_KO: Record<AttrKey, string> = {
  stamina: '체력',
  mental: '멘탈',
  footballIQ: '축구지능',
  finishing: '마무리',
  positioning: '위치선정',
  speed: '스피드',
  passing: '패스',
  vision: '시야',
  pressing: '압박',
  tackling: '태클',
  marking: '마킹',
  aerial: '공중볼',
  shotStopping: '선방',
  command: '커맨드',
  buildup: '빌드업',
}

export const TRAINING_ATTR: Record<
  import('../types').TrainingFocus,
  AttrKey | 'rehab'
> = {
  결정력: 'finishing',
  지구력: 'stamina',
  위치선정: 'positioning',
  멘탈: 'mental',
  '재활·컨디션': 'rehab',
}
