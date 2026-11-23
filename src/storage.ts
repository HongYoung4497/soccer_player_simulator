import { defaultAttrs } from './sim/attrs'
import type {
  AuthMode,
  CareerSave,
  CompetitionStats,
  PlayerProfile,
  SeasonAccum,
} from './types'

const SAVE_KEY = 'jersey-rebirth-career-v1'
const AUTH_KEY = 'jersey-rebirth-auth-mode-v1'
const SQUAD_KEY = 'jersey-rebirth-squad-v1'

export function persistPendingAuth(mode: AuthMode): void {
  if (!mode) {
    sessionStorage.removeItem(AUTH_KEY)
    return
  }
  sessionStorage.setItem(AUTH_KEY, mode)
}

export function loadPendingAuth(): AuthMode {
  const raw = sessionStorage.getItem(AUTH_KEY)
  if (raw === 'guest' || raw === 'google' || raw === 'kakao') return raw
  return null
}

function emptyComp(): CompetitionStats {
  return {
    apps: 0,
    starts: 0,
    minutes: 0,
    goals: 0,
    assists: 0,
    yellow: 0,
    red: 0,
    cleanSheets: 0,
    goalsAgainst: 0,
  }
}

export function emptySeasonAccum(): SeasonAccum {
  return {
    apps: 0,
    starts: 0,
    minutes: 0,
    goals: 0,
    assists: 0,
    ratingSum: 0,
    ratingCount: 0,
    league: emptyComp(),
    cup: emptyComp(),
    highlights: [],
  }
}

/** 샘플 페르소나 — 페이퍼 프로토 가정명 */
export const SAMPLE_PARENT: CareerSave['parentClub'] = {
  id: 'harbourlight-fc',
  name: '하버라이트 FC',
  tier: 1,
  league: '북섬 프리미어',
  cup: '왕실 방패',
}

export const SAMPLE_LOAN: CareerSave['playingClub'] = {
  id: 'milbrook-united',
  name: '밀브룩 유나이티드',
  tier: 2,
  league: '북섬 프리미어',
  cup: '왕실 방패',
}

export const SAMPLE_TRANSFER: CareerSave['playingClub'] = {
  id: 'saint-harbour-city',
  name: '세인트 하버 시티',
  tier: 1,
  league: '북섬 프리미어',
  cup: '왕실 방패',
}

function newCareerSeed(): string {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** v1 셸 세이브 → v2 엔진 필드로 승격 */
function migrateToV2(raw: Record<string, unknown>): CareerSave | null {
  try {
    const playerRaw = raw.player as PlayerProfile | undefined
    if (!playerRaw?.name) return null

    const position = playerRaw.position ?? 'FW'
    const style = playerRaw.style ?? '포처'
    const ovr = playerRaw.ovr ?? 68
    const attrs = playerRaw.attrs ?? defaultAttrs(position, style, ovr)

    const parent = (raw.parentClub as CareerSave['parentClub']) ?? SAMPLE_PARENT
    const playing = (raw.playingClub as CareerSave['playingClub']) ?? parent

    const save: CareerSave = {
      version: 2,
      authMode: (raw.authMode as AuthMode) ?? 'guest',
      careerSeed: (raw.careerSeed as string) ?? newCareerSeed(),
      player: {
        ...playerRaw,
        position,
        style,
        ovr,
        attrs,
        age: playerRaw.age ?? 18,
      },
      parentClub: {
        id: parent.id ?? 'harbourlight-fc',
        name: parent.name,
        tier: parent.tier,
        league: parent.league,
        cup: parent.cup,
      },
      playingClub: {
        id: playing.id ?? parent.id ?? 'harbourlight-fc',
        name: playing.name,
        tier: playing.tier,
        league: playing.league,
        cup: playing.cup,
      },
      onLoan: Boolean(raw.onLoan),
      loanEndsAfterSeason: Boolean(raw.loanEndsAfterSeason ?? raw.onLoan),
      role: (raw.role as CareerSave['role']) ?? 'rotation',
      promisedRole: (raw.promisedRole as CareerSave['promisedRole']) ?? null,
      fitness: typeof raw.fitness === 'number' ? raw.fitness : 78,
      injury:
        raw.injury && typeof raw.injury === 'object'
          ? (raw.injury as CareerSave['injury'])
          : { type: 'none' },
      form: typeof raw.form === 'number' ? raw.form : 0,
      morale: typeof raw.morale === 'number' ? raw.morale : 70,
      contractYearsLeft:
        typeof raw.contractYearsLeft === 'number' ? raw.contractYearsLeft : 2,
      seasonYear: (raw.seasonYear as number) ?? 2027,
      quarterIndex: (raw.quarterIndex as 1 | 2 | 3 | 4) ?? 1,
      cupRound: (raw.cupRound as CareerSave['cupRound']) ?? 'round_of_64',
      leagueTable:
        (raw.leagueTable as CareerSave['leagueTable']) ?? {
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
          rank: 10,
        },
      seasonAccum: (raw.seasonAccum as SeasonAccum) ?? emptySeasonAccum(),
      lastQuarterSummary: (raw.lastQuarterSummary as string | null) ?? null,
      lastQuarterResult: (raw.lastQuarterResult as CareerSave['lastQuarterResult']) ?? null,
      lastTeamBlock: (raw.lastTeamBlock as CareerSave['lastTeamBlock']) ?? null,
      pendingEvents: Array.isArray(raw.pendingEvents)
        ? (raw.pendingEvents as CareerSave['pendingEvents'])
        : [],
      lastSeasonWrap: (raw.lastSeasonWrap as CareerSave['lastSeasonWrap']) ?? null,
      careerApps: (raw.careerApps as number) ?? 0,
      careerGoals: (raw.careerGoals as number) ?? 0,
      careerAssists: (raw.careerAssists as number) ?? 0,
      historyLines: Array.isArray(raw.historyLines)
        ? (raw.historyLines as string[])
        : [],
      retired: Boolean(raw.retired),
      savedAt: (raw.savedAt as string) ?? new Date().toISOString(),
    }
    return save
  } catch {
    return null
  }
}

export function loadSave(): CareerSave | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (parsed?.version === 2) {
      const v2 = migrateToV2(parsed)
      return v2
    }
    if (parsed?.version === 1) {
      const migrated = migrateToV2(parsed)
      if (migrated) persistSave(migrated)
      return migrated
    }
    return null
  } catch {
    return null
  }
}

