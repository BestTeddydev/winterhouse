// Room form values (strings as typed in inputs) and their conversion to/from the rooms API.

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

export interface SeasonDraft {
  name: string
  startMonth: number
  endMonth: number
  weekday: string
  weekend: string
  holiday: string
}

export interface RoomHotspot {
  x: number
  y: number
  title: string
  description: string
}

export interface RoomFormValues {
  name: string
  description: string
  price: string
  capacity: string
  pricing: { weekday: string; weekend: string; holiday: string }
  seasonalPricing: SeasonDraft[]
  amenities: string[]
  isActive: boolean
  hotspots: RoomHotspot[]
  /** Uploaded as soon as they are picked (they are large), so these are already URLs */
  videoUrls: string[]
}

export const EMPTY_SEASON: SeasonDraft = { name: '', startMonth: 1, endMonth: 3, weekday: '', weekend: '', holiday: '' }

export const EMPTY_ROOM: RoomFormValues = {
  name: '',
  description: '',
  price: '',
  capacity: '',
  pricing: { weekday: '', weekend: '', holiday: '' },
  seasonalPricing: [],
  amenities: [],
  isActive: true,
  hotspots: [],
  videoUrls: [],
}

const str = (n: unknown) => (n === undefined || n === null ? '' : String(n))

/** Form values for a room loaded from the API */
export function roomToFormValues(room: any): RoomFormValues {
  return {
    name: room.name ?? '',
    description: room.description ?? '',
    price: str(room.price || room.pricing?.weekday),
    capacity: str(room.capacity),
    pricing: {
      weekday: str(room.pricing?.weekday ?? room.price),
      weekend: str(room.pricing?.weekend),
      holiday: str(room.pricing?.holiday),
    },
    seasonalPricing: (room.seasonalPricing ?? []).map((s: any) => ({
      name: s.name || '',
      startMonth: s.startMonth || 1,
      endMonth: s.endMonth || 3,
      weekday: str(s.weekday),
      weekend: str(s.weekend),
      holiday: str(s.holiday),
    })),
    amenities: room.amenities ?? [],
    isActive: room.isActive ?? true,
    hotspots: room.hotspots ?? [],
    videoUrls: room.videoUrls ?? [],
  }
}

/** Why the form can't be saved yet, or null */
export function validateRoomForm(values: RoomFormValues): string | null {
  if (!values.name || !values.description || !values.capacity) return 'กรุณากรอกข้อมูลให้ครบถ้วน'
  if (!values.price && !values.pricing.weekday) return 'กรุณากรอกราคาอย่างน้อยหนึ่งแบบ'
  return null
}

/**
 * Body for POST/PUT /api/rooms. Missing weekend/holiday prices fall back to the weekday price,
 * which falls back to the base price.
 */
export function roomPayload(values: RoomFormValues, images: { urls: string[]; cover?: string }) {
  const basePrice = values.price || values.pricing.weekday || '0'
  const weekday = values.pricing.weekday || basePrice
  const { pricing } = values
  // The first image is the cover everywhere (rooms have no separate cover field)
  const cover = images.cover && images.urls.includes(images.cover) ? images.cover : images.urls[0]
  const imageUrls = cover ? [cover, ...images.urls.filter((url) => url !== cover)] : []
  return {
    name: values.name,
    description: values.description,
    imageUrl: cover ?? '',
    imageUrls,
    price: parseFloat(basePrice),
    capacity: parseInt(values.capacity),
    amenities: values.amenities,
    isActive: values.isActive,
    hotspots: values.hotspots,
    videoUrls: values.videoUrls,
    pricing:
      pricing.weekday || pricing.weekend || pricing.holiday
        ? {
            weekday: parseFloat(weekday),
            weekend: parseFloat(pricing.weekend || weekday),
            holiday: parseFloat(pricing.holiday || weekday),
          }
        : undefined,
    seasonalPricing: values.seasonalPricing
      .filter((s) => s.name && s.weekday)
      .map((s) => ({
        name: s.name,
        startMonth: s.startMonth,
        endMonth: s.endMonth,
        weekday: parseFloat(s.weekday),
        weekend: parseFloat(s.weekend || s.weekday),
        holiday: parseFloat(s.holiday || s.weekday),
      })),
  }
}
