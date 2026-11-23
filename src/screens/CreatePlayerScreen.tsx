import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GuestSaveChip } from '../components/GuestSaveChip'
import { useGame } from '../gameContext'
import type {
  PlayerProfile,
  PositionGroup,
  PreferredLeague,
  StyleTag,
} from '../types'

const POSITIONS: PositionGroup[] = ['GK', 'DF', 'MF', 'FW']
const STYLES: StyleTag[] = [
  '포처',
  '타겟',
  '박스투박스',
  '플레이메이커',
  '윙백',
  '스위퍼키퍼',
]
const LEAGUES: PreferredLeague[] = [
  '북섬 프리미어',
  '태양 리그',
  '운하 세리에',
  '강철 분데스',
  '세느 리그',
]

export function CreatePlayerScreen() {
  const navigate = useNavigate()
  const { startCareer } = useGame()
  const [name, setName] = useState('서하준')
  const [shirtNumber, setShirtNumber] = useState(19)
  const [foot, setFoot] = useState<PlayerProfile['preferredFoot']>('오른발')
  const [position, setPosition] = useState<PositionGroup>('FW')
  const [style, setStyle] = useState<StyleTag>('포처')
  const [league, setLeague] = useState<PreferredLeague>('북섬 프리미어')

  const submit = () => {
    // attrs·age는 createInitialSave에서 포지션 기본값으로 채움
    const player: Omit<PlayerProfile, 'attrs' | 'age'> = {
      name: name.trim() || '이름 없는 선수',
      shirtNumber: Math.min(99, Math.max(1, shirtNumber)),
      preferredFoot: foot,
      position,
      style,
      preferredLeague: league,
      ovr: 68,
    }
    startCareer(player)
    navigate('/youth')
  }

  return (
    <main className="screen screen--flow">
      <header className="flow-header">
        <button
          type="button"
          className="back-link"
          onClick={() => navigate('/auth')}
        >
          ← 뒤로
        </button>
        <h1 className="screen-heading">아카데미 마지막 겨울</h1>
      </header>

      <p className="essay">
        스태프는 당신의 강점을 적어 두고, 1군 복도 끝에는 빈 등번호가
        기다립니다. 이름을 쓰고, <strong>어디에 설지</strong> 골라 주세요.
        골키퍼든 윙이든, 등번호는 당신 것입니다.
      </p>

      <label className="field">
        <span>이름</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={12}
          autoComplete="off"
        />
      </label>

      <label className="field">
        <span>등번호</span>
        <input
          type="number"
          min={1}
          max={99}
          value={shirtNumber}
          onChange={(e) => setShirtNumber(Number(e.target.value))}
        />
      </label>

      <fieldset className="chip-fieldset">
        <legend>주발</legend>
        {(['왼발', '오른발', '양발'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={foot === f ? 'chip is-on' : 'chip'}
            onClick={() => setFoot(f)}
          >
            {f}
          </button>
        ))}
      </fieldset>

      <fieldset className="chip-fieldset">
        <legend>포지션</legend>
        {POSITIONS.map((p) => (
          <button
            key={p}
            type="button"
            className={position === p ? 'chip is-on' : 'chip'}
            onClick={() => setPosition(p)}
          >
            {p}
          </button>
        ))}
      </fieldset>

      <fieldset className="chip-fieldset">
        <legend>플레이 스타일</legend>
        {STYLES.map((s) => (
          <button
            key={s}
            type="button"
            className={style === s ? 'chip is-on' : 'chip'}
            onClick={() => setStyle(s)}
          >
            {s}
          </button>
        ))}
      </fieldset>

      <fieldset className="chip-fieldset">
        <legend>희망 리그 감성 (입단 보장 아님)</legend>
        {LEAGUES.map((l) => (
          <button
            key={l}
            type="button"
            className={league === l ? 'chip is-on' : 'chip'}
            onClick={() => setLeague(l)}
          >
            {l}
          </button>
        ))}
      </fieldset>

      <div className="candidate-stub">
        <p className="candidate-stub__label">후보 스텁</p>
        <p>
          OVR 68 · 강점 위치선정 · 약점 공중볼 — 수치와 후보장은 이후 엔진에서
          붙입니다.
        </p>
      </div>

      <button type="button" className="btn btn--primary" onClick={submit}>
        이 선수로 시작한다
      </button>
      <GuestSaveChip />
    </main>
  )
}
