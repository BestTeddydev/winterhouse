import type { Session } from 'next-auth'
import type { z } from 'zod'
import CampingBlockBlock from '@/models/CampingBlockBlock'
import type { ModelClass } from '@/lib/odm'
import RoomBlock from '@/models/RoomBlock'
import { badRequest, notFound } from '../errors'
import type { lockQuery, updateLockSchema } from '../schemas/locks'

/**
 * Admin "locks" that make a room or camping block unbookable for a period
 * (maintenance, private use). Rooms and camping blocks share the same rules.
 */
export interface LockKind {
  model: ModelClass
  refField: 'roomId' | 'campingBlockId'
  notFound: string
  overlapMessage: string
}

export const ROOM_LOCKS: LockKind = {
  model: RoomBlock,
  refField: 'roomId',
  notFound: 'ไม่พบข้อมูลการล็อคห้อง',
  overlapMessage: 'มีการล็อคห้องในช่วงเวลานี้อยู่แล้ว',
}

export const CAMPING_BLOCK_LOCKS: LockKind = {
  model: CampingBlockBlock,
  refField: 'campingBlockId',
  notFound: 'ไม่พบข้อมูลการล็อคบล็อคกางเต๊นท์',
  overlapMessage: 'มีการล็อคบล็อคกางเต๊นท์ในช่วงเวลานี้อยู่แล้ว',
}

/** Locks overlap when each starts before the other ends (end date is exclusive, like check-out) */
async function assertNoOverlap(kind: LockKind, refId: string, start: Date, end: Date, excludeId?: string) {
  const overlapping = await kind.model.findOne({
    [kind.refField]: refId,
    isActive: true,
    $and: [{ startDate: { $lt: end } }, { endDate: { $gt: start } }],
    ...(excludeId && { _id: { $ne: excludeId } }),
  })
  if (overlapping) {
    throw badRequest(kind.overlapMessage, {
      overlappingBlock: { id: overlapping._id, startDate: overlapping.startDate, endDate: overlapping.endDate },
    })
  }
}

const populated = (kind: LockKind, query: any) =>
  query.populate(kind.refField, 'name').populate('createdBy', 'name email')

export async function listLocks(kind: LockKind, q: z.infer<typeof lockQuery>) {
  const filter: Record<string, unknown> = {}
  const refId = q[kind.refField]
  if (refId) filter[kind.refField] = refId
  if (q.activeOnly) filter.isActive = true
  if (q.startDate) filter.endDate = { $gte: new Date(q.startDate) }
  if (q.endDate) filter.startDate = { $lte: new Date(q.endDate) }
  return populated(kind, kind.model.find(filter)).sort({ startDate: 1 })
}

export async function getLock(kind: LockKind, id: string) {
  const lock = await populated(kind, kind.model.findById(id))
  if (!lock) throw notFound(kind.notFound)
  return lock
}

export async function createLock(
  kind: LockKind,
  input: { startDate: Date; endDate: Date; reason: string } & Record<string, unknown>,
  session: Session
) {
  const refId = input[kind.refField] as string
  await assertNoOverlap(kind, refId, input.startDate, input.endDate)
  const lock = await kind.model.create({
    [kind.refField]: refId,
    startDate: input.startDate,
    endDate: input.endDate,
    reason: input.reason,
    isActive: true,
    createdBy: session.user.id,
  })
  return getLock(kind, lock._id)
}

export async function updateLock(kind: LockKind, id: string, input: z.infer<typeof updateLockSchema>) {
  const lock = await kind.model.findById(id)
  if (!lock) throw notFound(kind.notFound)

  const start = input.startDate ?? lock.startDate
  const end = input.endDate ?? lock.endDate
  if (input.startDate || input.endDate) {
    if (start >= end) throw badRequest('วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด')
    await assertNoOverlap(kind, String(lock[kind.refField]), start, end, id)
  }

  lock.startDate = start
  lock.endDate = end
  if (input.reason !== undefined) lock.reason = input.reason
  if (input.isActive !== undefined) lock.isActive = input.isActive
  await lock.save()
  return getLock(kind, id)
}

export async function deleteLock(kind: LockKind, id: string) {
  await kind.model.findByIdAndDelete(id)
}
