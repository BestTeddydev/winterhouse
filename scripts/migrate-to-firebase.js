/**
 * Migrate MongoDB -> Firestore and GCS bucket images -> Firebase Storage.
 *
 * Usage:
 *   MONGODB_URI="mongodb://admin:<password>@localhost:27019/baanlomnow?authSource=admin" \
 *     node scripts/migrate-to-firebase.js [--dry-run] [--only=storage|firestore] [--collections=rooms,bookings]
 *
 * Env:
 *   MONGODB_URI / DATABASE_URL   source MongoDB (database name taken from the URI)
 *   SOURCE_BUCKET                source GCS bucket (default: GOOGLE_CLOUD_BUCKET_NAME or "baanlomnow"),
 *                                read with Application Default Credentials (gcloud auth application-default login)
 *   SOURCE_ACCESS_TOKEN          optional OAuth token for the source bucket, e.g. $(gcloud auth print-access-token)
 *   FIREBASE_SERVICE_ACCOUNT     path to Firebase service account key (default: secrets/baanlomnow-firebase.json)
 *   FIREBASE_STORAGE_BUCKET      destination bucket (default: auto-detect <project>.firebasestorage.app / .appspot.com)
 *   FIRESTORE_DATABASE_ID        Firestore database (default: "(default)")
 *
 * Safe to re-run: files already copied (same md5) are skipped, Firestore docs are overwritten by id.
 * Run storage first (or without --only) so image URLs in documents can be rewritten to Firebase URLs.
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
const DRY_RUN = args.includes('--dry-run')
const ONLY = getArg('only')
const ONLY_COLLECTIONS = getArg('collections')?.split(',').filter(Boolean)

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL
const SOURCE_BUCKET = process.env.SOURCE_BUCKET || process.env.GOOGLE_CLOUD_BUCKET_NAME || 'baanlomnow'
const SERVICE_ACCOUNT_PATH = path.resolve(
  process.env.FIREBASE_SERVICE_ACCOUNT || path.join(__dirname, '..', 'secrets', 'baanlomnow-firebase.json')
)
const CONCURRENCY = 8

const serviceAccount = require(SERVICE_ACCOUNT_PATH)
const app = initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id })
const firestore = getFirestore(app, process.env.FIRESTORE_DATABASE_ID || '(default)')
firestore.settings({ ignoreUndefinedProperties: true })

// SOURCE_ACCESS_TOKEN (e.g. `gcloud auth print-access-token`) overrides Application Default Credentials
const sourceStorageOptions = { projectId: process.env.GOOGLE_CLOUD_PROJECT_ID }
if (process.env.SOURCE_ACCESS_TOKEN) {
  const { OAuth2Client } = require('google-auth-library')
  const authClient = new OAuth2Client()
  authClient.setCredentials({ access_token: process.env.SOURCE_ACCESS_TOKEN })
  sourceStorageOptions.authClient = authClient
}
const sourceBucket = new Storage(sourceStorageOptions).bucket(SOURCE_BUCKET)
let destBucket

async function resolveDestBucket() {
  const candidates = process.env.FIREBASE_STORAGE_BUCKET
    ? [process.env.FIREBASE_STORAGE_BUCKET]
    : [`${serviceAccount.project_id}.firebasestorage.app`, `${serviceAccount.project_id}.appspot.com`]
  for (const name of candidates) {
    const bucket = getStorage(app).bucket(name)
    const [exists] = await bucket.exists().catch(() => [false])
    if (exists) return bucket
  }
  throw new Error(
    `Firebase Storage bucket not found (tried ${candidates.join(', ')}). ` +
      'Enable Storage in the Firebase console or set FIREBASE_STORAGE_BUCKET.'
  )
}

async function runPool(items, worker) {
  let index = 0
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (index < items.length) await worker(items[index++])
  })
  await Promise.all(runners)
}

function firebaseDownloadUrl(bucketName, filePath, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media&token=${token}`
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

async function migrateStorage() {
  console.log(`\n📦 Storage: gs://${SOURCE_BUCKET} -> gs://${destBucket?.name ?? '(dry run)'}`)
  const [files] = await sourceBucket.getFiles()
  const objects = files.filter((f) => !f.name.endsWith('/'))
  const stats = { copied: 0, skipped: 0, failed: 0, bytes: 0 }
  console.log(`Found ${objects.length} objects`)

  await runPool(objects, async (src) => {
    const { name, size, md5Hash, contentType, cacheControl } = src.metadata
    try {
      if (DRY_RUN) {
        stats.copied++
        stats.bytes += Number(size)
        return
      }

      const dest = destBucket.file(name)
      const [exists] = await dest.exists()
      if (exists) {
        const [meta] = await dest.getMetadata()
        if (meta.md5Hash === md5Hash) {
          if (!meta.metadata?.firebaseStorageDownloadTokens) {
            await dest.setMetadata({ metadata: { firebaseStorageDownloadTokens: randomUUID() } })
          }
          stats.skipped++
          return
        }
      }

      await pipeline(
        src.createReadStream({ validation: false }),
        dest.createWriteStream({
          resumable: Number(size) > 5 * 1024 * 1024,
          validation: 'md5',
          metadata: {
            contentType: contentType || 'application/octet-stream',
            cacheControl: cacheControl || 'public, max-age=31536000',
            metadata: { firebaseStorageDownloadTokens: randomUUID() },
          },
        })
      )
      stats.copied++
      stats.bytes += Number(size)
      console.log(`  ✅ ${name}`)
    } catch (error) {
      stats.failed++
      console.error(`  ❌ ${name}: ${error.message}`)
    }
  })

  const verb = DRY_RUN ? 'would copy' : 'copied'
  console.log(
    `Storage done: ${verb} ${stats.copied} (${(stats.bytes / 1024 / 1024).toFixed(1)} MB), ` +
      `skipped ${stats.skipped} (already there), failed ${stats.failed}`
  )
  return stats
}

// ---------------------------------------------------------------------------
// URL rewriting
// ---------------------------------------------------------------------------

const escapedBucket = SOURCE_BUCKET.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const SOURCE_URL_PATTERNS = [
  new RegExp(`^https?://storage\\.(?:googleapis|cloud\\.google)\\.com/${escapedBucket}/([^?#]+)`),
  new RegExp(`^https?://${escapedBucket}\\.storage\\.googleapis\\.com/([^?#]+)`),
  new RegExp(`^gs://${escapedBucket}/([^?#]+)`),
]

const urlCache = new Map()
const urlStats = { rewritten: 0, missing: new Set() }

function sourcePathFromUrl(value) {
  for (const pattern of SOURCE_URL_PATTERNS) {
    const match = value.match(pattern)
    if (match) return decodeURIComponent(match[1])
  }
  return null
}

async function rewriteUrl(value) {
  const filePath = sourcePathFromUrl(value)
  if (!filePath) return value
  if (DRY_RUN || !destBucket) {
    urlStats.rewritten++
    return value
  }

  if (!urlCache.has(filePath)) {
    urlCache.set(
      filePath,
      destBucket
        .file(filePath)
        .getMetadata()
        .then(([meta]) => {
          const token = meta.metadata?.firebaseStorageDownloadTokens?.split(',')[0]
          return token ? firebaseDownloadUrl(destBucket.name, filePath, token) : null
        })
        .catch(() => null)
    )
  }
  const newUrl = await urlCache.get(filePath)
  if (!newUrl) {
    urlStats.missing.add(filePath)
    return value
  }
  urlStats.rewritten++
  return newUrl
}

// ---------------------------------------------------------------------------
// Firestore
// ---------------------------------------------------------------------------

// Convert BSON values to Firestore-compatible values
async function toFirestoreValue(value, fieldPath) {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') return rewriteUrl(value)
  if (typeof value !== 'object') return value
  if (value instanceof Date) return value

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
    case 'Binary':
      return Buffer.from(value.buffer)
  }

  if (Array.isArray(value)) {
    const items = await Promise.all(value.map((item, i) => toFirestoreValue(item, `${fieldPath}[${i}]`)))
    // Firestore does not support arrays directly inside arrays
    return items.map((item, i) => {
      if (!Array.isArray(item)) return item
      console.warn(`  ⚠️  nested array at ${fieldPath}[${i}] stored as { values: [...] }`)
      return { values: item }
    })
  }

  const result = {}
  for (const [key, child] of Object.entries(value)) {
    result[key] = await toFirestoreValue(child, fieldPath ? `${fieldPath}.${key}` : key)
  }
  return result
}

async function migrateFirestore() {
  const client = await new MongoClient(MONGODB_URI).connect()
  const db = client.db()
  console.log(`\n🗄️  Firestore: mongodb/${db.databaseName} -> ${serviceAccount.project_id}`)

  const collections = (await db.listCollections({}, { nameOnly: true }).toArray())
    .map((c) => c.name)
    .filter((name) => !name.startsWith('system.'))
    .filter((name) => !ONLY_COLLECTIONS || ONLY_COLLECTIONS.includes(name))
    .sort()

  const summary = []
  const writer = DRY_RUN ? null : firestore.bulkWriter()
  let failed = 0
  writer?.onWriteError((error) => {
    if (error.failedAttempts < 5) return true
    failed++
    console.error(`  ❌ ${error.documentRef.path}: ${error.message}`)
    return false
  })

  for (const name of collections) {
    let count = 0
    for await (const doc of db.collection(name).find()) {
      const { _id, __v, ...rest } = doc
      const id = _id?._bsontype ? _id.toHexString?.() ?? String(_id) : String(_id)
      const data = await toFirestoreValue(rest, '')
      writer?.set(firestore.collection(name).doc(id), data)
      count++
    }
    await writer?.flush()
    summary.push({ collection: name, mongo: count })
    console.log(`  ${DRY_RUN ? '🔍' : '✅'} ${name}: ${count} docs`)
  }
  await writer?.close()

  if (!DRY_RUN) {
    for (const row of summary) {
      const snapshot = await firestore.collection(row.collection).count().get()
      row.firestore = snapshot.data().count
    }
  }
  console.table(summary)
  console.log(
    `Image URLs ${DRY_RUN ? 'to rewrite' : 'rewritten'}: ${urlStats.rewritten}` +
      (failed ? `, failed writes: ${failed}` : '')
  )
  if (urlStats.missing.size) {
    console.warn(`⚠️  ${urlStats.missing.size} referenced files not found in Firebase Storage (URLs left unchanged):`)
    for (const filePath of urlStats.missing) console.warn(`   - ${filePath}`)
  }

  await client.close()
}

async function main() {
  if (DRY_RUN) console.log('🔍 DRY RUN - nothing will be written')
  const runStorage = !ONLY || ONLY === 'storage'
  const runFirestore = !ONLY || ONLY === 'firestore'

  if (runFirestore && !MONGODB_URI) throw new Error('Set MONGODB_URI (or DATABASE_URL)')
  if (!DRY_RUN) destBucket = await resolveDestBucket()

  if (runStorage) await migrateStorage()
  if (runFirestore) await migrateFirestore()
  console.log('\n🎉 Migration finished')
}

main().catch(async (error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
