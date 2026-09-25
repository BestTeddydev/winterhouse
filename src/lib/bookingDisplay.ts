// How a booking is described in lists (rooms, camping blocks, prices)

/** Room names of a booking (multi-room or legacy single room) */
export function roomNames(booking: any): string | null {
  if (booking.rooms?.length) return booking.rooms.map((r: any) => r?.name || 'N/A').join(', ')
  return booking.room ? booking.room.name || 'N/A' : null
}

export function roomImage(booking: any): { src: string; alt: string } {
  const room = booking.room ?? booking.rooms?.[0]
  return { src: room?.imageUrls?.[0] || '/placeholder-room.jpg', alt: room?.name || 'Room' }
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
