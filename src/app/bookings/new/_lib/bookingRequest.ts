// What the rooms page asks to book, read from the URL of /bookings/new

export interface BookingRequest {
  roomIds: string[]
  /** `guests` is missing when the URL doesn't say; the block's minimum is used then */
  campingBlocks: Array<{ id: string; guests?: number }>
  checkIn: string
  checkOut: string
}

const DATE = /^\d{4}-\d{2}-\d{2}$/
const list = (value: string | null) => (value ? value.split(',').map((v) => v.trim()).filter((v) => v && v !== 'null') : [])
const count = (value: string | undefined | null) => {
  const n = parseInt(value ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

/**
 * Accepts `roomId` or `roomIds=a,b`, `campingBlockId` (+`guestCount`) or `campingBlockIds=a,b` (+`guestCounts=2,3`),
 * `checkIn` and `checkOut`. Returns the reason when the request can't be booked.
 */
export function parseBookingRequest(params: URLSearchParams): { request: BookingRequest } | { error: string } {
  const roomIds = list(params.get('roomIds'))
  if (!roomIds.length) roomIds.push(...list(params.get('roomId')))

  let campingBlocks: BookingRequest['campingBlocks'] = list(params.get('campingBlockIds')).map((id, i) => ({
    id,
    guests: count(list(params.get('guestCounts'))[i]),
  }))
  if (!campingBlocks.length) {
    campingBlocks = list(params.get('campingBlockId')).map((id) => ({ id, guests: count(params.get('guestCount')) }))
  }

  if (!roomIds.length && !campingBlocks.length) {
    return { error: 'ข้อมูลการจองไม่ครบถ้วน กรุณาเลือกห้องพักหรือบล็อคกางเต๊นท์ใหม่' }
  }
  const checkIn = params.get('checkIn') ?? ''
  const checkOut = params.get('checkOut') ?? ''
  if (!DATE.test(checkIn) || !DATE.test(checkOut) || checkOut <= checkIn) {
    return { error: 'ข้อมูลการจองไม่ครบถ้วน กรุณาเลือกวันที่เช็คอิน' }
  }
  return { request: { roomIds, campingBlocks, checkIn, checkOut } }
}
