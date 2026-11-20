import { useLocation, useNavigate } from 'react-router-dom'
import { useGame } from '../gameContext'
import { GuestSaveChip } from '../components/GuestSaveChip'

export function AuthScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const preferLogin = Boolean(
    (location.state as { preferLogin?: boolean } | null)?.preferLogin,
  )
  const { setPendingAuth, simulateConflictLogin, continueCareer, save } =
    useGame()

  const goGuest = () => {
    setPendingAuth('guest')
    if (save && !save.retired) {
      navigate('/app/season')
      return
    }
    navigate('/create')
  }

  const goSocial = (mode: 'google' | 'kakao') => {
    const hasConflict = simulateConflictLogin(mode)
    if (hasConflict) {
      navigate('/conflict')
      return
    }
    setPendingAuth(mode)
    if (continueCareer()) {
      navigate('/app/season')
      return
    }
    navigate('/create')
  }

  return (
    <main className="screen screen--flow">
      <header className="flow-header">
        <button type="button" className="back-link" onClick={() => navigate('/')}>
          ← 타이틀
        </button>
        <h1 className="screen-heading">기록을 어디에 두고 싶으세요?</h1>
      </header>

      <p className="essay">
        <strong>게스트</strong>는 이 기기에만 남습니다. 브라우저를 지우면
        이야기도 함께 사라질 수 있어요.
      </p>
      <p className="essay">
        <strong>Google</strong>이나 <strong>Kakao</strong>로 들어오면, 같은
        계정이 있는 곳에서 이어서 읽을 수 있습니다. (OAuth는 플레이스홀더)
      </p>

      <div className="cta-stack">
        <button
          type="button"
          className={`btn ${preferLogin ? 'btn--ghost' : 'btn--primary'}`}
          onClick={goGuest}
        >
          게스트로 시작
        </button>
        <button
          type="button"
          className={`btn ${preferLogin ? 'btn--primary' : 'btn--ghost'}`}
          onClick={() => goSocial('google')}
        >
          Google로 계속
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => goSocial('kakao')}>
          Kakao로 계속
        </button>
      </div>

      <GuestSaveChip />
    </main>
  )
}
