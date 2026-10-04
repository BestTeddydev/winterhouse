import { describe, expect, it } from 'vitest'
import { formatPeriod, matchPreset, periodDays, presetPeriod, shiftPeriod } from './period'

// Sunday 4 October 2026
const today = '2026-10-04'

describe('presetPeriod', () => {
  it('gives today, this week (Monday to Sunday), this and last month and the last 30 days', () => {
    expect(presetPeriod('today', today)).toEqual({ from: today, to: today })
    expect(presetPeriod('week', today)).toEqual({ from: '2026-09-28', to: '2026-10-04' })
    expect(presetPeriod('month', today)).toEqual({ from: '2026-10-01', to: '2026-10-31' })
    expect(presetPeriod('lastMonth', today)).toEqual({ from: '2026-09-01', to: '2026-09-30' })
    expect(presetPeriod('last30', today)).toEqual({ from: '2026-09-05', to: today })
  })

  it('handles February and the turn of the year', () => {
    expect(presetPeriod('month', '2028-02-10')).toEqual({ from: '2028-02-01', to: '2028-02-29' })
    expect(presetPeriod('lastMonth', '2027-01-15')).toEqual({ from: '2026-12-01', to: '2026-12-31' })
  })
})

describe('shiftPeriod', () => {
  it('moves by the length of the period', () => {
    expect(shiftPeriod({ from: today, to: today }, -1)).toEqual({ from: '2026-10-03', to: '2026-10-03' })
    expect(shiftPeriod({ from: '2026-09-28', to: '2026-10-04' }, 1)).toEqual({ from: '2026-10-05', to: '2026-10-11' })
  })

  it('moves a calendar month to the whole next or previous month', () => {
    expect(shiftPeriod({ from: '2026-10-01', to: '2026-10-31' }, -1)).toEqual({ from: '2026-09-01', to: '2026-09-30' })
    expect(shiftPeriod({ from: '2026-01-01', to: '2026-01-31' }, 1)).toEqual({ from: '2026-02-01', to: '2026-02-28' })
  })
})

describe('matchPreset / periodDays / formatPeriod', () => {
  it('recognises presets and counts days', () => {
    expect(matchPreset({ from: '2026-10-01', to: '2026-10-31' }, today)).toBe('month')
    expect(matchPreset({ from: '2026-10-02', to: '2026-10-03' }, today)).toBeNull()
    expect(periodDays({ from: '2026-10-01', to: '2026-10-31' })).toBe(31)
    expect(periodDays({ from: today, to: today })).toBe(1)
  })

  it('writes one day in full and a period as a range', () => {
    expect(formatPeriod({ from: today, to: today })).toContain('4 ตุลาคม 2569')
    expect(formatPeriod({ from: '2026-10-01', to: '2026-10-31' })).toBe('1 ต.ค. 2569 – 31 ต.ค. 2569')
  })
})
