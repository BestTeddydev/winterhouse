/**
 * Copy bookings made in the old MongoDB system since a date into Firestore, with their payments
 * and any users that don't exist in Firestore yet. For bookings still made on the old system
 * after the main migration (scripts/migrate-to-firebase.js).
 *
 * Usage (MongoDB reachable, e.g. kubectl port-forward svc/mongodb-service 27019:27017 -n baanlomnow):
 *   node --env-file=.env.local scripts/migrate-bookings-since.js --since=2026-09-24            # report only
 *   node --env-file=.env.local scripts/migrate-bookings-since.js --since=2026-09-24 --apply    # write
 *
 * Options:
 *   --since=YYYY-MM-DD   bookings created on or after this Thai date (required)
 *   --until=YYYY-MM-DD   ... and before the end of this Thai date (default: now)
 *   --apply              write to Firestore (without it nothing is written)
 *   --overwrite          also replace bookings/payments that already exist in Firestore
 *                        (default: skip them, they may have been changed in the new system)
 *
 * Env: MONGODB_URI / DATABASE_URL, FIREBASE_SERVICE_ACCOUNT (default secrets/baanlomnow-firebase.json),
 *      FIRESTORE_DATABASE_ID (default baanlomnow-sg), SOURCE_BUCKET (old GCS bucket, default baanlomnow),
 *      FIREBASE_STORAGE_BUCKET (default <project>.firebasestorage.app)
 *
 * Users are never overwritten. Payment slips still in the old bucket are copied to Firebase Storage
 * and their URLs rewritten (needs `gcloud auth application-default login`); if that isn't possible
 * the old URL is kept and listed in the report.
 */

const path = require('path')
const { randomUUID } = require('crypto')
const { pipeline } = require('stream/promises')
const { MongoClient } = require('mongodb')
const { Storage } = require('@google-cloud/storage')
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getStorage } = require('firebase-admin/storage')

const args = process.argv.slice(2)
const getArg = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
const APPLY = args.includes('--apply')
const OVERWRITE = args.includes('--overwrite')
const SINCE = getArg('since')
const UNTIL = getArg('until')

const DATE = /^\d{4}-\d{2}-\d{2}$/
if (!SINCE || !DATE.test(SINCE) || (UNTIL && !DATE.test(UNTIL))) {
  console.error('Usage: --since=YYYY-MM-DD [--until=YYYY-MM-DD] [--apply] [--overwrite]')
  process.exit(1)
}
// Thai dates: midnight in Bangkok (UTC+7, no daylight saving time)
const from = new Date(`${SINCE}T00:00:00+07:00`)
const to = UNTIL ? new Date(new Date(`${UNTIL}T00:00:00+07:00`).getTime() + 24 * 3600_000) : new Date()

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL
if (!MONGODB_URI) {
  console.error('Set MONGODB_URI or DATABASE_URL (e.g. node --env-file=.env.local ...)')
  process.exit(1)
}
const SOURCE_BUCKET = process.env.SOURCE_BUCKET || 'baanlomnow'
const serviceAccount = require(
  path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT || path.join(__dirname, '..', 'secrets', 'baanlomnow-firebase.json'))
)
const app = initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id })
const firestore = getFirestore(app, process.env.FIRESTORE_DATABASE_ID || 'baanlomnow-sg')
firestore.settings({ ignoreUndefinedProperties: true })

// --- values -------------------------------------------------------------------

const hex = (id) => (id == null ? null : id._bsontype ? id.toHexString() : String(id))

const escapedBucket = SOURCE_BUCKET.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const OLD_BUCKET_URLS = [
  new RegExp(`^https?://storage\\.(?:googleapis|cloud\\.google)\\.com/${escapedBucket}/([^?#]+)`),
  new RegExp(`^https?://${escapedBucket}\\.storage\\.googleapis\\.com/([^?#]+)`),
  new RegExp(`^gs://${escapedBucket}/([^?#]+)`),
]
const oldBucketPath = (value) => {
  for (const pattern of OLD_BUCKET_URLS) {
    const match = value.match(pattern)
    if (match) return decodeURIComponent(match[1])
  }
  return null
}

/** BSON -> Firestore values; strings pointing at the old bucket go through `rewrite` */
function toFirestore(value, rewrite) {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') return rewrite(value)
  if (typeof value !== 'object' || value instanceof Date) return value
  switch (value._bsontype) {
    case 'ObjectId':
    case 'ObjectID':
      return value.toHexString()
    case 'Decimal128':
      return parseFloat(value.toString())
    case 'Long':
      return value.toNumber()
    case 'Int32':
    case 'Double':
      return value.valueOf()
  }
  if (Array.isArray(value)) return value.map((v) => toFirestore(v, rewrite))
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toFirestore(v, rewrite)]))
}

