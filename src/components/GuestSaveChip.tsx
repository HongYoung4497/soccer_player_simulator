import { useGame } from '../gameContext'

/** 저장이 일어나는 화면 하단 — 게스트 리마인더 / 계정 동기화 칩 */
export function GuestSaveChip() {
  const { save, pendingAuth } = useGame()
  // 세이브가 있으면 세이브 기준, 없으면 방금 고른 인증 모드
  const mode = save?.authMode ?? pendingAuth ?? 'guest'
  const isGuest = mode === 'guest'

  return (
    <p className="save-chip" role="status">
      {isGuest
        ? '게스트 · 이 기기에만 저장됩니다'
        : '계정에 동기화됨 (플레이스홀더)'}
    </p>
  )
}
