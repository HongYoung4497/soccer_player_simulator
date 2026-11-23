import type { CareerSave, SeasonWrapSummary } from '../types'
import { formatCupResult, formatSeasonWrapLine, seasonWrapEssay } from './essay'

function emptyAccum(): CareerSave['seasonAccum'] {
  const z = {
    apps: 0,
    starts: 0,
    minutes: 0,
    goals: 0,
    assists: 0,
    yellow: 0,
    red: 0,
    cleanSheets: 0,
    goalsAgainst: 0,
  }
  return {
    apps: 0,
    starts: 0,
    minutes: 0,
    goals: 0,
    assists: 0,
    ratingSum: 0,
    ratingCount: 0,
    league: { ...z },
    cup: { ...z },
    highlights: [],
  }
}

function emptyTable(): CareerSave['leagueTable'] {
  return {
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
    rank: 10,
  }
}

/** Q4 종료 후 시즌 랩 — rules §7 */
export function wrapSeason(save: CareerSave): {
  nextSave: CareerSave
  summary: SeasonWrapSummary
} {
  const accum = save.seasonAccum
  const avgRating =
    accum.ratingCount > 0
      ? Math.round((accum.ratingSum / accum.ratingCount) * 10) / 10
      : 6.0

  const cupResult = formatCupResult(save.cupRound, save.playingClub.cup)
  const summary: SeasonWrapSummary = {
    year: save.seasonYear,
    leagueName: save.playingClub.league,
    cupName: save.playingClub.cup,
    teamRank: save.leagueTable.rank,
    teamPoints: save.leagueTable.points,
    cupResult,
    playerApps: accum.apps,
    playerGoals: accum.goals,
    playerAssists: accum.assists,
    avgRating,
    essayLine: seasonWrapEssay(save.onLoan, save.leagueTable.rank),
    highlights: accum.highlights.slice(0, 4),
  }

  // 임대 만료 → 본대 복귀
  const returningFromLoan = save.onLoan && save.loanEndsAfterSeason

  const nextSave: CareerSave = {
    ...save,
    player: {
      ...save.player,
      age: save.player.age + 1,
    },
    contractYearsLeft: Math.max(0, save.contractYearsLeft - 1),
    onLoan: returningFromLoan ? false : save.onLoan,
    playingClub: returningFromLoan ? save.parentClub : save.playingClub,
    promisedRole: returningFromLoan ? null : save.promisedRole,
    role: returningFromLoan ? 'rotation' : save.role,
    loanEndsAfterSeason: false,
    seasonYear: save.seasonYear + 1,
    quarterIndex: 1,
    cupRound: 'round_of_64',
    leagueTable: emptyTable(),
    seasonAccum: emptyAccum(),
    lastSeasonWrap: summary,
    historyLines: [...save.historyLines, formatSeasonWrapLine(summary)],
    lastQuarterSummary: `${summary.year} 시즌 결산 — 출전 ${summary.playerApps} · 골 ${summary.playerGoals} · 도움 ${summary.playerAssists} · 평점 ${summary.avgRating}`,
    pendingEvents: [],
    fitness: Math.min(100, save.fitness + 10),
    form: 0,
    savedAt: new Date().toISOString(),
  }

  return { nextSave, summary }
}
