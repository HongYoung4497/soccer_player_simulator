import { useNavigate } from 'react-router-dom'
import { GuestSaveChip } from '../components/GuestSaveChip'
import { useGame } from '../gameContext'

export function YouthIntroScreen() {
  const navigate = useNavigate()
  const { save } = useGame()

  if (!save) {
    return (
      <main className="screen screen--flow">
        <p className="essay">저장된 선수가 없습니다.</p>
        <button type="button" className="btn btn--primary" onClick={() => navigate('/')}>
          타이틀로
        </button>
      </main>
    )
  }

  const { player, parentClub, role } = save
  const roleLabel =
    role === 'rotation' ? '로테이션 후보' : role === 'starter' ? '주전' : role

  return (
    <main className="screen screen--flow">
      <h1 className="screen-heading">유스에서 1군 복도로</h1>
      <p className="essay">
        {parentClub.league}, <strong>{parentClub.name}</strong> (티어{' '}
        {parentClub.tier}) 유스에서 1군 훈련에 합류했습니다.
      </p>
      <p className="essay">
        등번호 <strong>{player.shirtNumber}</strong>. 계약은 짧고, 역할은{' '}
        <strong>{roleLabel}</strong>입니다. 데뷔골은 아직 미래의 문장입니다.
      </p>

      <ul className="meta-row" aria-label="현재 소속">
        <li>본대 {parentClub.name}</li>
        <li>역할 {roleLabel}</li>
        <li>리그 {parentClub.league}</li>
        <li>컵 {parentClub.cup}</li>
      </ul>

      <button
        type="button"
        className="btn btn--primary"
        onClick={() => navigate('/app/season')}
      >
        시즌으로
      </button>
      <GuestSaveChip />
    </main>
  )
}