function collectOldUrls(value, found = new Set()) {
  if (typeof value === 'string') {
    const filePath = oldBucketPath(value)
    if (filePath) found.add(filePath)
  } else if (value && typeof value === 'object' && !(value instanceof Date) && !value._bsontype) {
    for (const child of Object.values(value)) collectOldUrls(child, found)
  }
  return found
}

// --- storage --------------------------------------------------------------------

/** Copies the files to Firebase Storage; returns old path -> new download URL for the ones that worked */
async function copyFiles(filePaths) {
  const urls = new Map()
  if (!filePaths.size) return urls
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.firebasestorage.app`
  const dest = getStorage(app).bucket(bucketName)
  const source = new Storage().bucket(SOURCE_BUCKET)
  for (const filePath of filePaths) {
    try {
      const target = dest.file(filePath)
      let [exists] = await target.exists()
      if (!exists) {
        const src = source.file(filePath)
        const [meta] = await src.getMetadata()
        await pipeline(
          src.createReadStream(),
          target.createWriteStream({
            metadata: {
              contentType: meta.contentType || 'application/octet-stream',
              cacheControl: 'public, max-age=31536000',
              metadata: { firebaseStorageDownloadTokens: randomUUID() },
            },
          })
        )
      }
      const [meta] = await target.getMetadata()
      let token = meta.metadata?.firebaseStorageDownloadTokens?.split(',')[0]
      if (!token) {
        token = randomUUID()
        await target.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } })
      }
      urls.set(filePath, `https://firebasestorage.googleapis.com/v0/b/${dest.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${token}`)
    } catch (error) {
      console.warn(`  ⚠️  could not copy ${filePath}: ${error.message}`)
    }
  }
  return urls
}

// --- main -------------------------------------------------------------------------

async function existingIds(collection, ids) {
  const unique = [...new Set(ids.filter(Boolean))]
  if (!unique.length) return new Set()
  const snapshots = await firestore.getAll(...unique.map((id) => firestore.collection(collection).doc(id)))
  return new Set(snapshots.filter((s) => s.exists).map((s) => s.id))
}

const roomIdsOf = (b) => [...new Set([b.roomId, ...(b.roomIds ?? []), ...(b.rooms ?? []).map((r) => r.roomId)].map(hex).filter(Boolean))]
const blockIdsOf = (b) => [...new Set([b.campingBlockId, ...(b.campingBlockIds ?? [])].map(hex).filter(Boolean))]
const thaiDate = (d) => (d ? new Date(new Date(d).getTime() + 7 * 3600_000).toISOString().slice(0, 10) : '-')

