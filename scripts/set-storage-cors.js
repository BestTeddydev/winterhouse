/**
 * Lets the admin pages upload videos straight from the browser to Firebase Storage (signed PUT URLs
 * from POST /api/upload/video). Browsers need the bucket to allow our site's origin; downloads
 * (<img>, <video>) don't need CORS. Run once per bucket; safe to re-run.
 *
 *   node scripts/set-storage-cors.js            # show what would be set
 *   node scripts/set-storage-cors.js --apply    # set it
 *
 * Env: FIREBASE_SERVICE_ACCOUNT (default secrets/baanlomnow-firebase.json),
 *      FIREBASE_STORAGE_BUCKET (default <project>.firebasestorage.app),
 *      CORS_ORIGINS (comma separated, default the production site and localhost)
 */
const path = require('path')
const { Storage } = require('@google-cloud/storage')

const serviceAccount = require(
  path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT || path.join(__dirname, '..', 'secrets', 'baanlomnow-firebase.json'))
)
const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.firebasestorage.app`
const origins = (process.env.CORS_ORIGINS || 'https://baanlomnow.com,https://www.baanlomnow.com,http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

const uploadRule = {
  origin: origins,
  method: ['PUT'],
  // The headers the browser sends with the signed upload (see createDirectUpload in src/lib/storage.ts)
  responseHeader: ['Content-Type', 'Cache-Control', 'x-goog-meta-firebaseStorageDownloadTokens', 'x-goog-content-length-range'],
  maxAgeSeconds: 3600,
}

async function main() {
  const bucket = new Storage({ credentials: serviceAccount, projectId: serviceAccount.project_id }).bucket(bucketName)
  const [metadata] = await bucket.getMetadata()
  // Keep any other rules; replace only an earlier upload rule
  const others = (metadata.cors ?? []).filter((rule) => !(rule.method ?? []).includes('PUT'))
  const cors = [...others, uploadRule]
  console.log(`Bucket: ${bucketName}`)
  console.log('Current CORS:', JSON.stringify(metadata.cors ?? []))
  console.log('New CORS:    ', JSON.stringify(cors))
  if (!process.argv.includes('--apply')) return console.log('\nNothing changed (add --apply to set it)')
  await bucket.setCorsConfiguration(cors)
  console.log('\n✅ CORS set')
}

main().catch((error) => {
  console.error('Failed:', error.message)
  process.exit(1)
})
