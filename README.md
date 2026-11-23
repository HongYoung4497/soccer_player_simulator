# 전생했더니 등번호를 받았던 건에 대하여

유럽 페르소나 리그 감성 **모바일 웹** 축구 커리어 시뮬레이션 MVP 셸.

> 기획 문서(Project store): `soccer-sim-plan.md` · `paper-prototype.md` · `quarterly-sim-rules.md`

## 실행

```bash
npm install
npm run dev
```

브라우저에서 표시되는 로컬 URL(보통 `http://localhost:5173`)을 엽니다. 세로 모바일 폭에 맞춰 보는 것을 권장합니다.

```bash
npm run build   # 타입체크 + 프로덕션 빌드
npm run preview # 빌드 미리보기
```

## 이 PR에 포함된 것 (셸)

- 타이틀 / 게스트·로그인 플레이스홀더 / 선수 생성 스텁 / 유스 입문
- 4탭 셸: **시즌 · 커리어 · 선수 · 연혁**
- 분기 준비 → 진행 → 결과 → 이벤트 연속 큐(벤치·임대·부상) 스텁
- 시즌 결산 · 은퇴·선수단 · 게스트↔계정 충돌 표 비교 스텁
- 게스트 `localStorage` 저장 + 하단 저장 리마인더 칩
- Google / Kakao는 UI만 (실제 OAuth 없음)

## 의도적으로 미룸

- 분기 시뮬 엔진 (`quarterly-sim-rules.md` 해상)
- 실 OAuth · 서버 세이브 · 페르소나 150클럽 월드 데이터
- 대륙 대회 · 국가대표 · 과금 · 멀티

## 스택

Vite · React 19 · TypeScript · React Router
