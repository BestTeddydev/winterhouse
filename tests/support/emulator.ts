import { execSync } from 'child_process'

// Starts a Firestore emulator in Docker unless FIRESTORE_EMULATOR_HOST is already set.
const CONTAINER = 'winterhouse-test-firestore'
const PORT = 8095

async function waitForEmulator(host: string) {
  for (let i = 0; i < 90; i++) {
    try {
      const res = await fetch(`http://${host}`)
      if (res.ok) return
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(`Firestore emulator did not start at ${host}`)
}

export default async function setup() {
  let started = false
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    execSync(`docker rm -f ${CONTAINER}`, { stdio: 'ignore' })
    execSync(
      `docker run -d --rm --name ${CONTAINER} -p ${PORT}:8080 gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators ` +
        'gcloud emulators firestore start --host-port=0.0.0.0:8080',
      { stdio: 'ignore' }
    )
    process.env.FIRESTORE_EMULATOR_HOST = `localhost:${PORT}`
    started = true
  }
  await waitForEmulator(process.env.FIRESTORE_EMULATOR_HOST)

  return () => {
    if (started) execSync(`docker rm -f ${CONTAINER}`, { stdio: 'ignore' })
  }
}
