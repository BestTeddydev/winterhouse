import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'
import * as usersRoute from '@/app/api/admin/users/route'
import * as userRoute from '@/app/api/admin/users/[id]/route'
import * as campingLocksRoute from '@/app/api/camping-block-blocks/route'
import * as attendanceRoute from '@/app/api/employee/attendance/route'
import * as reviewRoute from '@/app/api/employee/attendance/[id]/route'
import * as checkInRoute from '@/app/api/employee/attendance/checkin/route'
import * as checkOutRoute from '@/app/api/employee/attendance/checkout/route'
import * as roomLocksRoute from '@/app/api/room-blocks/route'
import * as roomLockRoute from '@/app/api/room-blocks/[id]/route'
import * as uploadRoute from '@/app/api/upload/route'
import User from '@/models/User'
import { createCampingBlock, createRoom, createUser, day } from '../support/factories'
import { call } from '../support/http'
import { lineMock, signInAs } from '../support/mocks'

describe('room locks', () => {
  it('are public when asking for active ones, staff-only otherwise', async () => {
    expect((await call(roomLocksRoute.GET, 'GET', { query: { activeOnly: 'true' } })).status).toBe(200)
    expect((await call(roomLocksRoute.GET, 'GET')).status).toBe(401)
  })

  it('reject overlapping periods but allow back-to-back ones', async () => {
    const room = await createRoom({ name: 'R1' })
    signInAs(await createUser({ role: 'ADMIN' }))
    const lock = (from: number, to: number) =>
      call(roomLocksRoute.POST, 'POST', { body: { roomId: room._id, startDate: day(from), endDate: day(to), reason: 'ซ่อม' } })

    const first = await lock(10, 12)
    expect(first.status).toBe(201)
    expect(first.body.roomId.name).toBe('R1')

    const overlap = await lock(11, 13)
    expect(overlap.status).toBe(400)
    expect(overlap.body.overlappingBlock.id).toBe(first.body._id)

    expect((await lock(12, 14)).status).toBe(201)
    expect((await lock(15, 15)).status).toBe(400) // start must be before end

    const list = await call(roomLocksRoute.GET, 'GET', { query: { activeOnly: 'true', roomId: room._id } })
    expect(list.body).toHaveLength(2)
    expect(list.body[0]).toMatchObject({ roomId: room._id, roomName: 'R1' })
  })

  it('can be moved, disabled and deleted', async () => {
    const room = await createRoom()
    signInAs(await createUser({ role: 'OWNER' }))
    const lock = (await call(roomLocksRoute.POST, 'POST', { body: { roomId: room._id, startDate: day(1), endDate: day(3) } })).body
    const moved = await call(roomLockRoute.PUT, 'PUT', { params: { id: lock._id }, body: { endDate: day(5), isActive: false } })
    expect(moved.status).toBe(200)
    expect(moved.body.isActive).toBe(false)
    expect((await call(roomLockRoute.DELETE, 'DELETE', { params: { id: lock._id } })).status).toBe(200)
    expect((await call(roomLockRoute.GET, 'GET', { params: { id: lock._id } })).status).toBe(404)
  })
})

describe('camping block locks', () => {
  it('are staff only and reject overlaps', async () => {
    const block = await createCampingBlock()
    const body = { campingBlockId: block._id, startDate: day(1), endDate: day(3) }
    signInAs(await createUser())
    expect((await call(campingLocksRoute.POST, 'POST', { body })).status).toBe(403)

    signInAs(await createUser({ role: 'ADMIN' }))
    expect((await call(campingLocksRoute.POST, 'POST', { body })).status).toBe(201)
    expect((await call(campingLocksRoute.POST, 'POST', { body })).status).toBe(400)
  })
})

