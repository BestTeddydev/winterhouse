// Attendance display and statistics, shared by the approval and summary pages

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'รอการอนุมัติ',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ปฏิเสธ',
}

export const WORK_TYPES = ['เข้างาน', 'ออกงาน', 'ลางาน'] as const

const TZ = { timeZone: 'Asia/Bangkok' } as const
export const attendanceDate = (date: string) =>
  new Date(date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', ...TZ })
export const attendanceTime = (date: string) => new Date(date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', ...TZ })
/** Short Thai date of a "YYYY-MM-DD" filter value */
export const filterDate = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString('th-TH', { timeZone: 'UTC' })

export interface AttendanceRecord {
  _id: string
  employeeId?: { _id: string; name?: string; email?: string } | string
  location?: string
  status: string
}

interface Counts {
  total: number
  workIn: number
  workOut: number
  approved: number
  pending: number
  rejected: number
}

export interface EmployeeCounts extends Counts {
  id: string
  name: string
}

const emptyCounts = (): Counts => ({ total: 0, workIn: 0, workOut: 0, approved: 0, pending: 0, rejected: 0 })

function add(counts: Counts, record: AttendanceRecord) {
  counts.total++
  if (record.location === 'เข้างาน') counts.workIn++
  if (record.location === 'ลางาน') counts.workOut++
  if (record.status === 'APPROVED') counts.approved++
  if (record.status === 'PENDING') counts.pending++
  if (record.status === 'REJECTED') counts.rejected++
}

/** Totals and per-employee counts of work days / leave and approvals */
export function summarize(records: AttendanceRecord[]): Counts & { employees: EmployeeCounts[] } {
  const totals = emptyCounts()
  const byEmployee = new Map<string, EmployeeCounts>()
  for (const record of records) {
    add(totals, record)
    const employee = typeof record.employeeId === 'object' ? record.employeeId : undefined
    const id = employee?._id ?? String(record.employeeId)
    if (!byEmployee.has(id)) byEmployee.set(id, { id, name: employee?.name || 'ไม่ระบุชื่อ', ...emptyCounts() })
    add(byEmployee.get(id)!, record)
  }
  return { ...totals, employees: [...byEmployee.values()] }
}
