// What the rooms page asks to book, read from the URL of /bookings/new

export interface BookingRequest {
  roomIds: string[]
  /** `guests` is missing when the URL doesn't say; the block's minimum is used then */
  campingBlocks: Array<{ id: string; guests?: number }>
  checkIn: string
  checkOut: string
  /** The guest's unpaid booking this selection is added to (it already includes that booking's rooms) */
  addTo?: string
}

const DATE = /^\d{4}-\d{2}-\d{2}$/
const OBJECT_ID = /^[0-9a-f]{24}$/i
const list = (value: string | null) => (value ? value.split(',').map((v) => v.trim()).filter((v) => v && v !== 'null') : [])
const count = (value: string | undefined | null) => {
  const n = parseInt(value ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

/**
 * Accepts `roomId` or `roomIds=a,b`, `campingBlockId` (+`guestCount`) or `campingBlockIds=a,b` (+`guestCounts=2,3`),
 * `checkIn` and `checkOut`. Returns the reason when the request can't be booked.
 */
/** The booking form URL query of a request (what parseBookingRequest reads) */
export function bookingQuery(request: BookingRequest): string {
  const params = new URLSearchParams({ checkIn: request.checkIn, checkOut: request.checkOut })
  if (request.roomIds.length) params.set('roomIds', request.roomIds.join(','))
  if (request.campingBlocks.length) {
    params.set('campingBlockIds', request.campingBlocks.map((c) => c.id).join(','))
    params.set('guestCounts', request.campingBlocks.map((c) => c.guests ?? '').join(','))
  }
  if (request.addTo) params.set('addTo', request.addTo)
  return params.toString()
}

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
  const addTo = params.get('addTo') ?? ''
  return { request: { roomIds, campingBlocks, checkIn, checkOut, ...(OBJECT_ID.test(addTo) && { addTo }) } }
}
