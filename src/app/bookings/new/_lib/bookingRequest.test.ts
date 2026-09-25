import { describe, expect, it } from 'vitest'
import { parseBookingRequest } from './bookingRequest'

const parse = (query: string) => parseBookingRequest(new URLSearchParams(query))
const dates = 'checkIn=2030-01-07&checkOut=2030-01-09'

describe('parseBookingRequest', () => {
  it('reads single and multiple rooms', () => {
    expect(parse(`roomId=a&${dates}`)).toEqual({
      request: { roomIds: ['a'], campingBlocks: [], checkIn: '2030-01-07', checkOut: '2030-01-09' },
    })
    expect(parse(`roomIds=a,b&roomId=c&${dates}`)).toMatchObject({ request: { roomIds: ['a', 'b'] } })
  })

  it('reads camping blocks with their guests, ignoring invalid counts', () => {
    expect(parse(`campingBlockId=c1&guestCount=3&${dates}`)).toMatchObject({ request: { campingBlocks: [{ id: 'c1', guests: 3 }] } })
    expect(parse(`campingBlockIds=c1,c2&guestCounts=2,abc&${dates}`)).toMatchObject({
      request: { campingBlocks: [{ id: 'c1', guests: 2 }, { id: 'c2', guests: undefined }] },
    })
  })

  it('rejects requests without something to book or valid dates', () => {
    expect(parse(dates)).toHaveProperty('error')
    expect(parse('roomId=null&' + dates)).toHaveProperty('error')
    expect(parse('roomId=a&checkIn=2030-01-09&checkOut=2030-01-09')).toHaveProperty('error')
    expect(parse('roomId=a&checkIn=tomorrow&checkOut=2030-01-09')).toHaveProperty('error')
  })
})
