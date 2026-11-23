/** MVP 게임 상태 — 분기 시뮬 엔진 연동 */

export type AuthMode = 'guest' | 'google' | 'kakao' | null

export type PositionGroup = 'GK' | 'DF' | 'MF' | 'FW'

export type Role = 'unused' | 'rotation' | 'starter' | 'key'

export type PreferredLeague =
  | '북섬 프리미어'
  | '태양 리그'
  | '운하 세리에'
  | '강철 분데스'
  | '세느 리그'

export type StyleTag =
  | '포처'
  | '타겟'
  | '박스투박스'
  | '플레이메이커'
  | '윙백'
  | '스위퍼키퍼'

export type TrainingFocus =
  | '결정력'
  | '지구력'
  | '위치선정'
  | '멘탈'
  | '재활·컨디션'

/** 세부 능력 `[가정: 목록]` — 플랜 표 수치화 */
export interface PlayerAttrs {
  stamina: number
  mental: number
  footballIQ: number
  finishing: number
  positioning: number
  speed: number
  passing: number
  vision: number
  pressing: number
  tackling: number
  marking: number
  aerial: number
  shotStopping: number
  command: number
  buildup: number
}

export type AttrKey = keyof PlayerAttrs

export type InjuryState =
  | { type: 'none' }
  | { type: 'muscle' | 'knock' | 'sprain'; quartersLeft: number }

export type CupRoundStatus =
  | 'not_entered'
  | 'round_of_64'
  | 'round_of_32'
  | 'round_of_16'
  | 'quarterfinal'
  | 'semifinal'
  | 'final'
  | 'winner'
  | 'eliminated'

export interface PlayerProfile {
  name: string
  shirtNumber: number
  preferredFoot: '왼발' | '오른발' | '양발'
  position: PositionGroup
  style: StyleTag
  preferredLeague: PreferredLeague
  ovr: number
  attrs: PlayerAttrs
  age: number
}

export interface ClubStub {
  id: string
  name: string
  tier: 1 | 2 | 3
  league: string
  cup: string
}

export interface LeagueTableSnapshot {
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  points: number
  /** 대략 순위 감 (플레이어 리그 상세) */
  rank: number
}

/** 분기 개인 스탯 — 리그/컵 분리 보관 `[가정: 저장 스키마]` */
export interface CompetitionStats {
  apps: number
  starts: number
  minutes: number
  goals: number
  assists: number
  yellow: number
  red: number
  /** GK/DF */
  cleanSheets?: number
  goalsAgainst?: number
}

export interface QuarterPlayerStats {
  league: CompetitionStats
  cup: CompetitionStats
  /** 합산 편의 */
  apps: number
  starts: number
  minutes: number
  goals: number
  assists: number
  avgRating: number
  yellow: number
  red: number
  highlights: string[]
  essayLine: string
}

export interface TeamQuarterBlock {
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  rankAfter: number
  cupRoundAfter: CupRoundStatus
  cupPlayed: boolean
  cupWon?: boolean
  /** 타 리그 요약 한 줄 (상세 시뮬 없음) */
  otherLeaguesNote: string
}

export type GameEventType =
  | 'ROLE_OFFER'
  | 'LOAN_OFFER'
  | 'TRANSFER_OFFER'
  | 'INJURY'
  | 'INJURY_RECOVERED'

export interface GameEvent {
  type: GameEventType
  title: string
  body: string
  /** ROLE */
  fromRole?: Role
  toRole?: Role
  /** LOAN / TRANSFER */
  fromClub?: string
  toClub?: string
  toClubId?: string
  tier?: 1 | 2 | 3
  years?: number
  wageDelta?: string
  promisedRole?: Role
  competitionNote?: string
  /** INJURY */
  injuryType?: InjuryState extends { type: infer T } ? Exclude<T, 'none'> : never
  quartersLeft?: number
}

export interface SeasonAccum {
  apps: number
  starts: number
  minutes: number
  goals: number
  assists: number
  ratingSum: number
  ratingCount: number
  league: CompetitionStats
  cup: CompetitionStats
  highlights: string[]
}

export interface SeasonWrapSummary {
  year: number
  leagueName: string
  cupName: string
  teamRank: number
  teamPoints: number
  cupResult: string
  playerApps: number
  playerGoals: number
  playerAssists: number
  avgRating: number
  essayLine: string
  highlights: string[]
}

export interface CareerSave {
  version: 2
  authMode: AuthMode
  /** 결정적 시드용 커리어 id */
  careerSeed: string
  player: PlayerProfile
  parentClub: ClubStub
  playingClub: ClubStub
  onLoan: boolean
  loanEndsAfterSeason: boolean
  role: Role
  promisedRole: Role | null
  fitness: number
  injury: InjuryState
  form: number
  morale: number
  contractYearsLeft: number
  seasonYear: number
  quarterIndex: 1 | 2 | 3 | 4
  cupRound: CupRoundStatus
  leagueTable: LeagueTableSnapshot
  seasonAccum: SeasonAccum
  lastQuarterSummary: string | null
  lastQuarterResult: QuarterPlayerStats | null
  lastTeamBlock: TeamQuarterBlock | null
  pendingEvents: GameEvent[]
  lastSeasonWrap: SeasonWrapSummary | null
  careerApps: number
  careerGoals: number
  careerAssists: number
  historyLines: string[]
  retired: boolean
  savedAt: string
}

export type ScreenId =
  | 'title'
  | 'auth'
  | 'create'
  | 'youth'
  | 'home'
  | 'quarter-prep'
  | 'quarter-progress'
  | 'quarter-result'
  | 'event-queue'
  | 'season-wrap'
  | 'retire'
  | 'squad'
  | 'conflict'
