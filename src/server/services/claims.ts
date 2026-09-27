import { getDb } from '@/lib/firebase'

/**
 * Atomic "claims" on keys such as "a room for one night" or "an employee's check-in for one day".
 *
 * Checking with a query and then saving is not enough when two requests arrive at the same
 * moment: both see nothing and both save. Each key here is one Firestore document, claimed in a
 * transaction, so only one of them can win. A claim names its owner (e.g. a booking id); once the
 * owner no longer holds the key (the booking was cancelled, moved or its payment hold lapsed),
 * anyone may take it over, so claims never need to be cleaned up.
 */

const COLLECTION = 'claims'

/**
 * An owner that doesn't exist yet counts as holding its claim for this long: the claim is taken
 * just before the owner (booking, attendance record) is saved.
 */
const UNSAVED_OWNER_GRACE_MS = 60_000

/** Whether `owner` still holds `key`: 'unknown' when the owner document doesn't exist (yet) */
export type HoldCheck = (owner: string, key: string) => Promise<'held' | 'released' | 'unknown'>

/**
 * Claims every key for `owner`, all or nothing. Keys the owner already holds are kept.
 * Returns the first key someone else holds (nothing is claimed then), or null on success.
 */
export async function claimKeys(keys: string[], owner: string, holds: HoldCheck): Promise<string | null> {
  const unique = [...new Set(keys)]
  if (!unique.length) return null
  const collection = getDb().collection(COLLECTION)
  const refs = unique.map((key) => collection.doc(key))

  return getDb().runTransaction(async (tx) => {
    const snapshots = await tx.getAll(...refs)
    for (const [i, snapshot] of snapshots.entries()) {
      const claim = snapshot.data()
      if (!claim || claim.owner === owner) continue
      const state = await holds(claim.owner, unique[i])
      const claimedAt: number = claim.claimedAt?.toMillis?.() ?? 0
      if (state === 'held' || (state === 'unknown' && Date.now() - claimedAt < UNSAVED_OWNER_GRACE_MS)) return unique[i]
    }
    const claimedAt = new Date()
    for (const [i, ref] of refs.entries()) tx.set(ref, { key: unique[i], owner, claimedAt })
    return null
  })
}
