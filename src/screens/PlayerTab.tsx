import { useGame } from '../gameContext'

const ROLE_KO = {
  unused: '미사용',
  rotation: '로테이션',
  starter: '주전',
  key: '핵심',
} as const

export function PlayerTab() {
  const { save } = useGame()

  if (!save) {
    return (
      <section className="tab-panel">
        <p className="essay">선수 정보가 없습니다.</p>
      </section>
    )
  }

  const { player, parentClub, playingClub, onLoan, role } = save

  return (
    <section className="tab-panel">
      <h1 className="screen-heading">지금의 나</h1>
      <p className="essay">
        {player.name} · #{player.shirtNumber} {player.position} ·{' '}
        {player.style}
      </p>

      <dl className="stat-list">
        <div>
          <dt>OVR</dt>
          <dd>{player.ovr}</dd>
        </div>
        <div>
          <dt>주발</dt>
          <dd>{player.preferredFoot}</dd>
        </div>
        <div>
          <dt>역할</dt>
          <dd>{ROLE_KO[role]}</dd>
        </div>
      </dl>

      <div className="soft-block">
        <p className="soft-block__label">소속 {onLoan ? '(임대 중)' : ''}</p>
        {onLoan ? (
          <>
            <p>
              본대 <strong>{parentClub.name}</strong> (계약)
            </p>
            <p>
              임대 <strong>{playingClub.name}</strong> (시즌 종료까지 · 주전)
            </p>
          </>
        ) : (
          <p>
            소속 <strong>{parentClub.name}</strong>
          </p>
        )}
      </div>

      <div className="soft-block">
        <p className="soft-block__label">세부 능력 (스텁)</p>
        <p>
          마무리 · 위치선정 · 스피드 · 체력 · 멘탈 — 수치 밸런스는 분기 엔진과
          함께.
        </p>
      </div>
    </section>
  )
}
