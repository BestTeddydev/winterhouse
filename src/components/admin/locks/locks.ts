// Room / camping block locks: one admin screen for both kinds
import { Lock, Tent, type LucideIcon } from 'lucide-react'

export interface LockKindConfig {
  /** "ห้อง" / "บล็อคกางเต๊นท์", used in every message */
  noun: string
  /** Label of the thing being locked, e.g. "ห้องพัก" */
  itemLabel: string
  itemsUrl: string
  itemsError: string
  locksUrl: string
  refField: 'roomId' | 'campingBlockId'
  emptyIcon: LucideIcon
}

export const ROOM_LOCKS: LockKindConfig = {
  noun: 'ห้อง',
  itemLabel: 'ห้องพัก',
  itemsUrl: '/api/rooms',
  itemsError: 'ไม่สามารถโหลดข้อมูลห้องพักได้',
  locksUrl: '/api/room-blocks',
  refField: 'roomId',
  emptyIcon: Lock,
}

export const CAMPING_BLOCK_LOCKS: LockKindConfig = {
  noun: 'บล็อคกางเต๊นท์',
  itemLabel: 'บล็อคกางเต๊นท์',
  itemsUrl: '/api/camping-blocks',
  itemsError: 'ไม่สามารถโหลดข้อมูลบล็อคกางเต๊นท์ได้',
  locksUrl: '/api/camping-block-blocks',
  refField: 'campingBlockId',
  emptyIcon: Tent,
}

export const LOCK_KINDS = { room: ROOM_LOCKS, camping: CAMPING_BLOCK_LOCKS }
export type LockKind = keyof typeof LOCK_KINDS

type Ref = { _id: string; name: string } | string

export interface LockRecord {
  _id: string
  /** Room locks come as a plain id plus `roomName` (the public rooms page uses them); camping locks populated */
  roomId?: Ref
  roomName?: string
  campingBlockId?: Ref
  startDate: string
  endDate: string
  reason?: string
  isActive: boolean
}

export interface LockFormValues {
  itemId: string
  startDate: string
  endDate: string
  reason: string
}

export const EMPTY_LOCK: LockFormValues = { itemId: '', startDate: '', endDate: '', reason: '' }

/** Lock dates are stored as UTC midnight of the chosen day */
export const dateKey = (date: string) => new Date(date).toISOString().slice(0, 10)
export const lockDate = (date: string) => new Date(date).toLocaleDateString('th-TH', { timeZone: 'UTC' })

/** Id and name of the locked room / camping block, whichever shape the API sent */
export function lockedItem(lock: LockRecord, refField: LockKindConfig['refField']) {
  const ref = lock[refField]
  if (ref && typeof ref === 'object') return { id: ref._id, name: ref.name }
  return { id: ref ?? '', name: lock.roomName }
}

export const lockToForm = (lock: LockRecord, refField: LockKindConfig['refField']): LockFormValues => ({
  itemId: lockedItem(lock, refField).id,
  startDate: dateKey(lock.startDate),
  endDate: dateKey(lock.endDate),
  reason: lock.reason || '',
})

/** Still blocking bookings: active and not ended before `today` */
export const isLockCurrent = (lock: LockRecord, today: string) => lock.isActive && dateKey(lock.endDate) >= today

export function validateLock(values: LockFormValues): string | null {
  if (!values.itemId || !values.startDate || !values.endDate) return 'กรุณากรอกข้อมูลให้ครบถ้วน'
  if (values.startDate >= values.endDate) return 'วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด'
  return null
}
