import { useGame } from '../gameContext'

export function HistoryTab() {
  const { save } = useGame()

  if (!save) {
    return (
      <section className="tab-panel">
        <p className="essay">연혁을 적을 시즌이 없습니다.</p>
      </section>
    )
  }

  const lines =
    save.historyLines.length > 0
      ? save.historyLines
      : ['아직 시즌을 덮지 않았습니다. 리그와 국내컵만 여기에 남습니다.']

  return (
    <section className="tab-panel">
      <h1 className="screen-heading">팀과 함께한 것</h1>
      <p className="essay">
        리그와 국내컵만. 대륙 대회와 국가대표 자리는 비워 둡니다.
      </p>

      <ul className="history-list">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <p className="muted-line">
        컵: {save.parentClub.cup} · 리그: {save.parentClub.league}
      </p>
    </section>
  )
}
