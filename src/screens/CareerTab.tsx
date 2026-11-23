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
            '주전 분기 → 임대 적응 → 부상 → 복귀 — 아직 샘플 문장입니다.'}
        </p>
      </div>

      <div className="soft-block">
        <p className="soft-block__label">업적 (스텁)</p>
        <p>첫 골 · 첫 풀타임 · 티어 사다리 — 배지 시스템은 이후 단계.</p>
      </div>
    </section>
  )
}
