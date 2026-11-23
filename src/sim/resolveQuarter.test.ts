import { describe, expect, it } from 'vitest'
import { createInitialSave } from '../storage'
import type { CareerSave } from '../types'
import { DEFAULT_LEAGUE, LEAGUE_NAMES } from '../world'
import { resolveQuarter } from './resolveQuarter'
import { wrapSeason } from './wrapSeason'

function baseSave(overrides: Partial<CareerSave> = {}): CareerSave {
  const save = createInitialSave(
    {
      name: '서하준',
      shirtNumber: 19,
      preferredFoot: '오른발',
      position: 'FW',
      style: '포처',
      preferredLeague: DEFAULT_LEAGUE,
      ovr: 68,
    },
    'guest',
  )
  return {
    ...save,
    careerSeed: 'test-seed-hajun',
    ...overrides,
    player: { ...save.player, ...(overrides.player ?? {}) },
  }
}

describe('resolveQuarter', () => {
  it('happy path: rotation FW gets minutes, stats, and advances commit fields', () => {
    const save = baseSave()
    const { nextSave, stats, team, summaryLine } = resolveQuarter(save, {
      trainingFocus: '결정력',
    })

    expect(stats.apps).toBeGreaterThan(0)
    expect(stats.minutes).toBeGreaterThan(0)
    expect(stats.avgRating).toBeGreaterThanOrEqual(5.5)
    expect(stats.avgRating).toBeLessThanOrEqual(8.5)
    expect(stats.league.apps + stats.cup.apps).toBe(stats.apps)
    expect(team.wins + team.draws + team.losses).toBe(9)
    expect(summaryLine).toContain('1분기')
    expect(team.otherLeaguesNote).toContain(LEAGUE_NAMES.ES)
    expect(team.otherLeaguesNote).toContain(DEFAULT_LEAGUE)
    expect(team.otherLeaguesNote).not.toMatch(/태양|운하|강철|세느/)
    expect(nextSave.lastQuarterResult).not.toBeNull()
    expect(nextSave.careerApps).toBe(save.careerApps + stats.apps)
    expect(nextSave.player.attrs.finishing).toBeGreaterThanOrEqual(
      save.player.attrs.finishing,
    )
    expect(nextSave.quarterIndex).toBe(1) // 큐 종료 시까지 분기 유지
    // 동일 시드 결정성
    const again = resolveQuarter(save, { trainingFocus: '결정력' })
    expect(again.stats.apps).toBe(stats.apps)
    expect(again.stats.goals).toBe(stats.goals)
    expect(again.summaryLine).toBe(summaryLine)
  })

  it('injury gate: active injury → 0 apps and INJURY_RECOVERED when healed', () => {
    const save = baseSave({
      injury: { type: 'muscle', quartersLeft: 1 },
      fitness: 50,
    })
    const { nextSave, stats, events } = resolveQuarter(save, {
      trainingFocus: '재활·컨디션',
    })

    expect(stats.apps).toBe(0)
    expect(stats.minutes).toBe(0)
    expect(stats.goals).toBe(0)
    expect(nextSave.injury.type).toBe('none')
    expect(events.some((e) => e.type === 'INJURY_RECOVERED')).toBe(true)
  })

  it('bench / unused role: very low minutes and optional ROLE_OFFER flag path', () => {
    const save = baseSave({
      role: 'unused',
      morale: 35,
      fitness: 70,
      careerSeed: 'bench-seed-01',
    })
    const { stats, events } = resolveQuarter(save, {
      trainingFocus: '멘탈',
    })

    // unused band 0–15% of 810 ≈ 0–121.5 → apps small
    expect(stats.minutes).toBeLessThanOrEqual(150)
    // 역할 제안이 뜰 수 있음 (벤치→로테이션) — 플래그 타입만 검증
    for (const e of events) {
      expect([
        'ROLE_OFFER',
        'LOAN_OFFER',
        'TRANSFER_OFFER',
        'INJURY',
        'INJURY_RECOVERED',
      ]).toContain(e.type)
    }
    const roleOffer = events.find((e) => e.type === 'ROLE_OFFER')
    if (roleOffer) {
      expect(roleOffer.fromRole).toBe('unused')
      expect(roleOffer.toRole).toBe('rotation')
    }
  })

  it('wrapSeason after Q4: age+1, history line, reset quarter', () => {
    let save = baseSave({ quarterIndex: 4, seasonYear: 2027 })
    const resolved = resolveQuarter(save, { trainingFocus: '지구력' })
    save = resolved.nextSave
    const { nextSave, summary } = wrapSeason(save)

    expect(summary.year).toBe(2027)
    expect(nextSave.seasonYear).toBe(2028)
    expect(nextSave.quarterIndex).toBe(1)
    expect(nextSave.player.age).toBe(save.player.age + 1)
    expect(nextSave.historyLines.some((l) => l.includes('2027'))).toBe(true)
    expect(nextSave.seasonAccum.apps).toBe(0)
  })

  it('excludes zero-appearance quarters from season rating average', () => {
    const played = baseSave({ careerSeed: 'rating-played' })
    const afterPlay = resolveQuarter(played, { trainingFocus: '결정력' })
    expect(afterPlay.nextSave.seasonAccum.ratingCount).toBe(1)
    expect(afterPlay.nextSave.seasonAccum.ratingSum).toBe(
      afterPlay.stats.avgRating,
    )

    const injured = {
      ...afterPlay.nextSave,
      injury: { type: 'muscle' as const, quartersLeft: 1 },
      careerSeed: 'rating-injured',
      quarterIndex: 2 as const,
    }
    const afterInjury = resolveQuarter(injured, { trainingFocus: '재활·컨디션' })
    expect(afterInjury.stats.apps).toBe(0)
    expect(afterInjury.nextSave.seasonAccum.ratingCount).toBe(1)
    expect(afterInjury.nextSave.seasonAccum.ratingSum).toBe(
      afterPlay.stats.avgRating,
    )
  })

  it('cup schedule can reach winner within four unbeaten quarters', () => {
    // 강제 전진: 높은 ovr·출전으로 승률 보너스 — 시드 탐색으로 무패 컵 런 확인
    let foundWinner = false
    for (let seed = 0; seed < 80 && !foundWinner; seed++) {
      let save = baseSave({
        careerSeed: `cup-run-${seed}`,
        role: 'key',
        fitness: 95,
        player: {
          ...baseSave().player,
          ovr: 82,
        },
      })
      let alive = true
      for (const q of [1, 2, 3, 4] as const) {
        save = { ...save, quarterIndex: q }
        const { nextSave, team } = resolveQuarter(save, {
          trainingFocus: '지구력',
        })
        save = nextSave
        if (team.cupRoundAfter === 'eliminated') {
          alive = false
          break
        }
        if (team.cupRoundAfter === 'winner') {
          foundWinner = true
          break
        }
      }
      if (alive && save.cupRound === 'winner') foundWinner = true
    }
    expect(foundWinner).toBe(true)
  })
})
