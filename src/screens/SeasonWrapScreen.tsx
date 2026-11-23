import { useNavigate } from 'react-router-dom'
import { GuestSaveChip } from '../components/GuestSaveChip'
import { useGame } from '../gameContext'
import { formatCupResult } from '../sim'
import { DEFAULT_CUP, DEFAULT_LEAGUE } from '../world'

export function SeasonWrapScreen() {
  const navigate = useNavigate()
  const { save, wrapSeasonAndAdvance } = useGame()
  const year = save?.seasonYear ?? 2027
  const accum = save?.seasonAccum
  const table = save?.leagueTable
  const stored = save?.lastSeasonWrap
  // 이전 시즌 wrap이 남아 있어도, 방금 마친 시즌(현재 seasonYear)과 연도가 같을 때만 사용
  const wrap = stored?.year === year ? stored : null

  const leagueName = wrap?.leagueName ?? save?.playingClub.league ?? DEFAULT_LEAGUE
  const cupName = wrap?.cupName ?? save?.playingClub.cup ?? DEFAULT_CUP
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
    formatCupResult(save?.cupRound ?? 'not_entered', cupName)
  const essay =
    wrap?.essayLine ??
    (save?.onLoan
      ? '임대지에서 보낸 봄이 가장 길었습니다. 본대로 돌아가는 버스에서 당신은 주전 경쟁의 다음 문장을 생각했습니다.'
      : '리그와 컵을 한 스크롤에 덮습니다. 다음 시즌의 등번호는 아직 같은 자리입니다.')
  const highlights = wrap?.highlights ?? accum?.highlights ?? []

  return (
    <main className="screen screen--flow">
      <h1 className="screen-heading">{year} 시즌을 덮습니다</h1>

      <div className="scroll-essay">
        <h2>리그 ({leagueName})</h2>
        <p>
          팀 {rank}위 · 당신: 출전 {apps} · 골 {goals} · 도움 {assists} · 시즌
          평점 {rating}
        </p>

        <h2>{cupName}</h2>
        <p>{cupResult}</p>

        {highlights.length > 0 && (
          <>
            <h2>하이라이트</h2>
            <ul>
              {highlights.slice(0, 4).map((h) => (
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
