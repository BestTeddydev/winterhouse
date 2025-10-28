import { IRoom } from '@/models/Room'

/**
 * Holiday dates for Thailand (2024-2025)
 * สามารถเพิ่มวันหยุดอื่นๆ ได้ตามต้องการ
 */
const THAI_HOLIDAYS: string[] = [
  // 2024
  '2024-01-01', // New Year
  '2024-01-02', // New Year (extended)
  '2024-02-10', // Chinese New Year
  '2024-04-06', // Chakri Memorial Day
  '2024-04-13', // Songkran Day 1
  '2024-04-14', // Songkran Day 2
  '2024-04-15', // Songkran Day 3
  '2024-05-01', // Labor Day
  '2024-05-04', // Coronation Day
  '2024-06-03', // Visakha Bucha Day
  '2024-07-28', // Birthday of King Rama X
  '2024-08-12', // Her Majesty The Queen's Birthday
  '2024-10-13', // King Bhumibol Memorial Day
  '2024-10-23', // Chulalongkorn Day
  '2024-12-05', // King Bhumibol's Birthday
  '2024-12-10', // Constitution Day
  '2024-12-31', // New Year's Eve
  
  // 2025
  '2025-01-01', // New Year
  '2025-01-02', // New Year (extended)
  '2025-01-29', // Chinese New Year
  '2025-04-06', // Chakri Memorial Day
  '2025-04-13', // Songkran Day 1
  '2025-04-14', // Songkran Day 2
  '2025-04-15', // Songkran Day 3
  '2025-05-01', // Labor Day
  '2025-05-05', // Coronation Day
  '2025-05-12', // Visakha Bucha Day
  '2025-07-28', // Birthday of King Rama X
  '2025-08-12', // Her Majesty The Queen's Birthday
  '2025-10-13', // King Bhumibol Memorial Day
  '2025-10-23', // Chulalongkorn Day
  '2025-12-05', // King Bhumibol's Birthday
  '2025-12-10', // Constitution Day
  '2025-12-31', // New Year's Eve
]

/**
 * Check if a date is a holiday
 */
export function isHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0]
  return THAI_HOLIDAYS.includes(dateStr)
}

/**
 * Check if a date is weekend (Friday, Saturday, Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  // 0 = Sunday, 6 = Saturday, 5 = Friday
  return day === 0 || day === 5 || day === 6
}

/**
 * Get day type for a date
 */
export type DayType = 'weekday' | 'weekend' | 'holiday'

export function getDayType(date: Date): DayType {
  if (isHoliday(date)) return 'holiday'
  if (isWeekend(date)) return 'weekend'
  return 'weekday'
}

/**
 * Get price for a room on a specific date
 */
export function getRoomPriceForDate(room: IRoom, date: Date): number {
  const dayType = getDayType(date)
  // ถ้ามี pricing object ใช้ pricing
  if (room.pricing) {
    return room.pricing[dayType] || room.price
  }
  
  // ถ้าไม่มี pricing ใช้ base price
  return room.price
}

/**
 * Calculate total price for a room over a date range
 */
export function calculateRoomPriceRange(
  room: IRoom,
  checkIn: Date,
  checkOut: Date
): { totalPrice: number; dailyPrices: Array<{ date: Date; price: number }> } {
  const dailyPrices: Array<{ date: Date; price: number }> = []
  let totalPrice = 0
  
  const currentDate = new Date(checkIn)
  const checkoutDate = new Date(checkOut)
  
  while (currentDate < checkoutDate) {
    const price = getRoomPriceForDate(room, currentDate)
    totalPrice += price
    dailyPrices.push({
      date: new Date(currentDate),
      price
    })
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return { totalPrice, dailyPrices }
}

/**
 * Calculate total price for multiple rooms
 */
export function calculateMultipleRoomsPrice(
  rooms: Array<{ room: IRoom; checkIn: Date; checkOut: Date }>
): number {
  return rooms.reduce((total, { room, checkIn, checkOut }) => {
    const result = calculateRoomPriceRange(room, checkIn, checkOut)
    return total + result.totalPrice
  }, 0)
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0
  }).format(price)
}

/**
 * Get daily breakdown for display
 */
export function getPriceBreakdown(
  room: IRoom,
  checkIn: Date,
  checkOut: Date
): Array<{
  date: Date
  dayType: DayType
  price: number
  formattedDate: string
}> {
  const { dailyPrices } = calculateRoomPriceRange(room, checkIn, checkOut)
  
  return dailyPrices.map(({ date, price }) => ({
    date,
    dayType: getDayType(date),
    price,
    formattedDate: formatDate(date)
  }))
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('th-TH', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Get day type label in Thai
 */
export function getDayTypeLabel(dayType: DayType): string {
  const labels = {
    weekday: 'วันธรรมดา',
    weekend: 'วันหยุดสุดสัปดาห์',
    holiday: 'วันหยุดนักขัตฤกษ์'
  }
  return labels[dayType]
}
