import { describe, expect, it } from 'vitest'
import { safeCallbackPath } from './middleware'

describe('safeCallbackPath', () => {
  it('keeps same-site paths', () => {
    expect(safeCallbackPath('/bookings?x=1')).toBe('/bookings?x=1')
  })

  it.each([null, '', 'https://evil.com', '//evil.com', 'javascript:alert(1)'])('rejects %s (open redirect)', (value) => {
    expect(safeCallbackPath(value)).toBe('/')
  })
})
