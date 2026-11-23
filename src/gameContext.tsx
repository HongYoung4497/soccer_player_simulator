import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { resolveQuarter } from './sim/resolveQuarter'
import { wrapSeason } from './sim/wrapSeason'
import type {
  AuthMode,
  CareerSave,
  GameEvent,
  PlayerProfile,
  Role,
  TrainingFocus,
} from './types'
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
  SAMPLE_TRANSFER,
} from './storage'

type StartPlayer = Omit<PlayerProfile, 'attrs' | 'age'> &
  Partial<Pick<PlayerProfile, 'attrs' | 'age'>>

interface GameContextValue {
  save: CareerSave | null
  squad: CareerSave[]
  pendingAuth: AuthMode
  lastTraining: TrainingFocus | null
  setPendingAuth: (mode: AuthMode) => void
  startCareer: (player: StartPlayer) => void
  continueCareer: () => boolean
  touchSave: (updater: (prev: CareerSave) => CareerSave) => void
  runQuarter: (focus: TrainingFocus) => void
  currentEvent: GameEvent | null
  /** 선택/확인 후 남은 큐·라우트. sync persist. */
  resolveCurrentEvent: (
    choice: 'accept' | 'decline' | 'ack',
  ) => 'continue' | 'season' | 'season-wrap'
  wrapSeasonAndAdvance: () => void
  /** 이벤트 없이 결과→홈/결산 */
  finishQuarterWithoutEvents: () => 'season' | 'season-wrap'
  retireAndStore: () => void
  simulateConflictLogin: (mode: 'google' | 'kakao') => boolean
  resolveConflict: (keep: 'device' | 'account') => void
  resetAll: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

function stamp(save: CareerSave): CareerSave {
  return { ...save, savedAt: new Date().toISOString() }
}

function advanceAfterQueue(save: CareerSave): {
  save: CareerSave
  route: 'season' | 'season-wrap'
} {
  if (save.quarterIndex >= 4) {
    return { save, route: 'season-wrap' }
  }
  return {
    save: stamp({
      ...save,
      quarterIndex: (save.quarterIndex + 1) as 1 | 2 | 3 | 4,
    }),
    route: 'season',
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<CareerSave | null>(() => loadSave())
  const [squad, setSquad] = useState<CareerSave[]>(() => loadSquad())
  const [pendingAuth, setPendingAuthState] = useState<AuthMode>(
    () => loadPendingAuth(),
  )
  const [lastTraining, setLastTraining] = useState<TrainingFocus | null>(null)

  const commit = useCallback((next: CareerSave) => {
    const stamped = stamp(next)
    persistSave(stamped)
    setSave(stamped)
    return stamped
  }, [])

  const setPendingAuth = useCallback((mode: AuthMode) => {
    persistPendingAuth(mode)
    setPendingAuthState(mode)
  }, [])

  const startCareer = useCallback(
    (player: StartPlayer) => {
      commit(createInitialSave(player, pendingAuth ?? 'guest'))
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
      const prev = loadSave()
      if (!prev) return
      commit(updater(prev))
    },
    [commit],
  )

  const runQuarter = useCallback(
    (focus: TrainingFocus) => {
      setLastTraining(focus)
      const prev = loadSave()
      if (!prev) return
      const { nextSave } = resolveQuarter(prev, { trainingFocus: focus })
      commit(nextSave)
    },
    [commit],
  )

  const currentEvent = save?.pendingEvents[0] ?? null

  const applyEventChoice = useCallback(
    (prev: CareerSave, choice: 'accept' | 'decline' | 'ack'): CareerSave => {
      const ev = prev.pendingEvents[0]
      const rest = prev.pendingEvents.slice(1)
      let next: CareerSave = { ...prev, pendingEvents: rest }

      if (!ev) return next

      if (ev.type === 'ROLE_OFFER' && choice === 'accept' && ev.toRole) {
        next = { ...next, role: ev.toRole, promisedRole: null }
      }

      if (ev.type === 'LOAN_OFFER' && choice === 'accept') {
        next = {
          ...next,
          onLoan: true,
          loanEndsAfterSeason: true,
          playingClub: {
            ...SAMPLE_LOAN,
            id: ev.toClubId ?? SAMPLE_LOAN.id,
            name: ev.toClub ?? SAMPLE_LOAN.name,
            tier: ev.tier ?? 2,
          },
          role: ev.promisedRole ?? 'starter',
          promisedRole: ev.promisedRole ?? 'starter',
        }
      }

      if (ev.type === 'TRANSFER_OFFER' && choice === 'accept') {
        const club = {
          ...SAMPLE_TRANSFER,
          id: ev.toClubId ?? SAMPLE_TRANSFER.id,
          name: ev.toClub ?? SAMPLE_TRANSFER.name,
          tier: (ev.tier as 1 | 2 | 3) ?? 1,
        }
        next = {
          ...next,
          onLoan: false,
          loanEndsAfterSeason: false,
          parentClub: club,
          playingClub: club,
          role: (ev.promisedRole as Role) ?? 'rotation',
          promisedRole: null,
          contractYearsLeft: ev.years ?? 3,
        }
      }

      // INJURY / RECOVERED / decline: 큐만 소비 (부상 상태는 해상 시 이미 반영)
      return next
    },
    [],
  )

  const resolveCurrentEvent = useCallback(
    (choice: 'accept' | 'decline' | 'ack'): 'continue' | 'season' | 'season-wrap' => {
      const prev = loadSave()
      if (!prev) return 'season'
      const afterChoice = applyEventChoice(prev, choice)
      if (afterChoice.pendingEvents.length > 0) {
        commit(afterChoice)
        return 'continue'
      }
      const { save: advanced, route } = advanceAfterQueue(afterChoice)
      commit(advanced)
      return route
    },
    [applyEventChoice, commit],
  )

  const finishQuarterWithoutEvents = useCallback((): 'season' | 'season-wrap' => {
    const prev = loadSave()
    if (!prev) return 'season'
    const cleared = { ...prev, pendingEvents: [] as GameEvent[] }
    const { save: advanced, route } = advanceAfterQueue(cleared)
    commit(advanced)
    return route
  }, [commit])

  const wrapSeasonAndAdvance = useCallback(() => {
    const prev = loadSave()
    if (!prev) return
    const { nextSave } = wrapSeason(prev)
    commit(nextSave)
  }, [commit])

  const retireAndStore = useCallback(() => {
    const prev = loadSave()
    if (!prev) return
    const retired = stamp({ ...prev, retired: true })
    setSquad(archiveToSquad(retired))
    persistSave(retired)
    setSave(retired)
  }, [])

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
      if (keep === 'device') {
        const prev = loadSave()
        if (prev) commit({ ...prev, authMode: pendingAuth ?? 'google' })
      }
      if (keep === 'account') {
        clearSave()
        setSave(null)
      }
    },
    [commit, pendingAuth],
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
      runQuarter,
      currentEvent,
      resolveCurrentEvent,
      wrapSeasonAndAdvance,
      finishQuarterWithoutEvents,
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
      runQuarter,
      currentEvent,
      resolveCurrentEvent,
      wrapSeasonAndAdvance,
      finishQuarterWithoutEvents,
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
