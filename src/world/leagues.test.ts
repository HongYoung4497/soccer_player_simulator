import { describe, expect, it } from 'vitest'
import {
  CUP_NAMES,
  DEFAULT_CUP,
  DEFAULT_LEAGUE,
  LEAGUE_NAMES,
  PREFERRED_LEAGUES,
  cupForLeague,
  normalizePreferredLeague,
  otherLeaguesSummaryNote,
} from './leagues'

describe('persona leagues & cups (locked terminology)', () => {
  it('exposes five locked league names', () => {
    expect(PREFERRED_LEAGUES).toEqual([
      '라 프리메라',
      '세리에 프리마',
      '분트 리가',
      '리그 앙',
      '북섬 프리미어',
    ])
    expect(LEAGUE_NAMES.ES).toBe('라 프리메라')
    expect(LEAGUE_NAMES.IT).toBe('세리에 프리마')
    expect(LEAGUE_NAMES.DE).toBe('분트 리가')
    expect(LEAGUE_NAMES.FR).toBe('리그 앙')
    expect(LEAGUE_NAMES.EN).toBe('북섬 프리미어')
  })

  it('maps each league to its locked domestic cup', () => {
    expect(cupForLeague(LEAGUE_NAMES.ES)).toBe('코파 레알')
    expect(cupForLeague(LEAGUE_NAMES.IT)).toBe('코파 이탈')
    expect(cupForLeague(LEAGUE_NAMES.DE)).toBe('분트 포칼')
    expect(cupForLeague(LEAGUE_NAMES.FR)).toBe('쿠프 갈리')
    expect(cupForLeague(LEAGUE_NAMES.EN)).toBe('왕실 방패')
    expect(DEFAULT_CUP).toBe(CUP_NAMES.EN)
    expect(DEFAULT_LEAGUE).toBe(LEAGUE_NAMES.EN)
  })

  it('migrates legacy preferred-league aliases', () => {
    expect(normalizePreferredLeague('태양 리그')).toBe(LEAGUE_NAMES.ES)
    expect(normalizePreferredLeague('운하 세리에')).toBe(LEAGUE_NAMES.IT)
    expect(normalizePreferredLeague('강철 분데스')).toBe(LEAGUE_NAMES.DE)
    expect(normalizePreferredLeague('세느 리그')).toBe(LEAGUE_NAMES.FR)
    expect(normalizePreferredLeague('북섬 프리미어')).toBe(LEAGUE_NAMES.EN)
    expect(normalizePreferredLeague('라 프리메라')).toBe(LEAGUE_NAMES.ES)
    expect(normalizePreferredLeague('unknown')).toBeNull()
  })

  it('builds other-leagues note without legacy nicknames', () => {
    const note = otherLeaguesSummaryNote(DEFAULT_LEAGUE)
    expect(note).toContain('라 프리메라')
    expect(note).toContain('세리에 프리마')
    expect(note).toContain('분트 리가')
    expect(note).toContain('리그 앙')
    expect(note).toContain('북섬 프리미어')
    expect(note).not.toMatch(/태양|운하|강철|세느/)
  })
})
