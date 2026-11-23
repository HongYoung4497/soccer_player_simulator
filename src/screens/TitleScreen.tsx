import { useNavigate } from 'react-router-dom'
import { useGame } from '../gameContext'
import { loadSave } from '../storage'

export function TitleScreen() {
  const navigate = useNavigate()
  const { continueCareer } = useGame()
  const existing = loadSave()
  const hasSave = Boolean(existing && !existing.retired)

  return (
    <main className="screen screen--title">
      <div className="title-atmosphere" aria-hidden="true" />
      <div className="title-content">
        <p className="eyebrow">모바일 웹 · 한국어</p>
        <h1 className="brand-title">
          전생했더니 등번호를
          <br />
          받았던 건에 대하여
        </h1>
        <p className="lede">
          이번 생의 축구는, 아직 비어 있는 등번호에서 시작됩니다. 유럽의 가명
          리그 어딘가에서, 당신의 등이 불릴 날을 기다립니다.
        </p>
        <div className="cta-stack">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => navigate('/auth')}
          >
            인생 시작하기
          </button>
          {hasSave && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                if (continueCareer()) navigate('/app/season')
              }}
            >
              이어하기
            </button>
          )}
          <button
            type="button"
            className="btn btn--text"
            onClick={() => navigate('/auth', { state: { preferLogin: true } })}
          >
            계정으로 동기화
          </button>
        </div>
      </div>
    </main>
  )
}
