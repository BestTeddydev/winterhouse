import { bangkokDateKey, bangkokDayRange } from '@/lib/dates'
import Booking from '@/models/Booking'
import Payment from '@/models/Payment'
import type { OwnerDashboardQuery } from '../schemas/dashboard'
import { populateForDisplay, toBookingResponse } from './bookings'

export interface DashboardStats {
  totalBookings: number
  pendingBookings: number
  confirmedBookings: number
  completedBookings: number
  cancelledBookings: number
  totalRevenue: number
  monthlyRevenue: number
  todayRevenue: number
}

type LightBooking = { _id: string; status: string; totalPrice?: number; createdAt: Date; paymentId?: string }

/** Counts per status and revenue: bookings that are confirmed or paid, by the Thai date they were made */
export function dashboardStats(bookings: LightBooking[], paidPaymentIds: Set<string>, now = new Date()): DashboardStats {
  const count = (status: string) => bookings.filter((b) => b.status === status).length
  const earning = bookings.filter((b) => b.status === 'CONFIRMED' || (b.paymentId && paidPaymentIds.has(String(b.paymentId))))
  const today = bangkokDateKey(now)
  const sum = (list: LightBooking[]) => list.reduce((total, b) => total + (b.totalPrice || 0), 0)
  const madeOn = (b: LightBooking) => bangkokDateKey(new Date(b.createdAt))

  return {
    totalBookings: bookings.length,
    pendingBookings: count('PENDING'),
    confirmedBookings: count('CONFIRMED'),
    completedBookings: count('COMPLETED'),
    cancelledBookings: count('CANCELLED'),
    totalRevenue: sum(earning),
    monthlyRevenue: sum(earning.filter((b) => madeOn(b).slice(0, 7) === today.slice(0, 7))),
    todayRevenue: sum(earning.filter((b) => madeOn(b) === today)),
  }
}

const onDay = (field: string, day: { start: Date; end: Date }) => ({ [field]: { $gte: day.start, $lt: day.end } })
const display = async (query: Record<string, unknown>, sort: Record<string, 1 | -1>) =>
  ((await populateForDisplay(Booking.find(query).sort(sort))) as any[]).map(toBookingResponse)

/** Owner overview: overall stats plus the check-ins, check-outs and bookings of one Thai day */
export async function ownerDashboard({ date, by }: OwnerDashboardQuery) {
  const day = bangkokDayRange(date)
  const [light, paid, checkIns, checkOuts, bookings] = await Promise.all([
    Booking.find({}).select('status totalPrice createdAt paymentId').lean().exec() as Promise<LightBooking[]>,
    Payment.find({ status: 'COMPLETED' }).select('_id').lean().exec() as Promise<Array<{ _id: string }>>,
    display(onDay('checkIn', day), { checkIn: 1 }),
    display(onDay('checkOut', day), { checkOut: 1 }),
    display(onDay(by, day), { [by]: -1 }),
  ])
  const active = (b: any) => b.status !== 'CANCELLED'

  return {
    date,
    by,
    stats: dashboardStats(light, new Set(paid.map((p) => p._id))),
    checkIns: checkIns.filter(active),
    checkOuts: checkOuts.filter(active),
    bookings,
  }
}
