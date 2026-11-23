import type {
  CareerSave,
  CompetitionStats,
  CupRoundStatus,
  GameEvent,
  PlayerAttrs,
  QuarterPlayerStats,
  Role,
  TeamQuarterBlock,
  TrainingFocus,
} from '../types'
import { ATTR_LABEL_KO, TRAINING_ATTR, recomputeOvr } from './attrs'
import {
  formatQuarterSummary,
  injuryCopy,
  injuryRecoveredCopy,
  loanOfferCopy,
  pickEssayLine,
  roleOfferCopy,
  transferOfferCopy,
} from './essay'
import {
  CUP_ROUNDS,
  EVENT_RATES,
  EVENT_SORT_ORDER,
  GROWTH,
  INJURY,
  LEAGUE_MATCHES_PER_QUARTER,
  ROLE_MINUTE_BANDS,
  RATING_CLAMP,
  SCORING,
  TEAM_FORM,
} from './knobs'
import { createRng, hashSeed, type Rng } from './rng'

export interface QuarterPrep {
  trainingFocus: TrainingFocus
}

export interface ResolveQuarterResult {
  nextSave: CareerSave
  stats: QuarterPlayerStats
  team: TeamQuarterBlock
  events: GameEvent[]
  summaryLine: string
}

function emptyComp(): CompetitionStats {
  return {
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
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function poisson(rng: Rng, lambda: number): number {
  // Knuth for small lambda
  const L = Math.exp(-Math.max(0, lambda))
  let k = 0
  let p = 1
  do {
    k++
    p *= rng.next()
  } while (p > L && k < 20)
  return k - 1
}

/** Step 1 — 출전 시간 */
function resolveMinutes(
  save: CareerSave,
  rng: Rng,
  injuredGate: boolean,
): {
  minutesLeague: number
  minutesCup: number
  starts: number
  subApps: number
  apps: number
  cupApps: number
  cupStarts: number
  targetRatio: number
} {
  const L = LEAGUE_MATCHES_PER_QUARTER
  const M_league = L * 90

  if (injuredGate) {
    return {
      minutesLeague: 0,
      minutesCup: 0,
      starts: 0,
      subApps: 0,
      apps: 0,
      cupApps: 0,
      cupStarts: 0,
      targetRatio: 0,
    }
  }

  const role: Role = save.promisedRole && save.onLoan ? save.promisedRole : save.role
  const band = ROLE_MINUTE_BANDS[role]
  let ratio = rng.float(band.min, band.max)

  // modifiers `[가정]`
  const ovr = save.player.ovr
  const tier = save.playingClub.tier
  if (tier === 1 && ovr < 70) ratio *= 0.85
  if (tier === 3 && ovr > 72) ratio = Math.min(1, ratio * 1.12)
  if (save.fitness < 60) ratio *= 0.75
  if (save.morale < 40) ratio *= 0.9
  if (save.form >= 1) ratio = Math.min(1, ratio * 1.08)
  if (save.form <= -1) ratio *= 0.92

  ratio = clamp(ratio, 0, 1)

  const minutesLeague = Math.round(M_league * ratio)
  // starts / subs heuristic
  const startShare =
    role === 'key' || role === 'starter' ? 0.75 : role === 'rotation' ? 0.35 : 0.1
  let starts = Math.round((minutesLeague / 90) * startShare)
  let apps = Math.max(starts, Math.round(minutesLeague / 70))
  apps = clamp(apps, 0, L)
  starts = clamp(starts, 0, apps)
  const subApps = Math.max(0, apps - starts)

  // Cup: 진행 중이면 최대 1경기
  let minutesCup = 0
  let cupApps = 0
  let cupStarts = 0
  const cupActive =
    save.cupRound !== 'eliminated' &&
    save.cupRound !== 'winner' &&
    save.cupRound !== 'not_entered'
  if (cupActive || save.cupRound === 'not_entered' || save.cupRound === 'round_of_64') {
    // Q1부터 참가 가정
    const playCup = save.cupRound !== 'eliminated' && save.cupRound !== 'winner'
    if (playCup && ratio > 0.1) {
      cupApps = 1
      cupStarts = rng.chance(startShare) ? 1 : 0
      minutesCup = cupStarts ? rng.int(70, 90) : rng.int(20, 45)
    }
  }

  return {
    minutesLeague,
    minutesCup,
    starts,
    subApps,
    apps,
    cupApps,
    cupStarts,
    targetRatio: ratio,
  }
}

/** Step 2 — 팀 블록 (플레이어 리그 상세 · 타 리그 요약) */
function resolveTeamBlock(
  save: CareerSave,
  rng: Rng,
  minutesLeague: number,
  cupPlayed: boolean,
): TeamQuarterBlock {
  const L = LEAGUE_MATCHES_PER_QUARTER
  const tier = save.playingClub.tier
  const base = TEAM_FORM.byTier[tier]
  const ovrBoost = Math.max(0, save.player.ovr - 65) * TEAM_FORM.playerOvrBoostPerPoint
  const minutesBoost = Math.min(
    TEAM_FORM.minutesContributionCap,
    (minutesLeague / (L * 90)) * TEAM_FORM.minutesContributionCap,
  )
  let winP = clamp(base.win + ovrBoost + minutesBoost * 0.5, 0.12, 0.62)
  let drawP = clamp(base.draw, 0.15, 0.4)

  let wins = 0
  let draws = 0
  let losses = 0
  let gf = 0
  let ga = 0
  for (let i = 0; i < L; i++) {
    const r = rng.next()
    let result: 'W' | 'D' | 'L'
    if (r < winP) result = 'W'
    else if (r < winP + drawP) result = 'D'
    else result = 'L'
    const scored = poisson(rng, result === 'W' ? 1.8 : result === 'D' ? 1.1 : 0.7)
    const conceded = poisson(rng, result === 'W' ? 0.7 : result === 'D' ? 1.1 : 1.9)
    gf += scored
    ga += conceded
    if (result === 'W') wins++
    else if (result === 'D') draws++
    else losses++
  }

  const pointsAdd = wins * 3 + draws
  const nextPlayed = save.leagueTable.played + L
  const nextPts = save.leagueTable.points + pointsAdd
  // rough rank from pts/game among ~10 tier clubs → scale to 1–20 feel
  const ppg = nextPts / Math.max(1, nextPlayed)
  const rankAfter = clamp(Math.round(21 - ppg * 12), 1, 20)

  let cupRoundAfter: CupRoundStatus = save.cupRound
  let cupWon = false
  if (cupPlayed) {
    const advance = rng.chance(0.55 + minutesBoost)
    if (save.cupRound === 'not_entered' || save.cupRound === 'round_of_64') {
      cupRoundAfter = advance ? 'round_of_32' : 'eliminated'
    } else if (save.cupRound === 'eliminated' || save.cupRound === 'winner') {
      cupRoundAfter = save.cupRound
    } else {
      const idx = CUP_ROUNDS.indexOf(
        save.cupRound as (typeof CUP_ROUNDS)[number],
      )
      if (idx >= 0) {
        if (!advance) cupRoundAfter = 'eliminated'
        else if (save.cupRound === 'final') {
          cupRoundAfter = 'winner'
          cupWon = true
        } else {
          cupRoundAfter = CUP_ROUNDS[Math.min(idx + 1, CUP_ROUNDS.length - 1)]!
        }
      }
    }
  }

  return {
    wins,
    draws,
    losses,
    goalsFor: gf,
    goalsAgainst: ga,
    rankAfter,
    cupRoundAfter,
    cupPlayed,
    cupWon,
    otherLeaguesNote:
      '타 리그(태양·운하·강철·세느)는 요약 롤만 — 플레이어 리그(북섬)만 상세 WDL.',
  }
}

function goalLambda(
  save: CareerSave,
  minutes: number,
): { goals: number; assists: number } {
  if (minutes <= 0) return { goals: 0, assists: 0 }
  const pos = save.player.position
  const attrs = save.player.attrs
  const per90 =
    pos === 'FW'
      ? SCORING.fwGoalPer90
      : pos === 'MF'
        ? SCORING.mfGoalPer90
        : pos === 'DF'
          ? SCORING.dfGoalPer90
          : SCORING.gkGoalPer90
  const assist90 =
    pos === 'FW'
      ? SCORING.fwAssistPer90
      : pos === 'MF'
        ? SCORING.mfAssistPer90
        : pos === 'DF'
          ? SCORING.dfAssistPer90
          : 0

  let gMult = 1 + (attrs.finishing - 60) * 0.01 + (attrs.positioning - 60) * 0.008
  let aMult = 1 + (attrs.passing - 60) * 0.008 + (attrs.vision - 60) * 0.01
  if (save.player.style === '포처') gMult *= SCORING.stylePoacherGoalMult
  if (save.player.style === '타겟') gMult *= SCORING.styleTargetGoalMult
  if (save.player.style === '플레이메이커') aMult *= SCORING.stylePlaymakerAssistMult
  if (save.player.style === '박스투박스') aMult *= SCORING.styleBoxToBoxAssistMult
  gMult *= 1 - (save.playingClub.tier - 1) * SCORING.tierPressureOnGoals

  const gLam = (minutes / 90) * per90 * gMult * (1 + save.form * 0.05)
  const aLam = (minutes / 90) * assist90 * aMult * (1 + save.form * 0.03)
  return { goals: gLam, assists: aLam }
}

/** Step 3–4 — 개인 스탯·평점·하이라이트 */
function resolvePlayerStats(
  save: CareerSave,
  rng: Rng,
  minutes: ReturnType<typeof resolveMinutes>,
  injuredGate: boolean,
): QuarterPlayerStats {
  const league = emptyComp()
  const cup = emptyComp()

  league.minutes = minutes.minutesLeague
  league.apps = minutes.apps
  league.starts = minutes.starts
  cup.minutes = minutes.minutesCup
  cup.apps = minutes.cupApps
  cup.starts = minutes.cupStarts

  if (!injuredGate && minutes.minutesLeague + minutes.minutesCup > 0) {
    const lg = goalLambda(save, minutes.minutesLeague)
    const cg = goalLambda(save, minutes.minutesCup)
    league.goals = poisson(rng, lg.goals)
    league.assists = poisson(rng, lg.assists)
    cup.goals = poisson(rng, cg.goals)
    cup.assists = poisson(rng, cg.assists)

    if (rng.chance(0.08)) league.yellow = 1
    if (rng.chance(0.01)) league.red = 1

    if (save.player.position === 'GK' || save.player.position === 'DF') {
      const csChance = 0.22 + (save.player.attrs.marking - 60) * 0.005
      league.cleanSheets = [...Array(league.apps)].filter(() => rng.chance(csChance)).length
      if (save.player.position === 'GK') {
        league.goalsAgainst = Math.max(
          0,
          poisson(rng, (league.minutes / 90) * 1.1) - league.cleanSheets,
        )
      }
    }
  }

  const apps = league.apps + cup.apps
  const starts = league.starts + cup.starts
  const totalMin = league.minutes + cup.minutes
  const goals = league.goals + cup.goals
  const assists = league.assists + cup.assists

  // rating
  let rating = 6.4
  rating += (goals + assists * 0.7) * 0.25
  rating += save.form * 0.15
  rating += (save.player.ovr - 68) * 0.02
  if (apps === 0) rating = 6.0
  rating += rng.float(-0.35, 0.35)
  rating = clamp(
    Math.round(rating * 10) / 10,
    RATING_CLAMP.min,
    RATING_CLAMP.max,
  )

  const highlights: string[] = []
  if (goals >= 1 && save.careerGoals === 0) {
    highlights.push('첫 골 — 교체 투입 장면')
  } else if (goals >= 2) {
    highlights.push(`멀티골 — 이번 분기 ${goals}골`)
  } else if (goals === 1) {
    highlights.push('골 — 분기 하이라이트')
  }
  if (rating >= 7.5 && highlights.length < 2) {
    highlights.push(`고평점 경기 흐름 (평균 ${rating.toFixed(1)})`)
  }
  if (cup.goals >= 1 && highlights.length < 2) {
    highlights.push(`컵 골 — ${save.playingClub.cup}`)
  }

  const stats: QuarterPlayerStats = {
    league,
    cup,
    apps,
    starts,
    minutes: totalMin,
    goals,
    assists,
    avgRating: rating,
    yellow: league.yellow + cup.yellow,
    red: league.red + cup.red,
    highlights,
    essayLine: '',
  }
  stats.essayLine = pickEssayLine(save.player.position, stats, injuredGate)
  return stats
}

/** Step 5 — 성장·피트니스·폼·부상 */
function applyGrowth(
  save: CareerSave,
  rng: Rng,
  focus: TrainingFocus,
  stats: QuarterPlayerStats,
  injuredGate: boolean,
): {
  attrs: PlayerAttrs
  ovr: number
  fitness: number
  form: number
  morale: number
  injury: CareerSave['injury']
  newInjuryEvent: GameEvent | null
  recoveredEvent: GameEvent | null
} {
  const attrs = { ...save.player.attrs }
  let fitness = save.fitness
  let form = save.form
  let morale = save.morale
  let injury = save.injury
  let newInjuryEvent: GameEvent | null = null
  let recoveredEvent: GameEvent | null = null

  const ageMult =
    save.player.age >= GROWTH.ageHardCap
      ? GROWTH.ageHardMult
      : save.player.age >= GROWTH.ageSoftCap
        ? GROWTH.ageSoftMult
        : 1

  const trainTarget = TRAINING_ATTR[focus]
  if (trainTarget === 'rehab') {
    fitness = clamp(fitness + 8, 0, 100)
    if (injury.type !== 'none') {
      injury = {
        ...injury,
        quartersLeft: Math.max(0, injury.quartersLeft - INJURY.rehabRecoveryBonus),
      }
    }
  } else {
    const delta = GROWTH.trainingDelta * ageMult
    attrs[trainTarget] = clamp(attrs[trainTarget] + delta, 30, 95)
    fitness = clamp(fitness - GROWTH.fitnessCostTraining, 0, 100)
  }

  if (!injuredGate && stats.minutes > 0) {
    const playKeys =
      save.player.position === 'FW'
        ? (['finishing', 'positioning'] as const)
        : save.player.position === 'MF'
          ? (['passing', 'stamina'] as const)
          : save.player.position === 'DF'
            ? (['tackling', 'marking'] as const)
            : (['shotStopping', 'command'] as const)
    for (const k of playKeys) {
      attrs[k] = clamp(attrs[k] + GROWTH.playingDelta * ageMult, 30, 95)
    }
    fitness = clamp(
      fitness - stats.minutes * GROWTH.fitnessCostPlaying,
      0,
      100,
    )
  } else if (injuredGate) {
    fitness = clamp(fitness + GROWTH.fitnessRecoverIdle, 0, 100)
  }

  // form from rating
  if (stats.apps === 0) form = clamp(form - 1, -2, 2)
  else if (stats.avgRating >= 7.2) form = clamp(form + 1, -2, 2)
  else if (stats.avgRating <= 6.0) form = clamp(form - 1, -2, 2)

  if (stats.apps === 0 && save.role !== 'unused') morale = clamp(morale - 6, 0, 100)
  else if (stats.avgRating >= 7) morale = clamp(morale + 4, 0, 100)

  // injury countdown / new injury
  if (injury.type !== 'none') {
    const left = injury.quartersLeft - 1
    if (left <= 0) {
      injury = { type: 'none' }
      recoveredEvent = {
        type: 'INJURY_RECOVERED',
        ...injuryRecoveredCopy(),
      }
    } else {
      injury = { ...injury, quartersLeft: left }
    }
  } else if (!injuredGate) {
    const maxMin = LEAGUE_MATCHES_PER_QUARTER * 90
    let p = INJURY.baseChance
    if (fitness < 55) p += INJURY.lowFitnessBonus
    if (stats.minutes > maxMin * 0.85) p += INJURY.highMinutesBonus
    if (rng.chance(p)) {
      const quartersLeft = INJURY.defaultQuarters + (rng.chance(0.3) ? 1 : 0)
      const type = rng.pick(['muscle', 'knock', 'sprain'] as const)
      injury = { type, quartersLeft }
      newInjuryEvent = {
        type: 'INJURY',
        injuryType: type,
        quartersLeft,
        ...injuryCopy(quartersLeft),
      }
    }
  }

  const ovr = recomputeOvr(save.player.position, attrs)
  return {
    attrs,
    ovr,
    fitness: Math.round(fitness),
    form,
    morale: Math.round(morale),
    injury,
    newInjuryEvent,
    recoveredEvent,
  }
}

/** Step 6 — 이벤트 큐 */
function buildEventQueue(
  save: CareerSave,
  rng: Rng,
  minutes: ReturnType<typeof resolveMinutes>,
  stats: QuarterPlayerStats,
  growth: ReturnType<typeof applyGrowth>,
): GameEvent[] {
  const events: GameEvent[] = []
  if (growth.newInjuryEvent) events.push(growth.newInjuryEvent)
  if (growth.recoveredEvent) events.push(growth.recoveredEvent)

  const band = ROLE_MINUTE_BANDS[save.role]
  const mid = (band.min + band.max) / 2
  const rolePressure = Math.abs(minutes.targetRatio - mid) >= EVENT_RATES.rolePressureThreshold

  if (
    !growth.newInjuryEvent &&
    (rolePressure || rng.chance(EVENT_RATES.roleOfferBase * 0.5)) &&
    save.role !== 'key'
  ) {
    const toRole: Role =
      save.role === 'unused'
        ? 'rotation'
        : save.role === 'rotation'
          ? 'starter'
          : stats.avgRating < 6.2
            ? 'rotation'
            : 'key'
    if (toRole !== save.role && rng.chance(EVENT_RATES.roleOfferBase)) {
      events.push({
        type: 'ROLE_OFFER',
        fromRole: save.role,
        toRole,
        ...roleOfferCopy(save.role, toRole),
      })
    }
  }

  const winter = save.quarterIndex === 3
  const summerish = save.quarterIndex === 1 || save.quarterIndex === 4
  const windowOpen = winter || summerish
  const lowMinutes = minutes.targetRatio < 0.4 && save.role !== 'unused'

  if (
    windowOpen &&
    lowMinutes &&
    !save.onLoan &&
    rng.chance(EVENT_RATES.loanWhenLowMinutes) &&
    events.length < EVENT_RATES.maxQueueLength
  ) {
    events.push({
      type: 'LOAN_OFFER',
      fromClub: save.parentClub.name,
      toClub: '밀브룩 유나이티드',
      toClubId: 'milbrook-united',
      tier: 2,
      years: 0,
      wageDelta: '±0',
      promisedRole: 'starter',
      competitionNote: '출전을 위해 한 계단 내려가는 선택입니다.',
      ...loanOfferCopy(save.parentClub.name, '밀브룩 유나이티드', 2, 'starter'),
    })
  }

  if (
    windowOpen &&
    stats.avgRating >= 7.0 &&
    save.player.ovr >= 70 &&
    rng.chance(EVENT_RATES.transferWindowBase) &&
    events.length < EVENT_RATES.maxQueueLength
  ) {
    events.push({
      type: 'TRANSFER_OFFER',
      fromClub: save.parentClub.name,
      toClub: '세인트 하버 시티',
      toClubId: 'saint-harbour-city',
      tier: 1,
      years: 3,
      wageDelta: '+소폭',
      promisedRole: 'rotation',
      competitionNote: '주전 경쟁은 치열합니다.',
      ...transferOfferCopy(
        save.parentClub.name,
        '세인트 하버 시티',
        1,
        3,
        'rotation',
      ),
    })
  }

  events.sort(
    (a, b) => EVENT_SORT_ORDER[a.type] - EVENT_SORT_ORDER[b.type],
  )
  return events.slice(0, EVENT_RATES.maxQueueLength)
}

function accumulateSeason(
  prev: CareerSave['seasonAccum'],
  stats: QuarterPlayerStats,
): CareerSave['seasonAccum'] {
  const add = (a: CompetitionStats, b: CompetitionStats): CompetitionStats => ({
    apps: a.apps + b.apps,
    starts: a.starts + b.starts,
    minutes: a.minutes + b.minutes,
    goals: a.goals + b.goals,
    assists: a.assists + b.assists,
    yellow: a.yellow + b.yellow,
    red: a.red + b.red,
    cleanSheets: (a.cleanSheets ?? 0) + (b.cleanSheets ?? 0),
    goalsAgainst: (a.goalsAgainst ?? 0) + (b.goalsAgainst ?? 0),
  })
  return {
    apps: prev.apps + stats.apps,
    starts: prev.starts + stats.starts,
    minutes: prev.minutes + stats.minutes,
    goals: prev.goals + stats.goals,
    assists: prev.assists + stats.assists,
    ratingSum: prev.ratingSum + stats.avgRating,
    ratingCount: prev.ratingCount + (stats.apps > 0 ? 1 : 0),
    league: add(prev.league, stats.league),
    cup: add(prev.cup, stats.cup),
    highlights: [...prev.highlights, ...stats.highlights].slice(0, 8),
  }
}

/**
 * 분기 해상 파이프라인 — 순서 고정 (rules §2)
 * 0 gate → 1 minutes → 2 team → 3–4 stats → 5 growth → 6 events → 7 commit
 */
export function resolveQuarter(
  save: CareerSave,
  prep: QuarterPrep,
): ResolveQuarterResult {
  const seed = hashSeed([
    save.careerSeed,
    save.seasonYear,
    save.quarterIndex,
    prep.trainingFocus,
  ])
  const rng = createRng(seed)

  // Step 0 — gate
  const injuredGate = save.injury.type !== 'none' && save.injury.quartersLeft > 0

  // Step 1
  const minutes = resolveMinutes(save, rng, injuredGate)

  // Step 2
  const team = resolveTeamBlock(
    save,
    rng,
    minutes.minutesLeague,
    minutes.cupApps > 0 ||
      (save.cupRound !== 'eliminated' && save.cupRound !== 'winner'),
  )

  // Steps 3–4
  const stats = resolvePlayerStats(save, rng, minutes, injuredGate)

  // Step 5
  const growth = applyGrowth(save, rng, prep.trainingFocus, stats, injuredGate)

  // Step 6
  const events = buildEventQueue(save, rng, minutes, stats, growth)

  const summaryLine = formatQuarterSummary(
    save.quarterIndex,
    stats,
    team,
    save.playingClub.cup,
  )

  const nextTable = {
    played: save.leagueTable.played + LEAGUE_MATCHES_PER_QUARTER,
    wins: save.leagueTable.wins + team.wins,
    draws: save.leagueTable.draws + team.draws,
    losses: save.leagueTable.losses + team.losses,
    goalsFor: save.leagueTable.goalsFor + team.goalsFor,
    goalsAgainst: save.leagueTable.goalsAgainst + team.goalsAgainst,
    points: save.leagueTable.points + team.wins * 3 + team.draws,
    rank: team.rankAfter,
  }

  // Step 7 — commit (quarterIndex는 이벤트 큐 종료 시 진행)
  const nextSave: CareerSave = {
    ...save,
    player: {
      ...save.player,
      attrs: growth.attrs,
      ovr: growth.ovr,
    },
    fitness: growth.fitness,
    form: growth.form,
    morale: growth.morale,
    injury: growth.injury,
    cupRound: team.cupRoundAfter,
    leagueTable: nextTable,
    seasonAccum: accumulateSeason(save.seasonAccum, stats),
    lastQuarterSummary: summaryLine,
    lastQuarterResult: stats,
    lastTeamBlock: team,
    pendingEvents: events,
    careerApps: save.careerApps + stats.apps,
    careerGoals: save.careerGoals + stats.goals,
    careerAssists: save.careerAssists + stats.assists,
    savedAt: new Date().toISOString(),
  }

  return { nextSave, stats, team, events, summaryLine }
}

/** 테스트·디버그용: 성장 라벨 */
export function trainingFocusLabel(focus: TrainingFocus): string {
  const t = TRAINING_ATTR[focus]
  return t === 'rehab' ? '재활·컨디션' : ATTR_LABEL_KO[t]
}
