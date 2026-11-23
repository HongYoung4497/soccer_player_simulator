import { useNavigate } from 'react-router-dom'
import { GuestSaveChip } from '../components/GuestSaveChip'
import { useGame } from '../gameContext'

export function SeasonWrapScreen() {
  const navigate = useNavigate()
  const { save, wrapSeasonAndAdvance } = useGame()
  const wrap = save?.lastSeasonWrap
  const year = save?.seasonYear ?? 2027
  const accum = save?.seasonAccum
  const table = save?.leagueTable

  // Q4 직후: lastSeasonWrap은 아직 없고 seasonAccum에 시즌 합산이 있음
  const displayYear = wrap?.year ?? year
  const leagueName = wrap?.leagueName ?? save?.playingClub.league ?? '북섬 프리미어'
  const cupName = wrap?.cupName ?? save?.playingClub.cup ?? '왕실 방패'
  const rank = wrap?.teamRank ?? table?.rank ?? 10
  const apps = wrap?.playerApps ?? accum?.apps ?? 0
  const goals = wrap?.playerGoals ?? accum?.goals ?? 0
  const assists = wrap?.playerAssists ?? accum?.assists ?? 0
  const rating =
    wrap?.avgRating ??
    (accum && accum.ratingCount > 0
      ? Math.round((accum.ratingSum / accum.ratingCount) * 10) / 10
      : 6.0)
  const cupResult =
    wrap?.cupResult ??
    `${cupName} · ${save?.cupRound === 'eliminated' ? '탈락' : save?.cupRound === 'winner' ? '우승' : '진행'}`
  const essay =
    wrap?.essayLine ??
    (save?.onLoan
      ? '임대지에서 보낸 봄이 가장 길었습니다. 본대로 돌아가는 버스에서 당신은 주전 경쟁의 다음 문장을 생각했습니다.'
      : '리그와 컵을 한 스크롤에 덮습니다. 다음 시즌의 등번호는 아직 같은 자리입니다.')

  return (
    <main className="screen screen--flow">
      <h1 className="screen-heading">{displayYear} 시즌을 덮습니다</h1>

      <div className="scroll-essay">
        <h2>리그 ({leagueName})</h2>
        <p>
          팀 {rank}위 · 당신: 출전 {apps} · 골 {goals} · 도움 {assists} · 시즌
          평점 {rating}
        </p>

        <h2>{cupName}</h2>
        <p>{cupResult}</p>

        {accum && accum.highlights.length > 0 && (
          <>
            <h2>하이라이트</h2>
            <ul>
              {(wrap?.highlights ?? accum.highlights).slice(0, 4).map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </>
        )}

        <p className="essay essay--quote">{essay}</p>
      </div>

      <button
        type="button"
        className="btn btn--primary"
        onClick={() => {
          wrapSeasonAndAdvance()
          navigate('/app/season')
        }}
      >
        다음 시즌 준비
      </button>
      <GuestSaveChip />
    </main>
  )
}
