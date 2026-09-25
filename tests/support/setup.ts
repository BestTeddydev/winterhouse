import { afterEach, beforeEach, vi } from 'vitest'
import { signInAs } from './mocks'

// Integration tests only ever talk to the emulator with a demo project (never real data)
process.env.FIREBASE_PROJECT_ID = 'demo-winterhouse'
process.env.FIRESTORE_DATABASE_ID = 'baanlomnow-sg'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('FIRESTORE_EMULATOR_HOST must be set for integration tests')

vi.mock('next-auth', async (importOriginal) => {
  const { auth } = await import('./mocks')
  return {
    ...(await importOriginal<typeof import('next-auth')>()),
    getServerSession: vi.fn(async () => auth.session),
  }
})

vi.mock('@/lib/stripe', async () => (await import('./mocks')).stripeMock)

vi.mock('@/lib/line', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/line')>()),
  sendLineNotification: (await import('./mocks')).lineMock.sendLineNotification,
}))

vi.mock('@/lib/email', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/email')>()),
  sendEmailNotification: (await import('./mocks')).emailMock.sendEmailNotification,
}))

// Every test starts with an empty database and no signed-in user
beforeEach(async () => {
  await fetch(
    `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/${process.env.FIRESTORE_DATABASE_ID}/documents`,
    { method: 'DELETE' }
  )
  signInAs(null)
})

afterEach(() => {
  vi.clearAllMocks()
})
