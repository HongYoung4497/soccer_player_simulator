import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GuestSaveChip } from '../components/GuestSaveChip'
import { useGame } from '../gameContext'

export function RetireScreen() {
  const navigate = useNavigate()
  const { save, retireAndStore } = useGame()

  useEffect(() => {
    if (!save) navigate('/')
  }, [save, navigate])

  if (!save) return null

  return (
    <main className="screen screen--flow">
      <h1 className="screen-heading">등번호를 벗는 날</h1>
      <p className="essay">
        현역의 마지막 홈 경기가 끝났습니다. 등번호 {save.player.shirtNumber}를
        벗는 날에도, 당신이 고른 길들은 아래에 남아 있습니다.
      </p>
      <ul className="history-list">
        <li>
          {save.parentClub.name}
          {save.onLoan ? ` · ${save.playingClub.name} 임대` : ''}
        </li>
        {save.historyLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="essay">이 선수를 나의 선수단에 남겨 두시겠어요?</p>
      <button
        type="button"
        className="btn btn--primary"
        onClick={() => {
          retireAndStore()
          navigate('/squad')
        }}
      >
        선수단에 저장
      </button>
      <GuestSaveChip />
    </main>
  )
}

export function SquadScreen() {
  const navigate = useNavigate()
  const { squad } = useGame()

  return (
    <main className="screen screen--flow">
      <h1 className="screen-heading">나의 선수단</h1>
      <p className="essay">끝난 인생도, 다시 펼칠 수 있습니다. 과금 슬롯은 없습니다.</p>

      {squad.length > 0 ? (
        <ul className="history-list" style={{ listStyle: 'none', paddingLeft: 0 }}>
          {squad.map((entry) => (
            <li key={`${entry.player.name}-${entry.savedAt}`} className="soft-block">
              <p>
                {entry.player.name} — #{entry.player.shirtNumber}{' '}
                {entry.player.position} · 은퇴
              </p>
              <p className="muted-line">
                {entry.seasonYear}시즌까지 · 통산 출전 {entry.careerApps} · 골{' '}
                {entry.careerGoals}
              </p>
              <button type="button" className="btn btn--ghost" disabled>
                커리어 다시 읽기 (스텁)
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted-line">보관된 선수가 없습니다.</p>
      )}

      <div className="cta-stack">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => navigate('/create')}
        >
          새 인생
        </button>
        <button type="button" className="btn btn--text" onClick={() => navigate('/')}>
          타이틀로
        </button>
      </div>
      <GuestSaveChip />
    </main>
  )
}

export function ConflictScreen() {
  const navigate = useNavigate()
  const { save, resolveConflict, pendingAuth } = useGame()

  return (
    <main className="screen screen--flow">
      <h1 className="screen-heading">이어갈 쪽을 하나</h1>
      <p className="essay">
        같은 계정으로는 두 인생을 한꺼번에 이어갈 수 없습니다. 앞으로 이어갈
        쪽을 하나 골라 주세요.
      </p>
      <p className="muted-line">
        로그인 시도: {pendingAuth === 'kakao' ? 'Kakao' : 'Google'} (플레이스홀더)
      </p>

      <div className="compare-table" role="table" aria-label="세이브 비교">
        <div className="compare-table__head" role="row">
          <span role="columnheader" />
          <span role="columnheader">이 기기 (게스트)</span>
          <span role="columnheader">계정</span>
        </div>
        <div className="compare-table__row" role="row">
          <span role="rowheader">선수</span>
          <span role="cell">
            {save
              ? `${save.player.name} · #${save.player.shirtNumber} · ${save.parentClub.name}`
              : '—'}
          </span>
          <span role="cell">다른 선수 / 시점 (스텁)</span>
        </div>
        <div className="compare-table__row" role="row">
          <span role="rowheader">시점</span>
          <span role="cell">
            {save ? `${save.seasonYear} ${save.quarterIndex}분기` : '—'}
          </span>
          <span role="cell">2029 은퇴 후 등</span>
        </div>
        <div className="compare-table__row" role="row">
          <span role="rowheader">저장</span>
          <span role="cell">로컬</span>
          <span role="cell">서버</span>
        </div>
      </div>

      <div className="cta-stack">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            resolveConflict('device')
            navigate('/app/season')
          }}
        >
          이 기기 진행을 계정당한다
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            resolveConflict('account')
            navigate('/')
          }}
        >
          계정 진행을 이어간다
        </button>
        <button type="button" className="btn btn--text" onClick={() => navigate('/auth')}>
          취소
        </button>
      </div>
    </main>
  )
}
