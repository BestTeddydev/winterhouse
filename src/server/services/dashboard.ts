import { bangkokDateKey, bangkokDayRange } from '@/lib/dates'
import AddOn from '@/models/AddOn'
import Booking from '@/models/Booking'
import EmployeeAttendance from '@/models/EmployeeAttendance'
import Room from '@/models/Room'
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

/** Active bookings that overlap today and the next `days` Thai days, by check-in */
export async function upcomingBookings(days = 7) {
  const start = bangkokDayRange(bangkokDateKey()).start
  const end = new Date(start.getTime() + (days + 1) * 24 * 60 * 60 * 1000)
  // One range filter per query in Firestore: check-out here, check-in in memory
  const candidates = (await Booking.find({ checkOut: { $gte: start } }).select('_id checkIn status').lean().exec()) as Array<{
    _id: string
    checkIn: Date
    status: string
  }>
  const ids = candidates.filter((b) => b.status !== 'CANCELLED' && new Date(b.checkIn) < end).map((b) => b._id)
  return ids.length ? display({ _id: { $in: ids } }, { checkIn: 1 }) : []
}

/** Admin home: overall booking stats, today's movements and counts for the menu cards */
export async function adminDashboard() {
  const today = bangkokDateKey()
  const day = bangkokDayRange(today)
  const [owner, stayingCandidates, rooms, activeRooms, addOns, activeAddOns, pendingAttendance, todayAttendance] = await Promise.all([
    ownerDashboard({ date: today, by: 'createdAt' }),
    Booking.find({ checkOut: { $gte: day.start } }).select('_id checkIn status').lean().exec() as Promise<
      Array<{ _id: string; checkIn: Date; status: string }>
    >,
    Room.countDocuments({}),
    Room.countDocuments({ isActive: true }),
    AddOn.countDocuments({}),
    AddOn.countDocuments({ isActive: true }),
    EmployeeAttendance.countDocuments({ status: 'PENDING' }),
    EmployeeAttendance.find({ checkInDate: { $gte: day.start, $lt: day.end } }).select('status').lean().exec() as Promise<Array<{ status: string }>>,
  ])

  return {
    stats: owner.stats,
    today: {
      created: owner.bookings,
      checkIns: owner.checkIns,
      checkOuts: owner.checkOuts,
      // In the house today: arrived before the day ends, leaving today or later
      staying: stayingCandidates.filter((b) => b.status !== 'CANCELLED' && new Date(b.checkIn) < day.end).length,
    },
    rooms: { total: rooms, active: activeRooms },
    addOns: { total: addOns, active: activeAddOns },
    attendance: {
      pending: pendingAttendance,
      today: todayAttendance.length,
      approvedToday: todayAttendance.filter((a) => a.status === 'APPROVED').length,
    },
  }
}
