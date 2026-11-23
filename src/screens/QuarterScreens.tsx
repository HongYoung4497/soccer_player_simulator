import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GuestSaveChip } from '../components/GuestSaveChip'
import { useGame } from '../gameContext'
import { CUP_ROUND_KO, ROLE_KO } from '../sim'
import type { TrainingFocus } from '../types'

const FOCUSES: { id: TrainingFocus; blurb: string }[] = [
  { id: '결정력', blurb: '골대 앞에서 한 박자 더 기다리게.' },
  { id: '지구력', blurb: '후반에도 숨을 고를 여유를.' },
  { id: '위치선정', blurb: '빈 공간을 읽는 눈.' },
  { id: '멘탈', blurb: '벤치에서도 시즌을 놓지 않게.' },
  { id: '재활·컨디션', blurb: '몸이 말하는 속도에 맞추기.' },
]

function routeAfterQueue(next: 'continue' | 'season' | 'season-wrap', navigate: ReturnType<typeof useNavigate>) {
  if (next === 'continue') return
  navigate(next === 'season-wrap' ? '/season-wrap' : '/app/season')
}

export function QuarterPrepScreen() {
  const navigate = useNavigate()
  const { save, runQuarter } = useGame()
  const [focus, setFocus] = useState<TrainingFocus>('결정력')

  useEffect(() => {
    if (!save) navigate('/')
  }, [save, navigate])

  if (!save) return null

  return (
    <main className="screen screen--flow">
      <h1 className="screen-heading">분기 준비</h1>
      <p className="essay">
        다음 분기 버튼을 누르기 전에. 능력치가 곧 성적은 아닙니다. 다만, 당신이
        무엇을 기대하는지는 남을 거예요.
      </p>

      <fieldset className="chip-fieldset chip-fieldset--stack">
        <legend>훈련 포커스 1택</legend>
        {FOCUSES.map((f) => (
          <button
            key={f.id}
            type="button"
            className={focus === f.id ? 'choice is-on' : 'choice'}
            onClick={() => setFocus(f.id)}
          >
            <strong>{f.id}</strong>
            <span>{f.blurb}</span>
          </button>
        ))}
      </fieldset>

      <button
        type="button"
        className="btn btn--primary"
        onClick={() => {
          runQuarter(focus)
          navigate('/quarter/progress')
        }}
      >
        준비 완료 · 분기 진행
      </button>
      <GuestSaveChip />
    </main>
  )
}

export function QuarterProgressScreen() {
  const navigate = useNavigate()
  const { lastTraining, save } = useGame()

  useEffect(() => {
    const t = window.setTimeout(() => navigate('/quarter/result'), 1600)
    return () => window.clearTimeout(t)
  }, [navigate])

  const injured =
    save?.injury.type !== 'none' && (save?.injury.quartersLeft ?? 0) > 0

  return (
    <main className="screen screen--flow screen--progress">
      <h1 className="screen-heading">분기 진행 중</h1>
      <p className="essay">
        {injured
          ? '재활실 조명이 길게 켜져 있습니다. 이번 분기 출전표는 비어 있을 수 있습니다.'
          : '가을의 홈구장 조명이 켜집니다. 당신은 몇 번은 선발로, 몇 번은 늦은 교체로 그라운드에 섰습니다.'}
      </p>
      {lastTraining && (
        <p className="muted-line">이번 준비: {lastTraining}</p>
      )}
      <div className="progress-pulse" aria-hidden="true" />
      <p className="muted-line">분기 해상 중…</p>
    </main>
  )
}

