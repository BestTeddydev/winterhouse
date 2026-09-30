// How a booking is described in lists (rooms, camping blocks, prices)

/** Room names of a booking (multi-room or legacy single room) */
export function roomNames(booking: any): string | null {
  if (booking.rooms?.length) return booking.rooms.map((r: any) => r?.name || 'N/A').join(', ')
  return booking.room ? booking.room.name || 'N/A' : null
}

export function roomImage(booking: any): { src: string; alt: string } {
  const room = booking.room ?? booking.rooms?.[0]
  return { src: room?.imageUrls?.[0] || '/placeholder-room.svg', alt: room?.name || 'Room' }
}

/** "Block A (3 คน), Block B (2 คน)" or null without camping blocks */
export function campingSummary(booking: any): string | null {
  if (booking.campingBlocks?.length) {
    return booking.campingBlocks
      .map((block: any, i: number) => {
        const guests = booking.guestCounts?.[i] || booking.guestCount || block?.minCapacity || 1
        return `${block?.name || 'N/A'} (${guests} คน)`
      })
      .join(', ')
  }
  if (!booking.campingBlock) return null
  return `${booking.campingBlock.name || 'N/A'} (${booking.guestCount || booking.campingBlock.minCapacity || 1} คน)`
}

/** Price before the discount, or null when there is none */
export function priceBeforeDiscount(booking: any): number | null {
  if (!(booking.discount > 0 || booking.discountAmount > 0)) return null
  return booking.totalPrice + (booking.discountAmount || (booking.totalPrice * (booking.discount || 0)) / 100)
}

/** Everything booked, e.g. "A1, A2 • Block 3 (4 คน)" */
export const stayName = (booking: any) => [roomNames(booking), campingSummary(booking)].filter(Boolean).join(' • ') || 'N/A'

/** A picture of what was booked: the first room, else the first camping block */
export function bookingImage(booking: any): { src: string; alt: string } {
  if (booking.room || booking.rooms?.length) return roomImage(booking)
  const block = booking.campingBlocks?.[0] ?? booking.campingBlock
  return block ? { src: block.imageUrls?.[0] || '/placeholder-camping.svg', alt: block.name || 'Camping' } : roomImage(booking)
}

type BookedAddOn = { name: string; price: number; quantity: number; unit?: string; pricing?: string }

const perNight = (addOn: { pricing?: string }) => addOn.pricing === 'PER_NIGHT'

/** "500/ชิ้น/คืน" (the amount is formatted by the caller) */
export const addOnRateSuffix = (addOn: { unit?: string; pricing?: string }) =>
  `/${addOn.unit || 'หน่วย'}${perNight(addOn) ? '/คืน' : ''}`

/** "เตียงเสริม x1 ชิ้น × 2 คืน" */
export const addOnLine = (addOn: BookedAddOn, nights: number) =>
  `${addOn.name} x${addOn.quantity} ${addOn.unit || 'หน่วย'}${perNight(addOn) ? ` × ${nights} คืน` : ''}`
