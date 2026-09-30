import { vi } from 'vitest'
import type { Session } from 'next-auth'

// Shared state for the module mocks registered in setup.ts. Tests import from here.

export const auth = { session: null as Session | null }

export function signInAs(user: { _id: string; role: Session['user']['role']; name?: string } | null) {
  auth.session = user
    ? { user: { id: user._id, role: user.role, name: user.name ?? 'Test' }, expires: '2999-01-01' }
    : null
}

export const stripeMock = {
  createCheckoutSession: vi.fn(async (_params: unknown) => ({ id: 'cs_test_1', url: 'https://checkout.stripe.test/cs_test_1' })),
  createQRCodePayment: vi.fn(async (_params: unknown) => ({
    paymentLink: { id: 'plink_test_1' },
    qrCodeUrl: 'https://buy.stripe.test/plink_test_1',
  })),
  constructWebhookEvent: vi.fn(),
  closeCheckout: vi.fn(async (_id: string) => {}),
}

export const lineMock = { sendLineNotification: vi.fn(async (_n: unknown) => true) }
export const emailMock = { sendEmailNotification: vi.fn(async (_n: unknown) => true) }
