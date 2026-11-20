import type { CareerSave } from './types'

const SAVE_KEY = 'jersey-rebirth-career-v1'
const AUTH_KEY = 'jersey-rebirth-auth-mode-v1'

export function persistPendingAuth(mode: CareerSave['authMode']): void {
  if (!mode) {
    sessionStorage.removeItem(AUTH_KEY)
    return
  }
  sessionStorage.setItem(AUTH_KEY, mode)
}

export function loadPendingAuth(): CareerSave['authMode'] {
  const raw = sessionStorage.getItem(AUTH_KEY)
  if (raw === 'guest' || raw === 'google' || raw === 'kakao') return raw
  return null
}

export function loadSave(): CareerSave | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CareerSave
    if (parsed?.version !== 1) return null
    return parsed
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

const SQUAD_KEY = 'jersey-rebirth-squad-v1'

/** 은퇴 선수 보관소 — 활성 커리어 키와 분리 */
export function loadSquad(): CareerSave[] {
  try {
    const raw = localStorage.getItem(SQUAD_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CareerSave[]
    return Array.isArray(parsed) ? parsed.filter((s) => s?.version === 1) : []
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
  // 같은 인생(이름+등번호+시즌) 재보관 시 최신만 유지
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

/** 샘플 페르소나 — 페이퍼 프로토 가정명 */
export const SAMPLE_PARENT: CareerSave['parentClub'] = {
  name: '하버라이트 FC',
  tier: 1,
  league: '북섬 프리미어',
  cup: '왕실 방패',
}

export const SAMPLE_LOAN: CareerSave['playingClub'] = {
  name: '밀브룩 유나이티드',
  tier: 2,
  league: '북섬 프리미어',
  cup: '왕실 방패',
}

export function createInitialSave(
  player: CareerSave['player'],
  authMode: CareerSave['authMode'],
): CareerSave {
  return {
    version: 1,
    authMode,
    player,
    parentClub: SAMPLE_PARENT,
    playingClub: SAMPLE_PARENT,
    onLoan: false,
    role: 'rotation',
    seasonYear: 2027,
    quarterIndex: 1,
    lastQuarterSummary: null,
    careerApps: 0,
    careerGoals: 0,
    historyLines: [],
    retired: false,
    savedAt: new Date().toISOString(),
  }
}
