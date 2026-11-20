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
  clearSave,
  createInitialSave,
  loadPendingAuth,
  loadSave,
  persistPendingAuth,
  persistSave,
  SAMPLE_LOAN,
  SAMPLE_PARENT,
} from './storage'

interface GameContextValue {
  save: CareerSave | null
  pendingAuth: AuthMode
  lastTraining: TrainingFocus | null
  setPendingAuth: (mode: AuthMode) => void
  startCareer: (player: PlayerProfile) => void
  continueCareer: () => boolean
  touchSave: (updater: (prev: CareerSave) => CareerSave) => void
  runQuarterStub: (focus: TrainingFocus) => void
  acceptRoleOffer: (accept: boolean) => void
  acceptLoan: (accept: boolean) => void
  acknowledgeInjury: () => void
  wrapSeasonStub: () => void
  retireAndStore: () => void
  simulateConflictLogin: (mode: 'google' | 'kakao') => boolean
  resolveConflict: (keep: 'device' | 'account') => void
  resetAll: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<CareerSave | null>(() => loadSave())
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
        lastQuarterSummary:
          '출전 7 (선발 2) · 골 1 · 도움 0 · 평균 평점 6.4 · 팀 5위권 · 왕실 방패 32강 대기',
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

  const acknowledgeInjury = useCallback(() => {
    /* 셸 스텁 — 상태만 유지 */
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
    touchSave((prev) => ({ ...prev, retired: true }))
  }, [touchSave])

  /** 충돌 화면 데모: 이미 게스트 세이브가 있으면 conflict로 유도 */
  const simulateConflictLogin = useCallback((mode: 'google' | 'kakao') => {
    const existing = loadSave()
    setPendingAuth(mode)
    return Boolean(existing && !existing.retired)
  }, [])

  const resolveConflict = useCallback(
    (keep: 'device' | 'account') => {
      if (keep === 'device' && save) {
        commit({ ...save, authMode: pendingAuth ?? 'google' })
      }
      // account keep: 셸에서는 게스트를 비우고 타이틀로 — 서버 세이브 없음
      if (keep === 'account') {
        clearSave()
        setSave(null)
      }
    },
    [commit, pendingAuth, save],
  )

  const resetAll = useCallback(() => {
    clearSave()
    setSave(null)
    persistPendingAuth(null)
    setPendingAuthState(null)
    setLastTraining(null)
  }, [])

  const value = useMemo(
    () => ({
      save,
      pendingAuth,
      lastTraining,
      setPendingAuth,
      startCareer,
      continueCareer,
      touchSave,
      runQuarterStub,
      acceptRoleOffer,
      acceptLoan,
      acknowledgeInjury,
      wrapSeasonStub,
      retireAndStore,
      simulateConflictLogin,
      resolveConflict,
      resetAll,
    }),
    [
      save,
      pendingAuth,
      lastTraining,
      startCareer,
      continueCareer,
      touchSave,
      runQuarterStub,
      acceptRoleOffer,
      acceptLoan,
      acknowledgeInjury,
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
