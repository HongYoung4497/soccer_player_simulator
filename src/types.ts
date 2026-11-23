/** MVP 셸용 최소 게임 상태 — 시뮬 엔진은 이후 단계 */

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

export interface PlayerProfile {
  name: string
  shirtNumber: number
  preferredFoot: '왼발' | '오른발' | '양발'
  position: PositionGroup
  style: StyleTag
  preferredLeague: PreferredLeague
  ovr: number
}

export interface ClubStub {
  name: string
  tier: 1 | 2 | 3
  league: string
  cup: string
}

export interface CareerSave {
  version: 1
  authMode: AuthMode
  player: PlayerProfile
  parentClub: ClubStub
  playingClub: ClubStub
  onLoan: boolean
  role: Role
  seasonYear: number
  quarterIndex: 1 | 2 | 3 | 4
  /** 직전 분기 요약 스텁 */
  lastQuarterSummary: string | null
  careerApps: number
  careerGoals: number
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
  | 'event-role'
  | 'event-loan'
  | 'event-injury'
  | 'season-wrap'
  | 'retire'
  | 'squad'
  | 'conflict'
