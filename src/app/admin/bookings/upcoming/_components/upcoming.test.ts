import { describe, expect, it } from 'vitest'
import { activityOf, groupByDay, todaysMoves } from './upcoming'

// Bangkok is UTC+7: 2030-01-10T17:00Z is already 2030-01-11 in Thailand
const at = (iso: string) => ({ checkIn: iso.split('|')[0], checkOut: iso.split('|')[1] })
const today = '2030-01-10'

describe('upcoming bookings', () => {
  it('tells what happens today in Thai time', () => {
    expect(activityOf(at('2030-01-09T17:00:00Z|2030-01-12T05:00:00Z'), today)).toBe('checkin')
    expect(activityOf(at('2030-01-07T07:00:00Z|2030-01-10T04:00:00Z'), today)).toBe('checkout')
    expect(activityOf(at('2030-01-08T07:00:00Z|2030-01-12T04:00:00Z'), today)).toBe('staying')
    expect(activityOf(at('2030-01-10T17:00:00Z|2030-01-12T04:00:00Z'), today)).toBe('upcoming')
  })

  it('groups current stays under today and the rest by check-in day', () => {
    const staying = at('2030-01-08T07:00:00Z|2030-01-12T04:00:00Z')
    const later = at('2030-01-12T07:00:00Z|2030-01-13T04:00:00Z')
    const tomorrow = at('2030-01-10T17:00:00Z|2030-01-12T04:00:00Z')
    expect(groupByDay([later, staying, tomorrow], today)).toEqual([
      ['2030-01-10', [staying]],
      ['2030-01-11', [tomorrow]],
      ['2030-01-12', [later]],
    ])
    expect(todaysMoves([staying, tomorrow], today)).toEqual({ checkIns: [], checkOuts: [] })
  })
})
