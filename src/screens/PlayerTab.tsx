import { useGame } from '../gameContext'
import { ATTR_LABEL_KO, ROLE_KO } from '../sim'
import type { AttrKey } from '../types'

const SHOW_ATTRS: Record<string, AttrKey[]> = {
  FW: ['finishing', 'positioning', 'speed', 'stamina', 'mental'],
  MF: ['passing', 'vision', 'pressing', 'stamina', 'footballIQ'],
  DF: ['tackling', 'marking', 'aerial', 'positioning', 'mental'],
  GK: ['shotStopping', 'command', 'buildup', 'mental', 'footballIQ'],
}

export function PlayerTab() {
  const { save } = useGame()

  if (!save) {
    return (
      <section className="tab-panel">
        <p className="essay">선수 정보가 없습니다.</p>
      </section>
    )
  }

  const { player, parentClub, playingClub, onLoan, role, fitness, form, injury } =
    save
  const keys = SHOW_ATTRS[player.position] ?? SHOW_ATTRS.FW

  return (
    <section className="tab-panel">
      <h1 className="screen-heading">지금의 나</h1>
      <p className="essay">
        {player.name} · #{player.shirtNumber} {player.position} · {player.style}{' '}
        · {player.age}세
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
        <div>
          <dt>컨디션</dt>
          <dd>{fitness}</dd>
        </div>
        <div>
          <dt>폼</dt>
          <dd>
            {form > 0 ? `+${form}` : form}
          </dd>
        </div>
      </dl>

      {injury.type !== 'none' && (
        <div className="soft-block">
          <p className="soft-block__label">부상</p>
          <p>
            {injury.type} · 남은 분기 {injury.quartersLeft}
          </p>
        </div>
      )}

      <div className="soft-block">
        <p className="soft-block__label">소속 {onLoan ? '(임대 중)' : ''}</p>
        {onLoan ? (
          <>
            <p>
              본대 <strong>{parentClub.name}</strong> (계약)
            </p>
            <p>
              임대 <strong>{playingClub.name}</strong> (시즌 종료까지 ·{' '}
              {ROLE_KO[save.promisedRole ?? role]})
            </p>
          </>
        ) : (
          <p>
            소속 <strong>{parentClub.name}</strong>
          </p>
        )}
      </div>

      <div className="soft-block">
        <p className="soft-block__label">세부 능력</p>
        <dl className="stat-list">
          {keys.map((k) => (
            <div key={k}>
              <dt>{ATTR_LABEL_KO[k]}</dt>
              <dd>{Math.round(player.attrs[k])}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