describe('employee attendance', () => {
  it('lets an employee check in once a day, and notifies the manager', async () => {
    process.env.LINE_ADMIN_USER_ID = 'Umanager'
    const employee = await createUser({ role: 'EMPLOYEE', name: 'Somsri' })
    signInAs(employee)

    const first = await call(checkInRoute.POST, 'POST', { body: { location: 'เข้างาน' } })
    expect(first.status).toBe(201)
    expect(first.body.attendance.status).toBe('PENDING')

    const again = await call(checkInRoute.POST, 'POST', { body: { location: 'เข้างาน' } })
    expect(again.status).toBe(400)
    expect(again.body.attendance._id).toBe(first.body.attendance._id) // the page shows the existing record

    await vi.waitFor(() =>
      expect(lineMock.sendLineNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: 'Umanager' }))
    )
  })

  it('requires approval before checking out', async () => {
    const employee = await createUser({ role: 'EMPLOYEE' })
    const admin = await createUser({ role: 'ADMIN' })
    signInAs(employee)
    const { attendance } = (await call(checkInRoute.POST, 'POST', { body: { location: 'เข้างาน' } })).body

    expect((await call(checkOutRoute.POST, 'POST', { body: {} })).body.error).toBe('กรุณารอการอนุมัติการเช็คอินก่อนเช็คเอาท์')

    signInAs(admin)
    const rejectWithoutReason = await call(reviewRoute.PATCH, 'PATCH', { params: { id: attendance._id }, body: { status: 'REJECTED' } })
    expect(rejectWithoutReason.status).toBe(400)
    const approved = await call(reviewRoute.PATCH, 'PATCH', { params: { id: attendance._id }, body: { status: 'APPROVED' } })
    expect(approved.body.attendance).toMatchObject({ status: 'APPROVED', approvedBy: { _id: admin._id } })

    signInAs(employee)
    const out = await call(checkOutRoute.POST, 'POST', { body: { notes: 'เลิกงาน' } })
    expect(out.status).toBe(200)
    expect(out.body.attendance.checkoutTime).toBeTruthy()
    expect((await call(checkOutRoute.POST, 'POST', { body: {} })).status).toBe(400)
  })

  it('shows employees only their own records and forbids customers', async () => {
    const a = await createUser({ role: 'EMPLOYEE' })
    const b = await createUser({ role: 'EMPLOYEE' })
    for (const e of [a, b]) {
      signInAs(e)
      await call(checkInRoute.POST, 'POST', { body: { location: 'เข้างาน' } })
    }
    signInAs(a)
    expect((await call(attendanceRoute.GET, 'GET')).body.pagination.total).toBe(1)
    signInAs(await createUser({ role: 'OWNER' }))
    expect((await call(attendanceRoute.GET, 'GET')).body.pagination.total).toBe(2)
    signInAs(await createUser())
    expect((await call(attendanceRoute.GET, 'GET')).status).toBe(403)
    signInAs(await createUser())
    expect((await call(checkInRoute.POST, 'POST', { body: {} })).status).toBe(403)
  })
})

describe('user administration', () => {
  it('only ADMIN can change roles; nobody else can escalate', async () => {
    const customer = await createUser()
    signInAs(customer)
    expect((await call(userRoute.PATCH, 'PATCH', { params: { id: customer._id }, body: { role: 'ADMIN' } })).status).toBe(403)
    signInAs(await createUser({ role: 'OWNER' }))
    expect((await call(userRoute.PATCH, 'PATCH', { params: { id: customer._id }, body: { role: 'ADMIN' } })).status).toBe(403)
    expect((await User.findById(customer._id)).role).toBe('CUSTOMER')

    signInAs(await createUser({ role: 'ADMIN' }))
    const res = await call(userRoute.PATCH, 'PATCH', { params: { id: customer._id }, body: { role: 'EMPLOYEE' } })
    expect(res.body.data.role).toBe('EMPLOYEE')
    expect((await call(userRoute.PATCH, 'PATCH', { params: { id: customer._id }, body: { role: 'GOD' } })).status).toBe(400)
  })

  it('lists users by role for staff and prevents duplicates and self-deletion', async () => {
    await createUser({ role: 'EMPLOYEE', email: 'e@example.com' })
    const admin = await createUser({ role: 'ADMIN', email: 'a@example.com' })
    signInAs(admin)

    const employees = await call(usersRoute.GET, 'GET', { query: { role: 'EMPLOYEE' } })
    expect(employees.body.users).toHaveLength(1)

    expect((await call(usersRoute.POST, 'POST', { body: { name: 'Dup', email: 'e@example.com' } })).status).toBe(409)
    expect((await call(userRoute.DELETE, 'DELETE', { params: { id: admin._id } })).status).toBe(400)

    expect((await call(usersRoute.GET, 'GET')).status).toBe(200)
    signInAs(null)
    expect((await call(usersRoute.GET, 'GET')).status).toBe(401)
  })
})

describe('upload', () => {
  it('is staff only and rejects non-images', async () => {
    const form = (type: string) => {
      const data = new FormData()
      data.append('file', new File(['x'], 'a.txt', { type }))
      return data
    }
    const post = (type: string) =>
      uploadRoute.POST(new NextRequest('http://localhost/api/upload', { method: 'POST', body: form(type) }), { params: {} })

    expect((await post('image/png')).status).toBe(401)
    signInAs(await createUser())
    expect((await post('image/png')).status).toBe(403)
    signInAs(await createUser({ role: 'ADMIN' }))
    const res = await post('text/plain')
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain('ประเภทไฟล์ไม่ถูกต้อง')
  })
})