export function persistSave(save: CareerSave): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save))
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY)
}

export function loadSquad(): CareerSave[] {
  try {
    const raw = localStorage.getItem(SQUAD_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => migrateToV2(item as Record<string, unknown>))
      .filter((s): s is CareerSave => s !== null)
  } catch {
    return []
  }
}

export function archiveToSquad(save: CareerSave): CareerSave[] {
  const stamped: CareerSave = {
    ...save,
    retired: true,
    savedAt: new Date().toISOString(),
  }
  const next = [
    stamped,
    ...loadSquad().filter(
      (s) =>
        !(
          s.player.name === stamped.player.name &&
          s.player.shirtNumber === stamped.player.shirtNumber &&
          s.seasonYear === stamped.seasonYear
        ),
    ),
  ]
  localStorage.setItem(SQUAD_KEY, JSON.stringify(next))
  return next
}

export function clearSquad(): void {
  localStorage.removeItem(SQUAD_KEY)
}

export function createInitialSave(
  player: Omit<PlayerProfile, 'attrs' | 'age'> &
    Partial<Pick<PlayerProfile, 'attrs' | 'age'>>,
  authMode: AuthMode,
): CareerSave {
  const attrs =
    player.attrs ?? defaultAttrs(player.position, player.style, player.ovr)
  return {
    version: 2,
    authMode,
    careerSeed: newCareerSeed(),
    player: {
      name: player.name,
      shirtNumber: player.shirtNumber,
      preferredFoot: player.preferredFoot,
      position: player.position,
      style: player.style,
      preferredLeague: player.preferredLeague,
      ovr: player.ovr,
      attrs,
      age: player.age ?? 18,
    },
    parentClub: SAMPLE_PARENT,
    playingClub: SAMPLE_PARENT,
    onLoan: false,
    loanEndsAfterSeason: false,
    role: 'rotation',
    promisedRole: null,
    fitness: 78,
    injury: { type: 'none' },
    form: 0,
    morale: 70,
    contractYearsLeft: 2,
    seasonYear: 2027,
    quarterIndex: 1,
    cupRound: 'round_of_64',
    leagueTable: {
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      rank: 10,
    },
    seasonAccum: emptySeasonAccum(),
    lastQuarterSummary: null,
    lastQuarterResult: null,
    lastTeamBlock: null,
    pendingEvents: [],
    lastSeasonWrap: null,
    careerApps: 0,
    careerGoals: 0,
    careerAssists: 0,
    historyLines: [],
    retired: false,
    savedAt: new Date().toISOString(),
  }
}
