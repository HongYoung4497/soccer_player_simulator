import { useNavigate } from 'react-router-dom'
import { useGame } from '../gameContext'
import { ROLE_KO } from '../sim'

export function SeasonTab() {
  const navigate = useNavigate()
  const { save } = useGame()

  if (!save) {
    return (
      <section className="tab-panel">
        <p className="essay">아직 시작된 인생이 없습니다.</p>
        <button type="button" className="btn btn--primary" onClick={() => navigate('/')}>
          타이틀로
        </button>
      </section>
    )
  }

  const club = save.playingClub

  return (
    <section className="tab-panel">
      <p className="season-kicker">
        {save.seasonYear} · {save.quarterIndex}분기 · {club.name} · #
        {save.player.shirtNumber}
      </p>
      <h1 className="screen-heading">지금 할 일</h1>
      <p className="essay">
        벤치에 앉은 시간도 시즌의 일부입니다. 이번 분기에 보고 싶은 장면을
        하나만 떠올려 보세요.
      </p>

      {save.lastQuarterSummary ? (
        <div className="soft-block">
          <p className="soft-block__label">직전 분기</p>
          <p>{save.lastQuarterSummary}</p>
        </div>
      ) : (
        <div className="soft-block">
          <p className="soft-block__label">직전 분기</p>
          <p>아직 성적표가 비어 있습니다. 첫 분기가 기다리고 있어요.</p>
        </div>
      )}

      <p className="muted-line">
        역할 {ROLE_KO[save.role]}
        {save.onLoan ? ' · 임대 중' : ''}
        {save.injury.type !== 'none' ? ' · 부상 중' : ''}
        {' · '}리그 {save.leagueTable.rank}위 · {save.leagueTable.points}점
      </p>

      <div className="cta-stack">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => navigate('/quarter/prep')}
        >
          이번 분기 준비
        </button>
        {save.quarterIndex === 4 && save.lastQuarterResult && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => navigate('/season-wrap')}
          >
            시즌 결산
          </button>
        )}
        <button
          type="button"
          className="btn btn--text"
          onClick={() => navigate('/retire')}
        >
          은퇴·리캡
        </button>
      </div>
    </section>
  )
}