async function main() {
  console.log(APPLY ? '✍️  APPLY: writing to Firestore' : '🔍 Report only (add --apply to write)')
  console.log(`Bookings created ${from.toISOString()} .. ${to.toISOString()} (Thai ${SINCE} .. ${UNTIL ?? 'now'})`)

  const client = await new MongoClient(MONGODB_URI).connect()
  const mongo = client.db()
  console.log(`Source: mongodb/${mongo.databaseName} -> Firestore ${serviceAccount.project_id}/${firestore.databaseId}\n`)

  const bookings = await mongo
    .collection('bookings')
    .find({ createdAt: { $gte: from, $lt: to } })
    .sort({ createdAt: 1 })
    .toArray()
  const bookingIds = bookings.map((b) => hex(b._id))

  const paymentIds = bookings.map((b) => hex(b.paymentId)).filter(Boolean)
  const payments = await mongo
    .collection('payments')
    .find({ $or: [{ _id: { $in: bookings.map((b) => b.paymentId).filter(Boolean) } }, { bookingId: { $in: bookings.map((b) => b._id) } }] })
    .toArray()
  const userObjectIds = [...new Map(bookings.flatMap((b) => [b.userId, b.createdBy]).filter(Boolean).map((id) => [hex(id), id])).values()]
  const users = await mongo.collection('users').find({ _id: { $in: userObjectIds } }).toArray()

  const [bookingsInFs, paymentsInFs, usersInFs, roomsInFs, blocksInFs, addOnsInFs] = await Promise.all([
    existingIds('bookings', bookingIds),
    existingIds('payments', payments.map((p) => hex(p._id))),
    existingIds('users', users.map((u) => hex(u._id))),
    existingIds('rooms', bookings.flatMap(roomIdsOf)),
    existingIds('campingblocks', bookings.flatMap(blockIdsOf)),
    existingIds('addons', bookings.flatMap((b) => (b.addOns ?? []).map((a) => hex(a.addOnId)))),
  ])

  // Stays already in Firestore (the new system) that overlap an imported one
  const active = (b) => b.status === 'CONFIRMED' || b.status === 'PENDING'
  const earliest = bookings.reduce((min, b) => (b.checkIn && b.checkIn < min ? b.checkIn : min), to)
  const fsStays = (await firestore.collection('bookings').where('checkOut', '>', earliest).get()).docs
    .map((d) => ({ id: d.id, ...d.data(), checkIn: d.data().checkIn?.toDate(), checkOut: d.data().checkOut?.toDate() }))
    .filter((b) => active(b) && !bookingIds.includes(b.id))

  const rows = []
  const problems = []
  for (const b of bookings) {
    const id = hex(b._id)
    const rooms = roomIdsOf(b)
    const blocks = blockIdsOf(b)
    const missing = [
      ...rooms.filter((r) => !roomsInFs.has(r)).map((r) => `room ${r}`),
      ...blocks.filter((c) => !blocksInFs.has(c)).map((c) => `camping block ${c}`),
      ...(b.addOns ?? []).map((a) => hex(a.addOnId)).filter((a) => a && !addOnsInFs.has(a)).map((a) => `add-on ${a}`),
    ]
    if (missing.length) problems.push(`${id}: not in Firestore: ${missing.join(', ')}`)
    if (active(b)) {
      for (const other of fsStays) {
        const overlaps = other.checkIn < b.checkOut && other.checkOut > b.checkIn
        const shared = [...roomIdsOf(other).filter((r) => rooms.includes(r)), ...blockIdsOf(other).filter((c) => blocks.includes(c))]
        if (overlaps && shared.length) {
          problems.push(`${id}: overlaps Firestore booking ${other.id} (${thaiDate(other.checkIn)}..${thaiDate(other.checkOut)}, ${other.guestName})`)
        }
      }
    }
    rows.push({
      id,
      created: thaiDate(b.createdAt),
      guest: b.guestName,
      stay: `${thaiDate(b.checkIn)}..${thaiDate(b.checkOut)}`,
      status: b.status,
      total: b.totalPrice,
      action: bookingsInFs.has(id) ? (OVERWRITE ? 'overwrite' : 'skip (in Firestore)') : 'add',
    })
  }
  console.table(rows)

  const oldFiles = collectOldUrls([...bookings, ...payments])
  const writeBookings = bookings.filter((b) => OVERWRITE || !bookingsInFs.has(hex(b._id)))
  const writeBookingIds = new Set(writeBookings.map((b) => hex(b._id)))
  const writePayments = payments.filter(
    (p) => writeBookingIds.has(hex(p.bookingId)) && (OVERWRITE || !paymentsInFs.has(hex(p._id)))
  )
  const writeUsers = users.filter((u) => !usersInFs.has(hex(u._id)))

  console.log(`Bookings: ${bookings.length} found, ${writeBookings.length} to write, ${bookings.length - writeBookings.length} skipped`)
  console.log(`Payments: ${payments.length} found (${paymentIds.length} linked), ${writePayments.length} to write`)
  console.log(`Users:    ${users.length} referenced, ${writeUsers.length} not in Firestore yet (to add: ${writeUsers.map((u) => u.email || u.name).join(', ') || '-'})`)
  console.log(`Files in the old bucket referenced: ${oldFiles.size}`)
  const missingUsers = userObjectIds.map(hex).filter((id) => !users.some((u) => hex(u._id) === id) && !usersInFs.has(id))
  if (missingUsers.length) problems.push(`users missing in both databases: ${missingUsers.join(', ')}`)
  if (problems.length) {
    console.log('\n⚠️  Check before/after applying:')
    for (const p of problems) console.log(`   - ${p}`)
  }

  if (!APPLY) {
    await client.close()
    return
  }

  const urls = await copyFiles(oldFiles)
  const keptOld = [...oldFiles].filter((f) => !urls.has(f))
  const rewrite = (value) => {
    const filePath = oldBucketPath(value)
    return filePath && urls.has(filePath) ? urls.get(filePath) : value
  }

  const writer = firestore.bulkWriter()
  let failed = 0
  writer.onWriteError((error) => {
    if (error.failedAttempts < 5) return true
    failed++
    console.error(`  ❌ ${error.documentRef.path}: ${error.message}`)
    return false
  })
  const put = (collection, doc) => {
    const { _id, __v, ...rest } = doc
    writer.set(firestore.collection(collection).doc(hex(_id)), toFirestore(rest, rewrite))
  }
  writeUsers.forEach((u) => put('users', u))
  writeBookings.forEach((b) => put('bookings', b))
  writePayments.forEach((p) => put('payments', p))
  await writer.close()

  console.log(`\n✅ Wrote ${writeUsers.length} users, ${writeBookings.length} bookings, ${writePayments.length} payments` + (failed ? `, ${failed} failed` : ''))
  if (keptOld.length) console.log(`⚠️  ${keptOld.length} files could not be copied; their old URLs were kept:\n   - ${keptOld.join('\n   - ')}`)
  await client.close()
}

main().catch((error) => {
  console.error('Failed:', error)
  process.exit(1)
})
