import { describe, expect, it } from 'vitest'
import { addDays, buildMonthGrid, nightsBetween, toKey } from './calendar'

describe('calendar helpers', () => {
  it('adds days across month and year ends', () => {
    expect(addDays('2030-01-31', 1)).toBe('2030-02-01')
    expect(addDays('2030-12-31', 1)).toBe('2031-01-01')
  })

  it('counts nights between two dates', () => {
    expect(nightsBetween('2030-01-10', '2030-01-13')).toBe(3)
  })

  it('builds full weeks starting on Sunday', () => {
    // October 2026 starts on a Thursday and has 31 days
    const cells = buildMonthGrid(new Date(2026, 9, 1))
    expect(cells.length % 7).toBe(0)
    expect(cells.slice(0, 4)).toEqual([null, null, null, null])
    expect(toKey(cells[4]!)).toBe('2026-10-01')
    expect(cells.filter(Boolean)).toHaveLength(31)
  })
})
