import { describe, expect, it } from 'vitest'
import { EMPTY_ROOM, roomPayload, roomToFormValues, validateRoomForm } from './roomForm'

describe('room form', () => {
  it('requires name, description, capacity and a price', () => {
    expect(validateRoomForm(EMPTY_ROOM)).toBe('กรุณากรอกข้อมูลให้ครบถ้วน')
    const filled = { ...EMPTY_ROOM, name: 'A', description: 'd', capacity: '2' }
    expect(validateRoomForm(filled)).toBe('กรุณากรอกราคาอย่างน้อยหนึ่งแบบ')
    expect(validateRoomForm({ ...filled, pricing: { ...filled.pricing, weekday: '900' } })).toBeNull()
  })

  it('builds the API body with price fallbacks', () => {
    const body = roomPayload(
      {
        ...EMPTY_ROOM,
        name: 'A',
        description: 'd',
        capacity: '2',
        pricing: { weekday: '1000', weekend: '', holiday: '1800' },
        seasonalPricing: [
          { name: 'หนาว', startMonth: 11, endMonth: 2, weekday: '1500', weekend: '', holiday: '' },
          { name: '', startMonth: 1, endMonth: 1, weekday: '1', weekend: '', holiday: '' }, // incomplete: dropped
        ],
      },
      { urls: ['a.jpg', 'b.jpg'], cover: 'b.jpg' }
    )
    expect(body).toMatchObject({
      price: 1000,
      capacity: 2,
      imageUrl: 'b.jpg',
      imageUrls: ['b.jpg', 'a.jpg'], // the chosen cover goes first (used as cover everywhere)
      pricing: { weekday: 1000, weekend: 1000, holiday: 1800 },
      seasonalPricing: [{ name: 'หนาว', weekday: 1500, weekend: 1500, holiday: 1500 }],
    })
  })

  it('round-trips a room from the API', () => {
    const values = roomToFormValues({ name: 'A', description: 'd', price: 900, capacity: 2, pricing: { weekday: 900, weekend: 1200 } })
    expect(values).toMatchObject({ price: '900', capacity: '2', pricing: { weekday: '900', weekend: '1200', holiday: '' } })
  })
})
