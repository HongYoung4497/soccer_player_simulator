import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthMode, CareerSave, PlayerProfile, TrainingFocus } from './types'
import {
  archiveToSquad,
  clearSave,
  clearSquad,
  createInitialSave,
  loadPendingAuth,
  loadSave,
  loadSquad,
  persistPendingAuth,
  persistSave,
  SAMPLE_LOAN,
  SAMPLE_PARENT,
} from './storage'

interface GameContextValue {
  save: CareerSave | null
  squad: CareerSave[]
  pendingAuth: AuthMode
  lastTraining: TrainingFocus | null
  setPendingAuth: (mode: AuthMode) => void
  startCareer: (player: PlayerProfile) => void
  continueCareer: () => boolean
  touchSave: (updater: (prev: CareerSave) => CareerSave) => void
  runQuarterStub: (focus: TrainingFocus) => void
  acceptRoleOffer: (accept: boolean) => void
  acceptLoan: (accept: boolean) => void
  /** 이벤트 큐 종료 시 분기 진행. Q4면 season-wrap으로 */
  completeEventQueue: () => 'season' | 'season-wrap'
  wrapSeasonStub: () => void
  retireAndStore: () => void
  simulateConflictLogin: (mode: 'google' | 'kakao') => boolean
  resolveConflict: (keep: 'device' | 'account') => void
  resetAll: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<CareerSave | null>(() => loadSave())
  const [squad, setSquad] = useState<CareerSave[]>(() => loadSquad())
  const [pendingAuth, setPendingAuthState] = useState<AuthMode>(
    () => loadPendingAuth(),
  )
  const [lastTraining, setLastTraining] = useState<TrainingFocus | null>(null)

  const setPendingAuth = useCallback((mode: AuthMode) => {
    persistPendingAuth(mode)
    setPendingAuthState(mode)
  }, [])

  const commit = useCallback((next: CareerSave) => {
    const stamped = { ...next, savedAt: new Date().toISOString() }
    persistSave(stamped)
    setSave(stamped)
  }, [])

  const startCareer = useCallback(
    (player: PlayerProfile) => {
      const mode = pendingAuth ?? 'guest'
      // 활성 커리어만 교체 — 선수단(squad) 아카이브는 유지
      commit(createInitialSave(player, mode))
    },
    [commit, pendingAuth],
  )

  const continueCareer = useCallback(() => {
    const existing = loadSave()
    if (!existing || existing.retired) return false
    setSave(existing)
    return true
  }, [])

  const touchSave = useCallback(
    (updater: (prev: CareerSave) => CareerSave) => {
      setSave((prev) => {
        if (!prev) return prev
        const next = updater(prev)
        const stamped = { ...next, savedAt: new Date().toISOString() }
        persistSave(stamped)
        return stamped
      })
    },
    [],
  )

  const runQuarterStub = useCallback(
    (focus: TrainingFocus) => {
      setLastTraining(focus)
      touchSave((prev) => ({
        ...prev,
        careerApps: prev.careerApps + 7,
        careerGoals: prev.careerGoals + 1,
        lastQuarterSummary: `${prev.quarterIndex}분기 · 출전 7 (선발 2) · 골 1 · 도움 0 · 평균 평점 6.4 · 팀 5위권 · 왕실 방패 32강 대기`,
      }))
    },
    [touchSave],
  )

  const acceptRoleOffer = useCallback(
    (accept: boolean) => {
      if (accept) touchSave((prev) => ({ ...prev, role: 'starter' }))
    },
    [touchSave],
  )

  const acceptLoan = useCallback(
    (accept: boolean) => {
      if (!accept) return
      touchSave((prev) => ({
        ...prev,
        onLoan: true,
        playingClub: SAMPLE_LOAN,
        role: 'starter',
      }))
    },
    [touchSave],
  )

  const completeEventQueue = useCallback((): 'season' | 'season-wrap' => {
    let nextRoute: 'season' | 'season-wrap' = 'season'
    setSave((prev) => {
      if (!prev) return prev
      if (prev.quarterIndex >= 4) {
        nextRoute = 'season-wrap'
        return prev
      }
      const advanced: CareerSave = {
        ...prev,
        quarterIndex: (prev.quarterIndex + 1) as 1 | 2 | 3 | 4,
        savedAt: new Date().toISOString(),
      }
      persistSave(advanced)
      return advanced
    })
    return nextRoute
  }, [])

  const wrapSeasonStub = useCallback(() => {
    touchSave((prev) => ({
      ...prev,
      quarterIndex: 1,
      seasonYear: prev.seasonYear + 1,
      onLoan: false,
      playingClub: SAMPLE_PARENT,
      role: 'rotation',
      historyLines: [
        ...prev.historyLines,
        `${prev.seasonYear} 북섬 프리미어 7위 · 왕실 방패 16강`,
      ],
      lastQuarterSummary: `${prev.seasonYear} 시즌 결산 — 출전 22 · 골 5 · 도움 2 · 평점 6.7`,
    }))
  }, [touchSave])

  const retireAndStore = useCallback(() => {
    if (!save) return
    const retired: CareerSave = {
      ...save,
      retired: true,
      savedAt: new Date().toISOString(),
    }
    // 선수단은 별도 localStorage 키 — 새 인생이 활성 세이브를 덮어도 보관 유지
    setSquad(archiveToSquad(retired))
    persistSave(retired)
    setSave(retired)
  }, [save])

  /** 충돌 화면 데모: 이미 게스트 세이브가 있으면 conflict로 유도 */
  const simulateConflictLogin = useCallback(
    (mode: 'google' | 'kakao') => {
      const existing = loadSave()
      setPendingAuth(mode)
      return Boolean(existing && !existing.retired)
    },
    [setPendingAuth],
  )

  const resolveConflict = useCallback(
    (keep: 'device' | 'account') => {
      if (keep === 'device' && save) {
        commit({ ...save, authMode: pendingAuth ?? 'google' })
      }
      if (keep === 'account') {
        clearSave()
        setSave(null)
      }
    },
    [commit, pendingAuth, save],
  )

  const resetAll = useCallback(() => {
    clearSave()
    clearSquad()
    setSave(null)
    setSquad([])
    persistPendingAuth(null)
    setPendingAuthState(null)
    setLastTraining(null)
  }, [])

  const value = useMemo(
    () => ({
      save,
      squad,
      pendingAuth,
      lastTraining,
      setPendingAuth,
      startCareer,
      continueCareer,
      touchSave,
      runQuarterStub,
      acceptRoleOffer,
      acceptLoan,
      completeEventQueue,
      wrapSeasonStub,
      retireAndStore,
      simulateConflictLogin,
      resolveConflict,
      resetAll,
    }),
    [
      save,
      squad,
      pendingAuth,
      lastTraining,
      setPendingAuth,
      startCareer,
      continueCareer,
      touchSave,
      runQuarterStub,
      acceptRoleOffer,
      acceptLoan,
      completeEventQueue,
      wrapSeasonStub,
      retireAndStore,
      simulateConflictLogin,
      resolveConflict,
      resetAll,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
