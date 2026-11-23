import type {
  CupRoundStatus,
  GameEvent,
  PositionGroup,
  QuarterPlayerStats,
  Role,
  SeasonWrapSummary,
  TeamQuarterBlock,
} from '../types'
import { CUP_ROUND_KO } from './knobs'

const ROLE_KO: Record<Role, string> = {
  unused: '미사용',
  rotation: '로테이션',
  starter: '주전',
  key: '핵심',
}

export { ROLE_KO }

export function formatQuarterSummary(
  quarterIndex: number,
  stats: QuarterPlayerStats,
  team: TeamQuarterBlock,
  cupName: string,
): string {
  const parts = [
    `${quarterIndex}분기 · 출전 ${stats.apps} (선발 ${stats.starts})`,
    `골 ${stats.goals}`,
    `도움 ${stats.assists}`,
    `평균 평점 ${stats.avgRating.toFixed(1)}`,
    `팀 ${team.rankAfter}위권`,
    `${cupName} ${CUP_ROUND_KO[team.cupRoundAfter]}`,
  ]
  return parts.join(' · ')
}

export function pickEssayLine(
  position: PositionGroup,
  stats: QuarterPlayerStats,
  injuredOut: boolean,
): string {
  if (injuredOut) {
    return '그라운드 대신 재활실에서 분기 달력을 넘겼습니다. 숫자는 비었지만, 시즌은 기다려 주지 않습니다.'
  }
  if (stats.apps === 0) {
    return '벤치와 관중석 사이에서 시즌을 읽었습니다. 이름 호출은 다음 분기의 몫으로 남았습니다.'
  }
  if (stats.goals >= 2) {
    return '골망이 두 번 흔들렸습니다. 관중의 소리는 짧게, 그러나 분명하게 등번호에 붙었습니다.'
  }
  if (stats.goals === 1) {
    return '교체로 들어간 더비에서 첫 골을 넣었습니다. 벤치로 돌아올 때 관중의 소리는 짧게 남았습니다.'
  }
  if (position === 'GK' && (stats.league.cleanSheets ?? 0) + (stats.cup.cleanSheets ?? 0) > 0) {
    return '골문을 지킨 밤이 있었습니다. 클린시트는 조용하지만, 팀의 순위표에는 분명합니다.'
  }
  if (stats.avgRating >= 7.2) {
    return '평점이 말해 줍니다. 이번 분기, 당신은 분명 그라운드에서 한 문장을 남겼습니다.'
  }
  if (stats.avgRating < 6.2) {
    return '폼이 말을 아끼는 분기였습니다. 능력은 그대로인데, 장면이 따라오지 않았습니다.'
  }
  return '선발과 교체를 오가며 분기를 채웠습니다. 능력치가 곧 성적은 아니라는 문장이, 이번에도 남았습니다.'
}

export function seasonWrapEssay(onLoan: boolean, rank: number): string {
  if (onLoan) {
    return '임대지에서 보낸 봄이 가장 길었습니다. 본대로 돌아가는 버스에서 당신은 주전 경쟁의 다음 문장을 생각했습니다.'
  }
  if (rank <= 4) {
    return '상위권 경쟁의 숨이 시즌을 밀고 갔습니다. 등번호는 더 무거워졌고, 내년의 문장도 길어졌습니다.'
  }
  if (rank >= 15) {
    return '하위권의 긴장이 시즌을 덮었습니다. 그래도 달력은 넘어가고, 계약서의 연차는 줄어듭니다.'
  }
  return '중위권의 고요한 시즌이었습니다. 리그와 컵을 한 스크롤에 덮으며, 당신은 다음 겨울을 고릅니다.'
}

export function roleOfferCopy(from: Role, to: Role): Pick<GameEvent, 'title' | 'body'> {
  return {
    title: '벤치와 주전 사이',
    body: `감독이 짧게 말을 남겼습니다. 「다음 분기는 ${ROLE_KO[to]}으로 열어 보고 싶다. 다만 폼이 떨어지면 다시 ${ROLE_KO[from]}이다.」`,
  }
}

export function loanOfferCopy(
  fromClub: string,
  toClub: string,
  tier: number,
  promised: Role,
): Pick<GameEvent, 'title' | 'body'> {
  return {
    title: '이적 시장이 문을 열었습니다',
    body: `${toClub}(티어 ${tier})에서 시즌 종료까지 임대를 제안했습니다. 약속 역할은 ${ROLE_KO[promised]}. 계약은 ${fromClub}에 남습니다. 제안은 확정이 아닙니다.`,
  }
}

export function transferOfferCopy(
  fromClub: string,
  toClub: string,
  tier: number,
  years: number,
  promised: Role,
): Pick<GameEvent, 'title' | 'body'> {
  return {
    title: '이적 제안이 도착했습니다',
    body: `${toClub}(티어 ${tier}) · ${years}년 · 약속 역할 ${ROLE_KO[promised]}. ${fromClub}을 떠나 새 등번호를 받을지, 잔류할지 고를 차례입니다.`,
  }
}

export function injuryCopy(quartersLeft: number): Pick<GameEvent, 'title' | 'body'> {
  return {
    title: '몸이 말을 듣지 않았습니다',
    body: `훈련·경기 중 통증이 말을 듣지 않았습니다. 앞으로 약 ${quartersLeft}분기, 경기 기록은 비어 있을 수 있습니다. 그래도 달력은 넘어갑니다.`,
  }
}

export function injuryRecoveredCopy(): Pick<GameEvent, 'title' | 'body'> {
  return {
    title: '다시 그라운드로',
    body: '재활이 끝났습니다. 다음 분기부터 출전표를 다시 열 수 있습니다. 몸이 기억한 속도로, 천천히.',
  }
}

export function formatCupResult(status: CupRoundStatus, cupName: string): string {
  if (status === 'winner') return `${cupName} 우승`
  if (status === 'eliminated') return `${cupName} 탈락`
  if (status === 'not_entered') return `${cupName} 미참가`
  return `${cupName} ${CUP_ROUND_KO[status]}까지`
}

export function formatSeasonWrapLine(summary: SeasonWrapSummary): string {
  return `${summary.year} ${summary.leagueName} ${summary.teamRank}위 · ${summary.cupResult}`
}
