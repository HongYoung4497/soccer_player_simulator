import { useNavigate } from 'react-router-dom'
import { GuestSaveChip } from '../components/GuestSaveChip'
import { useGame } from '../gameContext'

export function SeasonWrapScreen() {
  const navigate = useNavigate()
  const { save, wrapSeasonStub } = useGame()
  const year = save?.seasonYear ?? 2027

  return (
    <main className="screen screen--flow">
      <h1 className="screen-heading">{year} 시즌을 덮습니다</h1>

      <div className="scroll-essay">
        <h2>리그 (북섬 프리미어)</h2>
        <p>팀 7위 · 당신: 출전 22 · 골 5 · 도움 2 · 시즌 평점 6.7</p>

        <h2>왕실 방패</h2>
        <p>16강 탈락 — 한 골을 넣고도 원정에서 멈췄습니다.</p>

        <p className="essay essay--quote">
          임대지에서 보낸 봄이 가장 길었습니다. 하버라이트로 돌아가는 버스에서
          당신은 주전 경쟁의 다음 문장을 생각했습니다.
        </p>
      </div>

      <button
        type="button"
        className="btn btn--primary"
        onClick={() => {
          wrapSeasonStub()
          navigate('/app/season')
        }}
      >
        다음 시즌 준비
      </button>
      <GuestSaveChip />
    </main>
  )
}