export function QuarterResultScreen() {
  const navigate = useNavigate()
  const { save, finishQuarterWithoutEvents } = useGame()
  const result = save?.lastQuarterResult
  const team = save?.lastTeamBlock
  const hasEvents = (save?.pendingEvents.length ?? 0) > 0

  return (
    <main className="screen screen--flow">
      <h1 className="screen-heading">{save?.quarterIndex ?? 1}분기 결산</h1>
      <p className="essay">
        {save?.lastQuarterSummary ?? '아직 해상된 분기 결과가 없습니다.'}
      </p>

      {result && (
        <dl className="stat-list">
          <div>
            <dt>출전</dt>
            <dd>
              {result.apps} (선발 {result.starts})
            </dd>
          </div>
          <div>
            <dt>골 / 도움</dt>
            <dd>
              {result.goals} / {result.assists}
            </dd>
          </div>
          <div>
            <dt>평점</dt>
            <dd>{result.avgRating.toFixed(1)}</dd>
          </div>
          <div>
            <dt>분</dt>
            <dd>{result.minutes}</dd>
          </div>
        </dl>
      )}

      {result && (
        <p className="muted-line">
          리그 출전 {result.league.apps} · 컵 출전 {result.cup.apps}
          {team
            ? ` · 팀 ${team.wins}승 ${team.draws}무 ${team.losses}패 · ${CUP_ROUND_KO[team.cupRoundAfter]}`
            : ''}
        </p>
      )}

      {result?.essayLine && (
        <p className="essay essay--quote">{result.essayLine}</p>
      )}

      {result && result.highlights.length > 0 && (
        <div className="soft-block">
          <p className="soft-block__label">하이라이트</p>
          {result.highlights.map((h) => (
            <p key={h}>{h}</p>
          ))}
        </div>
      )}

      {hasEvents ? (
        <p className="muted-line">이어서 확인할 이야기가 있습니다</p>
      ) : (
        <p className="muted-line">이번 분기 이벤트는 없습니다</p>
      )}

      <button
        type="button"
        className="btn btn--primary"
        onClick={() => {
          if (hasEvents) {
            navigate('/events/queue')
            return
          }
          const next = finishQuarterWithoutEvents()
          navigate(next === 'season-wrap' ? '/season-wrap' : '/app/season')
        }}
      >
        계속
      </button>
      <GuestSaveChip />
    </main>
  )
}

/** 연속 이벤트 큐 — 타입별 카드 */
export function EventQueueScreen() {
  const navigate = useNavigate()
  const { save, currentEvent, resolveCurrentEvent } = useGame()

  useEffect(() => {
    if (!save) navigate('/')
  }, [save, navigate])

  if (!save) return null

  if (!currentEvent) {
    return (
      <main className="screen screen--flow">
        <p className="essay">확인할 이야기가 없습니다.</p>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => navigate('/app/season')}
        >
          시즌으로
        </button>
      </main>
    )
  }

  const ev = currentEvent
  const choose = (choice: 'accept' | 'decline' | 'ack') => {
    routeAfterQueue(resolveCurrentEvent(choice), navigate)
  }

  if (ev.type === 'ROLE_OFFER') {
    return (
      <main className="screen screen--flow">
        <h1 className="screen-heading">{ev.title}</h1>
        <p className="essay">{ev.body}</p>
        <p className="muted-line">
          현재: {ROLE_KO[ev.fromRole ?? save.role]} → 제안:{' '}
          {ROLE_KO[ev.toRole ?? 'starter']}
        </p>
        <div className="cta-stack">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => choose('accept')}
          >
            {ROLE_KO[ev.toRole ?? 'starter']} 도전을 받아들인다
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => choose('decline')}
          >
            {ROLE_KO[ev.fromRole ?? save.role]}을 지킨다
          </button>
        </div>
        <GuestSaveChip />
      </main>
    )
  }

  if (ev.type === 'LOAN_OFFER') {
    return (
      <main className="screen screen--flow">
        <h1 className="screen-heading">{ev.title}</h1>
        <p className="essay">{ev.body}</p>
        <div className="soft-block">
          <p className="soft-block__label">카드 A — 임대</p>
          <p>
            {ev.toClub} · 티어 {ev.tier} · 시즌 종료까지 · 약속 역할{' '}
            <strong>{ROLE_KO[ev.promisedRole ?? 'starter']}</strong>
          </p>
          <p className="muted-line">{ev.competitionNote}</p>
        </div>
        <div className="soft-block">
          <p className="soft-block__label">카드 B — 잔류</p>
          <p>{ev.fromClub} · 주전 경쟁 지속</p>
        </div>
        <div className="cta-stack">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => choose('accept')}
          >
            {ev.toClub}으로 임대
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => choose('decline')}
          >
            잔류
          </button>
        </div>
        <GuestSaveChip />
      </main>
    )
  }

  if (ev.type === 'TRANSFER_OFFER') {
    return (
      <main className="screen screen--flow">
        <h1 className="screen-heading">{ev.title}</h1>
        <p className="essay">{ev.body}</p>
        <div className="cta-stack">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => choose('accept')}
          >
            {ev.toClub}으로 이적
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => choose('decline')}
          >
            잔류
          </button>
        </div>
        <GuestSaveChip />
      </main>
    )
  }

  return (
    <main className="screen screen--flow">
      <h1 className="screen-heading">{ev.title}</h1>
      <p className="essay">{ev.body}</p>
      <button
        type="button"
        className="btn btn--primary"
        onClick={() => choose('ack')}
      >
        알겠다
      </button>
      <GuestSaveChip />
    </main>
  )
}
