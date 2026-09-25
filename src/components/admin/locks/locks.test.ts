import { describe, expect, it } from 'vitest'
import { isLockCurrent, lockedItem, lockToForm, validateLock, type LockRecord } from './locks'

const lock: LockRecord = {
  _id: 'l1',
  roomId: { _id: 'r1', name: 'A1' },
  startDate: '2030-01-05T00:00:00.000Z',
  endDate: '2030-01-08T00:00:00.000Z',
  reason: 'ซ่อม',
  isActive: true,
}

describe('locks', () => {
  it('fills the form with the stored days', () => {
    expect(lockToForm(lock, 'roomId')).toEqual({ itemId: 'r1', startDate: '2030-01-05', endDate: '2030-01-08', reason: 'ซ่อม' })
  })

  it('reads flattened room locks too', () => {
    const flat = { ...lock, roomId: 'r2', roomName: 'A2' }
    expect(lockedItem(flat, 'roomId')).toEqual({ id: 'r2', name: 'A2' })
    expect(lockToForm(flat, 'roomId').itemId).toBe('r2')
    expect(lockedItem(lock, 'roomId')).toEqual({ id: 'r1', name: 'A1' })
  })

  it('is current until its end day', () => {
    expect(isLockCurrent(lock, '2030-01-08')).toBe(true)
    expect(isLockCurrent(lock, '2030-01-09')).toBe(false)
    expect(isLockCurrent({ ...lock, isActive: false }, '2030-01-06')).toBe(false)
  })

  it('needs an item and a start before the end', () => {
    expect(validateLock({ itemId: '', startDate: '2030-01-01', endDate: '2030-01-02', reason: '' })).toBe('กรุณากรอกข้อมูลให้ครบถ้วน')
    expect(validateLock({ itemId: 'r1', startDate: '2030-01-02', endDate: '2030-01-02', reason: '' })).toBe('วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด')
    expect(validateLock({ itemId: 'r1', startDate: '2030-01-01', endDate: '2030-01-02', reason: '' })).toBeNull()
  })
})
