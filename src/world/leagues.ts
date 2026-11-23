/**
 * 페르소나 5리그 · 국내컵 고유명 — terminology.md 잠금.
 * 클럽 150개는 여기 두지 않음(미확정). 월드 콘텐츠 확장 시 이 모듈을 기준으로 붙인다.
 */

export type PersonaNation = 'ES' | 'IT' | 'DE' | 'FR' | 'EN'

/** 채택 리그명 (UI · save · preferredLeague) */
export const LEAGUE_NAMES = {
  ES: '라 프리메라',
  IT: '세리에 프리마',
  DE: '분트 리가',
  FR: '리그 앙',
  EN: '북섬 프리미어',
} as const satisfies Record<PersonaNation, string>

/** 채택 국내컵명 — 리그와 1:1 */
export const CUP_NAMES = {
  ES: '코파 레알',
  IT: '코파 이탈',
  DE: '분트 포칼',
  FR: '쿠프 갈리',
  EN: '왕실 방패',
} as const satisfies Record<PersonaNation, string>

export type PreferredLeague = (typeof LEAGUE_NAMES)[PersonaNation]

export type DomesticCup = (typeof CUP_NAMES)[PersonaNation]

/** UI 칩·선택지 순서 (감성: ES→IT→DE→FR→EN) */
export const PREFERRED_LEAGUES: readonly PreferredLeague[] = [
  LEAGUE_NAMES.ES,
  LEAGUE_NAMES.IT,
  LEAGUE_NAMES.DE,
  LEAGUE_NAMES.FR,
  LEAGUE_NAMES.EN,
]

export const DEFAULT_LEAGUE: PreferredLeague = LEAGUE_NAMES.EN
export const DEFAULT_CUP: DomesticCup = CUP_NAMES.EN

const LEAGUE_TO_NATION: Record<PreferredLeague, PersonaNation> = {
  [LEAGUE_NAMES.ES]: 'ES',
  [LEAGUE_NAMES.IT]: 'IT',
  [LEAGUE_NAMES.DE]: 'DE',
  [LEAGUE_NAMES.FR]: 'FR',
  [LEAGUE_NAMES.EN]: 'EN',
}

/** 구칭 → 잠금명 (세이브 마이그레이션) */
const LEGACY_LEAGUE_ALIASES: Record<string, PreferredLeague> = {
  '태양 리그': LEAGUE_NAMES.ES,
  '운하 세리에': LEAGUE_NAMES.IT,
  '강철 분데스': LEAGUE_NAMES.DE,
  '세느 리그': LEAGUE_NAMES.FR,
  // 이미 잠금명이면 그대로
  [LEAGUE_NAMES.ES]: LEAGUE_NAMES.ES,
  [LEAGUE_NAMES.IT]: LEAGUE_NAMES.IT,
  [LEAGUE_NAMES.DE]: LEAGUE_NAMES.DE,
  [LEAGUE_NAMES.FR]: LEAGUE_NAMES.FR,
  [LEAGUE_NAMES.EN]: LEAGUE_NAMES.EN,
}

export function nationForLeague(league: string): PersonaNation | null {
  const normalized = normalizePreferredLeague(league)
  if (!normalized) return null
  return LEAGUE_TO_NATION[normalized]
}

export function cupForLeague(league: string): DomesticCup {
  const nation = nationForLeague(league)
  return nation ? CUP_NAMES[nation] : DEFAULT_CUP
}

export function isPreferredLeague(value: string): value is PreferredLeague {
  return (PREFERRED_LEAGUES as readonly string[]).includes(value)
}

/** 알 수 없으면 null — 호출측에서 DEFAULT_LEAGUE 사용 */
export function normalizePreferredLeague(
  value: string | undefined | null,
): PreferredLeague | null {
  if (!value) return null
  return LEGACY_LEAGUE_ALIASES[value] ?? null
}

/** 플레이어 리그만 상세 WDL일 때 타 리그 요약 노트 */
export function otherLeaguesSummaryNote(
  playerLeague: PreferredLeague = DEFAULT_LEAGUE,
): string {
  const others = PREFERRED_LEAGUES.filter((l) => l !== playerLeague).join('·')
  return `타 리그(${others})는 요약 롤만 — 플레이어 리그(${playerLeague})만 상세 WDL.`
}
