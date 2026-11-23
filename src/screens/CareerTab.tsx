import { useGame } from '../gameContext'

export function CareerTab() {
  const { save } = useGame()

  if (!save) {
    return (
      <section className="tab-panel">
        <p className="essay">커리어를 쌓을 선수가 없습니다.</p>
      </section>
    )
  }

  return (
    <section className="tab-panel">
      <h1 className="screen-heading">쌓인 인생</h1>
      <p className="essay">
        통산 기록은 숫자로, 최근 흐름은 문장으로. 둘 다 당신의 등번호 뒤에
        남습니다.
      </p>

      <dl className="stat-list">
        <div>
          <dt>통산 출전</dt>
          <dd>{save.careerApps}</dd>
        </div>
        <div>
          <dt>통산 골</dt>
          <dd>{save.careerGoals}</dd>
        </div>
        <div>
          <dt>통산 도움</dt>
          <dd>{save.careerAssists}</dd>
        </div>
        <div>
          <dt>시즌</dt>
          <dd>
            {save.seasonYear} · {save.quarterIndex}분기
          </dd>
        </div>
      </dl>

      <div className="soft-block">
        <p className="soft-block__label">최근 흐름</p>
        <p>
          {save.lastQuarterSummary ??
            '아직 첫 분기 성적표가 없습니다. 시즌 탭에서 준비를 열어 보세요.'}
        </p>
      </div>

      {save.seasonAccum.apps > 0 && (
        <div className="soft-block">
          <p className="soft-block__label">이번 시즌</p>
          <p>
            출전 {save.seasonAccum.apps} · 골 {save.seasonAccum.goals} · 도움{' '}
            {save.seasonAccum.assists}
          </p>
        </div>
      )}
    </section>
  )
}
