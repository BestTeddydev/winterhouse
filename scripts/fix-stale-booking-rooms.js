/**
 * Repairs bookings whose per-room prices (`rooms`) still list a room the booking was moved away
 * from. Availability reads that list too, so such a room looked booked for those dates even though
 * the booking had moved to another room (fixed in updateBooking; this repairs earlier edits).
 *
 *   node scripts/fix-stale-booking-rooms.js            # report only
 *   node scripts/fix-stale-booking-rooms.js --apply    # remove the stale entries
 *
 * Env: FIREBASE_SERVICE_ACCOUNT (default secrets/baanlomnow-firebase.json),
 *      FIRESTORE_DATABASE_ID (default baanlomnow-sg)
 */
const path = require('path')
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

const APPLY = process.argv.includes('--apply')
const serviceAccount = require(
  path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT || path.join(__dirname, '..', 'secrets', 'baanlomnow-firebase.json'))
)
const db = getFirestore(initializeApp({ credential: cert(serviceAccount) }), process.env.FIRESTORE_DATABASE_ID || 'baanlomnow-sg')

const thaiDate = (t) => (t ? new Date(t.toDate().getTime() + 7 * 3600e3).toISOString().slice(0, 10) : '-')

async function main() {
  console.log(APPLY ? '✍️  APPLY: removing stale room entries' : '🔍 Report only (add --apply to fix)')
  const [bookings, rooms] = await Promise.all([db.collection('bookings').get(), db.collection('rooms').get()])
  const roomName = new Map(rooms.docs.map((d) => [d.id, d.data().name]))

  const stale = []
  for (const doc of bookings.docs) {
    const b = doc.data()
    if (!Array.isArray(b.rooms) || !b.rooms.length) continue
    // The booking's rooms: the list, or the single room of older bookings
    const current = new Set((b.roomIds?.length ? b.roomIds : b.roomId ? [b.roomId] : []).map(String))
    const kept = b.rooms.filter((r) => current.has(String(r.roomId)))
    if (kept.length === b.rooms.length) continue
    const removed = b.rooms.filter((r) => !current.has(String(r.roomId)))
    stale.push({ ref: doc.ref, kept, row: {
      id: doc.id,
      guest: b.guestName,
      stay: `${thaiDate(b.checkIn)}..${thaiDate(b.checkOut)}`,
      status: b.status,
      rooms: [...current].map((id) => roomName.get(id) ?? id).join(', ') || '-',
      'stale (shown as taken)': removed.map((r) => roomName.get(String(r.roomId)) ?? r.roomId).join(', '),
    } })
  }

  console.log(`Bookings checked: ${bookings.size}, with stale room entries: ${stale.length}`)
  if (stale.length) console.table(stale.map((s) => s.row))
  if (!APPLY || !stale.length) return

  const batch = db.batch()
  for (const s of stale) batch.update(s.ref, { rooms: s.kept, updatedAt: new Date() })
  await batch.commit()
  console.log(`✅ Fixed ${stale.length} bookings`)
}

main().catch((error) => {
  console.error('Failed:', error.message)
  process.exit(1)
})
