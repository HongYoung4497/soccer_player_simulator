/**
 * `[가정]` 밸런스 노브 — 스파이크에서 튜닝.
 * 제품 잠금(`[확정]`)은 quarterly-sim-rules.md §0·§9 참고.
 */

/** 분기 리그 경기 수 L `[가정: 8~10]` */
export const LEAGUE_MATCHES_PER_QUARTER = 9

/** 분기에 컵 경기가 있을 때 최대 경기 수 `[가정]` */
export const CUP_MATCHES_MAX_PER_QUARTER = 1

/** 역할 → 리그 출전 분 목표 비율 밴드 `[가정]` */
export const ROLE_MINUTE_BANDS = {
  key: { min: 0.85, max: 1.0 },
  starter: { min: 0.65, max: 0.85 },
  rotation: { min: 0.35, max: 0.6 },
  unused: { min: 0, max: 0.15 },
} as const

/** 평점 클램프 `[가정]` */
export const RATING_CLAMP = { min: 5.5, max: 8.5 } as const

/** 부상 롤 — fitness·출전 과다 `[가정]` */
export const INJURY = {
  baseChance: 0.04,
  lowFitnessBonus: 0.08, // fitness < 55
  highMinutesBonus: 0.06, // minutes > 0.85 * max
  rehabRecoveryBonus: 1, // 재활 훈련 시 quartersLeft 추가 감소
  defaultQuarters: 1,
} as const

/** 성장 δ `[가정]` */
export const GROWTH = {
  trainingDelta: 1.2,
  playingDelta: 0.35,
  fitnessCostTraining: 4,
  fitnessCostPlaying: 0.008, // per minute
  fitnessRecoverIdle: 3,
  ageSoftCap: 28,
  ageHardCap: 33,
  ageSoftMult: 0.65,
  ageHardMult: 0.35,
} as const

/** 제안 출현률 `[가정]` */
export const EVENT_RATES = {
  rolePressureThreshold: 0.18, // |actual - midBand|
  roleOfferBase: 0.35,
  loanWhenLowMinutes: 0.45,
  transferWindowBase: 0.22,
  maxQueueLength: 3,
} as const

/** 골/도움 기대식 계수 `[가정]` */
export const SCORING = {
  fwGoalPer90: 0.42,
  mfGoalPer90: 0.12,
  dfGoalPer90: 0.04,
  gkGoalPer90: 0,
  fwAssistPer90: 0.18,
  mfAssistPer90: 0.28,
  dfAssistPer90: 0.08,
  stylePoacherGoalMult: 1.25,
  styleTargetGoalMult: 1.1,
  stylePlaymakerAssistMult: 1.3,
  styleBoxToBoxAssistMult: 1.1,
  tierPressureOnGoals: 0.04, // higher tier slightly harder
} as const

/** 팀 WDL 기본 승률 `[가정]` — 티어별 */
export const TEAM_FORM = {
  /** P(win), P(draw) — 나머지 패 */
  byTier: {
    1: { win: 0.42, draw: 0.28 },
    2: { win: 0.34, draw: 0.3 },
    3: { win: 0.26, draw: 0.3 },
  },
  playerOvrBoostPerPoint: 0.004, // ovr above 65
  minutesContributionCap: 0.06,
} as const

/** 이벤트 큐 정렬 우선순위 `[가정]` — 낮을수록 먼저 */
export const EVENT_SORT_ORDER = {
  INJURY: 0,
  ROLE_OFFER: 1,
  LOAN_OFFER: 2,
  TRANSFER_OFFER: 3,
  INJURY_RECOVERED: 4,
} as const

/** 컵 라운드 진행 순서 `[가정]` */
export const CUP_ROUNDS = [
  'round_of_64',
  'round_of_32',
  'round_of_16',
  'quarterfinal',
  'semifinal',
  'final',
  'winner',
] as const

export const CUP_ROUND_KO: Record<(typeof CUP_ROUNDS)[number] | 'not_entered' | 'eliminated', string> =
  {
    not_entered: '미참가',
    round_of_64: '64강',
    round_of_32: '32강',
    round_of_16: '16강',
    quarterfinal: '8강',
    semifinal: '4강',
    final: '결승',
    winner: '우승',
    eliminated: '탈락',
  }
