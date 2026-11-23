import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GuestSaveChip } from '../components/GuestSaveChip'
import { useGame } from '../gameContext'
import type { TrainingFocus } from '../types'

const FOCUSES: { id: TrainingFocus; blurb: string }[] = [
  { id: '결정력', blurb: '골대 앞에서 한 박자 더 기다리게.' },
  { id: '지구력', blurb: '후반에도 숨을 고를 여유를.' },
  { id: '위치선정', blurb: '빈 공간을 읽는 눈.' },
  { id: '멘탈', blurb: '벤치에서도 시즌을 놓지 않게.' },
  { id: '재활·컨디션', blurb: '몸이 말하는 속도에 맞추기.' },
]

export function QuarterPrepScreen() {
  const navigate = useNavigate()
  const { save, runQuarterStub } = useGame()
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
          runQuarterStub(focus)
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
  const { lastTraining } = useGame()

  useEffect(() => {
    const t = window.setTimeout(() => navigate('/quarter/result'), 1600)
    return () => window.clearTimeout(t)
  }, [navigate])

  return (
    <main className="screen screen--flow screen--progress">
      <h1 className="screen-heading">분기 진행 중</h1>
      <p className="essay">
        가을의 홈구장 조명이 켜집니다. 당신은 몇 번은 선발로, 몇 번은 늦은
        교체로 그라운드에 섰습니다.
      </p>
      {lastTraining && (
        <p className="muted-line">이번 준비: {lastTraining}</p>
      )}
      <div className="progress-pulse" aria-hidden="true" />
      <p className="muted-line">잠시만요 — 시뮬 엔진은 이후 단계에서 붙습니다.</p>
    </main>
  )
}

export function QuarterResultScreen() {
  const navigate = useNavigate()
  const { save } = useGame()

  return (
    <main className="screen screen--flow">
      <h1 className="screen-heading">{save?.quarterIndex ?? 1}분기 성적표</h1>
      <p className="essay">
        {save?.lastQuarterSummary ??
          '출전 7 (선발 2) · 골 1 · 도움 0 · 평균 평점 6.4'}
      </p>
      <p className="essay essay--quote">
        교체로 들어간 더비에서 첫 골을 넣었습니다. 벤치로 돌아올 때 관중의
        소리는 짧게 남았습니다.
      </p>
      <div className="soft-block">
        <p className="soft-block__label">하이라이트</p>
        <p>첫 골 — 78분 교체 투입</p>
      </div>
      <p className="muted-line">이어서 확인할 이야기가 있습니다</p>
      <button
        type="button"
        className="btn btn--primary"
        onClick={() => navigate('/events/role')}
      >
        계속
      </button>
      <GuestSaveChip />
    </main>
  )
}

export function EventRoleScreen() {
  const navigate = useNavigate()
  const { acceptRoleOffer } = useGame()

  return (
    <main className="screen screen--flow">
      <h1 className="screen-heading">벤치와 주전 사이</h1>
      <p className="essay">
        감독이 짧게 말을 남겼습니다. 「다음 분기는 선발로 열어 보고 싶다. 다만
        폼이 떨어지면 다시 로테이션이다.」
      </p>
      <p className="muted-line">현재: 로테이션 → 제안: 주전 도전</p>
      <div className="cta-stack">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            acceptRoleOffer(true)
            navigate('/events/loan')
          }}
        >
          주전 도전을 받아들인다
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            acceptRoleOffer(false)
            navigate('/events/loan')
          }}
        >
          로테이션을 지킨다
        </button>
      </div>
      <GuestSaveChip />
    </main>
  )
}

export function EventLoanScreen() {
  const navigate = useNavigate()
  const { acceptLoan } = useGame()

  return (
    <main className="screen screen--flow">
      <h1 className="screen-heading">이적 시장이 문을 열었습니다</h1>
      <p className="essay">제안은 확정이 아닙니다.</p>

      <div className="soft-block">
        <p className="soft-block__label">카드 A — 임대</p>
        <p>
          밀브룩 유나이티드 · 북섬 · 티어 2 · 시즌 종료까지 · 약속 역할{' '}
          <strong>주전</strong>
        </p>
        <p className="muted-line">
          출전을 위해 한 계단 내려가는 선택입니다. 계약은 하버라이트에 남습니다.
        </p>
      </div>

      <div className="soft-block">
        <p className="soft-block__label">카드 B — 잔류</p>
        <p>하버라이트 · 주전 경쟁 지속</p>
      </div>

      <div className="cta-stack">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            acceptLoan(true)
            navigate('/events/injury')
          }}
        >
          밀브룩으로 임대
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            acceptLoan(false)
            navigate('/events/injury')
          }}
        >
          잔류
        </button>
      </div>
      <GuestSaveChip />
    </main>
  )
}

export function EventInjuryScreen() {
  const navigate = useNavigate()
  const { completeEventQueue } = useGame()

  return (
    <main className="screen screen--flow">
      <h1 className="screen-heading">몸이 말을 듣지 않았습니다</h1>
      <p className="essay">
        훈련 중 통증이 말을 듣지 않았습니다. 이번 분기의 경기 기록은 비어 있을
        수 있습니다. 그래도 달력은 넘어갑니다.
      </p>
      <button
        type="button"
        className="btn btn--primary"
        onClick={() => {
          const next = completeEventQueue()
          navigate(next === 'season-wrap' ? '/season-wrap' : '/app/season')
        }}
      >
        알겠다
      </button>
      <GuestSaveChip />
    </main>
  )
}
