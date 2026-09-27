import { describe, expect, it } from 'vitest'
import { EMPTY_BUILDING, buildingPayload, buildingToFormValues } from './BuildingForm'

const values = (overrides: Partial<typeof EMPTY_BUILDING>) => ({ ...EMPTY_BUILDING, name: 'A', description: 'd', ...overrides })

describe('buildingPayload', () => {
  it('trims text and turns positions into numbers', () => {
    expect(buildingPayload(values({ name: ' A ', description: ' d ', x: '12.5', y: '0' }))).toEqual({
      body: { name: 'A', description: 'd', buildingType: 'accommodation', facilities: [], x: 12.5, y: 0 },
    })
  })

  it('requires a name and a description (the API rejects blanks)', () => {
    expect(buildingPayload(values({ name: '  ' }))).toHaveProperty('error')
    expect(buildingPayload(values({ description: '' }))).toHaveProperty('error')
  })

  it('refuses empty or out-of-range positions instead of sending NaN', () => {
    for (const x of ['', 'abc', '-1', '100.1']) expect(buildingPayload(values({ x }))).toHaveProperty('error')
    expect(buildingPayload(values({ x: '100', y: '100' }))).toHaveProperty('body')
  })
})

describe('buildingToFormValues', () => {
  it('keeps a position of 0 (not replaced by the default 50)', () => {
    expect(buildingToFormValues({ name: 'A', x: 0, y: 0 })).toMatchObject({ x: '0', y: '0' })
  })
})
