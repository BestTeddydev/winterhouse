import { describe, expect, it } from 'vitest'
import { bangkokDateKey, bangkokDayRange, bangkokDayStart } from './dates'

describe('Thai business dates', () => {
  it('uses the Thai date even when it is still the previous day in UTC', () => {
    // 2030-01-10 02:00 in Bangkok = 2030-01-09 19:00 UTC
    const instant = new Date('2030-01-09T19:00:00Z')
    expect(bangkokDateKey(instant)).toBe('2030-01-10')
    expect(bangkokDayStart(instant).toISOString()).toBe('2030-01-09T17:00:00.000Z')
  })

  it('gives a 24h range for a day key', () => {
    const { start, end } = bangkokDayRange('2030-01-10')
    expect(start.toISOString()).toBe('2030-01-09T17:00:00.000Z')
    expect(end.toISOString()).toBe('2030-01-10T17:00:00.000Z')
  })
})
