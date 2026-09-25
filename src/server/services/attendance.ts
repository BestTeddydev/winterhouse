import type { Session } from 'next-auth'
import type { z } from 'zod'
import { bangkokDayRange } from '@/lib/dates'
import { sendLineNotification } from '@/lib/line'
import EmployeeAttendance from '@/models/EmployeeAttendance'
import User from '@/models/User'
import { findSessionUser, isStaff } from '../auth'
import { badRequest, forbidden, notFound } from '../errors'
import type { attendanceQuery, checkInSchema, checkOutSchema, reviewAttendanceSchema } from '../schemas/attendance'

/** Location value meaning "arrived for work" (only these can be checked out) */
const WORK_LOCATION = 'เข้างาน'

const timeTH = (date: Date) => new Date(date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' })
const dateTH = (date: Date) =>
  new Date(date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Asia/Bangkok' })

/** Attendance notifications go to LINE_ADMIN_USER_ID, or to the owners if it isn't set */
async function notifyManagers(message: string) {
  try {
    const admin = process.env.LINE_ADMIN_USER_ID
    const recipients = admin
      ? [admin]
      : (await User.find({ role: 'OWNER', lineUserId: { $exists: true, $ne: null } }).select('lineUserId').lean()).map(
          (u: { lineUserId: string }) => u.lineUserId
        )
    await Promise.allSettled(recipients.map((userId: string) => sendLineNotification({ userId, message })))
  } catch (error) {
    console.error('Error sending attendance notification:', error)
  }
}

async function currentEmployee(session: Session) {
  const employee = await findSessionUser(session)
  if (!employee) throw notFound('ไม่พบข้อมูลพนักงาน')
  if (employee.role !== 'EMPLOYEE') throw forbidden('เฉพาะพนักงานเท่านั้นที่สามารถเช็คอินได้')
  return employee
}

const todaysRecord = (employeeId: string) => {
  const { start, end } = bangkokDayRange()
  return EmployeeAttendance.findOne({ employeeId, checkInDate: { $gte: start, $lt: end } })
}

/** Employees see their own records; staff see everyone's (optionally one employee) */
export async function listAttendance(q: z.infer<typeof attendanceQuery>, session: Session) {
  const filter: Record<string, unknown> = {}
  if (session.user.role === 'EMPLOYEE') {
    const employee = await findSessionUser(session)
    if (!employee) throw notFound('ไม่พบข้อมูลพนักงาน')
    filter.employeeId = employee._id
  } else if (isStaff(session)) {
    if (q.employeeId) filter.employeeId = q.employeeId
  } else {
    throw forbidden('ไม่ได้รับอนุญาต')
  }
  if (q.status && q.status !== 'all') filter.status = q.status
  const from = q.date ?? q.dateFrom
  const to = q.date ?? q.dateTo
  if (from || to) {
    filter.checkInDate = {
      ...(from && { $gte: bangkokDayRange(from).start }),
      ...(to && { $lt: bangkokDayRange(to).end }),
    }
  }
  if (q.location && q.location !== 'all') filter.location = q.location
  if (q.search) {
    const pattern = new RegExp(q.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const employees = await User.find({ $or: [{ name: pattern }, { email: pattern }] }).select('_id').lean()
    filter.$or = [
      { employeeId: { $in: employees.map((e: { _id: string }) => e._id) } },
      { location: pattern },
      { notes: pattern },
    ]
  }

  const [total, attendance] = await Promise.all([
    EmployeeAttendance.countDocuments(filter),
    EmployeeAttendance.find(filter)
      .populate('employeeId', 'name email role')
      .populate('approvedBy', 'name email')
      .sort({ checkInDate: -1, checkInTime: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit),
  ])
  const totalPages = Math.ceil(total / q.limit)
  return {
    attendance,
    pagination: { page: q.page, limit: q.limit, total, totalPages, hasNextPage: q.page < totalPages, hasPrevPage: q.page > 1 },
  }
}

export async function checkIn(input: z.infer<typeof checkInSchema>, session: Session) {
  const employee = await currentEmployee(session)
  const existing = await todaysRecord(employee._id)
  if (existing) throw badRequest('คุณได้เช็คอินแล้ววันนี้', { attendance: existing })

  const now = new Date()
  const attendance = await EmployeeAttendance.create({
    employeeId: employee._id,
    checkInDate: bangkokDayRange(now).start,
    checkInTime: now,
    location: input.location,
    notes: input.notes,
    status: 'PENDING',
  })
  await attendance.populate('employeeId', 'name email')

  void notifyManagers(
    [
      '🔔 การเช็คอินพนักงานใหม่',
      '',
      `👤 พนักงาน: ${employee.name || employee.email || 'ไม่ระบุชื่อ'}`,
      `📅 วันที่: ${dateTH(now)}`,
      `🕐 เวลา: ${timeTH(now)}`,
      `📍 ประเภท: ${input.location || 'ไม่ระบุ'}`,
      input.notes ? `📝 หมายเหตุ: ${input.notes}` : '',
      '📊 สถานะ: รอการอนุมัติ',
      '',
      'กรุณาตรวจสอบและอนุมัติในระบบแอดมิน',
    ]
      .filter((line, i, all) => line || all[i - 1])
      .join('\n')
  )

  return { message: 'เช็คอินสำเร็จ รอการอนุมัติ', attendance }
}

export async function checkOut(input: z.infer<typeof checkOutSchema>, session: Session) {
  const employee = await currentEmployee(session)
  const attendance = await todaysRecord(employee._id)
  if (!attendance) throw notFound('ไม่พบการเช็คอินวันนี้')
  if (attendance.checkoutTime) throw badRequest('คุณได้เช็คเอาท์แล้ววันนี้', { attendance })
  if (attendance.status !== 'APPROVED') throw badRequest('กรุณารอการอนุมัติการเช็คอินก่อนเช็คเอาท์')
  if (attendance.location !== WORK_LOCATION) throw badRequest('สามารถเช็คเอาท์ได้เฉพาะเมื่อเช็คเข้างานเท่านั้น')

  attendance.checkoutTime = new Date()
  if (input.notes) {
    attendance.notes = attendance.notes ? `${attendance.notes}\nหมายเหตุออกงาน: ${input.notes}` : `หมายเหตุออกงาน: ${input.notes}`
  }
  await attendance.save()
  await attendance.populate('employeeId', 'name email')

  const workedMs = attendance.checkoutTime.getTime() - new Date(attendance.checkInTime).getTime()
  const hours = Math.floor(workedMs / 3_600_000)
  const minutes = Math.floor((workedMs % 3_600_000) / 60_000)
  void notifyManagers(
    [
      '✅ การเช็คเอาท์พนักงาน',
      '',
      `👤 พนักงาน: ${employee.name || employee.email || 'ไม่ระบุชื่อ'}`,
      `📅 วันที่: ${dateTH(attendance.checkInDate)}`,
      `🕐 เข้างาน: ${timeTH(attendance.checkInTime)}`,
      `🕐 ออกงาน: ${timeTH(attendance.checkoutTime)}`,
      `⏱️ จำนวนชั่วโมง: ${hours} ชั่วโมง ${minutes} นาที`,
      input.notes ? `📝 หมายเหตุออกงาน: ${input.notes}` : '',
      '',
      'กรุณาตรวจสอบในระบบแอดมิน',
    ]
      .filter((line, i, all) => line || all[i - 1])
      .join('\n')
  )

  return { message: 'เช็คเอาท์สำเร็จ', attendance }
}

/** Staff approve or reject a pending check-in */
export async function reviewAttendance(id: string, input: z.infer<typeof reviewAttendanceSchema>, session: Session) {
  const attendance = await EmployeeAttendance.findById(id)
  if (!attendance) throw notFound('ไม่พบข้อมูลการเช็คอิน')
  if (attendance.status !== 'PENDING') {
    throw badRequest(`การเช็คอินนี้ถูก${attendance.status === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ'}แล้ว`)
  }
  const reviewer = await findSessionUser(session)
  if (!reviewer) throw notFound('ไม่พบข้อมูลผู้ดูแลระบบ')

  attendance.status = input.status
  attendance.approvedBy = reviewer._id
  attendance.approvedAt = new Date()
  if (input.status === 'REJECTED') attendance.rejectionReason = input.rejectionReason
  await attendance.save()
  await attendance.populate('employeeId', 'name email')
  await attendance.populate('approvedBy', 'name email')

  return { message: `การเช็คอิน${input.status === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ'}เรียบร้อย`, attendance }
}
