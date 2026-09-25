import { describe, expect, it } from 'vitest'
import { summarize } from './attendance'

describe('summarize', () => {
  it('counts work days, leave and approvals per employee', () => {
    const a = { _id: 'a', name: 'สมชาย' }
    const summary = summarize([
      { _id: '1', employeeId: a, location: 'เข้างาน', status: 'APPROVED' },
      { _id: '2', employeeId: a, location: 'ลางาน', status: 'PENDING' },
      { _id: '3', employeeId: 'b', location: 'เข้างาน', status: 'REJECTED' },
    ])
    expect(summary).toMatchObject({ total: 3, workIn: 2, workOut: 1, approved: 1, pending: 1, rejected: 1 })
    expect(summary.employees).toEqual([
      { id: 'a', name: 'สมชาย', total: 2, workIn: 1, workOut: 1, approved: 1, pending: 1, rejected: 0 },
      { id: 'b', name: 'ไม่ระบุชื่อ', total: 1, workIn: 1, workOut: 0, approved: 0, pending: 0, rejected: 1 },
    ])
  })
})
