# 전생했더니 등번호를 받았던 건에 대하여

유럽 페르소나 리그 감성 **모바일 웹** 축구 커리어 시뮬레이션 MVP.

> 기획 문서(Project store): `soccer-sim-plan.md` · `paper-prototype.md` · `quarterly-sim-rules.md`

## 실행

```bash
npm install
npm run dev
```

브라우저에서 표시되는 로컬 URL(보통 `http://localhost:5173`)을 엽니다. 세로 모바일 폭에 맞춰 보는 것을 권장합니다.

```bash
npm test      # 분기 해상 유닛 테스트
npm run build # 타입체크 + 프로덕션 빌드
npm run preview
```

## 포함된 것

- 모바일 웹 셸 (타이틀 · 게스트 · 생성 · 4탭 · 은퇴·선수단)
- **분기 시뮬 엔진** `resolveQuarter` — 출전 → 팀 블록 → 스탯 → 성장 → 연속 이벤트 큐
- 시즌 랩 `wrapSeason` (4분기 → 결산 한 스크롤)
- 게스트 `localStorage` (세이브 v2 · v1 자동 마이그레이션)
- `[가정]` 밸런스 노브: `src/sim/knobs.ts`

## 시뮬 설계 선택 (§10)

- **리그/컵 스탯:** 분기 결과에 `league` / `cup` 분리 저장, UI는 합산+분리 병기
- **팀 시뮬 깊이:** 플레이어 리그(북섬 프리미어)만 상세 WDL · 타 리그(라 프리메라·세리에 프리마·분트 리가·리그 앙)는 요약 노트
- **페르소나 대회명:** `src/world/leagues.ts` — 5리그·5국내컵 잠금명 중앙화
- **시드:** `careerSeed + season + quarter + training` 결정적 해상

## 의도적으로 미룸

- 실 Google/Kakao OAuth · 서버 세이브
- 150클럽 전부 상세 시뮬 · 대륙 대회 · 국가대표 · 과금 · 멀티

## 스택

Vite · React 19 · TypeScript · React Router · Vitest
